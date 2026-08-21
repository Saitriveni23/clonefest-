import Database from 'better-sqlite3';
import path from 'path';

let dbInstance: Database.Database | null = null;

function getDb(): Database.Database {
  if (!dbInstance) {
    const dbPath = path.resolve(process.cwd(), 'cipherdrop.db');
    dbInstance = new Database(dbPath);
    
    // Enable Write-Ahead Logging (WAL) for better concurrent performance
    dbInstance.pragma('journal_mode = WAL');
    
    // Create/update schemas
    dbInstance.exec(`
      CREATE TABLE IF NOT EXISTS pastes (
        id TEXT PRIMARY KEY,
        ciphertext TEXT NOT NULL,
        iv TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER,
        burn_after_read INTEGER DEFAULT 0,
        password_protected INTEGER DEFAULT 0,
        view_count INTEGER DEFAULT 0,
        manage_key_hash TEXT,
        read_at INTEGER,
        is_dead_man INTEGER DEFAULT 0,
        check_in_due INTEGER,
        check_in_interval INTEGER,
        check_in_key_hash TEXT,
        duress_key_hash TEXT
      );
      
      CREATE TABLE IF NOT EXISTS threads (
        id TEXT PRIMARY KEY,
        messages_json TEXT NOT NULL,
        created_at INTEGER NOT NULL,
        expires_at INTEGER NOT NULL
      );
      
      CREATE INDEX IF NOT EXISTS idx_pastes_expires_at ON pastes(expires_at);
      CREATE INDEX IF NOT EXISTS idx_threads_expires_at ON threads(expires_at);
    `);

    // Run safe migrations for existing sqlite databases
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN manage_key_hash TEXT");
    } catch(e){}
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN read_at INTEGER");
    } catch(e){}
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN is_dead_man INTEGER DEFAULT 0");
    } catch(e){}
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN check_in_due INTEGER");
    } catch(e){}
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN check_in_interval INTEGER");
    } catch(e){}
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN check_in_key_hash TEXT");
    } catch(e){}
    try {
      dbInstance.exec("ALTER TABLE pastes ADD COLUMN duress_key_hash TEXT");
    } catch(e){}
  }
  return dbInstance;
}

export interface PasteRow {
  id: string;
  ciphertext: string;
  iv: string;
  created_at: number;
  expires_at: number | null;
  burn_after_read: number;
  password_protected: number;
  view_count: number;
  manage_key_hash: string | null;
  read_at: number | null;
  is_dead_man: number;
  check_in_due: number | null;
  check_in_interval: number | null;
  check_in_key_hash: string | null;
  duress_key_hash: string | null;
}

export interface ThreadRow {
  id: string;
  messages_json: string;
  created_at: number;
  expires_at: number;
}

export const dbHelper = {
  /**
   * Save a new encrypted paste.
   */
  createPaste(paste: {
    id: string;
    ciphertext: string;
    iv: string;
    expires_in_seconds: number | null;
    burn_after_read: boolean;
    password_protected: boolean;
    manage_key_hash?: string | null;
    is_dead_man?: boolean;
    check_in_interval?: number | null;
    check_in_key_hash?: string | null;
    duress_key_hash?: string | null;
  }): void {
    const db = getDb();
    const createdAt = Date.now();
    const expiresAt = paste.expires_in_seconds ? createdAt + (paste.expires_in_seconds * 1000) : null;
    
    // For dead man switch, initial check_in_due is now + interval
    const checkInDue = paste.is_dead_man && paste.check_in_interval 
      ? createdAt + (paste.check_in_interval * 1000) 
      : null;

    const stmt = db.prepare(`
      INSERT INTO pastes (
        id, ciphertext, iv, created_at, expires_at, burn_after_read, 
        password_protected, view_count, manage_key_hash, read_at,
        is_dead_man, check_in_due, check_in_interval, check_in_key_hash,
        duress_key_hash
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, NULL, ?, ?, ?, ?, ?)
    `);
    
    stmt.run(
      paste.id,
      paste.ciphertext,
      paste.iv,
      createdAt,
      expiresAt,
      paste.burn_after_read ? 1 : 0,
      paste.password_protected ? 1 : 0,
      paste.manage_key_hash || null,
      paste.is_dead_man ? 1 : 0,
      checkInDue,
      paste.check_in_interval || null,
      paste.check_in_key_hash || null,
      paste.duress_key_hash || null
    );
  },

  /**
   * Retrieve a paste by ID.
   * Cleans up expired pastes first, and deletes burn-after-read pastes on retrieval.
   */
  getPaste(id: string): PasteRow | null {
    const db = getDb();
    this.cleanupExpired();
    
    const stmt = db.prepare('SELECT * FROM pastes WHERE id = ?');
    const row = stmt.get(id) as PasteRow | undefined;
    
    if (!row) return null;
    
    const now = Date.now();
    
    // If it's a dead man's switch, do not increment view count or record read_at until countdown expires
    if (row.is_dead_man === 1 && row.check_in_due && now < row.check_in_due) {
      return row; // Keep it locked, we'll return it but the API route will block sending ciphertext
    }
    
    // Update view count and read_at timestamp
    const updateStmt = db.prepare('UPDATE pastes SET view_count = view_count + 1, read_at = ? WHERE id = ?');
    updateStmt.run(row.read_at ? row.read_at : now, id);
    
    // If it's a burn-after-read paste, delete it immediately
    if (row.burn_after_read === 1) {
      const deleteStmt = db.prepare('DELETE FROM pastes WHERE id = ?');
      deleteStmt.run(id);
    }
    
    return row;
  },

  /**
   * Fetch paste metadata safely for the sender (doesn't trigger burn-after-read destruction or update read_at)
   */
  getPasteMetadata(id: string): Omit<PasteRow, 'ciphertext' | 'iv'> | null {
    const db = getDb();
    const stmt = db.prepare(`
      SELECT id, created_at, expires_at, burn_after_read, password_protected, 
             view_count, manage_key_hash, read_at, is_dead_man, check_in_due, 
             check_in_interval, check_in_key_hash, duress_key_hash 
      FROM pastes WHERE id = ?
    `);
    const row = stmt.get(id) as Omit<PasteRow, 'ciphertext' | 'iv'> | undefined;
    return row || null;
  },

  /**
   * Triggers a check-in for the dead man switch, resetting the countdown timer.
   */
  checkInDeadMan(id: string, intervalSeconds: number): number {
    const db = getDb();
    const nextCheckIn = Date.now() + intervalSeconds * 1000;
    const stmt = db.prepare('UPDATE pastes SET check_in_due = ? WHERE id = ? AND is_dead_man = 1');
    const result = stmt.run(nextCheckIn, id);
    return nextCheckIn;
  },

  /**
   * Deletes a paste by ID manually.
   */
  deletePaste(id: string): boolean {
    const db = getDb();
    const stmt = db.prepare('DELETE FROM pastes WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  },

  /**
   * Clean up all expired pastes.
   */
  cleanupExpired(): number {
    const db = getDb();
    const now = Date.now();
    const stmt = db.prepare('DELETE FROM pastes WHERE expires_at IS NOT NULL AND expires_at < ?');
    const result = stmt.run(now);
    
    // Prune expired threads too
    const threadStmt = db.prepare('DELETE FROM threads WHERE expires_at < ?');
    threadStmt.run(now);
    
    return result.changes;
  },

  /* --- THREAD METHODS --- */

  createThread(id: string, messagesJson: string, expiresInSeconds: number): void {
    const db = getDb();
    const now = Date.now();
    const expiresAt = now + expiresInSeconds * 1000;
    const stmt = db.prepare(`
      INSERT INTO threads (id, messages_json, created_at, expires_at)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, messagesJson, now, expiresAt);
  },

  getThread(id: string): ThreadRow | null {
    const db = getDb();
    const now = Date.now();
    db.prepare('DELETE FROM threads WHERE expires_at < ?').run(now);
    
    const stmt = db.prepare('SELECT * FROM threads WHERE id = ?');
    const row = stmt.get(id) as ThreadRow | undefined;
    return row || null;
  },

  updateThread(id: string, messagesJson: string): boolean {
    const db = getDb();
    const stmt = db.prepare('UPDATE threads SET messages_json = ? WHERE id = ?');
    const result = stmt.run(messagesJson, id);
    return result.changes > 0;
  }
};
