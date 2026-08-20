import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import crypto from 'crypto';

// Custom ID generator using characters that are safe for URLs
function generateUniqueId(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  // Try up to 10 times to find a unique ID
  for (let attempt = 0; attempt < 10; attempt++) {
    result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    // Check if ID is unique
    const existing = dbHelper.getPaste(result);
    if (!existing) {
      return result;
    }
  }
  throw new Error('Failed to generate a unique ID.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      ciphertext, iv, expires_in_seconds, burn_after_read, password_protected, 
      manage_key_hash, is_dead_man, check_in_interval, check_in_key_hash 
    } = body;

    // Validation
    if (!ciphertext || !iv) {
      return NextResponse.json(
        { error: 'Ciphertext and IV are required.' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = generateUniqueId();

    // Save to SQLite database
    dbHelper.createPaste({
      id,
      ciphertext,
      iv,
      expires_in_seconds: expires_in_seconds === null ? null : Number(expires_in_seconds),
      burn_after_read: Boolean(burn_after_read),
      password_protected: Boolean(password_protected),
      manage_key_hash: manage_key_hash || null,
      is_dead_man: Boolean(is_dead_man),
      check_in_interval: check_in_interval ? Number(check_in_interval) : null,
      check_in_key_hash: check_in_key_hash || null,
    });

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error('Error creating paste:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
