/**
 * Client-side cryptographic helper using the Web Crypto API.
 * This runs entirely in the browser (client-side) to ensure zero-knowledge security.
 */

// Helper: Convert Uint8Array to Hex string
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert Hex string to Uint8Array
export function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * Generates a random 256-bit key in hex format.
 */
export function generateKey(): string {
  const bytes = new Uint8Array(32); // 256 bits
  if (typeof window !== 'undefined' && window.crypto) {
    window.crypto.getRandomValues(bytes);
  } else {
    // Fallback for node or server environment (though encryption is client-side)
    const crypto = require('crypto');
    crypto.randomFillSync(bytes);
  }
  return bytesToHex(bytes);
}

/**
 * Derives a CryptoKey using PBKDF2 from a password and salt.
 */
async function deriveKey(keyHex: string, password?: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  
  if (password) {
    // Import the raw secret (password + keyHex to mix the URL key with the password)
    const baseKey = await window.crypto.subtle.importKey(
      'raw',
      enc.encode(password + keyHex),
      'PBKDF2',
      false,
      ['deriveKey']
    );

    // Derive the final AES-GCM key
    return await window.crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: enc.encode(keyHex), // URL key acts as a client-side salt
        iterations: 100000,
        hash: 'SHA-256',
      },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  } else {
    // No password: use the URL key directly
    return await window.crypto.subtle.importKey(
      'raw',
      hexToBytes(keyHex) as any,
      'AES-GCM',
      false,
      ['encrypt', 'decrypt']
    );
  }
}

/**
 * Encrypts plaintext string using AES-256-GCM.
 */
export async function encryptData(
  plaintext: string,
  keyHex: string,
  password?: string
): Promise<{ ciphertext: string; iv: string }> {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is only available in the browser.');
  }

  const derivedKey = await deriveKey(keyHex, password);
  
  // Generate random 12-byte IV
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  
  const enc = new TextEncoder();
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    derivedKey,
    enc.encode(plaintext)
  );

  return {
    ciphertext: bytesToHex(new Uint8Array(encryptedBuffer)),
    iv: bytesToHex(iv),
  };
}

/**
 * Decrypts ciphertext string using AES-256-GCM.
 */
export async function decryptData(
  ciphertextHex: string,
  ivHex: string,
  keyHex: string,
  password?: string
): Promise<string> {
  if (typeof window === 'undefined' || !window.crypto) {
    throw new Error('Web Crypto API is only available in the browser.');
  }

  const derivedKey = await deriveKey(keyHex, password);
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const decryptedBuffer = await window.crypto.subtle.decrypt(
    {
      name: 'AES-GCM',
      iv: iv as any,
    },
    derivedKey,
    ciphertext as any
  );

  const dec = new TextDecoder();
  return dec.decode(decryptedBuffer);
}
