/**
 * c2vector - Image Operations Module
 * High-quality canvas resampling, bilateral edge-preserving smoothing, and framing
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

      dstData[centerIdx] = Math.round(accR / totalW);
      dstData[centerIdx + 1] = Math.round(accG / totalW);
      dstData[centerIdx + 2] = Math.round(accB / totalW);
      dstData[centerIdx + 3] = srcData[centerIdx + 3];
    }
  }

  return dstData;
}

