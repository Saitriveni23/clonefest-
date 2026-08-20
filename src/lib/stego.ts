/**
 * Client-side steganography helper to hide encrypted ciphertext inside innocuous PNG images.
 * Operates entirely on HTML5 Canvas API.
 */

// Helper: Convert string to binary bit array
function stringToBits(str: string): number[] {
  const bits: number[] = [];
  // Prefix with 32-bit length of the string
  const len = str.length;
  for (let i = 31; i >= 0; i--) {
    bits.push((len >> i) & 1);
  }
  // Convert characters to 8-bit values
  for (let i = 0; i < len; i++) {
    const code = str.charCodeAt(i);
    for (let j = 7; j >= 0; j--) {
      bits.push((code >> j) & 1);
    }
  }
  return bits;
}

// Helper: Convert binary bit array back to string
function bitsToString(bits: number[]): string {
  // Read first 32 bits for length
  let len = 0;
  for (let i = 0; i < 32; i++) {
    len = (len << 1) | bits[i];
  }

  // Sanity check for length bounds
  if (len <= 0 || len > 500000) {
    throw new Error('Steganography decode failed: invalid header length. Ensure this is a valid CipherDrop secure image.');
  }

  let result = '';
  let bitIdx = 32;
  for (let i = 0; i < len; i++) {
    let code = 0;
    for (let j = 0; j < 8; j++) {
      if (bitIdx >= bits.length) break;
      code = (code << 1) | bits[bitIdx++];
    }
    result += String.fromCharCode(code);
  }
  return result;
}

/**
 * Hides text in a canvas and returns the base64-encoded PNG image data.
 * If no imageSource is provided, we generate a premium gradient image on-the-fly.
 */
export async function encodeTextInImage(text: string, imageSource?: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    const img = new Image();
    
    const onImageLoaded = () => {
      canvas.width = img.width || 500;
      canvas.height = img.height || 500;
      
      if (imageSource) {
        ctx.drawImage(img, 0, 0);
      } else {
        // Generate beautiful gradient background if no source image is provided
        const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        grad.addColorStop(0, '#5f3aed');
        grad.addColorStop(0.5, '#4f46e5');
        grad.addColorStop(1, '#14b8a6');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Add a subtle premium abstract pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
        ctx.lineWidth = 2;
        for (let i = 0; i < canvas.width; i += 20) {
          ctx.beginPath();
          ctx.moveTo(i, 0);
          ctx.lineTo(canvas.width - i, canvas.height);
          ctx.stroke();
        }
      }

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const bits = stringToBits(text);

      if (bits.length > (data.length * 3) / 4) {
        return reject(new Error('Ciphertext is too long for the selected image size.'));
      }

      let bitIdx = 0;
      for (let i = 0; i < data.length; i += 4) {
        // Embed 1 bit in Red, Green, and Blue channels (skip Alpha at index i+3)
        for (let channel = 0; channel < 3; channel++) {
          if (bitIdx >= bits.length) break;
          // Clear LSB and write data bit
          data[i + channel] = (data[i + channel] & 0xfe) | bits[bitIdx++];
        }
        if (bitIdx >= bits.length) break;
      }

      ctx.putImageData(imgData, 0, 0);
      resolve(canvas.toDataURL('image/png'));
    };

    img.onerror = () => reject(new Error('Failed to load base steganography image'));

    if (imageSource) {
      img.src = imageSource;
    } else {
      // Trigger load manually for generated canvas gradient
      onImageLoaded();
    }
  });
}

/**
 * Extracts hidden text from a steganographic PNG image.
 */
export async function decodeTextFromImage(imageSrc: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return reject(new Error('Canvas context not available'));

    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const bits: number[] = [];

      for (let i = 0; i < data.length; i += 4) {
        for (let channel = 0; channel < 3; channel++) {
          bits.push(data[i + channel] & 1);
        }
      }

      try {
        const decodedText = bitsToString(bits);
        resolve(decodedText);
      } catch (err) {
        reject(err);
      }
    };
    img.onerror = () => reject(new Error('Failed to load steganography image for decoding.'));
    img.src = imageSrc;
  });
}
