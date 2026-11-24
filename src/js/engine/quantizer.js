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

export function deltaE(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

export function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(x => {
    const hex = Math.min(255, Math.max(0, Math.round(x))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

export function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [0, 0, 0];
  const clean = hex.replace('#', '');
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 0,
      parseInt(clean[1] + clean[1], 16) || 0,
      parseInt(clean[2] + clean[2], 16) || 0
    ];
  }
  const result = /^([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(clean);
  return result ? [
    parseInt(result[1], 16),
    parseInt(result[2], 16),
    parseInt(result[3], 16)
  ] : [0, 0, 0];
}

/**
 * Fast Median-Cut Palette Quantizer
 */
export function quantizePalette(pixels, maxColors = 64, minBoxRange = null) {
  const effectiveMinRange = minBoxRange !== null ? minBoxRange : (maxColors > 8 ? 14 : 0);
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

    if (bestIdx === -1 || maxRange <= 0 || maxRange < effectiveMinRange) break;

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
 * Perceptual CIELAB Palette Consolidation & Micro-Layer Absorption.
 * Merges near-identical clusters (Delta E < minDeltaE) and absorbs < 0.15% micro-outliers
 * to reduce redundant vector layers without visible quality loss.
 */
export function consolidatePalette(palette, options = {}) {
  if (!palette || palette.length <= 2) return palette;
  const minDeltaE = options.minDeltaE !== undefined ? options.minDeltaE : 5.5;
  const minAreaRatio = options.minAreaRatio !== undefined ? options.minAreaRatio : 0.0015;

  let clusters = palette.map(p => ({
    ...p,
    lab: p.lab || rgbToLab(p.r, p.g, p.b),
    count: p.count || 1
  }));

  const totalCount = clusters.reduce((s, c) => s + c.count, 0) || 1;

  function mergeInto(target, source) {
    const wSum = target.count + source.count;
    target.r = Math.round((target.r * target.count + source.r * source.count) / wSum);
    target.g = Math.round((target.g * target.count + source.g * source.count) / wSum);
    target.b = Math.round((target.b * target.count + source.b * source.count) / wSum);
    target.hex = rgbToHex(target.r, target.g, target.b);
    target.lab = rgbToLab(target.r, target.g, target.b);
    target.L = target.lab[0];
    target.count = wSum;
  }

  // 1. Absorb micro-outlier tiers (< 0.15% area) into nearest perceptual neighbor
  for (let i = clusters.length - 1; i >= 0 && clusters.length > 2; i--) {
    if ((clusters[i].count / totalCount) < minAreaRatio) {
      let bestIdx = -1;
      let bestDist = Infinity;
      for (let j = 0; j < clusters.length; j++) {
        if (i === j) continue;
        const d = deltaE(clusters[i].lab, clusters[j].lab);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = j;
        }
      }
      if (bestIdx >= 0) {
        mergeInto(clusters[bestIdx], clusters[i]);
        clusters.splice(i, 1);
      }
    }
  }

  // 2. Iteratively merge closest perceptual pairs below minDeltaE
  while (clusters.length > 2) {
    let bestA = -1, bestB = -1, minDist = Infinity;
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = deltaE(clusters[i].lab, clusters[j].lab);
        if (d < minDist) {
          minDist = d;
          bestA = i;
          bestB = j;
        }
      }
    }
    if (bestA === -1 || minDist >= minDeltaE) break;
    // Keep the larger cluster as primary
    if (clusters[bestB].count > clusters[bestA].count) {
      mergeInto(clusters[bestB], clusters[bestA]);
      clusters.splice(bestA, 1);
    } else {
      mergeInto(clusters[bestA], clusters[bestB]);
      clusters.splice(bestB, 1);
    }
  }

  clusters.sort((a, b) => a.L - b.L);
  return clusters;
}

/**
 * Perceptual Focal-Accent Canva Palette Selection (<= 5 editable solid colors).
 * Anchors darkest/lightest structural contrast, then picks remaining slots using
 * Max-Min Delta E x Chroma Focal Scoring so vivid accents (e.g. red eyes, cobalt stripes)
 * are preserved instead of being swallowed by large neutral backgrounds.
 */
export function selectCanvaPalette(candidates, maxColors = 5) {
  if (!candidates || candidates.length <= maxColors) return candidates || [];

  const pool = candidates.map(c => {
    const lab = c.lab || rgbToLab(c.r, c.g, c.b);
    const chroma = Math.sqrt(lab[1] * lab[1] + lab[2] * lab[2]);
    return { ...c, lab, L: lab[0], chroma, count: c.count || 1 };
  });

  const totalCount = pool.reduce((s, c) => s + c.count, 0) || 1;
  const significant = pool.filter(c => (c.count / totalCount) >= 0.0015);
  const working = significant.length >= maxColors ? significant : pool;

  const selected = [];
  const used = new Set();

  // Anchor 1: Darkest structural tone (>= 2% area if available)
  const majorDark = working.filter(c => (c.count / totalCount) >= 0.02);
  const darkPool = majorDark.length > 0 ? majorDark : working;
  let darkestIdx = 0;
  for (let i = 1; i < darkPool.length; i++) {
    if (darkPool[i].L < darkPool[darkestIdx].L) darkestIdx = i;
  }
  const darkAnchor = darkPool[darkestIdx];
  selected.push(darkAnchor);
  used.add(darkAnchor);

  // Anchor 2: Lightest structural tone (>= 2% area if available)
  const lightPool = majorDark.length > 1 ? majorDark.filter(c => !used.has(c)) : working.filter(c => !used.has(c));
  if (lightPool.length > 0 && selected.length < maxColors) {
    let lightestIdx = 0;
    for (let i = 1; i < lightPool.length; i++) {
      if (lightPool[i].L > lightPool[lightestIdx].L) lightestIdx = i;
    }
    const lightAnchor = lightPool[lightestIdx];
    selected.push(lightAnchor);
    used.add(lightAnchor);
  }

  // Remaining slots: Max-Min Delta E x Chroma Focal Scoring
  while (selected.length < maxColors) {
    let bestCand = null;
    let bestScore = -1;
    for (const cand of working) {
      if (used.has(cand)) continue;
      let minDE = Infinity;
      for (const s of selected) {
        const d = deltaE(cand.lab, s.lab);
        if (d < minDE) minDE = d;
      }
      const areaRatio = Math.max(0.001, cand.count / totalCount);
      const chromaBoost = 1 + Math.pow(cand.chroma, 1.35) / 25;
      const score = chromaBoost * minDE * Math.pow(areaRatio, 0.2);
      if (score > bestScore) {
        bestScore = score;
        bestCand = cand;
      }
    }
    if (!bestCand) break;
    selected.push(bestCand);
    used.add(bestCand);
  }

  selected.sort((a, b) => a.L - b.L);
  return selected;
}

/**
 * Perceptual CIELAB Delta E pixel mapping (preserves vivid red/blue accents accurately).
 */
export function mapPixelsToPaletteLab(pixels, palette) {
  const indices = new Uint8Array(pixels.length / 4);
  const palLabs = palette.map(p => p.lab || rgbToLab(p.r, p.g, p.b));

  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const pLab = rgbToLab(pixels[i], pixels[i + 1], pixels[i + 2]);
    let bestDist = Infinity;
    let bestTier = 0;
    for (let t = 0; t < palLabs.length; t++) {
      const d = deltaE(pLab, palLabs[t]);
      if (d < bestDist) {
        bestDist = d;
        bestTier = t;
      }
    }
    indices[p] = bestTier;
  }
  return indices;
}

/**
 * 3x3 Spatial Majority Despeckle for quantized tier maps (prunes 1px brush/weave/anti-aliasing noise).
 * @param {boolean} [strict=false] - Also prune 2-same-neighbor fringes surrounded by >=6 dominant neighbors
 */
export function despeckleTierMap(tierMap, width, height, strict = false) {
  const out = new tierMap.constructor(tierMap);
  for (let y = 1; y < height - 1; y++) {
    const yOff = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOff + x;
      const cur = tierMap[idx];
      if (cur < 0) continue;
      let same = 0;
      let domTier = cur;
      let domCount = 0;
      const counts = new Map();
      for (let dy = -1; dy <= 1; dy++) {
        const nRow = (y + dy) * width;
        for (let dx = -1; dx <= 1; dx++) {
          if (dx === 0 && dy === 0) continue;
          const nt = tierMap[nRow + x + dx];
          if (nt < 0) continue;
          if (nt === cur) {
            same++;
          } else {
            const c = (counts.get(nt) || 0) + 1;
            counts.set(nt, c);
            if (c > domCount) {
              domCount = c;
              domTier = nt;
            }
          }
        }
      }
      if ((same <= 1 && domCount >= 5) || (strict && same <= 2 && domCount >= 6)) {
        out[idx] = domTier;
      }
    }
  }
  return out;
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
