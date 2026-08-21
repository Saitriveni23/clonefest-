import { Redis } from '@upstash/redis';

// Initialize Redis client from env variables
let redis: Redis | null = null;
try {
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    redis = Redis.fromEnv();
  } else {
    console.warn("UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are not set. Redis is not initialized.");
  }
} catch (e) {
  console.error("Failed to initialize Upstash Redis:", e);
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
  max_attempts: number;
  failed_attempts: number;
  allowed_countries: string | null;
  release_after: number | null;
  otp_required: number;
  scan_limit: number;
  scan_count: number;
  biometric_required: number;
}

export interface ThreadRow {
  id: string;
  messages_json: string;
  created_at: number;
  expires_at: number;
}

// Helper to sanitize database object for Redis hash storage (filtering out null/undefined)
function sanitizeForRedis(obj: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== null && val !== undefined) {
      if (typeof val === 'boolean') {
        result[key] = val ? 1 : 0;
      } else {
        result[key] = val;
      }
    }
  }
  return result;
}

function parsePasteRow(data: Record<string, any> | null): PasteRow | null {
  if (!data || !data.id) return null;
  return {
    id: String(data.id),
    ciphertext: String(data.ciphertext || ''),
    iv: String(data.iv || ''),
    created_at: Number(data.created_at || 0),
    expires_at: data.expires_at ? Number(data.expires_at) : null,
    burn_after_read: Number(data.burn_after_read || 0),
    password_protected: Number(data.password_protected || 0),
    view_count: Number(data.view_count || 0),
    manage_key_hash: data.manage_key_hash || null,
    read_at: data.read_at ? Number(data.read_at) : null,
    is_dead_man: Number(data.is_dead_man || 0),
    check_in_due: data.check_in_due ? Number(data.check_in_due) : null,
    check_in_interval: data.check_in_interval ? Number(data.check_in_interval) : null,
    check_in_key_hash: data.check_in_key_hash || null,
    duress_key_hash: data.duress_key_hash || null,
    max_attempts: Number(data.max_attempts || 0),
    failed_attempts: Number(data.failed_attempts || 0),
    allowed_countries: data.allowed_countries || null,
    release_after: data.release_after ? Number(data.release_after) : null,
    otp_required: Number(data.otp_required || 0),
    scan_limit: Number(data.scan_limit || 0),
    scan_count: Number(data.scan_count || 0),
    biometric_required: Number(data.biometric_required || 0),
  };
}

function parseThreadRow(data: Record<string, any> | null): ThreadRow | null {
  if (!data || !data.id) return null;
  return {
    id: String(data.id),
    messages_json: String(data.messages_json || '[]'),
    created_at: Number(data.created_at || 0),
    expires_at: Number(data.expires_at || 0),
  };
}

export const dbHelper = {
  /**
   * Save a new encrypted paste.
   */
  async createPaste(paste: {
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
    max_attempts?: number;
    allowed_countries?: string | null;
    release_after?: number | null;
    otp_required?: boolean;
    scan_limit?: number;
    biometric_required?: boolean;
  }): Promise<void> {
    if (!redis) return;

    const createdAt = Date.now();
    const expiresAt = paste.expires_in_seconds ? createdAt + (paste.expires_in_seconds * 1000) : null;
    const checkInDue = paste.is_dead_man && paste.check_in_interval 
      ? createdAt + (paste.check_in_interval * 1000) 
      : null;

    const rawData = {
      id: paste.id,
      ciphertext: paste.ciphertext,
      iv: paste.iv,
      created_at: createdAt,
      expires_at: expiresAt,
      burn_after_read: paste.burn_after_read ? 1 : 0,
      password_protected: paste.password_protected ? 1 : 0,
      view_count: 0,
      manage_key_hash: paste.manage_key_hash || null,
      read_at: null,
      is_dead_man: paste.is_dead_man ? 1 : 0,
      check_in_due: checkInDue,
      check_in_interval: paste.check_in_interval || null,
      check_in_key_hash: paste.check_in_key_hash || null,
      duress_key_hash: paste.duress_key_hash || null,
      max_attempts: paste.max_attempts || 0,
      failed_attempts: 0,
      allowed_countries: paste.allowed_countries || null,
      release_after: paste.release_after || null,
      otp_required: paste.otp_required ? 1 : 0,
      scan_limit: paste.scan_limit || 0,
      scan_count: 0,
      biometric_required: paste.biometric_required ? 1 : 0,
    };

    const redisKey = `paste:${paste.id}`;
    await redis.hset(redisKey, sanitizeForRedis(rawData));

    // If there is an expiration, set TTL in Redis automatically
    if (paste.expires_in_seconds) {
      await redis.expire(redisKey, paste.expires_in_seconds);
    }
  },

  /**
   * Retrieve a paste by ID.
   */
  async getPaste(id: string): Promise<PasteRow | null> {
    if (!redis) return null;

    const redisKey = `paste:${id}`;
    const rawData = await redis.hgetall(redisKey);
    const row = parsePasteRow(rawData);

    if (!row) return null;

    const now = Date.now();

    // Check dead man switch countdown active
    if (row.is_dead_man === 1 && row.check_in_due && now < row.check_in_due) {
      return row;
    }

    // Update view count and read_at timestamp
    const newReadAt = row.read_at ? row.read_at : now;
    const newViewCount = row.view_count + 1;
    await redis.hset(redisKey, {
      view_count: newViewCount,
      read_at: newReadAt,
    });

    // If it's a burn-after-read paste, delete it immediately
    if (row.burn_after_read === 1) {
      await redis.del(redisKey);
    }

    return {
      ...row,
      view_count: newViewCount,
      read_at: newReadAt,
    };
  },

  /**
   * Fetch paste metadata safely for the sender
   */
  async getPasteMetadata(id: string): Promise<Omit<PasteRow, 'ciphertext' | 'iv'> | null> {
    if (!redis) return null;

    const redisKey = `paste:${id}`;
    const rawData = await redis.hgetall(redisKey);
    const row = parsePasteRow(rawData);
    if (!row) return null;

    const { ciphertext, iv, ...metadata } = row;
    return metadata;
  },

  /**
   * Increments the failed attempts counter.
   */
  async incrementFailedAttempts(id: string): Promise<{ failed: number; burned: boolean }> {
    if (!redis) return { failed: 0, burned: false };

    const redisKey = `paste:${id}`;
    const rawData = await redis.hgetall(redisKey);
    const row = parsePasteRow(rawData);
    if (!row) return { failed: 0, burned: true };

    const newFailed = row.failed_attempts + 1;
    if (row.max_attempts > 0 && newFailed >= row.max_attempts) {
      await this.deletePaste(id);
      return { failed: newFailed, burned: true };
    }

    await redis.hset(redisKey, { failed_attempts: newFailed });
    return { failed: newFailed, burned: false };
  },

  /**
   * Triggers a check-in for the dead man switch, resetting the countdown timer.
   */
  async checkInDeadMan(id: string, intervalSeconds: number): Promise<number> {
    if (!redis) return Date.now();

    const redisKey = `paste:${id}`;
    const nextCheckIn = Date.now() + intervalSeconds * 1000;
    await redis.hset(redisKey, { check_in_due: nextCheckIn });
    return nextCheckIn;
  },

  /**
   * Deletes a paste by ID manually.
   */
  async deletePaste(id: string): Promise<boolean> {
    if (!redis) return false;

    const redisKey = `paste:${id}`;
    const deletedCount = await redis.del(redisKey);
    return deletedCount > 0;
  },

  /**
   * Clean up all expired pastes (no-op with Redis TTL, but kept for interface compatibility)
   */
  async cleanupExpired(): Promise<number> {
    // Redis handles TTL expiration natively
    return 0;
  },

  /* --- THREAD METHODS --- */

  async createThread(id: string, messagesJson: string, expiresInSeconds: number): Promise<void> {
    if (!redis) return;

    const now = Date.now();
    const expiresAt = now + expiresInSeconds * 1000;
    const redisKey = `thread:${id}`;

    const rawData = {
      id,
      messages_json: messagesJson,
      created_at: now,
      expires_at: expiresAt,
    };

    await redis.hset(redisKey, sanitizeForRedis(rawData));
    await redis.expire(redisKey, expiresInSeconds);
  },

  async getThread(id: string): Promise<ThreadRow | null> {
    if (!redis) return null;

    const redisKey = `thread:${id}`;
    const rawData = await redis.hgetall(redisKey);
    return parseThreadRow(rawData);
  },

  async updateThread(id: string, messagesJson: string): Promise<boolean> {
    if (!redis) return false;

    const redisKey = `thread:${id}`;
    const exists = await redis.exists(redisKey);
    if (!exists) return false;

    await redis.hset(redisKey, { messages_json: messagesJson });
    return true;
  },

  /**
   * Increments scan_count and returns the updated row.
   */
  async incrementScanCount(id: string): Promise<{ burned: boolean; scan_count: number; scan_limit: number }> {
    if (!redis) return { burned: false, scan_count: 0, scan_limit: 0 };

    const redisKey = `paste:${id}`;
    const rawData = await redis.hgetall(redisKey);
    const row = parsePasteRow(rawData);
    if (!row) return { burned: false, scan_count: 0, scan_limit: 0 };

    const newCount = row.scan_count + 1;
    await redis.hset(redisKey, { scan_count: newCount });

    if (row.scan_limit > 0 && newCount >= row.scan_limit) {
      await redis.del(redisKey);
      return { burned: true, scan_count: newCount, scan_limit: row.scan_limit };
    }
    return { burned: false, scan_count: newCount, scan_limit: row.scan_limit };
  },
};
