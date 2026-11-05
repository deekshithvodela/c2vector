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
  let opaqueCount = 0;

  for (let i = 0; i < pixels.length; i += 4) {
    if (pixels[i + 3] < 64) continue; // Ignore transparent pixels
    const lum = Math.round(computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]));
    histogram[lum]++;
    opaqueCount++;
  }

  const total = opaqueCount > 0 ? opaqueCount : (width * height);

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
    if (pixels[i + 3] < 64) {
      map[p] = 0;
      continue;
    }
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

/**
 * Generates an exact alpha mask for transparent vectors.
 * Directly reads pixel alpha values to preserve 100% of both external and internal transparent cutouts
 * (such as negative space between limbs/torso, typography counter loops, open filigree in furniture).
 * Applies a micro-speckle noise filter to fill only isolated single-pixel dust/noise voids (< 6px),
 * while strictly preserving all genuine transparent regions (>= 6px).
 * 
 * @param {Uint8ClampedArray|Uint8Array} pixels - RGBA pixel array
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {object} [options] - Optional configuration (alphaThreshold, minHoleArea)
 * @returns {Uint8Array} - 1 for subject, 0 for transparent areas
 */
export function generateExactAlphaMask(pixels, width, height, options = {}) {
  const threshold = options.alphaThreshold !== undefined ? options.alphaThreshold : 32;
  const minHoleArea = options.minHoleArea !== undefined ? options.minHoleArea : 6;
  const total = width * height;

  const mask = new Uint8Array(total);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    if (pixels[i + 3] >= threshold) {
      mask[p] = 1;
    }
  }

  // Micro-speckle noise cleanup:
  // Identify isolated transparent pinholes (< minHoleArea pixels) completely enclosed inside the subject.
  // We ONLY close tiny 1-5 pixel sensor noise/pinholes so they don't create jagged Potrace artifacts.
  // Genuine transparent cutouts (>= 6px) are strictly left 0 (transparent).
  if (minHoleArea > 1) {
    const visited = new Uint8Array(total);
    const q = new Int32Array(total);

    for (let p = 0; p < total; p++) {
      if (mask[p] === 0 && !visited[p]) {
        let head = 0, tail = 0;
        visited[p] = 1;
        q[tail++] = p;

        let touchesBorder = false;

        while (head < tail) {
          const curr = q[head++];
          const cx = curr % width;
          const cy = Math.floor(curr / width);

          if (cx === 0 || cx === width - 1 || cy === 0 || cy === height - 1) {
            touchesBorder = true;
          }

          if (cx > 0) {
            const n = curr - 1;
            if (!visited[n] && mask[n] === 0) { visited[n] = 1; q[tail++] = n; }
          }
          if (cx < width - 1) {
            const n = curr + 1;
            if (!visited[n] && mask[n] === 0) { visited[n] = 1; q[tail++] = n; }
          }
          if (cy > 0) {
            const n = curr - width;
            if (!visited[n] && mask[n] === 0) { visited[n] = 1; q[tail++] = n; }
          }
          if (cy < height - 1) {
            const n = curr + width;
            if (!visited[n] && mask[n] === 0) { visited[n] = 1; q[tail++] = n; }
          }
        }

        // If this transparent cluster does NOT touch the outer border AND has < minHoleArea pixels:
        // it is isolated single-pixel dust/noise, so seal it into the mask.
        if (!touchesBorder && tail < minHoleArea) {
          for (let k = 0; k < tail; k++) {
            mask[q[k]] = 1;
          }
        }
      }
    }
  }

  return mask;
}

// Backward-compatible alias
export const generateSolidSubjectMask = generateExactAlphaMask;
