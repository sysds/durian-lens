import sharp from 'sharp';

/**
 * Detect image blur using Laplacian variance.
 * High variance = sharp image, low variance = blurry image.
 * Returns a score between 0 and ~1000+ (typical sharp photos are 100–500).
 */
export async function detectBlurScore(imageBuffer: Buffer): Promise<number> {
  // Convert to grayscale raw 8-bit pixels
  const { data, info } = await sharp(imageBuffer)
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const pixels = new Uint8Array(data);

  // 3x3 Laplacian kernel
  const kernel = [
    [0, 1, 0],
    [1, -4, 1],
    [0, 1, 0],
  ];

  let sum = 0;
  let sumSq = 0;
  let count = 0;

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      let conv = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const px = pixels[(y + ky) * width + (x + kx)];
          conv += px * kernel[ky + 1][kx + 1];
        }
      }
      sum += conv;
      sumSq += conv * conv;
      count++;
    }
  }

  if (count === 0) return 0;

  const mean = sum / count;
  const variance = sumSq / count - mean * mean;

  // Normalize to a roughly 0–1000 scale for typical phone photos
  return Math.max(0, variance / 100);
}

// Threshold tuned for typical mobile durian photos.
// Below this -> likely blurry or out of focus.
export const BLUR_THRESHOLD = 35;
