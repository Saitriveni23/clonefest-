import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import crypto from 'crypto';

async function generateUniqueId(length = 8): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    const existing = await dbHelper.getThread(result);
    if (!existing) {
      return result;
    }
  }
  throw new Error('Failed to generate a unique thread ID.');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages_json, expires_in_seconds } = body;

    if (!messages_json) {
      return NextResponse.json(
        { error: 'Initial encrypted message payload is required.' },
        { status: 400 }
      );
    }

    const id = await generateUniqueId();
    const expSeconds = expires_in_seconds ? Number(expires_in_seconds) : 86400; // Default 1 day

    await dbHelper.createThread(id, messages_json, expSeconds);

    return NextResponse.json({ id });
  } catch (error: any) {
    console.error('Error creating thread:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
