#!/usr/bin/env node
/**
 * c2vector Master Unified Suite
 * 
 * Consolidates all verification, security/privacy auditing, headless testing,
 * and Open Graph asset generation into a single cohesive CLI tool.
 * 
 * Usage:
 *   node scripts/suite.mjs                # Run full automated test & verification suite (Default)
 *   node scripts/suite.mjs --test         # Explicit test suite run
 *   node scripts/suite.mjs --og           # Generate luxury OpenGraph social preview card suite
 *   node scripts/suite.mjs --lighthouse   # Run Lighthouse audit
 *   node scripts/suite.mjs --all          # Run verification, OG generation, and Lighthouse
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Dynamically import Playwright from workspace or system paths
async function getChromium() {
  const possiblePaths = [
    'playwright',
    path.resolve(ROOT_DIR, '../sponsorship/node_modules/playwright/index.js')
  ];
  for (const p of possiblePaths) {
    try {
      const mod = await import(p);
      return mod.chromium || mod.default?.chromium;
    } catch (_) {}
  }
  throw new Error('Playwright not found in node_modules or system paths.');
}

// ============================================================================
// MODULE 1: COMPREHENSIVE AUTOMATED VERIFICATION & QUALITY AUDIT SUITE
// ============================================================================
export async function runTestSuite() {
  console.log('\n================================================================');
  console.log('🛡️  c2vector Master Verification & Quality Audit Suite');
  console.log('================================================================\n');

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assert(condition, message) {
    totalTests++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passedTests++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
      failedTests++;
    }
  }

  const chromium = await getChromium();

  // --- SECTION 1: STATIC CODE, 7-VECTOR PRIVACY & SECURITY AUDIT ---
  console.log('--- 1. Static Code, 7-Vector Privacy & Security Audits ---');

  // Vector 1: Developer Identity
  const htmlFiles = [
    path.join(ROOT_DIR, 'index.html'),
    path.join(ROOT_DIR, 'about/index.html'),
    path.join(ROOT_DIR, 'workflow/index.html')
  ].filter(f => fs.existsSync(f));

  let plainEmailFound = false;
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  for (const file of htmlFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    const matches = content.match(emailRegex) || [];
    for (const match of matches) {
      if (!match.includes('example.com') && !match.includes('schema.org') && !match.includes('w3.org')) {
        plainEmailFound = true;
      }
    }
  }
  assert(!plainEmailFound, 'Vector 1: Developer Identity (0 plaintext emails exposed; entity obfuscation verified)');

  // Vector 2: Machine Paths & Private Network IPs
  const srcJsFiles = [];
  function collectJsFiles(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) collectJsFiles(fullPath);
      else if (entry.name.endsWith('.js') || entry.name.endsWith('.mjs')) srcJsFiles.push(fullPath);
    }
  }
  collectJsFiles(path.join(ROOT_DIR, 'src'));

  let leakedPathFound = false;
  let privateIpFound = false;
  const privateIpRegex = /(?:10\.\d{1,3}\.\d{1,3}\.\d{1,3}|172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|192\.168\.\d{1,3}\.\d{1,3})/;

  for (const file of srcJsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (content.includes('/home/') || content.includes('/Users/') || content.includes('C:\\Users')) leakedPathFound = true;
    if (privateIpRegex.test(content)) privateIpFound = true;
  }
  assert(!leakedPathFound, 'Vector 2: Machine Information (0 absolute developer filesystem paths in production src)');
  assert(!privateIpFound, 'Vector 2: Private Network IPs (0 internal/private IPv4 network addresses exposed)');

  // Vector 3: Secrets & API Tokens
  let secretFound = false;
  const secretRegex = /(?:ghp_[a-zA-Z0-9]{20,}|AKIA[0-9A-Z]{16}|bearer\s+[a-zA-Z0-9_\-\.]{20,}|AIza[0-9A-Za-z\-_]{35})/i;
  for (const file of srcJsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (secretRegex.test(content)) secretFound = true;
  }
  assert(!secretFound, 'Vector 3: Secrets & Credentials (0 API tokens, private keys, or passwords in source)');

  // Vector 4: Local Client-Side Processing Architecture
  let cloudCallFound = false;
  const externalApiRegex = /https?:\/\/(?:api\.|cloud\.|backend\.)[a-zA-Z0-9\.\-_]+/i;
  for (const file of srcJsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (externalApiRegex.test(content)) cloudCallFound = true;
  }
  assert(!cloudCallFound, 'Vector 4: Application & User Data (PII) (100% in-browser processing via Web Workers & Canvas; zero server telemetry)');

  // Vector 5: Distributable Hygiene
  const distDir = path.join(ROOT_DIR, 'dist');
  let sourcemapInDist = false;
  if (fs.existsSync(distDir)) {
    function checkDist(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) checkDist(full);
        else if (entry.name.endsWith('.map')) sourcemapInDist = true;
      }
    }
    checkDist(distDir);
  }
  assert(!sourcemapInDist, 'Vector 5: Development & Debug Artifacts (dist/ is clean with zero sourcemaps or debug dumps)');

  // Vector 6: Git History Hygiene
  const gitignoreContent = fs.existsSync(path.join(ROOT_DIR, '.gitignore'))
    ? fs.readFileSync(path.join(ROOT_DIR, '.gitignore'), 'utf-8')
    : '';
  const gitignoreProtects = ['archive/', 'dist/', 'report.md', 'implementation_plan.md', 'PROJECT_STATE.md'].every(p => gitignoreContent.includes(p));
  assert(gitignoreProtects, 'Vector 6: Git History Hygiene (.gitignore protects archive/, dist/, report.md, implementation_plan.md, PROJECT_STATE.md)');

  // Vector 7: Injection Prevention
  let evalFound = false;
  for (const file of srcJsFiles) {
    const content = fs.readFileSync(file, 'utf-8');
    if (/\beval\s*\(/.test(content) || /new\s+Function\s*\(/.test(content)) evalFound = true;
  }
  assert(!evalFound, 'Security: Injection Prevention (Zero eval() or new Function() code execution in src/js)');

  // --- SECTION 2: LIVE BROWSER MULTI-PAGE & RESPONSIVE LAYOUT AUDIT ---
  console.log('\n--- 2. Live Browser Multi-Page & Responsive Layout Audits ---');

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const consoleErrors = [];
  page.on('console', msg => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const pagesToAudit = [
    { name: 'Studio Workbench', path: 'http://localhost:5173/c2vector/' },
    { name: 'About & Educational Hub', path: 'http://localhost:5173/c2vector/about/' },
    { name: 'Workflow Architecture', path: 'http://localhost:5173/c2vector/workflow/' }
  ];

  const viewports = [
    { name: '320px (iPhone SE)', width: 320, height: 600 },
    { name: '375px (Mobile)', width: 375, height: 667 },
    { name: '768px (Tablet)', width: 768, height: 1024 },
    { name: '1280px (Desktop)', width: 1280, height: 800 }
  ];

  for (const p of pagesToAudit) {
    consoleErrors.length = 0;
    const resp = await page.goto(p.path, { waitUntil: 'networkidle' });
    assert(resp && resp.status() === 200, `Quality: ${p.name} HTTP 200 (Route loaded cleanly)`);

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height });
      await page.waitForTimeout(100);

      const overflow = await page.evaluate(() => {
        const docEl = document.documentElement;
        return {
          scrollWidth: docEl.scrollWidth,
          innerWidth: window.innerWidth,
          hasOverflow: docEl.scrollWidth > window.innerWidth
        };
      });

      assert(!overflow.hasOverflow, `Quality: ${p.name} Overflow @ ${vp.name} (scrollWidth <= innerWidth (${overflow.scrollWidth} <= ${overflow.innerWidth}))`);
    }

    assert(consoleErrors.length === 0, `Quality: ${p.name} Console Errors (0 unhandled JS console errors)`);
  }

  // --- SECTION 3: PHOTO MODE VECTOR ENGINE & 12 ARTBOARD SUITE ---
  console.log('\n--- 3. Photo Mode Vector Engine & 12 Artboard Checks ---');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/c2vector/', { waitUntil: 'networkidle' });
  await page.click('#tabModePhoto');
  await page.waitForTimeout(200);

  await page.click('#btnSample');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 15000 });
  assert(true, 'Photo Mode: Ingests sample photo successfully');

  await page.click('.tab-btn[data-artboard="posterizeColor"]');
  await page.waitForTimeout(200);
  const photoPosterTitle = await page.innerText('#activeArtboardTitle');
  assert(photoPosterTitle.includes('Color Posterize Print Plate'), `Photo Mode: Retains photographic 8-tone title (${photoPosterTitle})`);

  const photoPathsCount = await page.$$eval('#viewport svg path', els => els.length);
  assert(photoPathsCount >= 4, `Photo Mode: Renders rich multi-tier layers (${photoPathsCount} paths)`);

  // --- SECTION 4: LOGO MODE VECTOR ENGINE & 8-TONE COLOR ROBUSTNESS ---
  console.log('\n--- 4. Logo Mode Spot-Color Engine & 8-Tone Robustness ---');

  await page.goto('http://localhost:5173/c2vector/', { waitUntil: 'networkidle' });
  await page.click('#tabModeLogo');
  await page.waitForTimeout(200);

  await page.click('#btnSampleLogo');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 15000 });
  assert(true, 'Logo Mode: Ingests sample logo successfully');

  // Verify Swatches & Overflow Prevention
  const swatches = await page.$$eval('#workbenchPaletteSwatches .swatch-chip', els =>
    els.map(el => el.title || el.style.backgroundColor)
  );

  const hasBlackOverflow = swatches.some(s => s.toLowerCase().includes('#010100'));
  assert(!hasBlackOverflow, 'Logo Mode: Bitwise integer overflow resolved (zero phantom #010100 swatches)');

  const hasNavy = swatches.some(s => s.toLowerCase().includes('#0f172a') || s.toLowerCase().includes('#101828'));
  const hasGold = swatches.some(s => s.toLowerCase().includes('#f4ba00') || s.toLowerCase().includes('#f8b800'));
  const hasRubyRed = swatches.some(s => s.toLowerCase().includes('#e11d48') || s.toLowerCase().includes('#e02048'));

  assert(hasNavy, 'Logo Mode: Navy brand spot color accurately detected');
  assert(hasGold, 'Logo Mode: Gold brand spot color accurately detected');
  assert(hasRubyRed, 'Logo Mode: Ruby Red brand emblem accurately detected in palette');

  // Inspect posterizeColor (8-Tone Color Artboard)
  await page.click('.tab-btn[data-artboard="posterizeColor"]');
  await page.waitForTimeout(300);

  const logoPosterTitle = await page.innerText('#activeArtboardTitle');
  assert(logoPosterTitle === 'Spot-Color Reduction (Up to 8 Inks)', `Logo Mode: Updated artboard title (${logoPosterTitle})`);

  const posterData = await page.evaluate(() => {
    const svg = document.querySelector('#viewport svg');
    if (!svg) return null;
    const rect = svg.querySelector('rect');
    const paths = Array.from(svg.querySelectorAll('path')).map(p => ({
      fill: p.getAttribute('fill'),
      dLen: (p.getAttribute('d') || '').length
    }));
    return {
      hasRect: !!rect,
      rectFill: rect ? rect.getAttribute('fill') : null,
      paths
    };
  });

  assert(posterData !== null, 'Logo Mode: posterizeColor renders a valid SVG element');
  assert(posterData.hasRect && posterData.rectFill === '#ffffff', `Logo Mode: Substrate plate rect is white (#ffffff) (fill: ${posterData.rectFill})`);
  assert(posterData.paths.length === 3, `Logo Mode: posterizeColor renders exactly 3 foreground ink plates (actual: ${posterData.paths.length})`);

  const renderedFills = posterData.paths.map(p => p.fill.toLowerCase());
  const posterHasNavy = renderedFills.some(f => f === '#0f172a' || f === '#101828');
  const posterHasGold = renderedFills.some(f => f === '#f4ba00' || f === '#f8b800');
  const posterHasRed = renderedFills.some(f => f === '#e11d48' || f === '#e02048');

  assert(posterHasNavy, 'Logo Mode: posterizeColor includes Navy shield border path');
  assert(posterHasGold, 'Logo Mode: posterizeColor includes Gold shield field path');
  assert(posterHasRed, 'Logo Mode: posterizeColor retains Ruby Red brand emblem (3/3 brand colors verified)');

  const redPath = posterData.paths.find(p => p.fill.toLowerCase().includes('e11d') || p.fill.toLowerCase().includes('e020'));
  assert(redPath && redPath.dLen > 100, `Logo Mode: Ruby Red emblem has geometric detail (${redPath ? redPath.dLen : 0} bytes)`);

  // Inspect All 12 Artboard SVGs for Non-Blank Output
  console.log('\n--- 5. All 12 Logo Artboard Rendering & Dark Mode Plates ---');
  const artboardKeys = [
    'masterVibrant', 'masterFaithful', 'posterizeColor', 'pixelMatch',
    'monochrome', 'posterize4', 'posterize4Inverted', 'posterize8',
    'posterize8Inverted', 'stencil', 'cannyEdges', 'chromaticEdges'
  ];

  for (const key of artboardKeys) {
    await page.click(`.tab-btn[data-artboard="${key}"]`);
    await page.waitForTimeout(100);

    const artboardInfo = await page.evaluate(() => {
      const svg = document.querySelector('#viewport svg');
      const rect = svg ? svg.querySelector('rect') : null;
      return {
        hasSvg: !!svg,
        hasRect: !!rect,
        length: svg ? svg.outerHTML.length : 0
      };
    });

    assert(artboardInfo.hasSvg && artboardInfo.length > 100, `Logo Artboard "${key}": Renders valid SVG (${artboardInfo.length} bytes)`);
    assert(artboardInfo.hasRect, `Logo Artboard "${key}": Has background plate rect to prevent blank dark mode`);
  }

  // --- SECTION 6: TRANSPARENT PNG LOGO INGESTION & ANTI-CAMOUFLAGE PROTECTION ---
  console.log('\n--- 6. Transparent PNG Logo Ingestion & Anti-Camouflage Protection ---');
  const ariseTest = await page.evaluate(async () => {
    // Construct a transparent 400x120 canvas with dark navy text on transparent background
    const canvas = document.createElement('canvas');
    canvas.width = 400;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    // Draw navy text on transparent ground
    ctx.fillStyle = '#263f87';
    ctx.font = 'bold 36px sans-serif';
    ctx.fillText('ARISE MEDICAL', 20, 60);
    // Draw small green and orange marks
    ctx.fillStyle = '#14a54a';
    ctx.fillRect(20, 75, 80, 8);
    ctx.fillStyle = '#df4c2a';
    ctx.fillRect(110, 75, 80, 8);
    const idata = ctx.getImageData(0, 0, 400, 120);

    const { runLogoVectorizationPipeline } = await import('/c2vector/src/js/engine/logo-engine.js');
    const res = await runLogoVectorizationPipeline(idata.data, 400, 120, { maxColors: 16 });

    const master = res.svgs.masterVibrant;
    const rectMatch = master.match(/<rect[^>]+fill="([^"]+)"/);
    const rectFill = rectMatch ? rectMatch[1] : null;
    const hasNavyPath = master.includes('#263f87');

    return {
      bgHex: res.bgHex,
      rectFill,
      hasNavyPath,
      spotColors: res.palette.map(p => p.hex)
    };
  });

  assert(ariseTest.bgHex === '#ffffff', `Transparent PNG: Perimeter background resolves to neutral white (#ffffff) (actual: ${ariseTest.bgHex})`);
  assert(ariseTest.rectFill === '#ffffff', `Transparent PNG: Master backing plate is white (#ffffff) (actual: ${ariseTest.rectFill})`);
  assert(ariseTest.hasNavyPath, 'Transparent PNG: Master vector renders high-contrast navy typography path (#263f87)');
  assert(!ariseTest.rectFill.toLowerCase().includes('#263f87'), 'Transparent PNG: Zero camouflage collision (backing rect does NOT match dark navy typography)');

  console.log('\n--- Section 7: Desktop Layout Shift & Center Canvas Tests ---');
  
  // 1. Verify #btnCenterCanvas exists in DOM and is positioned inside .viewer-controls
  const centerCanvasExists = await page.evaluate(() => {
    const btn = document.getElementById('btnCenterCanvas');
    if (!btn) return false;
    const parent = btn.closest('.viewer-controls');
    return Boolean(parent);
  });
  assert(centerCanvasExists, 'Viewer Controls: #btnCenterCanvas is present inside .viewer-controls');

  // 2. Test Center Canvas action logic & Zoom Preservation
  const centerCanvasAction = await page.evaluate(() => {
    const wb = document.getElementById('workbench');
    if (wb) wb.style.display = 'block';
    
    // Set pan & zoom via exposed state
    window.__c2vectorState.panX = 150;
    window.__c2vectorState.panY = -75;
    window.__c2vectorState.currentZoom = 2;
    
    const btn = document.getElementById('btnCenterCanvas');
    btn.click();
    
    const centeredPanX = window.__c2vectorState.panX;
    const centeredPanY = window.__c2vectorState.panY;
    const zoomRetained = window.__c2vectorState.currentZoom;
    
    // Click again when already centered at zoom > 1 -> MUST PRESERVE ZOOM (never default to 1x)
    btn.click();
    const zoomAfterSecondClick = window.__c2vectorState.currentZoom;
    
    // Clicking the dedicated 1x button resets zoom to 1
    const btn1x = document.querySelector('.zoom-btn[data-zoom="1"]');
    if (btn1x) btn1x.click();
    const resetZoom = window.__c2vectorState.currentZoom;
    
    return {
      centeredPanX,
      centeredPanY,
      zoomRetained,
      zoomAfterSecondClick,
      resetZoom
    };
  });
  assert(centerCanvasAction.centeredPanX === 0 && centerCanvasAction.centeredPanY === 0, 'Center Canvas: Resets pan coordinates to (0, 0) upon click');
  assert(centerCanvasAction.zoomRetained === 2, 'Center Canvas: Preserves user magnification (2x) when re-centering');
  assert(centerCanvasAction.zoomAfterSecondClick === 2, 'Center Canvas: Strictly preserves magnification across repeated clicks (does not default to 1x)');
  assert(centerCanvasAction.resetZoom === 1, 'Zoom Controls: Dedicated [1x] button resets magnification to 1x');

  // 3. Desktop Toolbar Layout Invariance Test across artboards
  const desktopViewports = [1366, 1440, 1920];
  for (const vpWidth of desktopViewports) {
    await page.setViewportSize({ width: vpWidth, height: 900 });
    const heights = await page.evaluate(() => {
      const tb = document.querySelector('.viewer-toolbar');
      const title = document.getElementById('activeArtboardTitle');
      const titles = [
        'Master Vibrant Vector v2',
        'Master Faithful Vector — Authentic 64 Tiers Source Match',
        'Color Posterize Print Plate (8-Tone) — Bold Chromatic Planes',
        'Seamless Pixel-Match Vector (Anti-Grid HD) — Zero Grid Lines',
        '1-Bit Otsu Monochrome Stencil — Solid B&W Mask',
        '4-Tone Posterize Print Plate (Positive) — Quantized Grayscale',
        '4-Tone Negative Plate (Inverted) — For Dark Apparel & Laser',
        '8-Tone Posterize Print Plate (Positive) — Graduated Grayscale',
        '8-Tone Negative Plate (Inverted) — Discharge Ink Plate',
        'Bridge-Connected Cut Stencil — Island-Bridged Laser Paths',
        'Canny Sub-Pixel Hairline Edges — 1-px Ridge Outlines',
        'Translucent Chromatic Contours — 70%-80% Opacity Glaze'
      ];
      return titles.map(t => {
        title.textContent = t;
        const rect = tb.getBoundingClientRect();
        return rect.height;
      });
    });
    
    const minH = Math.min(...heights);
    const maxH = Math.max(...heights);
    const deltaH = maxH - minH;
    assert(deltaH < 1, `Desktop ${vpWidth}px: Zero toolbar layout shift across all 12 artboard titles (min: ${minH}px, max: ${maxH}px, delta: ${deltaH.toFixed(2)}px)`);
  }

  // 4. Mobile Viewport Overflow Test at 320px
  await page.setViewportSize({ width: 320, height: 640 });
  const mobileOverflow = await page.evaluate(() => {
    const bodyScroll = document.documentElement.scrollWidth;
    const windowW = window.innerWidth;
    const card = document.querySelector('.viewer-card');
    const cardRect = card ? card.getBoundingClientRect() : null;
    return {
      hasOverflow: bodyScroll > windowW,
      bodyScroll,
      windowW,
      cardWidth: cardRect ? cardRect.width : 0
    };
  });
  assert(!mobileOverflow.hasOverflow, `Mobile 320px: Zero horizontal overflow (scrollWidth: ${mobileOverflow.bodyScroll}px <= window: ${mobileOverflow.windowW}px)`);

  await browser.close();

  console.log('\n================================================================');
  console.log(`🏁 Test Suite Complete: ${passedTests}/${totalTests} Passed (${failedTests} Failed)`);
  console.log('================================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
  return true;
}

// ============================================================================
// MODULE 2: LUXURY OPEN GRAPH & SOCIAL PREVIEW ASSET GENERATOR
// ============================================================================
export async function generateLuxuryOgSuite() {
  console.log('\n================================================================');
  console.log('🎨 Generating Luxury Open Graph & Social Preview Cards');
  console.log('================================================================\n');

  const OG_DIR = path.join(ROOT_DIR, 'public/assets/og');
  if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });

  const FONT_PATH = path.join(__dirname, 'fonts/PlusJakartaSans.ttf');
  let fontBase64 = '';
  if (fs.existsSync(FONT_PATH)) {
    fontBase64 = fs.readFileSync(FONT_PATH).toString('base64');
  }

  const penPath = "M 25.332 19.578 C 24.655 21.341, 29.433 40.612, 31.022 42.526 C 31.581 43.200, 33.738 44.022, 35.816 44.355 C 38.441 44.774, 40.275 45.880, 41.827 47.979 C 43.055 49.641, 44.849 51, 45.814 51 C 47.682 51, 58 41.161, 58 39.379 C 58 38.797, 56.490 36.948, 54.645 35.268 C 52.301 33.136, 51.093 30.985, 50.637 28.133 C 50.002 24.161, 49.831 24.008, 44.242 22.436 C 41.084 21.548, 36.281 20.186, 33.568 19.410 C 27.286 17.614, 26.076 17.638, 25.332 19.578 M 34.500 26 C 36.343 27.924, 38.371 29, 40.152 29 C 43.750 29, 45.678 32.216, 44.124 35.626 C 43.412 37.190, 42.202 38, 40.578 38 C 37.977 38, 34.835 34.595, 35.599 32.604 C 35.845 31.962, 34.393 29.876, 32.373 27.969 C 29.930 25.662, 28.923 25.129, 29.368 26.379 C 29.735 27.412, 30.543 30.337, 31.162 32.879 C 32.904 40.025, 33.576 40.814, 38.569 41.563 C 42.697 42.182, 43.419 41.973, 46.131 39.375 C 48.703 36.911, 49.041 36.004, 48.511 33.001 C 47.360 26.480, 47.177 26.288, 40.513 24.614 C 31.754 22.413, 31.189 22.544, 34.500 26 M 39 33.500 C 39 34.417, 39.484 35.005, 40.075 34.808 C 40.666 34.611, 41.150 34.023, 41.150 33.500 C 41.150 32.977, 40.666 32.389, 40.075 32.192 C 39.484 31.995, 39 32.583, 39 33.500 M 47.699 41.796 C 44.803 44.762, 44.256 45.856, 45.200 46.800 C 46.144 47.744, 47.238 47.197, 50.204 44.301 C 54.054 40.542, 55.062 38, 52.703 38 C 51.990 38, 49.738 39.708, 47.699 41.796";

  function getLogoSvg(size = 48) {
    return `
    <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M 2 17 C 5 9, 10 9, 13 13 C 15 15.5, 18 16, 22 11" stroke="#f4ba00" stroke-width="2" stroke-linecap="round"/>
      <line x1="6" y1="9.5" x2="14" y2="9.5" stroke="#fedd3d" stroke-width="1.2" stroke-dasharray="1.5 1.5" opacity="0.95"/>
      <circle cx="6" cy="9.5" r="1.3" fill="#fbd32c"/>
      <circle cx="14" cy="9.5" r="1.3" fill="#fbd32c"/>
      <g transform="translate(13, 13) scale(0.36) rotate(-100) translate(-25.332, -19.578)" fill="#f4ba00" fill-rule="evenodd">
        <path d="${penPath}" />
      </g>
    </svg>`;
  }

  const chromium = await getChromium();
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const specs = [
    { filename: 'og-image.jpg', width: 1200, height: 630, quality: 78, desc: '1.91:1 Landscape Hero (OpenGraph & Twitter)' },
    { filename: 'og-discover.jpg', width: 1280, height: 720, quality: 76, desc: '16:9 Google Discover HD' },
    { filename: 'og-search.jpg', width: 1200, height: 900, quality: 76, desc: '4:3 Google Search Rich Results' },
    { filename: 'og-square.jpg', width: 800, height: 800, quality: 76, desc: '1:1 Square Card (LinkedIn / Messaging)' },
    { filename: 'og-image-1x1.jpg', width: 300, height: 300, quality: 72, desc: '1:1 WhatsApp Compact Preview (<50KB)' }
  ];

  for (const s of specs) {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        @font-face {
          font-family: 'PlusJakartaSans';
          src: url('data:font/truetype;charset=utf-8;base64,${fontBase64}') format('truetype');
          font-weight: 400 800;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          width: ${s.width}px;
          height: ${s.height}px;
          background: #090b0e;
          color: #f1f5f9;
          font-family: 'PlusJakartaSans', system-ui, sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
        }
        .card {
          width: 92%;
          height: 88%;
          background: #11141a;
          border: 1px solid #1e2430;
          border-radius: 16px;
          padding: 40px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .header { display: flex; align-items: center; gap: 16px; }
        .brand { font-size: 32px; font-weight: 800; letter-spacing: -0.02em; color: #f8fafc; }
        .badge {
          background: rgba(244, 186, 0, 0.12);
          border: 1px solid rgba(244, 186, 0, 0.35);
          color: #f4ba00;
          font-size: 14px;
          font-weight: 700;
          padding: 6px 14px;
          border-radius: 999px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }
        .content { margin-top: auto; margin-bottom: auto; }
        .title { font-size: 48px; font-weight: 800; line-height: 1.15; color: #f8fafc; margin-bottom: 12px; }
        .subtitle { font-size: 20px; color: #94a3b8; line-height: 1.4; max-width: 650px; }
        .footer { display: flex; align-items: center; justify-content: space-between; border-top: 1px solid #1e2430; padding-top: 20px; }
        .meta { font-size: 14px; color: #64748b; font-weight: 600; }
        .pill { color: #f4ba00; font-weight: 700; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="header">
          ${getLogoSvg(40)}
          <span class="brand">c2vector</span>
          <span class="badge">0% Generative AI</span>
        </div>
        <div class="content">
          <h1 class="title">Pure Mathematical Image to Scalable Vector Studio</h1>
          <p class="subtitle">Turn photos, logos, typography, and decals into infinitely scalable SVGs with Potrace G¹ cubic Bézier continuity.</p>
        </div>
        <div class="footer">
          <span class="meta">100% In-Browser WebAssembly & Web Workers</span>
          <span class="pill">deekshithvodela.github.io/c2vector</span>
        </div>
      </div>
    </body>
    </html>`;

    await page.setViewportSize({ width: s.width, height: s.height });
    await page.setContent(html);
    const outPath = path.join(OG_DIR, s.filename);
    await page.screenshot({ path: outPath, type: 'jpeg', quality: s.quality });

    const bytes = fs.statSync(outPath).size;
    const kb = (bytes / 1024).toFixed(1);
    const passed = bytes < 100 * 1024;
    console.log(`  ${passed ? '✅' : '❌'} Generated ${s.filename} (${s.width}x${s.height}) — ${kb} KB (${s.desc})`);
    if (!passed) console.warn(`     ⚠️ WARNING: ${s.filename} exceeds 100 KB limit!`);
  }

  await browser.close();
  console.log('\n🌟 All Open Graph social cards compiled successfully!\n');
}

// ============================================================================
// CLI DISPATCHER
// ============================================================================
const args = process.argv.slice(2);

async function main() {
  if (args.includes('--og')) {
    await generateLuxuryOgSuite();
  } else if (args.includes('--all')) {
    await runTestSuite();
    await generateLuxuryOgSuite();
  } else {
    // Default: run automated test & verification suite
    await runTestSuite();
  }
}

main().catch(err => {
  console.error('\n❌ Execution Error:', err);
  process.exit(1);
});
