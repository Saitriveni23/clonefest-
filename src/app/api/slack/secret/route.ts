import { NextRequest, NextResponse } from 'next/server';
import { dbHelper } from '@/lib/db';
import crypto from 'crypto';

// Server-side AES-256-GCM encryption compatible with Web Crypto API client-side decryption
function encryptServerSide(plaintext: string, keyHex: string): { ciphertext: string; iv: string } {
  const iv = crypto.randomBytes(12);
  const key = Buffer.from(keyHex, 'hex');
  
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  
  const tag = cipher.getAuthTag().toString('hex');
  
  return {
    ciphertext: ciphertext + tag, // Concatenate ciphertext and auth tag
    iv: iv.toString('hex'),
  };
}

async function generateUniqueId(length = 8): Promise<string> {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let attempt = 0; attempt < 10; attempt++) {
    result = '';
    const bytes = crypto.randomBytes(length);
    for (let i = 0; i < length; i++) {
      result += chars[bytes[i] % chars.length];
    }
    const existing = await dbHelper.getPaste(result);
    if (!existing) {
      return result;
    }
  }
  throw new Error('Failed to generate a unique ID.');
}

export async function POST(req: NextRequest) {
  try {
    // Slack sends URL-encoded form data
    const formData = await req.formData();
    const text = formData.get('text') as string;
    const userName = (formData.get('user_name') as string) || 'someone';
    
    if (!text) {
      return NextResponse.json({
        response_type: 'ephemeral',
        text: '❌ *Error*: Please provide the secret text. Usage: `/secret <your secret> [expires_seconds]`',
      });
    }

    // Parse options: check if the last parameter is a number representing expiration
    const parts = text.trim().split(/\s+/);
    let secretContent = text;
    let expiresSeconds: number | null = 86400; // Default 1 day

    if (parts.length > 1) {
      const lastPart = parts[parts.length - 1];
      if (/^\d+$/.test(lastPart)) {
        expiresSeconds = parseInt(lastPart, 10);
        secretContent = parts.slice(0, -1).join(' ');
      }
    }

    // Generate random 256-bit encryption key
    const keyBytes = crypto.randomBytes(32);
    const keyHex = keyBytes.toString('hex');

    // Build standard zero-knowledge payload JSON matching PasteForm's structure
    const payload = {
      verification: 'cipherdrop-verify',
      title: `Slack Secret from @${userName}`,
      text: secretContent,
      format: 'plaintext',
      language: 'plaintext',
      file: null,
    };

    // Encrypt payload using server-side AES-256-GCM
    const { ciphertext, iv } = encryptServerSide(JSON.stringify(payload), keyHex);
    const pasteId = await generateUniqueId();

    // Save encrypted paste to SQLite
    await dbHelper.createPaste({
      id: pasteId,
      ciphertext,
      iv,
      expires_in_seconds: expiresSeconds,
      burn_after_read: true, // Default to burn-after-reading for slack secrets
      password_protected: false,
    });

    const host = req.headers.get('host') || 'localhost:3000';
    const protocol = host.includes('localhost') ? 'http' : 'https';
    const secureUrl = `${protocol}://${host}/p/${pasteId}#${keyHex}`;

    // Return public message to Slack channel
    return NextResponse.json({
      response_type: 'in_channel',
      text: `🔐 *Secure Secret shared by @${userName}* via CipherDrop:\nThis note is zero-knowledge encrypted and will self-destruct upon reading.\n\n👉 *Secure Link*: <${secureUrl}|Click here to decrypt note>`,
    });

  } catch (error: any) {
    console.error('Error in Slack Slash command:', error);
    return NextResponse.json({
      response_type: 'ephemeral',
      text: `❌ *Error*: Failed to securely process the secret.`,
    });
  }
}
