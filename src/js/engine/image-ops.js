/**
 * c2vector - Image Operations Module
 * High-quality canvas resampling, bilateral edge-preserving smoothing, and Canny edge detection
 */

export function computeLuminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, v = max;
  const d = max - min;
  s = max === 0 ? 0 : d / max;
  if (max === min) {
    h = 0;
  } else {
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return [h * 360, s, v];
}

export function hsvToRgb(h, s, v) {
  let r, g, b;
  const i = Math.floor((h / 60) % 6);
  const f = h / 60 - Math.floor(h / 60);
  const p = v * (1 - s);
  const q = v * (1 - f * s);
  const t = v * (1 - (1 - f) * s);
  switch (i) {
    case 0: r = v; g = t; b = p; break;
    case 1: r = q; g = v; b = p; break;
    case 2: r = p; g = v; b = t; break;
    case 3: r = p; g = q; b = v; break;
    case 4: r = t; g = p; b = v; break;
    case 5: r = v; g = p; b = q; break;
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

/**
 * Resamples an ImageData buffer using bicubic Catmull-Rom interpolation
 */
export function resampleBicubic(srcData, srcW, srcH, dstW, dstH) {
  const dstData = new Uint8ClampedArray(dstW * dstH * 4);
  const xRatio = srcW / dstW;
  const yRatio = srcH / dstH;

  function cubicKernel(x) {
    x = Math.abs(x);
    if (x <= 1) return 1.5 * x * x * x - 2.5 * x * x + 1.0;
    if (x < 2) return -0.5 * x * x * x + 2.5 * x * x - 4.0 * x + 2.0;
    return 0;
  }

  for (let dy = 0; dy < dstH; dy++) {
    const srcY = dy * yRatio;
    const yInt = Math.floor(srcY);
    const yFrac = srcY - yInt;

    for (let dx = 0; dx < dstW; dx++) {
      const srcX = dx * xRatio;
      const xInt = Math.floor(srcX);
      const xFrac = srcX - xInt;

      let r = 0, g = 0, b = 0, a = 0;
      let totalWeight = 0;

      for (let m = -1; m <= 2; m++) {
        const py = Math.min(Math.max(yInt + m, 0), srcH - 1);
        const wy = cubicKernel(m - yFrac);

        for (let n = -1; n <= 2; n++) {
          const px = Math.min(Math.max(xInt + n, 0), srcW - 1);
          const wx = cubicKernel(n - xFrac);
          const weight = wx * wy;

          const idx = (py * srcW + px) * 4;
          r += srcData[idx] * weight;
          g += srcData[idx + 1] * weight;
          b += srcData[idx + 2] * weight;
          a += srcData[idx + 3] * weight;
          totalWeight += weight;
        }
      }

      const dstIdx = (dy * dstW + dx) * 4;
      dstData[dstIdx] = Math.min(255, Math.max(0, Math.round(r / totalWeight)));
      dstData[dstIdx + 1] = Math.min(255, Math.max(0, Math.round(g / totalWeight)));
      dstData[dstIdx + 2] = Math.min(255, Math.max(0, Math.round(b / totalWeight)));
      dstData[dstIdx + 3] = Math.min(255, Math.max(0, Math.round(a / totalWeight)));
    }
  }

  return dstData;
}

/**
 * Fast edge-preserving bilateral filter on pixel buffer with precomputed LUT
 */
export function bilateralDenoise(srcData, width, height, spatialSigma = 1.5, colorSigma = 22.0) {
  const dstData = new Uint8ClampedArray(srcData.length);
  const radius = Math.max(1, Math.round(spatialSigma * 1.5));
  const spatialLut = [];
  for (let r = 0; r <= radius; r++) {
    for (let c = 0; c <= radius; c++) {
      const dsq = r * r + c * c;
      spatialLut[dsq] = Math.exp(-dsq / (2 * spatialSigma * spatialSigma));
    }
  }

  const colorCoeff = -1 / (2 * colorSigma * colorSigma);
  const maxColorDist = 255 * 255 * 3;
  const colorLut = new Float32Array(maxColorDist + 1);
  for (let i = 0; i <= maxColorDist; i++) {
    colorLut[i] = Math.exp(i * colorCoeff);
  }

  for (let y = 0; y < height; y++) {
    const yOffset = y * width;
    for (let x = 0; x < width; x++) {
      const centerIdx = (yOffset + x) * 4;
      const cA = srcData[centerIdx + 3];
      if (cA < 32) {
        dstData[centerIdx] = srcData[centerIdx];
        dstData[centerIdx + 1] = srcData[centerIdx + 1];
        dstData[centerIdx + 2] = srcData[centerIdx + 2];
        dstData[centerIdx + 3] = cA;
        continue;
      }
      const cR = srcData[centerIdx];
      const cG = srcData[centerIdx + 1];
      const cB = srcData[centerIdx + 2];

      let accR = 0, accG = 0, accB = 0, totalW = 0;

      for (let dy = -radius; dy <= radius; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;
        const nyOffset = ny * width;

        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const distSq = dx * dx + dy * dy;
          if (distSq > radius * radius) continue;

          const nIdx = (nyOffset + nx) * 4;
          if (srcData[nIdx + 3] < 32) continue; // Never bleed transparent matte RGB into opaque edges
          const nR = srcData[nIdx];
          const nG = srcData[nIdx + 1];
          const nB = srcData[nIdx + 2];

          const dr = cR - nR, dg = cG - nG, db = cB - nB;
          const colorDistSq = dr * dr + dg * dg + db * db;
          const weight = (spatialLut[distSq] || 0) * (colorLut[colorDistSq] || 0);

          accR += nR * weight;
          accG += nG * weight;
          accB += nB * weight;
          totalW += weight;
        }
      }

      if (totalW > 0) {
        dstData[centerIdx] = Math.round(accR / totalW);
        dstData[centerIdx + 1] = Math.round(accG / totalW);
        dstData[centerIdx + 2] = Math.round(accB / totalW);
      } else {
        dstData[centerIdx] = cR;
        dstData[centerIdx + 1] = cG;
        dstData[centerIdx + 2] = cB;
      }
      dstData[centerIdx + 3] = cA;
    }
  }

  return dstData;
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

