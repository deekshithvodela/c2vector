/**
 * c2vector - Master Bézier Tracer Module (Peter Selinger Potrace Engine)
 * Generates continuous cubic Bézier curves with G1 continuity, nested hole decomposition (fill-rule="evenodd"),
 * and zero pixel stair appearance. 100% in-browser client-side execution.
 */

import { traceMaskToPathD } from './potrace.js';

// Per-mask WeakMap cache eliminates redundant 2x-4x Potrace calls across solid/transparent & faithful/vibrant plates
const maskTraceCache = new WeakMap();

export function compactSvgPathD(pathD) {
  if (!pathD || typeof pathD !== 'string') return '';
  return pathD
    .trim()
    .replace(/,\s*/g, ' ')
    .replace(/\s*([CLZ])\s*/g, '$1')
    .replace(/\s*M\s*/g, ' M ')
    .replace(/^ M /, 'M ')
    .replace(/\s{2,}/g, ' ');
}

function cachedTraceMask(mask, width, height, opts) {
  let byOpts = maskTraceCache.get(mask);
  if (!byOpts) {
    byOpts = new Map();
    maskTraceCache.set(mask, byOpts);
  }
  const key = `${width}x${height}:${opts.turdSize}:${opts.optTolerance}:${opts.alphaMax}:${opts.turnPolicy}`;
  if (byOpts.has(key)) {
    return byOpts.get(key);
  }
  const traced = compactSvgPathD(traceMaskToPathD(mask, width, height, opts));
  byOpts.set(key, traced);
  return traced;
}

/**
 * Builds Full Master Vector SVG string with continuous Bézier tiers and translucent chromatic contours
 * Universal Continuous Discrete Vector Tier Production Print Specifications
 */
export function buildMasterSvg(width, height, palette, tierMasks, chromaticEdges = null, bgHex = null, silhouettePathD = null, options = {}) {
  let body = '';

  // 1. Solid background base underlay path preventing sub-pixel seam light leaks
  if (bgHex) {
    body += `  <rect width="${width}" height="${height}" fill="${bgHex}"/>\n`;
  } else if (silhouettePathD) {
    // For transparent vectors, the opaque subject silhouette seals 100% of internal seams without leaking canvas background
    const baseColor = palette[0] ? palette[0].hex : '#000000';
    body += `  <!-- Subject Silhouette Base (Seals 100% of internal seams in transparent vector) -->\n`;
    body += `  <path id="subject-silhouette-base" fill="${baseColor}" fill-rule="evenodd" d="${silhouettePathD}"/>\n`;
  }

  // 2. Render color tiers in tonal order (darkest to lightest)
  body += '  <!-- Continuous Bézier Color Tiers (G1 Continuity, Zero Pixel Stairs) -->\n';
  body += '  <g id="paletted-bezier-tiers">\n';

  for (let t = 0; t < palette.length; t++) {
    const mask = tierMasks[t];
    if (!mask) continue;

    const tierTurd = typeof options.tierTurdSize === 'function'
      ? options.tierTurdSize(t)
      : (options.turdSize !== undefined ? options.turdSize : 3);

    const pathD = cachedTraceMask(mask, width, height, {
      optCurve: true,
      turdSize: tierTurd,
      optTolerance: options.optTolerance !== undefined ? options.optTolerance : 0.22,
      alphaMax: options.alphaMax !== undefined ? options.alphaMax : 0.15,
      turnPolicy: 'minority'
    });

    if (pathD && pathD.trim().length > 0) {
      body += `    <path id="tier-${t}" fill="${palette[t].hex}" fill-rule="evenodd" d="${pathD}"/>\n`;
    }
  }
  body += '  </g>\n';

  // 3. Render 70%-80% Translucent Chromatic Outline Glaze (Zero Flat Black Ink)
  if (chromaticEdges && chromaticEdges.length > 0) {
    body += '  <!-- Translucent Chromatic Outlines (70-80% Glaze, Zero Black Ink) -->\n';
    body += '  <g id="chromatic-structural-contours" opacity="0.75">\n';
    for (const edge of chromaticEdges) {
      if (edge.d && edge.d.trim().length > 0) {
        body += `    <!-- ${edge.name || 'Chromatic Contour'} -->\n`;
        body += `    <path id="${edge.id || 'edge'}" fill="${edge.color}" fill-rule="evenodd" d="${edge.d}"/>\n`;
      }
    }
    body += '  </g>\n';
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Builds 1-bit or single-mask study SVG
 */
export function buildStudySvg(width, height, fillHex, bgHex, mask, options = {}, silhouettePathD = null) {
  const turdSize = options.turdSize !== undefined ? options.turdSize : 3;
  const pathD = cachedTraceMask(mask, width, height, {
    optCurve: true,
    turdSize,
    optTolerance: 0.20,
    alphaMax: options.alphaMax !== undefined ? options.alphaMax : 1.0,
    turnPolicy: 'minority'
  });

  let body = '';
  if (bgHex) {
    body += `  <rect width="${width}" height="${height}" fill="${bgHex}"/>\n`;
  } else if (silhouettePathD) {
    body += `  <!-- Contrasting Opaque Silhouette Base Plate for Transparent Vector Stencil -->\n`;
    body += `  <path id="study-silhouette-base" fill="#ffffff" fill-rule="evenodd" d="${silhouettePathD}"/>\n`;
  }
  if (pathD && pathD.trim().length > 0) {
    body += `  <path fill="${fillHex}" fill-rule="evenodd" d="${pathD}"/>\n`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Builds Multi-Tier Grayscale Tonal Study SVG (4-tone, 8-tone, inverted plates)
 * Universal Discrete Vector Tier Production Print Specifications
 */
export function buildMultiToneStudySvg(width, height, layers, bgHex = null, silhouettePathD = null, defaultBaseFill = '#000000') {
  let body = '';
  if (bgHex) {
    body += `  <rect width="${width}" height="${height}" fill="${bgHex}"/>\n`;
  } else if (silhouettePathD) {
    body += `  <!-- Subject Silhouette Base Plate (Seals internal tone gaps in transparent vector) -->\n`;
    body += `  <path id="tonal-silhouette-base" fill="${defaultBaseFill}" fill-rule="evenodd" d="${silhouettePathD}"/>\n`;
  }
  body += '  <g id="tonal-study-layers">\n';
  for (const layer of layers) {
    if (!layer.mask) continue;
    const pathD = cachedTraceMask(layer.mask, width, height, {
      optCurve: true,
      turdSize: layer.turdSize !== undefined ? layer.turdSize : 3,
      optTolerance: layer.optTolerance !== undefined ? layer.optTolerance : 0.20,
      alphaMax: layer.alphaMax !== undefined ? layer.alphaMax : 0.15,
      turnPolicy: 'minority'
    });
    if (pathD && pathD.trim().length > 0) {
      body += `    <!-- ${layer.name || 'Tonal Tier'} -->\n`;
      body += `    <path fill="${layer.color}" opacity="${layer.opacity || 1.0}" fill-rule="evenodd" d="${pathD}"/>\n`;
    }
  }
  body += '  </g>\n';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Builds Bold Color Posterized Print Plate SVG (8-12 bold chromatic planes)
 * Uses enhanced planar smoothing for bold, iconic Pop-Art / silkscreen poster fills
 */
export function buildColorPosterizeSvg(width, height, layers, bgHex = null, silhouettePathD = null) {
  let body = '';
  if (bgHex) {
    body += `  <!-- Base Underlay -->\n  <rect width="${width}" height="${height}" fill="${bgHex}"/>\n`;
  } else if (silhouettePathD) {
    const baseColor = layers[0] ? layers[0].color : '#000000';
    body += `  <!-- Subject Silhouette Base (Eliminates inter-plane transparent fissures) -->\n`;
    body += `  <path id="poster-silhouette-base" fill="${baseColor}" fill-rule="evenodd" d="${silhouettePathD}"/>\n`;
  }
  body += '  <!-- Bold Chromatic Poster Planes (Pop-Art / Silkscreen Vector) -->\n';
  body += '  <g id="color-posterize-planes">\n';
  for (const layer of layers) {
    if (!layer.mask) continue;
    const pathD = cachedTraceMask(layer.mask, width, height, {
      optCurve: true,
      turdSize: layer.turdSize !== undefined ? layer.turdSize : 4,
      optTolerance: layer.optTolerance !== undefined ? layer.optTolerance : 0.25,
      alphaMax: layer.alphaMax !== undefined ? layer.alphaMax : 0.15,
      turnPolicy: 'minority'
    });
    if (pathD && pathD.trim().length > 0) {
      body += `    <!-- ${layer.name || 'Poster Color Tier'} -->\n`;
      body += `    <path fill="${layer.color}" fill-rule="evenodd" d="${pathD}"/>\n`;
    }
  }
  body += '  </g>\n';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Builds Seamless Pixel-Match Vector SVG (Anti-Grid Architecture)
 * 2D contiguous polygon boundary fusion, sub-pixel Potrace curve fitting, and solid underlay
 * Completely eliminates rectangular scanline bricks, grid staircases, and inter-pixel white seams
 */
export function buildSeamlessPixelMatchSvg(width, height, layers, bgHex = null, silhouettePathD = null) {
  let body = '';
  // 1. Solid underlay eliminates 100% of inter-polygon anti-aliasing white seam lines
  if (bgHex) {
    body += `  <!-- Solid Base Underlay: Eliminates 100% of sub-pixel grid lines and seam light bleed -->\n`;
    body += `  <rect id="pixel-match-base-underlay" width="${width}" height="${height}" fill="${bgHex}"/>\n`;
  } else if (silhouettePathD) {
    const baseColor = layers[0] ? layers[0].color : '#000000';
    body += `  <!-- Subject Silhouette Base: Eliminates 100% of transparent gaps in transparent vector -->\n`;
    body += `  <path id="pixel-match-silhouette-underlay" fill="${baseColor}" fill-rule="evenodd" d="${silhouettePathD}"/>\n`;
  }

  // 2. Continuous Bézier Color Zones (G1 Tangent Continuity, Zero Rectangular Bricks)
  body += '  <!-- Continuous Sub-Pixel Color Zones (Seamless Anti-Grid Architecture) -->\n';
  body += '  <g id="seamless-pixel-match-planes">\n';
  for (const layer of layers) {
    if (!layer.mask) continue;
    const pathD = cachedTraceMask(layer.mask, width, height, {
      optCurve: true,
      turdSize: 3,
      optTolerance: 0.18,
      alphaMax: 1.0,
      turnPolicy: 'minority'
    });
    if (pathD && pathD.trim().length > 0) {
      body += `    <!-- ${layer.name || 'Pixel Zone'} -->\n`;
      body += `    <path id="${layer.id || 'zone'}" fill="${layer.color}" fill-rule="evenodd" d="${pathD}"/>\n`;
    }
  }
  body += '  </g>\n';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Builds a Canva-Optimized Master SVG 1.1 document:
 * - <= 4 focal solid opaque colors (unlocks Canva's inline color palette editor)
 * - Zero translucent groups (no opacity < 1) and zero inline CSS style attributes
 * - Single hole-safe compound <path fill-rule="evenodd"> per color
 */
export function buildCanvaOptimizedSvg(width, height, layers, bgHex = null, silhouettePathD = null) {
  let body = '';
  if (bgHex) {
    body += `  <rect width="${width}" height="${height}" fill="${bgHex}"/>\n`;
  } else if (silhouettePathD) {
    const baseColor = layers[0] ? layers[0].color : '#000000';
    body += `  <path fill="${baseColor}" fill-rule="evenodd" d="${compactSvgPathD(silhouettePathD)}"/>\n`;
  }

  body += '  <!-- Canva-Optimized Solid Vector Layers (<=4 Editable Solid Colors, Hole-Safe EvenOdd) -->\n';
  body += '  <g id="canva-optimized-paths">\n';
  for (const layer of layers) {
    let pathD = layer.d || '';
    if (!pathD && layer.mask) {
      pathD = cachedTraceMask(layer.mask, width, height, {
        optCurve: true,
        turdSize: layer.turdSize !== undefined ? layer.turdSize : 4,
        optTolerance: layer.optTolerance !== undefined ? layer.optTolerance : 0.25,
        alphaMax: layer.alphaMax !== undefined ? layer.alphaMax : 0.55,
        turnPolicy: 'minority'
      });
    } else if (pathD) {
      pathD = compactSvgPathD(pathD);
    }
    if (pathD && pathD.trim().length > 0) {
      // Keep each color in a single compound <path> so fill-rule="evenodd" never separates inner holes from outer contours
      body += `    <path fill="${layer.color}" fill-rule="evenodd" d="${pathD}"/>\n`;
    }
  }
  body += '  </g>\n';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Builds a single-pass CAD / Plotter Wireframe SVG document (zero double-walled fill ribbons).
 */
export function buildWireframeSvg(width, height, pathStrings, isTransparent = false, strokeHex = '#00d2ff', strokeWidth = 1.2) {
  let body = '';
  if (!isTransparent) {
    body += `  <rect width="${width}" height="${height}" fill="#090d16"/>\n`;
  }
  body += `  <!-- Single-Pass CAD Plotter & Laser Wireframe Toolpaths -->\n`;
  body += `  <g id="plotter-cut-paths" fill="none" stroke="${strokeHex}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">\n`;
  for (const d of pathStrings) {
    if (d && d.trim().length > 0) {
      body += `    <path d="${d}"/>\n`;
    }
  }
  body += `  </g>\n`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n${body}</svg>`;
}

/**
 * Shifts all (x, y) coordinates in a Potrace M/L/C/Z path string by (+dx, +dy).
 */
export function translateSvgPathD(d, dx, dy) {
  if (!d || (dx === 0 && dy === 0)) return d || '';
  let coordIndex = 0;
  return d.replace(/[-+]?[0-9]*\.?[0-9]+(?:[eE][-+]?[0-9]+)?/g, (num) => {
    const val = parseFloat(num) + ((coordIndex++ & 1) === 0 ? dx : dy);
    return Number(val.toFixed(1));
  });
}

/**
 * Builds a production Sticker / Vinyl Die-Cut Contour SVG document:
 * - Expanded white vinyl carrier cushion matching padded offset envelope
 * - Crisp vector artwork print proof aligned inside the carrier (never a grey silhouette slab)
 * - Unbroken Magenta #CutContour path (industry spot cut line)
 * - Print-then-cut optical corner registration marks on solid plates
 */
export function buildDieCutSvg(width, height, dieCutPathD, previewLayers = [], isTransparent = false, pad = 0) {
  const pw = width + 2 * pad;
  const ph = height + 2 * pad;
  let body = '';
  if (!isTransparent) {
    body += `  <rect width="${pw}" height="${ph}" fill="#0f172a"/>\n`;
    const m = Math.max(8, Math.round(Math.min(pw, ph) * 0.014));
    const arm = Math.max(14, Math.round(Math.min(pw, ph) * 0.028));
    body += `  <!-- Optical Print-Then-Cut Corner Registration Marks -->\n`;
    body += `  <g id="registration-crop-marks" fill="none" stroke="#64748b" stroke-width="1.5" stroke-linecap="square">\n`;
    body += `    <path d="M ${m} ${m + arm} L ${m} ${m} L ${m + arm} ${m}"/>\n`;
    body += `    <path d="M ${pw - m - arm} ${m} L ${pw - m} ${m} L ${pw - m} ${m + arm}"/>\n`;
    body += `    <path d="M ${m} ${ph - m - arm} L ${m} ${ph - m} L ${m + arm} ${ph - m}"/>\n`;
    body += `    <path d="M ${pw - m - arm} ${ph - m} L ${pw - m} ${ph - m} L ${pw - m} ${ph - m - arm}"/>\n`;
    body += `  </g>\n`;
  }

  body += `  <!-- Sticker Vinyl Carrier & Industry Spot #CutContour Path -->\n`;
  body += `  <g id="diecut-sticker-carrier">\n`;
  if (dieCutPathD && dieCutPathD.trim().length > 0) {
    body += `    <path id="diecut-vinyl-cushion" fill="#ffffff" fill-rule="evenodd" d="${dieCutPathD}"/>\n`;
  }

  const layers = Array.isArray(previewLayers) ? previewLayers : [];
  if (layers.length > 0) {
    body += `    <g id="diecut-subject-preview">\n`;
    for (const layer of layers) {
      let pathD = layer.d || '';
      if (!pathD && layer.mask) {
        pathD = cachedTraceMask(layer.mask, width, height, {
          optCurve: true,
          turdSize: layer.turdSize !== undefined ? layer.turdSize : 4,
          optTolerance: layer.optTolerance !== undefined ? layer.optTolerance : 0.25,
          alphaMax: layer.alphaMax !== undefined ? layer.alphaMax : 0.15,
          turnPolicy: 'minority'
        });
      }
      if (pathD && pathD.trim().length > 0) {
        const shiftedD = translateSvgPathD(compactSvgPathD(pathD), pad, pad);
        body += `      <path fill="${layer.color || '#0f172a'}" fill-rule="evenodd" d="${shiftedD}"/>\n`;
      }
    }
    body += `    </g>\n`;
  }

  if (dieCutPathD && dieCutPathD.trim().length > 0) {
    body += `    <path id="CutContour" fill="none" stroke="#ff00ff" stroke-width="2" stroke-linejoin="round" vector-effect="non-scaling-stroke" d="${dieCutPathD}"/>\n`;
  }
  body += `  </g>\n`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${pw} ${ph}" width="${pw}" height="${ph}">\n${body}</svg>`;
}


