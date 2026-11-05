/**
 * c2vector - Master Bézier Tracer Module (Peter Selinger Potrace Engine)
 * Generates continuous cubic Bézier curves with G1 continuity, nested hole decomposition (fill-rule="evenodd"),
 * and zero pixel stair appearance. 100% in-browser client-side execution.
 */

import { traceMaskToPathD } from './potrace.js';

/**
 * Traces a binary mask into a smooth cubic Bézier path string
 * @param {Uint8Array} mask - 1 for path, 0 for background
 * @param {number} width - canvas width
 * @param {number} height - canvas height
 * @param {object} options - turdSize, optTolerance, etc.
 * @returns {Array<string>} - Array with single combined multi-loop path string (or empty array)
 */
export function traceBinaryMask(mask, width, height, options = {}) {
  const turdSize = options.turdSize !== undefined ? options.turdSize : 14;
  const optTolerance = options.optTolerance !== undefined ? options.optTolerance : 0.22;
  const pathD = traceMaskToPathD(mask, width, height, {
    optCurve: true,
    turdSize,
    optTolerance,
    turnPolicy: 'minority'
  });
  return pathD ? [pathD] : [];
}

/**
 * Builds Full Master Vector SVG string with continuous Bézier tiers and translucent chromatic contours
 * Universal Continuous Discrete Vector Tier Production Print Specifications
 */
export function buildMasterSvg(width, height, palette, tierMasks, chromaticEdges = null, bgHex = null, silhouettePathD = null) {
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

    const pathD = traceMaskToPathD(mask, width, height, {
      optCurve: true,
      turdSize: 3,
      optTolerance: 0.22,
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
  const pathD = traceMaskToPathD(mask, width, height, {
    optCurve: true,
    turdSize,
    optTolerance: 0.20,
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
    const pathD = traceMaskToPathD(layer.mask, width, height, {
      optCurve: true,
      turdSize: layer.turdSize !== undefined ? layer.turdSize : 3,
      optTolerance: 0.20,
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
    const pathD = traceMaskToPathD(layer.mask, width, height, {
      optCurve: true,
      turdSize: layer.turdSize !== undefined ? layer.turdSize : 4,
      optTolerance: 0.25,
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
    const pathD = traceMaskToPathD(layer.mask, width, height, {
      optCurve: true,
      turdSize: 3,
      optTolerance: 0.18,
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


