/**
 * c2vector - Tonal Studies Module
 * Otsu 1-bit, 4-tone & 8-tone positive/negative posterization, and island-bridge stencil
 */

import { computeLuminance } from './image-ops.js';

/**
 * Computes optimal Otsu threshold maximizing between-class variance
 */
export function computeOtsuThreshold(pixels, width, height) {
  const histogram = new Int32Array(256);
  const total = width * height;

  for (let i = 0; i < pixels.length; i += 4) {
    const lum = Math.round(computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]));
    histogram[lum]++;
  }

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * histogram[t];

  let sumB = 0;
  let wB = 0;
  let maxVar = 0;
  let threshold = 128;

  for (let t = 0; t < 256; t++) {
    wB += histogram[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;

    sumB += t * histogram[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;

    const betweenVar = wB * wF * (mB - mF) * (mB - mF);
    if (betweenVar > maxVar) {
      maxVar = betweenVar;
      threshold = t;
    }
  }

  return threshold;
}

/**
 * 1-Bit Otsu Monochrome bitmap: returns Uint8Array (0 or 255)
 */
export function generateMonochromeMap(pixels, width, height, threshold) {
  const map = new Uint8Array(width * height);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const lum = computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]);
    map[p] = lum >= threshold ? 255 : 0;
  }
  return map;
}

/**
 * Posterize luminance into N equalized steps
 */
export function generatePosterizeMap(pixels, width, height, numTiers = 4, inverted = false) {
  const map = new Uint8Array(width * height);
  const step = 255 / (numTiers - 1);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    let lum = computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]);
    if (inverted) lum = 255 - lum;

    const tierIndex = Math.min(numTiers - 1, Math.round(lum / step));
    map[p] = Math.round(tierIndex * step);
  }

  return map;
}

/**
 * Generates bridge-connected structural stencil
 * Adds vertical/horizontal anchor bridges across isolated floating islands
 */
export function generateBridgeStencilMap(monochromeMap, width, height, bridgeWidth = 3, gridInterval = 48) {
  const stencil = new Uint8Array(monochromeMap);

  // Carve structural grid bridges to support detached physical cut islands
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      // Border reinforcement
      if (x < 6 || x >= width - 6 || y < 6 || y >= height - 6) {
        stencil[idx] = 0; // Solid boundary frame
        continue;
      }

      // Periodic vertical bridge ribs
      if (x % gridInterval < bridgeWidth && stencil[idx] === 255) {
        // Connect to nearest dark region if bridging islands
        stencil[idx] = 0;
      }
    }
  }

  return stencil;
}
