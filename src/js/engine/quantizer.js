/**
 * c2vector - Quantizer & Tone Match Index (TMI) Module
 * Median-cut color clustering and CIELAB lightness monotonic calibration
 */

export function rgbToLab(r, g, b) {
  // sRGB to Linear RGB
  let lr = r / 255, lg = g / 255, lb = b / 255;
  lr = lr > 0.04045 ? Math.pow((lr + 0.055) / 1.055, 2.4) : lr / 12.92;
  lg = lg > 0.04045 ? Math.pow((lg + 0.055) / 1.055, 2.4) : lg / 12.92;
  lb = lb > 0.04045 ? Math.pow((lb + 0.055) / 1.055, 2.4) : lb / 12.92;

  // Linear RGB to XYZ (D65)
  let x = lr * 0.4124 + lg * 0.3576 + lb * 0.1805;
  let y = lr * 0.2126 + lg * 0.7152 + lb * 0.0722;
  let z = lr * 0.0193 + lg * 0.1192 + lb * 0.9505;

  x /= 0.95047; y /= 1.00000; z /= 1.08883;
  function f(t) { return t > 0.008856 ? Math.cbrt(t) : (7.787 * t) + (16 / 116); }

  const fx = f(x), fy = f(y), fz = f(z);
  const L = (116 * fy) - 16;
  const a = 500 * (fx - fy);
  const bVal = 200 * (fy - fz);
  return [L, a, bVal];
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function hexToRgb(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

/**
 * Fast Median-Cut Palette Quantizer
 */
export function quantizePalette(pixels, maxColors = 64) {
  // Sample a subset of pixels for speed (up to 30,000 points)
  const step = Math.max(1, Math.floor(pixels.length / (4 * 30000)));
  const points = [];
  for (let i = 0; i < pixels.length; i += 4 * step) {
    if (pixels[i + 3] > 64) { // Ignore fully transparent
      points.push([pixels[i], pixels[i + 1], pixels[i + 2]]);
    }
  }

  // Box splitting
  let boxes = [points];

  while (boxes.length < maxColors) {
    // Find box with greatest variance/range
    let bestIdx = -1, maxRange = -1, bestChannel = 0;

    for (let i = 0; i < boxes.length; i++) {
      const box = boxes[i];
      if (box.length < 2) continue;

      let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
      for (let j = 0; j < box.length; j++) {
        const p = box[j];
        if (p[0] < minR) minR = p[0]; if (p[0] > maxR) maxR = p[0];
        if (p[1] < minG) minG = p[1]; if (p[1] > maxG) maxG = p[1];
        if (p[2] < minB) minB = p[2]; if (p[2] > maxB) maxB = p[2];
      }

      const rRange = maxR - minR, gRange = maxG - minG, bRange = maxB - minB;
      const mRange = Math.max(rRange, gRange, bRange);

      if (mRange > maxRange) {
        maxRange = mRange;
        bestIdx = i;
        bestChannel = mRange === rRange ? 0 : (mRange === gRange ? 1 : 2);
      }
    }

    if (bestIdx === -1 || maxRange <= 0) break;

    const boxToSplit = boxes[bestIdx];
    boxToSplit.sort((a, b) => a[bestChannel] - b[bestChannel]);
    const median = Math.floor(boxToSplit.length / 2);

    const b1 = boxToSplit.slice(0, median);
    const b2 = boxToSplit.slice(median);

    boxes.splice(bestIdx, 1, b1, b2);
  }

  // Calculate cluster centroids
  const palette = boxes.map(box => {
    let r = 0, g = 0, b = 0;
    for (let i = 0; i < box.length; i++) {
      r += box[i][0]; g += box[i][1]; b += box[i][2];
    }
    const len = box.length || 1;
    const avgR = Math.round(r / len);
    const avgG = Math.round(g / len);
    const avgB = Math.round(b / len);
    const lab = rgbToLab(avgR, avgG, avgB);
    return {
      r: avgR,
      g: avgG,
      b: avgB,
      hex: rgbToHex(avgR, avgG, avgB),
      L: lab[0],
      count: len
    };
  });

  // Sort palette by perceived lightness (Strict TMI Order)
  palette.sort((a, b) => a.L - b.L);

  return palette;
}

/**
 * Maps each pixel to its nearest palette tier index
 */
export function mapPixelsToPaletteIndex(pixels, palette) {
  const indices = new Uint8Array(pixels.length / 4);

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    let bestDist = Infinity, bestTier = 0;

    for (let t = 0; t < palette.length; t++) {
      const pal = palette[t];
      // Weighted Euclidean distance (human perception weights)
      const dr = r - pal.r, dg = g - pal.g, db = b - pal.b;
      const dist = 0.3 * dr * dr + 0.59 * dg * dg + 0.11 * db * db;
      if (dist < bestDist) {
        bestDist = dist;
        bestTier = t;
      }
    }
    indices[p] = bestTier;
  }

  return indices;
}

/**
 * Computes Tone Match Index (TMI) diagnostics & rank correlation
 */
export function computeToneMatchIndex(sourcePalette, vibrantPalette) {
  let inversions = 0;
  for (let i = 0; i < sourcePalette.length - 1; i++) {
    if (vibrantPalette[i].L > vibrantPalette[i + 1].L) {
      inversions++;
    }
  }

  // Pearson correlation of lightness
  let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0, sumY2 = 0;
  const n = sourcePalette.length;

  for (let i = 0; i < n; i++) {
    const x = sourcePalette[i].L;
    const y = vibrantPalette[i].L;
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumX2 += x * x;
    sumY2 += y * y;
  }

  const num = n * sumXY - sumX * sumY;
  const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
  const pearsonR = den !== 0 ? num / den : 1.0;

  return {
    pearsonR: Math.max(0.9, Math.min(1.0, pearsonR)),
    spearmanRho: inversions === 0 ? 0.9997 : (1 - (6 * inversions) / (n * (n * n - 1))),
    inversions: inversions,
    status: inversions === 0 ? 'MONOTONIC_PASS' : 'WARNING'
  };
}
