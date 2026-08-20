/**
 * Pure JavaScript implementation of Shamir's Secret Sharing (SSS) over Galois Field GF(256).
 * Used for client-side zero-knowledge threshold decryption.
 */

// Initialize Galois Field GF(256) tables using primitive polynomial 0x11b
const gfExp = new Uint8Array(256);
const gfLog = new Uint8Array(256);

let x = 1;
for (let i = 0; i < 255; i++) {
  gfExp[i] = x;
  gfLog[x] = i;
  x <<= 1;
  if (x & 0x100) {
    x ^= 0x11b; // x^8 + x^4 + x^3 + x + 1
  }
}
gfExp[255] = gfExp[0];

// GF(256) Multiplication
function gfMul(a: number, b: number): number {
  if (a === 0 || b === 0) return 0;
  return gfExp[(gfLog[a] + gfLog[b]) % 255];
}

// GF(256) Division
function gfDiv(a: number, b: number): number {
  if (b === 0) throw new Error('Division by zero in GF(256)');
  if (a === 0) return 0;
  return gfExp[(gfLog[a] - gfLog[b] + 255) % 255];
}

// Evaluate polynomial at x
function evalPoly(coeffs: Uint8Array, xVal: number): number {
  let result = coeffs[0];
  let xPower = 1;
  for (let i = 1; i < coeffs.length; i++) {
    xPower = gfMul(xPower, xVal);
    result ^= gfMul(coeffs[i], xPower);
  }
  return result;
}

/**
 * Splits a 32-byte (256-bit) secret key (hex string) into M shares with a threshold of N.
 * Each share is returned as a hex string: 2-digit X coordinate + 64-digit Y coordinate.
 */
export function splitKey(keyHex: string, threshold: number, totalShares: number): string[] {
  if (threshold < 2 || threshold > totalShares) {
    throw new Error('Invalid threshold configuration');
  }

  const keyBytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    keyBytes[i] = parseInt(keyHex.substring(i * 2, i * 2 + 2), 16);
  }

  const shares: Uint8Array[] = Array.from({ length: totalShares }, () => new Uint8Array(32));

  // Split byte-by-byte
  for (let b = 0; b < 32; b++) {
    const secretByte = keyBytes[b];
    
    // Construct polynomial coeffs: [secretByte, random, random, ...] of length `threshold`
    const coeffs = new Uint8Array(threshold);
    coeffs[0] = secretByte;
    
    if (typeof window !== 'undefined' && window.crypto) {
      const rand = new Uint8Array(threshold - 1);
      window.crypto.getRandomValues(rand);
      for (let i = 1; i < threshold; i++) {
        // Ensure random coefficients are non-zero to prevent trivial degrees
        coeffs[i] = rand[i - 1] === 0 ? 1 : rand[i - 1];
      }
    } else {
      const crypto = require('crypto');
      const rand = crypto.randomBytes(threshold - 1);
      for (let i = 1; i < threshold; i++) {
        coeffs[i] = rand[i - 1] === 0 ? 1 : rand[i - 1];
      }
    }

    // Evaluate for each share X = 1, 2, ..., totalShares
    for (let xVal = 1; xVal <= totalShares; xVal++) {
      shares[xVal - 1][b] = evalPoly(coeffs, xVal);
    }
  }

  // Format shares as: xx(X coordinate in hex) + yy...yy(32-byte Y coordinate in hex)
  return shares.map((share, idx) => {
    const xHex = (idx + 1).toString(16).padStart(2, '0');
    const yHex = Array.from(share)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return xHex + yHex;
  });
}

/**
 * Reconstructs a 32-byte secret key from a list of share hex strings.
 * Each share is: 2-digit X coordinate + 64-digit Y coordinate.
 */
export function reconstructKey(shareHexes: string[]): string {
  const uniqueShares = Array.from(new Set(shareHexes)).filter(s => s.length === 66);
  if (uniqueShares.length === 0) {
    throw new Error('No valid shares provided');
  }

  const n = uniqueShares.length;
  const xVals = new Uint8Array(n);
  const yVals: Uint8Array[] = [];

  for (let i = 0; i < n; i++) {
    const share = uniqueShares[i];
    xVals[i] = parseInt(share.substring(0, 2), 16);
    
    const yBytes = new Uint8Array(32);
    for (let b = 0; b < 32; b++) {
      yBytes[b] = parseInt(share.substring(2 + b * 2, 2 + b * 2 + 2), 16);
    }
    yVals.push(yBytes);
  }

  const secretBytes = new Uint8Array(32);

  // Reconstruct byte-by-byte
  for (let b = 0; b < 32; b++) {
    let secretByte = 0;
    
    for (let i = 0; i < n; i++) {
      const xi = xVals[i];
      const yi = yVals[i][b];
      
      // Calculate Lagrange basis polynomial value at x = 0
      // l_i(0) = PROD_{j != i} (x_j / (x_j - x_i))
      let li0 = 1;
      for (let j = 0; j < n; j++) {
        if (j === i) continue;
        const xj = xVals[j];
        // Addition/subtraction in GF(256) is XOR
        const denom = xj ^ xi;
        li0 = gfMul(li0, gfDiv(xj, denom));
      }
      
      secretByte ^= gfMul(yi, li0);
    }
    secretBytes[b] = secretByte;
  }

  return Array.from(secretBytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
