/**
 * Real-time, corner-preserving vector path refiner for smoothing
 * micro-staircase and jagged edge artifacts directly on SVG <path> elements.
 *
 * Strategy:
 * 1. Parse subpaths once per path and adaptively subdivide curved C/Q segments
 *    (De Casteljau) so existing smooth arcs never flatten into polygonal chords.
 * 2. Detect corners across a macro arc-length chord span (~5px) so 1-2px
 *    staircase ripples are smoothed away while true logo corners remain pinned.
 * 3. Apply shrinkage-free Taubin (lambda | mu) fairing with arc-length chord
 *    projection (zero tangential drift across unequal segment lengths).
 * 4. Prune micro-jitter via corner-segmented RDP and reconstruct smooth cubic
 *    Beziers using clamped centripetal Catmull-Rom (alpha = 0.5).
 */

const parsedSubpathCache = new WeakMap();

function fmtCoord(n) {
  return Number.isFinite(n) ? Number(n.toFixed(2)) : 0;
}

function perpDist(p, a, b) {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1e-8) return Math.hypot(p.x - a.x, p.y - a.y);
  return Math.abs(dy * p.x - dx * p.y + b.x * a.y - b.y * a.x) / Math.sqrt(lenSq);
}

/**
 * Adaptively flatten a cubic Bezier segment via De Casteljau so genuine curved arcs
 * retain smooth curvature instead of collapsing to straight chords.
 */
function flattenCubic(p0, c1, c2, p3, pts, depth = 0) {
  const d1 = perpDist(c1, p0, p3);
  const d2 = perpDist(c2, p0, p3);
  const flatErr = Math.max(d1, d2);
  const chordLen = Math.hypot(p3.x - p0.x, p3.y - p0.y);

  if (depth < 4 && (flatErr > 0.35 || (flatErr > 0.15 && chordLen > 10))) {
    const m01x = 0.5 * (p0.x + c1.x), m01y = 0.5 * (p0.y + c1.y);
    const m12x = 0.5 * (c1.x + c2.x), m12y = 0.5 * (c1.y + c2.y);
    const m23x = 0.5 * (c2.x + p3.x), m23y = 0.5 * (c2.y + p3.y);
    const m012x = 0.5 * (m01x + m12x), m012y = 0.5 * (m01y + m12y);
    const m123x = 0.5 * (m12x + m23x), m123y = 0.5 * (m12y + m23y);
    const mid = { x: 0.5 * (m012x + m123x), y: 0.5 * (m012y + m123y) };

    flattenCubic(p0, { x: m01x, y: m01y }, { x: m012x, y: m012y }, mid, pts, depth + 1);
    flattenCubic(mid, { x: m123x, y: m123y }, { x: m23x, y: m23y }, p3, pts, depth + 1);
    return;
  }
  pts.push({ x: p3.x, y: p3.y });
}

/**
 * Parse an SVG path `d` string into vertex rings, preserving curved arcs.
 * Supports M, L, C, Q, H, V, Z (absolute and relative).
 */
function parseSubpaths(d) {
  const tokens = d.match(/[MLCQHVZmlcqhvz]|-?\d*\.?\d+(?:e[+-]?\d+)?/g);
  if (!tokens) return [];

  const subpaths = [];
  let current = [];
  let closed = false;
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  let i = 0;
  let cmd = '';

  const isCmd = (tok) => /^[MLCQHVZmlcqhvz]$/.test(tok);
  const nextNum = () => parseFloat(tokens[i++]);

  const flush = () => {
    if (current.length > 0) {
      if (current.length > 1) {
        const first = current[0];
        const last = current[current.length - 1];
        if (Math.hypot(first.x - last.x, first.y - last.y) < 1e-3) {
          current.pop();
        }
      }
      subpaths.push({ pts: current, closed });
      current = [];
      closed = false;
    }
  };

  while (i < tokens.length) {
    if (isCmd(tokens[i])) {
      cmd = tokens[i++];
      if (cmd === 'Z' || cmd === 'z') {
        closed = true;
        cx = sx;
        cy = sy;
        flush();
        continue;
      }
    }

    if (i >= tokens.length) break;

    switch (cmd) {
      case 'M': {
        flush();
        cx = nextNum();
        cy = nextNum();
        sx = cx;
        sy = cy;
        current.push({ x: cx, y: cy });
        cmd = 'L';
        break;
      }
      case 'm': {
        flush();
        cx += nextNum();
        cy += nextNum();
        sx = cx;
        sy = cy;
        current.push({ x: cx, y: cy });
        cmd = 'l';
        break;
      }
      case 'L': {
        cx = nextNum();
        cy = nextNum();
        current.push({ x: cx, y: cy });
        break;
      }
      case 'l': {
        cx += nextNum();
        cy += nextNum();
        current.push({ x: cx, y: cy });
        break;
      }
      case 'H': {
        cx = nextNum();
        current.push({ x: cx, y: cy });
        break;
      }
      case 'h': {
        cx += nextNum();
        current.push({ x: cx, y: cy });
        break;
      }
      case 'V': {
        cy = nextNum();
        current.push({ x: cx, y: cy });
        break;
      }
      case 'v': {
        cy += nextNum();
        current.push({ x: cx, y: cy });
        break;
      }
      case 'C': {
        const c1x = nextNum(), c1y = nextNum();
        const c2x = nextNum(), c2y = nextNum();
        const x = nextNum(), y = nextNum();
        flattenCubic({ x: cx, y: cy }, { x: c1x, y: c1y }, { x: c2x, y: c2y }, { x, y }, current);
        cx = x;
        cy = y;
        break;
      }
      case 'c': {
        const c1x = cx + nextNum(), c1y = cy + nextNum();
        const c2x = cx + nextNum(), c2y = cy + nextNum();
        const x = cx + nextNum(), y = cy + nextNum();
        flattenCubic({ x: cx, y: cy }, { x: c1x, y: c1y }, { x: c2x, y: c2y }, { x, y }, current);
        cx = x;
        cy = y;
        break;
      }
      case 'Q': {
        const qx = nextNum(), qy = nextNum();
        const x = nextNum(), y = nextNum();
        const c1 = { x: cx + (2 / 3) * (qx - cx), y: cy + (2 / 3) * (qy - cy) };
        const c2 = { x: x + (2 / 3) * (qx - x), y: y + (2 / 3) * (qy - y) };
        flattenCubic({ x: cx, y: cy }, c1, c2, { x, y }, current);
        cx = x;
        cy = y;
        break;
      }
      case 'q': {
        const qx = cx + nextNum(), qy = cy + nextNum();
        const x = cx + nextNum(), y = cy + nextNum();
        const c1 = { x: cx + (2 / 3) * (qx - cx), y: cy + (2 / 3) * (qy - cy) };
        const c2 = { x: x + (2 / 3) * (qx - x), y: y + (2 / 3) * (qy - y) };
        flattenCubic({ x: cx, y: cy }, c1, c2, { x, y }, current);
        cx = x;
        cy = y;
        break;
      }
      default:
        i++;
        break;
    }
  }

  flush();
  return subpaths;
}

function rdpOpen(pts, eps) {
  if (pts.length <= 2) return pts;
  let maxDist = 0;
  let idx = 0;
  const first = pts[0];
  const last = pts[pts.length - 1];
  for (let i = 1; i < pts.length - 1; i++) {
    const d = perpDist(pts[i], first, last);
    if (d > maxDist) {
      maxDist = d;
      idx = i;
    }
  }
  if (maxDist > eps) {
    const left = rdpOpen(pts.slice(0, idx + 1), eps);
    const right = rdpOpen(pts.slice(idx), eps);
    return left.slice(0, -1).concat(right);
  }
  return [first, last];
}

/**
 * Macro chord-span corner detector: walks ~5px backward and forward along the
 * contour so 1-2px staircase jaggies are NOT falsely pinned as corners, while
 * true logo corners stay crisp and locked.
 */
function detectMacroCorners(pts, closed, spanPx = 5.0, cosThreshold = 0.62) {
  const n = pts.length;
  const corners = new Uint8Array(n);
  if (n < 3) {
    corners.fill(1);
    return corners;
  }

  const maxSteps = Math.max(1, Math.floor(n / 3));

  const walkSpan = (startIdx, dir) => {
    let dist = 0;
    let steps = 0;
    let cur = startIdx;
    while (steps < maxSteps) {
      const next = cur + dir;
      if (!closed && (next < 0 || next >= n)) break;
      const wrappedNext = (next + n) % n;
      dist += Math.hypot(pts[wrappedNext].x - pts[cur].x, pts[wrappedNext].y - pts[cur].y);
      cur = wrappedNext;
      steps++;
      if (dist >= spanPx) break;
    }
    return pts[cur];
  };

  for (let i = 0; i < n; i++) {
    if (!closed && (i === 0 || i === n - 1)) {
      corners[i] = 1;
      continue;
    }
    const pBack = walkSpan(i, -1);
    const pFwd = walkSpan(i, 1);
    const curr = pts[i];

    const dx1 = curr.x - pBack.x;
    const dy1 = curr.y - pBack.y;
    const dx2 = pFwd.x - curr.x;
    const dy2 = pFwd.y - curr.y;
    const len1 = Math.hypot(dx1, dy1);
    const len2 = Math.hypot(dx2, dy2);
    if (len1 < 1e-4 || len2 < 1e-4) continue;

    const cosMacro = (dx1 * dx2 + dy1 * dy2) / (len1 * len2);
    if (cosMacro < cosThreshold) {
      // Only pin the local extremum (largest immediate turn inside the neighborhood)
      const prev = pts[(i - 1 + n) % n];
      const next = pts[(i + 1) % n];
      const l1 = Math.hypot(curr.x - prev.x, curr.y - prev.y);
      const l2 = Math.hypot(next.x - curr.x, next.y - curr.y);
      if (l1 > 1e-5 && l2 > 1e-5) {
        const cosLocal = ((curr.x - prev.x) * (next.x - curr.x) + (curr.y - prev.y) * (next.y - curr.y)) / (l1 * l2);
        if (cosLocal < 0.72) {
          corners[i] = 1;
        }
      }
    }
  }
  return corners;
}

/**
 * Single pass of arc-length chord-projection Laplacian smoothing (zero tangential drift).
 */
function fairingStep(pts, corners, closed, scaleFactor) {
  const n = pts.length;
  const out = pts.map(p => ({ x: p.x, y: p.y }));
  for (let i = 0; i < n; i++) {
    if (corners[i]) continue;
    if (!closed && (i === 0 || i === n - 1)) continue;
    const prev = pts[(i - 1 + n) % n];
    const curr = pts[i];
    const next = pts[(i + 1) % n];

    const dPrev = Math.max(0.25, Math.hypot(curr.x - prev.x, curr.y - prev.y));
    const dNext = Math.max(0.25, Math.hypot(next.x - curr.x, next.y - curr.y));
    const frac = dPrev / (dPrev + dNext);
    const targetX = prev.x + frac * (next.x - prev.x);
    const targetY = prev.y + frac * (next.y - prev.y);

    out[i].x = curr.x + scaleFactor * (targetX - curr.x);
    out[i].y = curr.y + scaleFactor * (targetY - curr.y);
  }
  return out;
}

function smoothSubpath(subpath, t) {
  let pts = subpath.pts.map(p => ({ x: p.x, y: p.y }));
  const closed = subpath.closed;
  if (pts.length < 3) return { pts, closed, corners: detectMacroCorners(pts, closed) };

  const spanPx = 4.0 + 3.0 * t;
  let corners = detectMacroCorners(pts, closed, spanPx, 0.62);

  // Shrinkage-free Taubin fairing (lambda shrink pass paired with mu inflate pass)
  const passes = Math.max(1, Math.round(1 + t * 5));
  const lambda = 0.35 + 0.25 * t;
  const mu = -lambda * 0.92;
  for (let pass = 0; pass < passes; pass++) {
    pts = fairingStep(pts, corners, closed, lambda);
    pts = fairingStep(pts, corners, closed, mu);
  }

  // Corner-segmented RDP pruning
  const eps = 0.02 + 0.55 * t;
  const cornerMeta = new Map();
  if (closed) {
    const cornerIndices = [];
    for (let i = 0; i < pts.length; i++) {
      if (corners[i]) cornerIndices.push(i);
    }
    if (cornerIndices.length >= 2) {
      const simplified = [];
      const preservedCorners = [];
      for (let c = 0; c < cornerIndices.length; c++) {
        const startIdx = cornerIndices[c];
        const endIdx = cornerIndices[(c + 1) % cornerIndices.length];
        const seg = [];
        let idx = startIdx;
        while (true) {
          seg.push(pts[idx]);
          if (idx === endIdx) break;
          idx = (idx + 1) % pts.length;
        }
        const reduced = rdpOpen(seg, eps);
        for (let k = 0; k < reduced.length - 1; k++) {
          preservedCorners.push(k === 0 ? 1 : 0);
          simplified.push(reduced[k]);
        }
      }
      if (simplified.length >= 3) {
        pts = simplified;
        corners = Uint8Array.from(preservedCorners);
      } else {
        corners = detectMacroCorners(pts, closed, spanPx, 0.62);
      }
    } else {
      const reduced = rdpOpen(pts.concat([pts[0]]), eps);
      if (reduced.length >= 4) {
        pts = reduced.slice(0, -1);
      }
      corners = detectMacroCorners(pts, closed, spanPx, 0.62);
    }
  } else {
    pts = rdpOpen(pts, eps);
    corners = detectMacroCorners(pts, closed, spanPx, 0.62);
  }

  cornerMeta.clear();
  return { pts, closed, corners };
}

/**
 * Emit SVG path commands using clamped centripetal Catmull-Rom (alpha = 0.5)
 * to prevent cusps and self-intersections across uneven segment lengths.
 */
function emitSubpathD({ pts, closed, corners }) {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M ${fmtCoord(pts[0].x)} ${fmtCoord(pts[0].y)}${closed ? ' Z' : ''}`;
  if (n === 2) {
    return `M ${fmtCoord(pts[0].x)} ${fmtCoord(pts[0].y)} L ${fmtCoord(pts[1].x)} ${fmtCoord(pts[1].y)}${closed ? ' Z' : ''}`;
  }

  const parts = [`M ${fmtCoord(pts[0].x)} ${fmtCoord(pts[0].y)}`];
  const segCount = closed ? n : n - 1;

  for (let i = 0; i < segCount; i++) {
    const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[(i + 1) % n];
    const p3 = closed ? pts[(i + 2) % n] : pts[Math.min(n - 1, i + 2)];

    const c1 = corners[i];
    const c2 = corners[(i + 1) % n];

    if (c1 && c2) {
      parts.push(`L ${fmtCoord(p2.x)} ${fmtCoord(p2.y)}`);
      continue;
    }

    const chord = Math.hypot(p2.x - p1.x, p2.y - p1.y);
    const d1 = Math.max(1e-3, Math.sqrt(Math.hypot(p1.x - p0.x, p1.y - p0.y)));
    const d2 = Math.max(1e-3, Math.sqrt(chord));
    const d3 = Math.max(1e-3, Math.sqrt(Math.hypot(p3.x - p2.x, p3.y - p2.y)));

    let t1x = 0, t1y = 0;
    if (!c1) {
      const a1 = d1 / (d1 + d2);
      const b1 = (d2 * d2) / (d1 * (d1 + d2));
      t1x = (a1 * (p2.x - p1.x) + b1 * (p1.x - p0.x)) / 3;
      t1y = (a1 * (p2.y - p1.y) + b1 * (p1.y - p0.y)) / 3;
      const len1 = Math.hypot(t1x, t1y);
      const maxH = 0.45 * chord;
      if (len1 > maxH && len1 > 1e-6) {
        t1x *= maxH / len1;
        t1y *= maxH / len1;
      }
    }

    let t2x = 0, t2y = 0;
    if (!c2) {
      const a2 = (d2 * d2) / (d3 * (d2 + d3));
      const b2 = d3 / (d2 + d3);
      t2x = (a2 * (p3.x - p2.x) + b2 * (p2.x - p1.x)) / 3;
      t2y = (a2 * (p3.y - p2.y) + b2 * (p2.y - p1.y)) / 3;
      const len2 = Math.hypot(t2x, t2y);
      const maxH = 0.45 * chord;
      if (len2 > maxH && len2 > 1e-6) {
        t2x *= maxH / len2;
        t2y *= maxH / len2;
      }
    }

    parts.push(
      `C ${fmtCoord(p1.x + t1x)} ${fmtCoord(p1.y + t1y)} ${fmtCoord(p2.x - t2x)} ${fmtCoord(p2.y - t2y)} ${fmtCoord(p2.x)} ${fmtCoord(p2.y)}`
    );
  }

  if (closed) parts.push('Z');
  return parts.join(' ');
}

/**
 * Smooth jagged staircase edges on an SVG path `d` string in real time.
 * Optionally caches parsed subpaths by `<path>` element reference for 60fps slider dragging.
 *
 * @param {string} rawD - Original SVG path `d` string.
 * @param {number} strengthPct - Smoothing strength from 0 to 100.
 * @param {Element|null} pathEl - Optional `<path>` element key for subpath cache.
 * @returns {string} Refined SVG path `d` string.
 */
export function refineSvgPathD(rawD, strengthPct, pathEl = null) {
  if (!rawD || !Number.isFinite(strengthPct) || strengthPct <= 0) return rawD;
  const t = Math.min(1, Math.max(0, strengthPct / 100));

  let subpaths = pathEl ? parsedSubpathCache.get(pathEl) : null;
  if (!subpaths) {
    subpaths = parseSubpaths(rawD);
    if (pathEl && subpaths.length > 0) {
      parsedSubpathCache.set(pathEl, subpaths);
    }
  }
  if (subpaths.length === 0) return rawD;

  return subpaths
    .map(sp => emitSubpathD(smoothSubpath(sp, t)))
    .filter(Boolean)
    .join(' ');
}

/**
 * Single-pass 8-connected centerline ridge tracer for Canny NMS binary edge masks.
 * Produces smooth open/closed single-line vector paths (`M ... C ...`) instead of
 * double-walled area polygons, making pen/laser/CNC plotting practical and 1-pass.
 */
export function traceCenterlinePaths(edgeMask, width, height, options = {}) {
  const minLen = options.minLen !== undefined ? options.minLen : 8;
  const eps = options.eps !== undefined ? options.eps : 0.65;
  const total = width * height;
  const visited = new Uint8Array(total);
  const paths = [];

  // Cardinal offsets checked first, then diagonals, to keep 8-connected pixel chains clean
  const nbOffsets = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
    [-1, -1], [1, -1], [-1, 1], [1, 1]
  ];

  const degreeAt = new Uint8Array(total);
  for (let y = 1; y < height - 1; y++) {
    const yOff = y * width;
    for (let x = 1; x < width - 1; x++) {
      const idx = yOff + x;
      if (!edgeMask[idx]) continue;
      let deg = 0;
      for (let d = 0; d < 8; d++) {
        const [ox, oy] = nbOffsets[d];
        if (edgeMask[(y + oy) * width + (x + ox)]) deg++;
      }
      degreeAt[idx] = deg;
    }
  }

  function walkFrom(startIdx) {
    const chain = [];
    let curr = startIdx;
    visited[curr] = 1;
    chain.push({ x: curr % width, y: Math.floor(curr / width) });

    while (true) {
      const cx = curr % width;
      const cy = Math.floor(curr / width);
      let nextIdx = -1;
      for (let d = 0; d < 8; d++) {
        const nx = cx + nbOffsets[d][0];
        const ny = cy + nbOffsets[d][1];
        if (nx < 0 || nx >= width || ny < 0 || ny >= height) continue;
        const nIdx = ny * width + nx;
        if (edgeMask[nIdx] && !visited[nIdx]) {
          nextIdx = nIdx;
          break;
        }
      }
      if (nextIdx === -1) break;
      visited[nextIdx] = 1;
      chain.push({ x: nextIdx % width, y: Math.floor(nextIdx / width) });
      curr = nextIdx;
    }
    return chain;
  }

  function appendChain(pts) {
    if (pts.length < minLen) return;
    const closed = pts.length >= 6 &&
      Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y) <= 1.6;
    if (closed) {
      const d = Math.hypot(pts[0].x - pts[pts.length - 1].x, pts[0].y - pts[pts.length - 1].y);
      if (d < 1e-3 && pts.length > 3) pts.pop();
    }
    let reduced = pts;
    const rawCorners = detectMacroCorners(pts, closed, 4.5, 0.55);
    const cornerIdx = [];
    for (let i = 0; i < pts.length; i++) {
      if (rawCorners[i] || (!closed && (i === 0 || i === pts.length - 1))) {
        cornerIdx.push(i);
      }
    }
    if (cornerIdx.length >= 2) {
      const merged = [];
      for (let c = 0; c < cornerIdx.length - 1; c++) {
        const seg = pts.slice(cornerIdx[c], cornerIdx[c + 1] + 1);
        const simp = rdpOpen(seg, eps);
        for (let k = 0; k < simp.length - 1; k++) merged.push(simp[k]);
      }
      if (closed) {
        const tailSeg = pts.slice(cornerIdx[cornerIdx.length - 1]).concat(pts.slice(0, cornerIdx[0] + 1));
        const simpTail = rdpOpen(tailSeg, eps);
        for (let k = 0; k < simpTail.length - 1; k++) merged.push(simpTail[k]);
      } else {
        merged.push(pts[pts.length - 1]);
      }
      if (merged.length >= 2) reduced = merged;
    } else {
      reduced = rdpOpen(pts, eps);
    }

    if (reduced.length < 2) return;
    const corners = detectMacroCorners(reduced, closed, 4.5, 0.55);
    const dStr = emitSubpathD({ pts: reduced, closed, corners });
    if (dStr) paths.push(dStr);
  }

  // Pass 1: Trace from endpoints and junctions first so open strokes remain unbroken
  for (let i = 0; i < total; i++) {
    if (edgeMask[i] && !visited[i] && (degreeAt[i] === 1 || degreeAt[i] >= 3)) {
      appendChain(walkFrom(i));
    }
  }

  // Pass 2: Trace remaining closed loops
  for (let i = 0; i < total; i++) {
    if (edgeMask[i] && !visited[i]) {
      appendChain(walkFrom(i));
    }
  }

  return paths;
}
