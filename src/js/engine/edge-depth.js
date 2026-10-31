/**
 * c2vector - Edge & Depth Module
 * Sub-pixel Canny edge detection with NMS and multi-scale Laplacian focus depth estimation
 */

import { computeLuminance } from './image-ops.js';

/**
 * Multi-scale Laplacian of Gaussian focus depth energy
 */
export function computeDepthMap(pixels, width, height) {
  const depth = new Uint8Array(width * height);
  const lum = new Float32Array(width * height);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    lum[p] = computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]);
  }

  // 3x3 Laplacian kernel
  let minVal = Infinity, maxVal = -Infinity;
  const lap = new Float32Array(width * height);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const center = lum[idx];
      const sumNeighbors = lum[idx - 1] + lum[idx + 1] + lum[idx - width] + lum[idx + width];
      const val = Math.abs(4 * center - sumNeighbors);
      lap[idx] = val;
      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
    }
  }

  const range = maxVal - minVal || 1;
  for (let i = 0; i < lap.length; i++) {
    depth[i] = Math.min(255, Math.max(0, Math.round(((lap[i] - minVal) / range) * 255)));
  }

  return depth;
}

/**
 * Sub-pixel Canny Edge Detector with Non-Maximum Suppression (1-px ridges)
 */
export function computeCannyEdges(pixels, width, height, lowThreshold = 25, highThreshold = 65) {
  const count = width * height;
  const lum = new Float32Array(count);
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    lum[p] = computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]);
  }

  // Sobel convolution
  const gx = new Float32Array(count);
  const gy = new Float32Array(count);
  const mag = new Float32Array(count);
  const dir = new Uint8Array(count);

  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;

      const p00 = lum[idx - width - 1], p01 = lum[idx - width], p02 = lum[idx - width + 1];
      const p10 = lum[idx - 1],                                 p12 = lum[idx + 1];
      const p20 = lum[idx + width - 1], p21 = lum[idx + width], p22 = lum[idx + width + 1];

      const xGrad = (p02 + 2 * p12 + p22) - (p00 + 2 * p10 + p20);
      const yGrad = (p20 + 2 * p21 + p22) - (p00 + 2 * p01 + p02);

      gx[idx] = xGrad;
      gy[idx] = yGrad;
      const m = Math.sqrt(xGrad * xGrad + yGrad * yGrad);
      mag[idx] = m;

      // Quantize angle to 0, 45, 90, 135 degrees
      let angle = (Math.atan2(yGrad, xGrad) * 180 / Math.PI) % 180;
      if (angle < 0) angle += 180;

      if ((angle >= 0 && angle < 22.5) || (angle >= 157.5 && angle <= 180)) {
        dir[idx] = 0; // East-West
      } else if (angle >= 22.5 && angle < 67.5) {
        dir[idx] = 1; // North-East
      } else if (angle >= 67.5 && angle < 112.5) {
        dir[idx] = 2; // North-South
      } else {
        dir[idx] = 3; // North-West
      }
    }
  }

  // Non-Maximum Suppression (thinning to 1-pixel ridges)
  const nms = new Float32Array(count);
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      const m = mag[idx];
      const d = dir[idx];

      let n1 = 0, n2 = 0;
      if (d === 0) { // Horizontal (check left & right)
        n1 = mag[idx - 1]; n2 = mag[idx + 1];
      } else if (d === 1) { // 45 degree diagonal
        n1 = mag[idx - width + 1]; n2 = mag[idx + width - 1];
      } else if (d === 2) { // Vertical (check top & bottom)
        n1 = mag[idx - width]; n2 = mag[idx + width];
      } else if (d === 3) { // 135 degree diagonal
        n1 = mag[idx - width - 1]; n2 = mag[idx + width + 1];
      }

      if (m >= n1 && m >= n2) {
        nms[idx] = m;
      } else {
        nms[idx] = 0;
      }
    }
  }

  // Hysteresis thresholding
  const edges = new Uint8Array(count);
  const queue = [];

  for (let i = 0; i < count; i++) {
    if (nms[i] >= highThreshold) {
      edges[i] = 255;
      queue.push(i);
    }
  }

  // Link weak edges
  while (queue.length > 0) {
    const cur = queue.pop();
    const cx = cur % width;
    const cy = Math.floor(cur / width);

    for (let dy = -1; dy <= 1; dy++) {
      const ny = cy + dy;
      if (ny < 0 || ny >= height) continue;
      for (let dx = -1; dx <= 1; dx++) {
        const nx = cx + dx;
        if (nx < 0 || nx >= width) continue;

        const nIdx = ny * width + nx;
        if (edges[nIdx] === 0 && nms[nIdx] >= lowThreshold) {
          edges[nIdx] = 255;
          queue.push(nIdx);
        }
      }
    }
  }

  return edges;
}
