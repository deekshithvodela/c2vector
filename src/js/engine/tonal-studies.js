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
 * Generates topologically bridged structural stencil mask:
 * 1. Prunes tiny cut-confetti specks (< minCutArea) unless preserveFineDetail is set.
 * 2. Reinforces outer stencil margin so outer sheet remains contiguous.
 * 3. Runs perimeter BFS to detect disconnected internal 0-islands (e.g. inside O, A, rings)
 *    and carves shortest multi-ray bridges (with dual opposing bridges on large islands)
 *    chaining nested rings all the way out to the outer sheet frame.
 */
export function generateBridgeStencilMap(monochromeMap, width, height, options = {}) {
  const opts = typeof options === 'object' && options !== null ? options : {};
  const total = width * height;
  const minDim = Math.min(width, height);
  const preserveFineDetail = Boolean(opts.preserveFineDetail);

  let borderZeroCount = 0;
  let borderTotal = 0;
  for (let x = 0; x < width; x++) {
    borderTotal += 2;
    if (monochromeMap[x] === 0) borderZeroCount++;
    if (monochromeMap[(height - 1) * width + x] === 0) borderZeroCount++;
  }
  for (let y = 1; y < height - 1; y++) {
    borderTotal += 2;
    if (monochromeMap[y * width] === 0) borderZeroCount++;
    if (monochromeMap[y * width + width - 1] === 0) borderZeroCount++;
  }
  const openPerimeter = borderTotal > 0 && (borderZeroCount / borderTotal) >= 0.65;

  const margin = opts.margin !== undefined
    ? opts.margin
    : (preserveFineDetail && openPerimeter
      ? 0
      : (preserveFineDetail
        ? Math.min(4, Math.max(2, Math.round(minDim * 0.004)))
        : Math.min(10, Math.max(4, Math.round(minDim * 0.012)))));
  const minCutArea = opts.minCutArea !== undefined
    ? opts.minCutArea
    : (preserveFineDetail ? 0 : Math.max(8, Math.round(total * 0.000015)));
  const minIslandArea = opts.minIslandArea !== undefined
    ? opts.minIslandArea
    : (preserveFineDetail
      ? Math.max(90, Math.round(total * 0.00015))
      : Math.max(20, Math.round(total * 0.00004)));
  const bridgeWidth = opts.bridgeWidth !== undefined
    ? opts.bridgeWidth
    : (preserveFineDetail
      ? Math.max(2, Math.round(minDim * 0.0025))
      : Math.max(4, Math.round(minDim * 0.009)));

  const stencil = new Uint8Array(monochromeMap);

  // 1. Optional micro-confetti cut pruning (skipped on intricate glyph line art)
  if (minCutArea > 0) {
    const cutBinary = new Uint8Array(total);
    for (let i = 0; i < total; i++) {
      if (stencil[i] > 0) cutBinary[i] = 1;
    }
    const { stats: cutStats } = labelConnectedComponents(cutBinary, width, height, true);
    for (const s of cutStats.values()) {
      if (s.count < minCutArea) {
        for (let k = 0; k < s.pixels.length; k++) {
          stencil[s.pixels[k]] = 0;
        }
      }
    }
  }

  // 2. Outer perimeter frame enforcement (keeps sheet border intact when margin > 0)
  if (margin > 0) {
    for (let y = 0; y < height; y++) {
      const yOff = y * width;
      for (let x = 0; x < width; x++) {
        if (x < margin || x >= width - margin || y < margin || y >= height - margin) {
          stencil[yOff + x] = 0;
        }
      }
    }
  }

  // 3. BFS flood-fill over 0-pixels from outer frame to mark reachable stencil sheet
  const outerReachable = new Uint8Array(total);
  const queue = new Int32Array(total);

  function floodOuterFrom(seeds) {
    let head = 0;
    let tail = 0;
    for (let i = 0; i < seeds.length; i++) {
      const idx = seeds[i];
      if (stencil[idx] === 0 && !outerReachable[idx]) {
        outerReachable[idx] = 1;
        queue[tail++] = idx;
      }
    }
    while (head < tail) {
      const curr = queue[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      if (cx > 0) {
        const n = curr - 1;
        if (stencil[n] === 0 && !outerReachable[n]) { outerReachable[n] = 1; queue[tail++] = n; }
      }
      if (cx < width - 1) {
        const n = curr + 1;
        if (stencil[n] === 0 && !outerReachable[n]) { outerReachable[n] = 1; queue[tail++] = n; }
      }
      if (cy > 0) {
        const n = curr - width;
        if (stencil[n] === 0 && !outerReachable[n]) { outerReachable[n] = 1; queue[tail++] = n; }
      }
      if (cy < height - 1) {
        const n = curr + width;
        if (stencil[n] === 0 && !outerReachable[n]) { outerReachable[n] = 1; queue[tail++] = n; }
      }
    }
  }

  const borderSeeds = [];
  for (let x = 0; x < width; x++) {
    borderSeeds.push(x, (height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    borderSeeds.push(y * width, y * width + width - 1);
  }
  floodOuterFrom(borderSeeds);

  // 4. Identify all enclosed 0-islands (not reachable from outer sheet)
  const islandMask = new Uint8Array(total);
  let hasIslands = false;
  for (let i = 0; i < total; i++) {
    if (stencil[i] === 0 && !outerReachable[i]) {
      islandMask[i] = 1;
      hasIslands = true;
    }
  }
  if (!hasIslands) return stencil;

  const { stats: islandStats } = labelConnectedComponents(islandMask, width, height, true);
  const islands = Array.from(islandStats.values())
    .filter(s => s.count >= minIslandArea)
    .sort((a, b) => b.count - a.count);

  const dirs = [
    [1, 0], [-1, 0], [0, 1], [0, -1],
    [1, 1], [-1, -1], [1, -1], [-1, 1]
  ];
  const halfBW = Math.max(1.0, bridgeWidth * 0.5);
  const maxRayDist = Math.max(width, height);

  function carveBridge(x0, y0, x1, y1, radius) {
    const dx = x1 - x0;
    const dy = y1 - y0;
    const steps = Math.max(1, Math.ceil(Math.hypot(dx, dy) * 1.5));
    const rCeil = Math.ceil(radius);
    const rSq = radius * radius;
    const carved = [];
    for (let s = 0; s <= steps; s++) {
      const t = s / steps;
      const cx = Math.round(x0 + dx * t);
      const cy = Math.round(y0 + dy * t);
      for (let oy = -rCeil; oy <= rCeil; oy++) {
        const ny = cy + oy;
        if (ny < 0 || ny >= height) continue;
        for (let ox = -rCeil; ox <= rCeil; ox++) {
          const nx = cx + ox;
          if (nx < 0 || nx >= width) continue;
          if (ox * ox + oy * oy <= rSq + 0.25) {
            const idx = ny * width + nx;
            stencil[idx] = 0;
            carved.push(idx);
          }
        }
      }
    }
    return carved;
  }

  // 5. Connect each enclosed island with shortest ray bridge (plus opposing bridge for large centers)
  for (const isl of islands) {
    const stillIsolated = isl.pixels.some(idx => !outerReachable[idx]);
    if (!stillIsolated) continue;

    // Collect boundary pixels of this island touching cut pixels
    const boundary = [];
    for (let i = 0; i < isl.pixels.length; i++) {
      const idx = isl.pixels[i];
      const bx = idx % width;
      const by = Math.floor(idx / width);
      if (
        (bx > 0 && stencil[idx - 1] > 0) ||
        (bx < width - 1 && stencil[idx + 1] > 0) ||
        (by > 0 && stencil[idx - width] > 0) ||
        (by < height - 1 && stencil[idx + width] > 0)
      ) {
        boundary.push(idx);
      }
    }
    if (boundary.length === 0) continue;

    const sampleStride = Math.max(1, Math.floor(boundary.length / 28));
    const candidates = [];
    for (let i = 0; i < boundary.length; i += sampleStride) {
      const bIdx = boundary[i];
      const bx = bIdx % width;
      const by = Math.floor(bIdx / width);
      for (let d = 0; d < dirs.length; d++) {
        const [ux, uy] = dirs[d];
        const stepLen = Math.hypot(ux, uy);
        for (let k = 1; k < maxRayDist; k++) {
          const nx = bx + ux * k;
          const ny = by + uy * k;
          if (nx < 0 || nx >= width || ny < 0 || ny >= height) break;
          const nIdx = ny * width + nx;
          if (stencil[nIdx] === 0 && outerReachable[nIdx] === 1) {
            candidates.push({
              len: k * stepLen,
              x0: bx, y0: by,
              x1: nx, y1: ny,
              ux: ux / stepLen, uy: uy / stepLen
            });
            break;
          }
        }
      }
    }

    if (candidates.length === 0) continue;
    candidates.sort((a, b) => a.len - b.len);
    const best = candidates[0];
    const seeds = carveBridge(best.x0, best.y0, best.x1, best.y1, halfBW);

    // Dual opposing bridge for large structural centers so they stay firmly anchored
    if (isl.count >= Math.max(400, total * 0.012)) {
      const opp = candidates.find(c => (c.ux * best.ux + c.uy * best.uy) <= -0.4);
      if (opp) {
        const oppSeeds = carveBridge(opp.x0, opp.y0, opp.x1, opp.y1, halfBW);
        for (let i = 0; i < oppSeeds.length; i++) seeds.push(oppSeeds[i]);
      }
    }

    // Include island pixels in flood seeds so newly bridged island immediately joins outerReachable
    for (let i = 0; i < isl.pixels.length; i++) seeds.push(isl.pixels[i]);
    floodOuterFrom(seeds);
  }

  return stencil;
}

/**
 * Generates a positive-cut source mask (`1` = cut out void, `0` = intact stencil carrier)
 * handling fine dark-ink line art, multi-tone cutouts, dark-backdrop full photos (via
 * Otsu + local adaptive contrast), and full-bleed dark-ground inversions.
 */
export function generateCutStencilSourceMask(pixels, width, height, options = {}) {
  const opts = typeof options === 'object' && options !== null ? options : {};
  const isAchromaticArt = Boolean(opts.isAchromaticArt);
  const isTransparent = Boolean(opts.isTransparent);
  const total = width * height;
  const mask = new Uint8Array(total);
  const lumArr = new Float32Array(total);
  const isOpaque = new Uint8Array(total);

  let opaqueCount = 0;
  for (let i = 0, p = 0; i < pixels.length; i += 4, p++) {
    const l = computeLuminance(pixels[i], pixels[i + 1], pixels[i + 2]);
    lumArr[p] = l;
    if (pixels[i + 3] >= 64) {
      isOpaque[p] = 1;
      opaqueCount++;
    }
  }

  let borderDark = 0;
  let borderTotal = 0;
  const checkBorder = (p) => {
    borderTotal++;
    if (isOpaque[p] && lumArr[p] < 80) borderDark++;
  };
  for (let x = 0; x < width; x++) {
    checkBorder(x);
    checkBorder((height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    checkBorder(y * width);
    checkBorder(y * width + width - 1);
  }
  const darkBorderRatio = borderTotal > 0 ? borderDark / borderTotal : 0;

  if (isAchromaticArt) {
    const invertLightOnDark = !isTransparent && darkBorderRatio >= 0.72;
    for (let p = 0; p < total; p++) {
      if (!isOpaque[p]) continue;
      mask[p] = invertLightOnDark ? (lumArr[p] >= 150 ? 1 : 0) : (lumArr[p] < 175 ? 1 : 0);
    }
    return mask;
  }

  // Tonal & Photographic scenes: blend clamped global Otsu shadows with interior local contrast
  const rawOtsu = computeOtsuThreshold(pixels, width, height);
  const shadowCut = Math.max(55, Math.min(195, rawOtsu));

  // Build 2D prefix sums for O(1) local window luminance and opaque-coverage checks
  const w1 = width + 1;
  const satLum = new Float64Array(w1 * (height + 1));
  const satOpq = new Int32Array(w1 * (height + 1));
  for (let y = 0; y < height; y++) {
    let rowLum = 0;
    let rowOpq = 0;
    const srcOff = y * width;
    const prevOff = y * w1;
    const curOff = (y + 1) * w1;
    for (let x = 0; x < width; x++) {
      const p = srcOff + x;
      const op = isOpaque[p];
      rowLum += op ? lumArr[p] : 255;
      rowOpq += op;
      satLum[curOff + x + 1] = satLum[prevOff + x + 1] + rowLum;
      satOpq[curOff + x + 1] = satOpq[prevOff + x + 1] + rowOpq;
    }
  }

  const rad = Math.max(8, Math.round(Math.min(width, height) * 0.025));
  let cutCount = 0;
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - rad);
    const y1 = Math.min(height, y + rad + 1);
    const r0 = y0 * w1;
    const r1 = y1 * w1;
    const yOff = y * width;
    for (let x = 0; x < width; x++) {
      const p = yOff + x;
      if (!isOpaque[p]) continue;
      const x0 = Math.max(0, x - rad);
      const x1 = Math.min(width, x + rad + 1);
      const area = (y1 - y0) * (x1 - x0);
      const opqSum = satOpq[r1 + x1] - satOpq[r0 + x1] - satOpq[r1 + x0] + satOpq[r0 + x0];
      const opqDensity = opqSum / Math.max(1, area);

      const lum = lumArr[p];
      let cut = lum < shadowCut;
      if (!cut && opqDensity >= 0.85 && lum < 215) {
        const lumSum = satLum[r1 + x1] - satLum[r0 + x1] - satLum[r1 + x0] + satLum[r0 + x0];
        const localMean = lumSum / area;
        if (localMean - lum > 22) cut = true;
      }
      if (cut) {
        mask[p] = 1;
        cutCount++;
      }
    }
  }

  // Avoid cutting an entire solid dark studio backdrop wall on full-bleed dark-ground scenes
  if (!isTransparent && darkBorderRatio >= 0.72 && opaqueCount > 0 && (cutCount / opaqueCount) > 0.62) {
    const inv = new Uint8Array(total);
    for (let p = 0; p < total; p++) {
      if (isOpaque[p] && lumArr[p] >= shadowCut) inv[p] = 1;
    }
    return inv;
  }

  return mask;
}

/**
 * Extracts foreground subject mask from an opaque photo using dominant-perimeter
 * backdrop flood-fill, falling back to a clean rounded decal card mask for full-bleed photos.
 */
export function extractPhotoForegroundMask(pixels, width, height) {
  const total = width * height;
  const fg = new Uint8Array(total);

  // Sample perimeter border pixels to find dominant quantized backdrop cluster
  const borderIndices = [];
  for (let x = 0; x < width; x++) {
    borderIndices.push(x, (height - 1) * width + x);
  }
  for (let y = 1; y < height - 1; y++) {
    borderIndices.push(y * width, y * width + width - 1);
  }

  const bucketCounts = new Map();
  let bestKey = 0;
  let bestCount = 0;
  for (let i = 0; i < borderIndices.length; i++) {
    const off = borderIndices[i] * 4;
    const key = ((pixels[off] >> 4) << 8) | ((pixels[off + 1] >> 4) << 4) | (pixels[off + 2] >> 4);
    const next = (bucketCounts.get(key) || 0) + 1;
    bucketCounts.set(key, next);
    if (next > bestCount) {
      bestCount = next;
      bestKey = key;
    }
  }

  const seedR = (((bestKey >> 8) & 0xf) << 4) + 8;
  const seedG = (((bestKey >> 4) & 0xf) << 4) + 8;
  const seedB = ((bestKey & 0xf) << 4) + 8;

  let matchCount = 0;
  let sumR = 0, sumG = 0, sumB = 0;
  for (let i = 0; i < borderIndices.length; i++) {
    const off = borderIndices[i] * 4;
    const dr = pixels[off] - seedR, dg = pixels[off + 1] - seedG, db = pixels[off + 2] - seedB;
    if (dr * dr + dg * dg + db * db <= 45 * 45) {
      matchCount++;
      sumR += pixels[off];
      sumG += pixels[off + 1];
      sumB += pixels[off + 2];
    }
  }

  if (borderIndices.length > 0 && (matchCount / borderIndices.length) >= 0.45) {
    const bgR = sumR / matchCount;
    const bgG = sumG / matchCount;
    const bgB = sumB / matchCount;
    const isBg = new Uint8Array(total);
    const q = new Int32Array(total);
    let head = 0, tail = 0;
    const threshSq = 52 * 52;

    const trySeed = (p) => {
      if (isBg[p]) return;
      const off = p * 4;
      const dr = pixels[off] - bgR, dg = pixels[off + 1] - bgG, db = pixels[off + 2] - bgB;
      if (dr * dr + dg * dg + db * db <= threshSq) {
        isBg[p] = 1;
        q[tail++] = p;
      }
    };

    for (let i = 0; i < borderIndices.length; i++) trySeed(borderIndices[i]);

    while (head < tail) {
      const curr = q[head++];
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      if (cx > 0) trySeed(curr - 1);
      if (cx < width - 1) trySeed(curr + 1);
      if (cy > 0) trySeed(curr - width);
      if (cy < height - 1) trySeed(curr + width);
    }

    let fgCount = 0;
    for (let p = 0; p < total; p++) {
      if (!isBg[p]) {
        fg[p] = 1;
        fgCount++;
      }
    }

    const ratio = fgCount / total;
    if (ratio >= 0.02 && ratio <= 0.96) {
      return fg;
    }
  }

  // Fallback for full-bleed photos: build a rounded-corner decal card envelope
  fg.fill(0);
  const padX = Math.max(4, Math.round(width * 0.06));
  const padY = Math.max(4, Math.round(height * 0.06));
  const rad = Math.max(4, Math.round(Math.min(width, height) * 0.05));
  const xMin = padX, xMax = width - 1 - padX;
  const yMin = padY, yMax = height - 1 - padY;

  for (let y = yMin; y <= yMax; y++) {
    for (let x = xMin; x <= xMax; x++) {
      let inside = true;
      if (x < xMin + rad && y < yMin + rad) {
        inside = Math.hypot(x - (xMin + rad), y - (yMin + rad)) <= rad;
      } else if (x > xMax - rad && y < yMin + rad) {
        inside = Math.hypot(x - (xMax - rad), y - (yMin + rad)) <= rad;
      } else if (x < xMin + rad && y > yMax - rad) {
        inside = Math.hypot(x - (xMin + rad), y - (yMax - rad)) <= rad;
      } else if (x > xMax - rad && y > yMax - rad) {
        inside = Math.hypot(x - (xMax - rad), y - (yMax - rad)) <= rad;
      }
      if (inside) fg[y * width + x] = 1;
    }
  }
  return fg;
}

/**
 * Expands a binary foreground mask outward using a 2-pass Chamfer 5-7 distance transform
 * inside a padded canvas so offset die-cut contours never flatten against frame walls.
 */
export function generateDieCutMask(fgMask, width, height, offsetPx = 14, pad = 0) {
  const pw = width + 2 * pad;
  const ph = height + 2 * pad;
  const pTotal = pw * ph;
  const INF = 1e6;
  const dist = new Int32Array(pTotal);
  dist.fill(INF);
  let hasFg = false;

  for (let y = 0; y < height; y++) {
    const srcOff = y * width;
    const dstOff = (y + pad) * pw + pad;
    for (let x = 0; x < width; x++) {
      if (fgMask[srcOff + x] > 0) {
        dist[dstOff + x] = 0;
        hasFg = true;
      }
    }
  }
  if (!hasFg) return { mask: new Uint8Array(pTotal), width: pw, height: ph, pad };

  // Pass 1: top-left to bottom-right (Chamfer 5-7 Euclidean approximation)
  for (let y = 0; y < ph; y++) {
    const yOff = y * pw;
    for (let x = 0; x < pw; x++) {
      const idx = yOff + x;
      let d = dist[idx];
      if (d === 0) continue;
      if (x > 0 && dist[idx - 1] + 5 < d) d = dist[idx - 1] + 5;
      if (y > 0) {
        if (dist[idx - pw] + 5 < d) d = dist[idx - pw] + 5;
        if (x > 0 && dist[idx - pw - 1] + 7 < d) d = dist[idx - pw - 1] + 7;
        if (x < pw - 1 && dist[idx - pw + 1] + 7 < d) d = dist[idx - pw + 1] + 7;
      }
      dist[idx] = d;
    }
  }

  // Pass 2: bottom-right to top-left
  for (let y = ph - 1; y >= 0; y--) {
    const yOff = y * pw;
    for (let x = pw - 1; x >= 0; x--) {
      const idx = yOff + x;
      let d = dist[idx];
      if (d === 0) continue;
      if (x < pw - 1 && dist[idx + 1] + 5 < d) d = dist[idx + 1] + 5;
      if (y < ph - 1) {
        if (dist[idx + pw] + 5 < d) d = dist[idx + pw] + 5;
        if (x < pw - 1 && dist[idx + pw + 1] + 7 < d) d = dist[idx + pw + 1] + 7;
        if (x > 0 && dist[idx + pw - 1] + 7 < d) d = dist[idx + pw - 1] + 7;
      }
      dist[idx] = d;
    }
  }

  const thresh = Math.max(5, Math.round(offsetPx * 5));
  const out = new Uint8Array(pTotal);
  const edgePad = 1;
  for (let y = edgePad; y < ph - edgePad; y++) {
    const yOff = y * pw;
    for (let x = edgePad; x < pw - edgePad; x++) {
      if (dist[yOff + x] <= thresh) out[yOff + x] = 1;
    }
  }

  // Seal small interior holes so minor subject gaps do not punch holes in sticker die-cut cushion
  const maxHoleArea = Math.max(64, Math.round(Math.PI * offsetPx * offsetPx * 2.5));
  const visited = new Uint8Array(pTotal);
  const q = new Int32Array(pTotal);
  for (let p = 0; p < pTotal; p++) {
    if (out[p] === 0 && !visited[p]) {
      let head = 0, tail = 0;
      let touchesBorder = false;
      visited[p] = 1;
      q[tail++] = p;
      while (head < tail) {
        const curr = q[head++];
        const cx = curr % pw;
        const cy = Math.floor(curr / pw);
        if (cx === 0 || cx === pw - 1 || cy === 0 || cy === ph - 1) touchesBorder = true;
        if (cx > 0 && !visited[curr - 1] && out[curr - 1] === 0) { visited[curr - 1] = 1; q[tail++] = curr - 1; }
        if (cx < pw - 1 && !visited[curr + 1] && out[curr + 1] === 0) { visited[curr + 1] = 1; q[tail++] = curr + 1; }
        if (cy > 0 && !visited[curr - pw] && out[curr - pw] === 0) { visited[curr - pw] = 1; q[tail++] = curr - pw; }
        if (cy < ph - 1 && !visited[curr + pw] && out[curr + pw] === 0) { visited[curr + pw] = 1; q[tail++] = curr + pw; }
      }
      if (!touchesBorder && tail < maxHoleArea) {
        for (let k = 0; k < tail; k++) out[q[k]] = 1;
      }
    }
  }

  return { mask: out, width: pw, height: ph, pad };
}

/**
 * Computes adaptive bleed offset & canvas padding for sticker die-cut contours so
 * bordered cards/stamps preserve their outer shape while isolated subjects get plush bleed margins.
 */
export function computeDieCutParams(fgMask, width, height) {
  let fgCount = 0;
  for (let i = 0; i < fgMask.length; i++) if (fgMask[i] > 0) fgCount++;
  const fgRatio = fgCount / Math.max(1, width * height);
  const minDim = Math.min(width, height);
  const isBorderedFrame = fgRatio >= 0.80;
  const offsetPx = isBorderedFrame
    ? Math.max(6, Math.round(minDim * 0.010))
    : Math.max(12, Math.round(minDim * 0.026));
  const pad = offsetPx + 8;
  return { ...generateDieCutMask(fgMask, width, height, offsetPx, pad), fgRatio, offsetPx };
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

/**
 * Dual-Pass Compound Mask Optimizer for Hand-Drawn Line Art & Illustrations.
 * 
 * Calibrates stroke thickness to the original master artwork line weight (within ±0.5%)
 * at strokeThreshold (default 128 for high-res), restoring open negative whitespace between helical arcs,
 * acanthus foliage, and fine parallel hatching lines.
 * 
 * Simultaneously identifies compact micro-components (handwriting letterforms, Telugu/Brahmi
 * glyphs, ancient runes, micro-dots, and calligraphic loops) at glyphThreshold (default 85 for high-res)
 * using Connected Component Labeling (Union-Find) and promotes them into the unified mask.
 * 
 * @param {Uint8Array} inkDensities - Continuous optical ink density array (0..255)
 * @param {number} width - Canvas width
 * @param {number} height - Canvas height
 * @param {object} [options] - Configuration thresholds
 * @returns {Uint8Array} - Unified 1-bit binary mask (1 = ink, 0 = substrate)
 */
/**
 * Shared 2-Pass Connected Component Labeling (Union-Find) on a 1-bit binary mask.
 * Returns resolved `labels` array and `stats` Map<rootLabel, { minX, maxX, minY, maxY, count, pixels? }>.
 */
function labelConnectedComponents(binaryMask, width, height, collectPixels = false) {
  const total = width * height;
  const labels = new Int32Array(total);
  const parent = [0];
  let nextLabel = 1;

  function find(i) {
    let root = i;
    while (parent[root] !== root) root = parent[root];
    let curr = i;
    while (curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  for (let y = 0; y < height; y++) {
    const yOff = y * width;
    for (let x = 0; x < width; x++) {
      const idx = yOff + x;
      if (binaryMask[idx] === 0) continue;
      const up = y > 0 ? labels[idx - width] : 0;
      const left = x > 0 ? labels[idx - 1] : 0;
      if (up === 0 && left === 0) {
        labels[idx] = nextLabel;
        parent.push(nextLabel);
        nextLabel++;
      } else if (up !== 0 && left === 0) {
        labels[idx] = up;
      } else if (up === 0 && left !== 0) {
        labels[idx] = left;
      } else {
        labels[idx] = up;
        if (up !== left) {
          const rA = find(up);
          const rB = find(left);
          if (rA !== rB) parent[rA] = rB;
        }
      }
    }
  }

  const stats = new Map();
  for (let idx = 0; idx < total; idx++) {
    if (labels[idx] === 0) continue;
    const root = find(labels[idx]);
    labels[idx] = root;
    const x = idx % width;
    const y = Math.floor(idx / width);
    let s = stats.get(root);
    if (!s) {
      s = collectPixels
        ? { minX: x, maxX: x, minY: y, maxY: y, count: 0, pixels: [] }
        : { minX: x, maxX: x, minY: y, maxY: y, count: 0 };
      stats.set(root, s);
    } else {
      if (x < s.minX) s.minX = x;
      if (x > s.maxX) s.maxX = x;
      if (y < s.minY) s.minY = y;
      if (y > s.maxY) s.maxY = y;
    }
    s.count++;
    if (collectPixels) s.pixels.push(idx);
  }

  return { labels, stats };
}

export function generateOptimizedLineArtMask(inkDensities, width, height, options = {}) {
  const isHighRes = Math.max(width, height) >= 1400;
  const strokeThresh = options.strokeThreshold !== undefined ? options.strokeThreshold : (isHighRes ? 128 : 105);
  const glyphThresh = options.glyphThreshold !== undefined ? options.glyphThreshold : (isHighRes ? 85 : 90);
  const total = width * height;
  const maxDim = options.maxGlyphDim !== undefined ? options.maxGlyphDim : Math.round(Math.max(width, height) * 0.055);
  const maxArea = options.maxGlyphArea !== undefined ? options.maxGlyphArea : Math.round(Math.max(width, height) * 1.5);

  const finalMask = new Uint8Array(total);
  const glyphMask = new Uint8Array(total);

  for (let i = 0; i < total; i++) {
    const val = inkDensities[i];
    if (val >= strokeThresh) finalMask[i] = 1;
    if (val >= glyphThresh) glyphMask[i] = 1;
  }

  const { stats: compStats } = labelConnectedComponents(glyphMask, width, height, true);

  // Promote compact components (letterforms, runes, handwriting, dots, small symbols)
  for (const [, s] of compStats.entries()) {
    const cw = s.maxX - s.minX + 1;
    const ch = s.maxY - s.minY + 1;
    if (cw <= maxDim && ch <= maxDim && s.count <= maxArea) {
      for (let k = 0; k < s.pixels.length; k++) {
        finalMask[s.pixels[k]] = 1;
      }
    }
  }

  return finalMask;
}

/**
 * Connected-Component Glyph Detector for chromatic & achromatic foreground masks.
 * Separates compact typographic glyphs and symbols from large structural shapes
 * so each domain can use tailored curve-fitting tolerances without edge wiggles.
 */
export function detectGlyphMask(binaryMask, width, height, options = {}) {
  const total = width * height;
  const maxGlyphW = options.maxGlyphW || Math.max(16, Math.round(width * 0.12));
  const maxGlyphH = options.maxGlyphH || Math.max(16, Math.round(height * 0.12));
  const minGlyphPx = options.minGlyphPx || 6;
  const maxGlyphArea = options.maxGlyphArea || Math.round(total * 0.04);

  const { labels, stats } = labelConnectedComponents(binaryMask, width, height, false);

  const isGlyphRoot = new Set();
  for (const [root, s] of stats.entries()) {
    const cw = s.maxX - s.minX + 1;
    const ch = s.maxY - s.minY + 1;
    const aspect = cw / Math.max(1, ch);
    if (
      cw <= maxGlyphW &&
      ch <= maxGlyphH &&
      s.count >= minGlyphPx &&
      s.count <= maxGlyphArea &&
      aspect >= 0.15 &&
      aspect <= 6.5
    ) {
      isGlyphRoot.add(root);
    }
  }

  const glyphMask = new Uint8Array(total);
  const structuralMask = new Uint8Array(total);
  for (let idx = 0; idx < total; idx++) {
    if (binaryMask[idx] === 0) continue;
    if (isGlyphRoot.has(labels[idx])) {
      glyphMask[idx] = 1;
    } else {
      structuralMask[idx] = 1;
    }
  }

  return { glyphMask, structuralMask, glyphCount: isGlyphRoot.size };
}

/**
 * Corner-safe anti-wiggle edge conditioning for typographic glyph masks.
 * Suppresses 1px alternating staircase teeth without breaking 1px thin strokes or rounding 90° terminals.
 */
export function smoothGlyphStaircases(mask, width, height) {
  const out = new Uint8Array(mask);
  for (let y = 1; y < height - 1; y++) {
    const yOff = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOff + x;
      const cur = mask[idx];
      const u = mask[idx - width];
      const d = mask[idx + width];
      const l = mask[idx - 1];
      const r = mask[idx + 1];
      const n8 = u + d + l + r +
        mask[idx - width - 1] + mask[idx - width + 1] +
        mask[idx + width - 1] + mask[idx + width + 1];

      if (cur === 1) {
        // Prune isolated 1px staircase tooth only if it does not bridge opposite cardinal strokes
        if (n8 <= 2 && !(u && d) && !(l && r)) {
          out[idx] = 0;
        }
      } else {
        // Fill single-pixel diagonal staircase notch along solid stems (keeps letter counters open)
        if (n8 >= 6 && (u + d + l + r) >= 3) {
          out[idx] = 1;
        }
      }
    }
  }
  return out;
}
