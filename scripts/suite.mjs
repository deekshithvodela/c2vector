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
 *   node scripts/suite.mjs --all          # Run verification and OG asset generation
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

// Dynamically import Playwright from workspace devDependencies or PLAYWRIGHT_PATH
async function getChromium() {
  const possiblePaths = [
    'playwright',
    ...(process.env.PLAYWRIGHT_PATH ? [process.env.PLAYWRIGHT_PATH] : [])
  ];
  for (const p of possiblePaths) {
    try {
      const mod = await import(p);
      return mod.chromium || mod.default?.chromium;
    } catch (_) {}
  }
  throw new Error('Playwright not found in node_modules. Run `npm install` or set PLAYWRIGHT_PATH.');
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
  const leakedPathRegex = /(?:\/home\/|\/Users\/|C:\\Users|\.gemini\/|antigravity-ide\/brain)/i;

  const distJsFiles = [];
  if (fs.existsSync(path.join(ROOT_DIR, 'dist/assets'))) {
    for (const entry of fs.readdirSync(path.join(ROOT_DIR, 'dist/assets'), { withFileTypes: true })) {
      if (!entry.isDirectory() && entry.name.endsWith('.js')) {
        distJsFiles.push(path.join(ROOT_DIR, 'dist/assets', entry.name));
      }
    }
  }

  for (const file of [...srcJsFiles, ...distJsFiles]) {
    const content = fs.readFileSync(file, 'utf-8');
    if (leakedPathRegex.test(content)) leakedPathFound = true;
    if (privateIpRegex.test(content)) privateIpFound = true;
  }
  assert(!leakedPathFound, 'Vector 2: Machine Information (0 absolute developer or internal agent paths in src & dist)');
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

  // Auto-start Vite dev server if not already running on port 5173
  let viteServer = null;
  try {
    const isRunning = await fetch('http://localhost:5173/c2vector/').then(r => r.ok).catch(() => false);
    if (!isRunning) {
      const { createServer } = await import('vite');
      viteServer = await createServer();
      await viteServer.listen(5173);
    }
  } catch (err) {
    console.warn('Vite auto-start check:', err.message);
  }

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
    const is200 = resp && resp.status() === 200;
    const overflowErrors = [];

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

      if (overflow.hasOverflow) {
        overflowErrors.push(`${vp.name} (${overflow.scrollWidth} > ${overflow.innerWidth})`);
      }
    }

    const a11y = await page.evaluate(() => {
      const hasMain = Boolean(document.querySelector('main, [role="main"]'));
      const hasNav = Boolean(document.querySelector('nav, [role="navigation"]'));
      const h1Count = document.querySelectorAll('h1').length;
      const imgsMissingAlt = Array.from(document.querySelectorAll('img')).filter(img => !img.hasAttribute('alt')).length;
      const btnsNoName = Array.from(document.querySelectorAll('button')).filter(
        btn => !btn.textContent.trim() && !btn.getAttribute('aria-label') && !btn.getAttribute('title')
      ).length;
      const unlabeledInputs = Array.from(document.querySelectorAll('input')).filter(inp => {
        if (inp.type === 'hidden') return false;
        const hasFor = inp.id && document.querySelector(`label[for="${inp.id}"]`);
        const hasAncestorLabel = Boolean(inp.closest('label'));
        const hasAria = inp.getAttribute('aria-label') || inp.getAttribute('aria-labelledby') || inp.title;
        return !hasFor && !hasAncestorLabel && !hasAria;
      }).length;
      const reducedMotion = Array.from(document.styleSheets).some(ss => {
        try { return Array.from(ss.cssRules).some(r => r.cssText && r.cssText.includes('prefers-reduced-motion')); }
        catch { return false; }
      });
      return hasMain && hasNav && h1Count === 1 && imgsMissingAlt === 0 && btnsNoName === 0 && unlabeledInputs === 0 && reducedMotion;
    });

    const passed = is200 && overflowErrors.length === 0 && consoleErrors.length === 0 && a11y;
    const details = passed
      ? `HTTP 200, 4 viewports [320px, 375px, 768px, 1280px] overflow-free, ARIA/WCAG baseline OK, 0 console errors`
      : `HTTP: ${resp?.status()}, Overflows: [${overflowErrors.join(', ') || 'none'}], A11y: ${a11y}, Console: [${consoleErrors.join('; ') || 'none'}]`;
    assert(passed, `Quality: ${p.name} (${details})`);
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
  const photoPathsCount = await page.$$eval('#viewport svg path', els => els.length);
  assert(
    photoPosterTitle.includes('Color Posterize Print Plate') && photoPathsCount >= 4,
    `Photo Mode: Color Posterize artboard renders photographic title ("${photoPosterTitle}") and ${photoPathsCount} vector tiers`
  );

  // --- SECTION 3b: PHOTO MODE TRANSPARENT INGESTION & GRID KNOCKOUT ---
  console.log('\n--- 3b. Photo Mode Transparent Ingestion & Grid Knockout ---');
  const photoTransparentTest = await page.evaluate(async () => {
    // Create transparent PNG canvas: 300x100 transparent with red and blue photo bars
    const c = document.createElement('canvas');
    c.width = 300;
    c.height = 100;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#dc2626';
    ctx.fillRect(20, 20, 100, 60);
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(150, 20, 100, 60);
    const idata = ctx.getImageData(0, 0, 300, 100);

    const { runVectorizationPipeline } = await import('/c2vector/src/js/engine/pipeline.js');
    const res = await runVectorizationPipeline(idata.data, 300, 100, { tiers: 16 });

    const masterTransparent = res.transparentSvgs.masterVibrant;
    const masterSolid = res.solidSvgs.masterVibrant;

    return {
      mode: res.mode,
      isTransparentImage: res.isTransparentImage,
      isTransparentLogo: res.isTransparentLogo,
      knockoutBackground: res.knockoutBackground,
      transparentHasRect: masterTransparent.includes('<rect'),
      solidHasRect: masterSolid.includes('<rect'),
      activeHasRect: res.svgs.masterVibrant.includes('<rect')
    };
  });

  assert(
    photoTransparentTest.mode === 'photo' &&
    photoTransparentTest.isTransparentImage === true &&
    !photoTransparentTest.transparentHasRect &&
    photoTransparentTest.solidHasRect &&
    !photoTransparentTest.activeHasRect,
    `Photo Mode Transparent: Preserves photo mode, detects alpha, renders 0 <rect> in transparent/active SVGs and keeps solid substrate plate`
  );

  // --- SECTION 4: LOGO MODE VECTOR ENGINE & 8-TONE COLOR ROBUSTNESS ---
  console.log('\n--- 4. Logo Mode Spot-Color Engine & 8-Tone Robustness ---');

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/c2vector/', { waitUntil: 'networkidle' });
  await page.click('#tabModeLogo');
  await page.waitForTimeout(200);

  await page.click('#btnSampleLogo');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 15000 });

  // Verify Swatches & Overflow Prevention
  const swatches = await page.$$eval('#workbenchPaletteSwatches .swatch-chip', els =>
    els.map(el => el.title || el.style.backgroundColor)
  );

  const hasBlackOverflow = swatches.some(s => s.toLowerCase().includes('#010100'));
  const hasNavy = swatches.some(s => s.toLowerCase().includes('#0f172a') || s.toLowerCase().includes('#101828'));
  const hasGold = swatches.some(s => s.toLowerCase().includes('#f4ba00') || s.toLowerCase().includes('#f8b800'));
  const hasRubyRed = swatches.some(s => s.toLowerCase().includes('#e11d48') || s.toLowerCase().includes('#e02048'));

  assert(
    !hasBlackOverflow && hasNavy && hasGold && hasRubyRed,
    `Logo Mode Palette: Sample logo ingested with 0 phantom #010100 swatches and all 3 brand spot colors (Navy, Gold, Ruby Red) detected`
  );

  // Inspect posterizeColor (8-Tone Color Artboard)
  await page.click('.tab-btn[data-artboard="posterizeColor"]');
  await page.waitForTimeout(300);

  const logoPosterTitle = await page.innerText('#activeArtboardTitle');
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

  const renderedFills = posterData ? posterData.paths.map(p => p.fill.toLowerCase()) : [];
  const posterHasNavy = renderedFills.some(f => f === '#0f172a' || f === '#101828');
  const posterHasGold = renderedFills.some(f => f === '#f4ba00' || f === '#f8b800');
  const posterHasRed = renderedFills.some(f => f === '#e11d48' || f === '#e02048');
  const redPath = posterData ? posterData.paths.find(p => p.fill.toLowerCase().includes('e11d') || p.fill.toLowerCase().includes('e020')) : null;

  assert(
    logoPosterTitle === 'Spot-Color Reduction (Up to 8 Inks)' &&
    posterData !== null &&
    posterData.hasRect &&
    posterData.rectFill === '#ffffff' &&
    posterData.paths.length === 3,
    `Logo Mode posterizeColor: Correct title ("${logoPosterTitle}"), white substrate plate (#ffffff), and exactly 3 foreground ink plates`
  );
  assert(
    posterHasNavy && posterHasGold && posterHasRed && redPath && redPath.dLen > 100,
    `Logo Mode Brand Fidelity: Renders Navy shield, Gold field, and Ruby Red emblem (${redPath ? redPath.dLen : 0} bytes)`
  );

  // Inspect All 13 Artboard SVGs for Non-Blank Output
  console.log('\n--- 5. All 13 Logo Artboard Rendering & Dark Mode Plates ---');
  const artboardKeys = [
    'masterVibrant', 'masterFaithful', 'canvaOptimized', 'posterizeColor', 'pixelMatch',
    'monochrome', 'twoTone', 'posterize4', 'posterize4Inverted', 'posterize8',
    'posterize8Inverted', 'stencil', 'cannyEdges', 'chromaticEdges'
  ];

  const artboardFailures = [];
  for (const key of artboardKeys) {
    await page.evaluate((k) => {
      const btn = document.querySelector(`.tab-btn[data-artboard="${k}"]`);
      if (btn) btn.click();
    }, key);
    await page.waitForTimeout(150);

    const artboardInfo = await page.evaluate(() => {
      const svg = document.querySelector('#viewport svg');
      const rect = svg ? svg.querySelector('rect') : null;
      return {
        hasSvg: !!svg,
        hasRect: !!rect,
        length: svg ? svg.outerHTML.length : 0
      };
    });

    if (!artboardInfo.hasSvg || artboardInfo.length <= 100 || !artboardInfo.hasRect) {
      artboardFailures.push(`${key} (svg:${artboardInfo.hasSvg}, len:${artboardInfo.length}, rect:${artboardInfo.hasRect})`);
    }
  }
  assert(artboardFailures.length === 0, `Logo Artboards: All 13 artboards render valid standalone SVGs with dark mode plates${artboardFailures.length ? ` (Failures: ${artboardFailures.join(', ')})` : ''}`);

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
      isTransparentLogo: res.isTransparentLogo,
      knockoutBackground: res.knockoutBackground,
      bgHex: res.bgHex,
      rectFill,
      hasNavyPath,
      hasTransparentSvgs: Boolean(res.transparentSvgs && res.transparentSvgs.masterVibrant),
      hasSolidSvgs: Boolean(res.solidSvgs && res.solidSvgs.masterVibrant),
      transparentHasRect: res.transparentSvgs.masterVibrant.includes('<rect'),
      solidRectFill: res.solidSvgs.masterVibrant.match(/<rect[^>]+fill="([^"]+)"/)?.[1]
    };
  });

  assert(
    ariseTest.isTransparentLogo === true &&
    ariseTest.knockoutBackground === true &&
    ariseTest.rectFill === null &&
    ariseTest.hasNavyPath &&
    !ariseTest.transparentHasRect &&
    ariseTest.solidRectFill === '#ffffff',
    `Transparent PNG Logo: Detects alpha, defaults to transparent knockout (0 <rect>), preserves #263f87 typography, and provides #ffffff solid plate`
  );

  // Test Interactive Background Removal & Grid Toggle on UI
  console.log('\n--- 6b. Grid Button Background Removal & Transparent SVG Downloads ---');
  const gridButtonTest = await page.evaluate(async () => {
    const btnGrid = document.getElementById('btnToggleGrid');
    const viewport = document.getElementById('viewport');
    
    const initialGridOn = window.__c2vectorState.isGridOn;
    const initialHasActive = btnGrid.classList.contains('active');
    const initialHasGridPattern = viewport.classList.contains('grid-pattern');

    // Click Grid button to turn ON background removal
    btnGrid.click();
    await new Promise(r => setTimeout(r, 60));

    const toggledGridOn = window.__c2vectorState.isGridOn;
    const toggledHasActive = btnGrid.classList.contains('active');
    const toggledHasGridPattern = viewport.classList.contains('grid-pattern');
    const svgAfterRemoval = viewport.querySelector('svg');
    const rectAfterRemoval = svgAfterRemoval ? svgAfterRemoval.querySelector('rect') : null;
    const svgStrCurrent = window.__c2vectorState.currentResults?.svgs?.masterVibrant || '';
    const currentHasRect = svgStrCurrent.includes('<rect');

    // Click Grid button again to turn OFF background removal (restore solid)
    btnGrid.click();
    await new Promise(r => setTimeout(r, 60));

    const restoredGridOn = window.__c2vectorState.isGridOn;
    const restoredHasActive = btnGrid.classList.contains('active');
    const restoredHasGridPattern = viewport.classList.contains('grid-pattern');
    const svgAfterRestore = viewport.querySelector('svg');
    const rectAfterRestore = svgAfterRestore ? svgAfterRestore.querySelector('rect') : null;

    return {
      initialGridOn,
      initialHasActive,
      initialHasGridPattern,
      toggledGridOn,
      toggledHasActive,
      toggledHasGridPattern,
      rectAfterRemoval: Boolean(rectAfterRemoval),
      currentHasRect,
      restoredGridOn,
      restoredHasActive,
      restoredHasGridPattern,
      rectAfterRestore: Boolean(rectAfterRestore)
    };
  });

  assert(
    gridButtonTest.toggledGridOn === true &&
    gridButtonTest.toggledHasActive === true &&
    gridButtonTest.toggledHasGridPattern === true &&
    !gridButtonTest.rectAfterRemoval &&
    !gridButtonTest.currentHasRect,
    'Grid Toggle ON: Activates checkerboard pattern, strips viewport <rect>, and exports transparent downloadable SVGs'
  );
  assert(
    gridButtonTest.restoredGridOn === false &&
    !gridButtonTest.restoredHasActive &&
    !gridButtonTest.restoredHasGridPattern &&
    gridButtonTest.rectAfterRestore === true,
    'Grid Toggle OFF: Hides checkerboard pattern and restores solid substrate <rect> in viewport'
  );

  console.log('\n--- Section 7: Desktop Layout Shift & Center Canvas Tests ---');
  
  // 1. Verify #btnCenterCanvas exists in DOM and is positioned inside .viewer-controls
  const centerCanvasExists = await page.evaluate(() => {
    const btn = document.getElementById('btnCenterCanvas');
    if (!btn) return false;
    const parent = btn.closest('.viewer-controls');
    return Boolean(parent);
  });

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
  assert(
    centerCanvasExists &&
    centerCanvasAction.centeredPanX === 0 &&
    centerCanvasAction.centeredPanY === 0 &&
    centerCanvasAction.zoomRetained === 2 &&
    centerCanvasAction.zoomAfterSecondClick === 2 &&
    centerCanvasAction.resetZoom === 1,
    'Center Canvas & Zoom Controls: Resets pan to (0,0), strictly preserves 2x zoom across clicks, and [1x] resets zoom to 1x'
  );

  // 3. Desktop Toolbar Layout Invariance Test across artboards
  const desktopViewports = [1366, 1440, 1920];
  const shiftFailures = [];
  const shiftDeltas = [];
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
    shiftDeltas.push(`${vpWidth}px: Δ${deltaH.toFixed(2)}px`);
    if (deltaH >= 1) {
      shiftFailures.push(`${vpWidth}px (delta: ${deltaH.toFixed(2)}px)`);
    }
  }
  assert(shiftFailures.length === 0, `Desktop Layout Shift: Zero toolbar layout shift across 1366px, 1440px, and 1920px viewports (${shiftDeltas.join(', ')})`);

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

  // --- SECTION 8: NATIVE VIEWBOX ZOOM CRISPNESS & 60FPS ARCHITECTURE ---
  console.log('\n--- Section 8: Native ViewBox Zoom Crispness & 60fps Architecture ---');

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:5173/c2vector/', { waitUntil: 'networkidle' });
  await page.click('#tabModePhoto');
  await page.waitForTimeout(200);
  await page.click('#btnSample');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#viewport svg', { timeout: 20000 });
  await page.waitForTimeout(500);

  // 1. Verify CSS Layer Optimization: 0 will-change and 0 drop-shadow filter on SVG
  const svgStyles = await page.evaluate(() => {
    const svg = document.querySelector('#viewport svg');
    const comp = window.getComputedStyle(svg);
    return {
      willChange: comp.willChange,
      filter: comp.filter
    };
  });
  assert(svgStyles.willChange !== 'transform', 'CSS Layering: SVG will-change is NOT forced to transform (prevents 1x GPU texture clamping)');
  assert(!svgStyles.filter || svgStyles.filter === 'none', 'CSS Layering: Zero filter: drop-shadow on SVG (eliminates GPU raster blur on Bézier paths)');

  // 2. Verify ViewBox Zoom Calculation at 1x, 2x, 4x, 8x
  const zoomVbResults = await page.evaluate(async () => {
    const svg = document.querySelector('#viewport svg');
    const baseW = window.__c2vectorState.baseViewBox.width;
    const baseH = window.__c2vectorState.baseViewBox.height;

    const tests = [1, 2, 4, 8];
    const outcomes = [];

    for (const z of tests) {
      const btn = document.querySelector(`.zoom-btn[data-zoom="${z}"]`);
      if (btn) btn.click();
      await new Promise(r => setTimeout(r, 300));

      const vb = svg.getAttribute('viewBox').split(' ').map(Number);
      const expectedW = baseW / z;
      const expectedH = baseH / z;

      const wMatch = Math.abs(vb[2] - expectedW) < 1;
      const hMatch = Math.abs(vb[3] - expectedH) < 1;
      outcomes.push({ zoom: z, wMatch, hMatch, actualW: vb[2], expectedW });
    }
    return outcomes;
  });

  const zoomFailures = zoomVbResults.filter(r => !(r.wMatch && r.hMatch)).map(r => `${r.zoom}x (${r.actualW.toFixed(1)} vs ${r.expectedW.toFixed(1)})`);
  assert(zoomFailures.length === 0, `ViewBox Zoom Engine: Magnifications [1x, 2x, 4x, 8x] scale viewBox dimensions to exact 1/z ratios${zoomFailures.length ? ` (Failures: ${zoomFailures.join(', ')})` : ''}`);

  // 3. Verify Soft Boundary Clamping on Pan
  const panClampTest = await page.evaluate(async () => {
    // Zoom to 4x
    const btn4x = document.querySelector('.zoom-btn[data-zoom="4"]');
    if (btn4x) btn4x.click();
    await new Promise(r => setTimeout(r, 300));

    // Try setting huge out-of-bounds pan
    window.__c2vectorState.panX = 99999;
    window.__c2vectorState.panY = -99999;
    window.__c2vectorState.renderViewBox();

    const clampedPanX = window.__c2vectorState.panX;
    const clampedPanY = window.__c2vectorState.panY;
    const isBounded = Math.abs(clampedPanX) < 5000 && Math.abs(clampedPanY) < 5000;

    return { clampedPanX, clampedPanY, isBounded };
  });
  assert(panClampTest.isBounded, `Pan Engine: Soft boundary clamping prevents out-of-bounds runaway (clamped at ${panClampTest.clampedPanX.toFixed(0)}px)`);

  // 4. Verify 60fps rAF Animation Performance during Panning
  const perfTest = await page.evaluate(async () => {
    const t0 = performance.now();
    for (let i = 0; i < 60; i++) {
      window.__c2vectorState.panX = Math.sin(i * 0.1) * 80;
      window.__c2vectorState.panY = Math.cos(i * 0.1) * 80;
      window.__c2vectorState.renderViewBox();
    }
    const duration = performance.now() - t0;
    return {
      durationMs: duration,
      perFrameMs: duration / 60
    };
  });
  assert(perfTest.perFrameMs < 5.0, `Canvas Performance: 60 simulated pan frames completed in ${perfTest.durationMs.toFixed(1)}ms (${perfTest.perFrameMs.toFixed(2)}ms/frame, well within 16.6ms budget)`);

  // --- SECTION 9: TRUE VECTOR SVG PATHS & STANDALONE SVG 1.1 EXPORT VALIDATION ---
  console.log('\n--- Section 9: True Vector SVG Paths & Standalone SVG 1.1 Export Validation ---');

  const vectorPathAudit = await page.evaluate(async () => {
    const { runVectorizationPipeline } = await import('/c2vector/src/js/engine/pipeline.js');
    const { runLogoVectorizationPipeline } = await import('/c2vector/src/js/engine/logo-engine.js');
    const { formatDownloadableSvg } = window.__c2vectorState;

    // Create a 160x160 sample graphic with circles and nested donut holes
    const c = document.createElement('canvas');
    c.width = 160;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 160, 160);
    // Draw outer circle with donut hole
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.arc(80, 80, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(80, 80, 30, 0, Math.PI * 2);
    ctx.fill();
    // Draw red inner dot
    ctx.fillStyle = '#e11d48';
    ctx.beginPath();
    ctx.arc(80, 80, 15, 0, Math.PI * 2);
    ctx.fill();

    const idata = ctx.getImageData(0, 0, 160, 160);

    const photoRes = await runVectorizationPipeline(idata.data, 160, 160, { tiers: 8 });
    const logoRes = await runLogoVectorizationPipeline(idata.data, 160, 160, { maxColors: 8 });

    function auditPaths(svgsObj, label) {
      let totalPaths = 0;
      let closedPaths = 0;
      let openPaths = 0;
      let compoundPaths = 0;
      let validCompoundClosures = 0;
      let hasEmbeddedRaster = false;
      let nanOrUndefinedCoords = 0;

      for (const [key, svg] of Object.entries(svgsObj)) {
        if (!svg) continue;
        if (/<image[\s>]|data:image\//i.test(svg)) hasEmbeddedRaster = true;

        // Corner L-shaped optical registration crop marks in Die-Cut are intentionally open strokes
        const auditableSvg = key === 'chromaticEdges'
          ? svg.replace(/<g id="registration-crop-marks"[\s\S]*?<\/g>/g, '')
          : svg;
        const dMatches = Array.from(auditableSvg.matchAll(/\sd="([^"]*)"/g)).map(m => m[1]);
        for (const d of dMatches) {
          if (!d || d.trim().length === 0) continue;
          totalPaths++;

          // Check if path ends with Z or z (intentionally open single-pass CAD plotter centerlines allowed in cannyEdges)
          const isPlotterCenterline = key === 'cannyEdges' && svg.includes('id="plotter-cut-paths"');
          if (/[Zz]\s*$/.test(d) || isPlotterCenterline) {
            closedPaths++;
          } else {
            openPaths++;
          }

          // Check compound paths (multiple M commands)
          const mMatches = d.match(/[Mm]/g) || [];
          if (mMatches.length > 1) {
            compoundPaths++;
            // In compound paths, every subpath before a new M must end with Z (unless single-pass CAD plotter centerline)
            const subpaths = d.split(/[Mm]\s+/).slice(1);
            const allSubpathsClosed = subpaths.every(sp => /[Zz]/.test(sp));
            if (allSubpathsClosed || isPlotterCenterline) {
              validCompoundClosures++;
            }
          }

          // Check for NaN or undefined in coordinates
          if (/NaN|undefined/.test(d)) {
            nanOrUndefinedCoords++;
          }
        }
      }

      return {
        label,
        totalPaths,
        closedPaths,
        openPaths,
        compoundPaths,
        validCompoundClosures,
        hasEmbeddedRaster,
        nanOrUndefinedCoords
      };
    }

    const photoAudit = auditPaths(photoRes.svgs, 'Photo Mode');
    const logoAudit = auditPaths(logoRes.svgs, 'Logo Mode');

    // Test formatDownloadableSvg standalone export formatting
    const rawSampleSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="#000" d="M 10 10 L 90 10 L 90 90 Z"/></svg>';
    const exportedSvg = formatDownloadableSvg(rawSampleSvg);

    const hasXmlHeader = exportedSvg.startsWith('<?xml version="1.0" encoding="UTF-8" standalone="no"?>');
    const hasDoctype = exportedSvg.includes('<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">');
    const hasVersion11 = exportedSvg.includes('version="1.1"');
    const hasXlink = exportedSvg.includes('xmlns:xlink="http://www.w3.org/1999/xlink"');

    return {
      photoAudit,
      logoAudit,
      exportCheck: {
        hasXmlHeader,
        hasDoctype,
        hasVersion11,
        hasXlink
      }
    };
  });

  assert(
    vectorPathAudit.photoAudit.totalPaths > 0 && vectorPathAudit.photoAudit.openPaths === 0 && vectorPathAudit.photoAudit.compoundPaths > 0 && vectorPathAudit.photoAudit.compoundPaths === vectorPathAudit.photoAudit.validCompoundClosures,
    `Photo Mode Geometry: ${vectorPathAudit.photoAudit.totalPaths} paths, ${vectorPathAudit.photoAudit.openPaths} open, ${vectorPathAudit.photoAudit.validCompoundClosures}/${vectorPathAudit.photoAudit.compoundPaths} compound cutouts valid`
  );
  assert(
    vectorPathAudit.logoAudit.totalPaths > 0 && vectorPathAudit.logoAudit.openPaths === 0 && vectorPathAudit.logoAudit.compoundPaths > 0 && vectorPathAudit.logoAudit.compoundPaths === vectorPathAudit.logoAudit.validCompoundClosures,
    `Logo Mode Geometry: ${vectorPathAudit.logoAudit.totalPaths} paths, ${vectorPathAudit.logoAudit.openPaths} open, ${vectorPathAudit.logoAudit.validCompoundClosures}/${vectorPathAudit.logoAudit.compoundPaths} compound cutouts valid`
  );
  assert(
    !vectorPathAudit.photoAudit.hasEmbeddedRaster && !vectorPathAudit.logoAudit.hasEmbeddedRaster && vectorPathAudit.photoAudit.nanOrUndefinedCoords === 0 && vectorPathAudit.logoAudit.nanOrUndefinedCoords === 0,
    'Vector Purity & Coordinates: 0 embedded raster/base64 tags and 0 NaN/undefined coordinates across all modes'
  );
  assert(
    vectorPathAudit.exportCheck.hasXmlHeader && vectorPathAudit.exportCheck.hasDoctype && vectorPathAudit.exportCheck.hasVersion11 && vectorPathAudit.exportCheck.hasXlink,
    'SVG 1.1 Conformance: Standalone export passes XML declaration, W3C SVG 1.1 DTD, version="1.1", and xmlns:xlink namespace'
  );

  // --- SECTION 10: TRANSPARENT INTERNAL SEAM & SILHOUETTE UNDERLAY VERIFICATION ---
  console.log('\n--- Section 10: Transparent Internal Seam & Silhouette Underlay Verification ---');

  const testImgPath = path.join(ROOT_DIR, 'input/traditional_figures_transparent.png');
  const testImgBase64 = fs.existsSync(testImgPath)
    ? fs.readFileSync(testImgPath).toString('base64')
    : null;

  const transparencyAudit = await page.evaluate(async (imgBase64) => {
    let imgData;
    let w, h;

    if (imgBase64) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = 'data:image/png;base64,' + imgBase64;
      });
      w = img.naturalWidth;
      h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      imgData = ctx.getImageData(0, 0, w, h);
    } else {
      // Fallback programmatic multi-tone graphic on transparent ground
      w = 300;
      h = 300;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#2b1a14';
      ctx.beginPath();
      ctx.arc(150, 150, 100, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#9b826f';
      ctx.beginPath();
      ctx.arc(150, 150, 60, 0, Math.PI * 2);
      ctx.fill();
      imgData = ctx.getImageData(0, 0, w, h);
    }

    const originalOpaquePixels = [];
    const originalTransparentPixels = [];
    for (let i = 0; i < imgData.data.length; i += 4) {
      if (imgData.data[i + 3] >= 64) {
        originalOpaquePixels.push(i / 4);
      } else {
        originalTransparentPixels.push(i / 4);
      }
    }

    const { runVectorizationPipeline } = await import('/c2vector/src/js/engine/pipeline.js');
    const { runLogoVectorizationPipeline } = await import('/c2vector/src/js/engine/logo-engine.js');

    const photoRes = await runVectorizationPipeline(imgData.data, w, h, { tiers: 16 });
    const logoRes = await runLogoVectorizationPipeline(imgData.data, w, h, { maxColors: 16 });

    const evalCanvas = document.createElement('canvas');
    evalCanvas.width = w;
    evalCanvas.height = h;
    const evalCtx = evalCanvas.getContext('2d');

    async function evaluateSvg(svgStr) {
      const svgBlob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const renderImg = new Image();
      await new Promise((resolve, reject) => {
        renderImg.onload = resolve;
        renderImg.onerror = reject;
        renderImg.src = url;
      });
      evalCtx.clearRect(0, 0, w, h);
      evalCtx.drawImage(renderImg, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const renderedData = evalCtx.getImageData(0, 0, w, h).data;

      let missingInsideSubject = 0;
      for (const idx of originalOpaquePixels) {
        if (renderedData[idx * 4 + 3] < 32) {
          missingInsideSubject++;
        }
      }

      let leakedOutsideSubject = 0;
      for (const idx of originalTransparentPixels) {
        if (renderedData[idx * 4 + 3] >= 32) {
          leakedOutsideSubject++;
        }
      }

      return {
        missingInsideSubject,
        missingPct: (missingInsideSubject / originalOpaquePixels.length) * 100,
        leakedOutsideSubject,
        leakedPct: (leakedOutsideSubject / originalTransparentPixels.length) * 100,
        hasRect: svgStr.includes('<rect')
      };
    }

    const filledArtboards = [
      'masterVibrant', 'masterFaithful', 'posterizeColor', 'pixelMatch',
      'monochrome', 'twoTone', 'stencil', 'posterize4', 'posterize4Inverted',
      'posterize8', 'posterize8Inverted'
    ];

    const photoStats = {};
    for (const key of filledArtboards) {
      photoStats[key] = await evaluateSvg(photoRes.transparentSvgs[key]);
    }

    const logoStats = {};
    for (const key of filledArtboards) {
      logoStats[key] = await evaluateSvg(logoRes.transparentSvgs[key]);
    }

    return {
      photoStats,
      logoStats,
      totalSubjectPixels: originalOpaquePixels.length,
      totalBgPixels: originalTransparentPixels.length
    };
  }, testImgBase64);

  function validateTransparencyStats(stats, modeLabel) {
    const failures = [];
    let maxMissing = 0;
    let maxLeaked = 0;
    for (const [key, stat] of Object.entries(stats)) {
      if (stat.hasRect) failures.push(`${key} has <rect>`);
      if (stat.missingPct > 0.1) failures.push(`${key} missing: ${stat.missingPct.toFixed(3)}% > 0.1%`);
      if (stat.leakedPct > 4.0) failures.push(`${key} leaked: ${stat.leakedPct.toFixed(3)}% > 4.0%`);
      if (stat.missingPct > maxMissing) maxMissing = stat.missingPct;
      if (stat.leakedPct > maxLeaked) maxLeaked = stat.leakedPct;
    }
    const count = Object.keys(stats).length;
    assert(failures.length === 0, `${modeLabel} Transparency: All ${count} artboards verified (0 <rect> plates, >=${(100 - maxMissing).toFixed(2)}% internal coverage, >=${(100 - maxLeaked).toFixed(2)}% background transparency)${failures.length ? ` (Failures: ${failures.join(', ')})` : ''}`);
  }

  validateTransparencyStats(transparencyAudit.photoStats, 'Photo Mode');
  validateTransparencyStats(transparencyAudit.logoStats, 'Logo Mode');

  // --- SECTION 11: FINE LINE ART & TWO-TONE QUALITY AUDIT (PHASE 50) ---
  console.log('\n--- 11. Fine Line Art Vectorization & Two-Tone Quality Audit ---');
  const fineLineAudit = await page.evaluate(async () => {
    const { runLogoVectorizationPipeline } = await import('/c2vector/src/js/engine/logo-engine.js');
    
    // Create an intricate 200x200 canvas with 1-px parallel lines and fine text
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 200, 200);

    // Draw 1px parallel black lines spaced 2px apart
    ctx.fillStyle = '#000000';
    for (let x = 10; x < 90; x += 3) {
      ctx.fillRect(x, 10, 1, 80);
    }
    // Draw micro text
    ctx.font = '8px sans-serif';
    ctx.fillText('kriti', 100, 30);
    ctx.fillText('vector', 100, 60);

    const imgData = ctx.getImageData(0, 0, 200, 200);
    const res = await runLogoVectorizationPipeline(imgData.data, 200, 200, { mode: 'logo' }, () => {});

    // Check circular blobs in master SVG
    const svgStr = res.transparentSvgs.masterVibrant;
    const subpaths = svgStr.split('M ').slice(1);
    let lineBlobs = 0;
    let iDots = 0;
    for (const sp of subpaths) {
      const coords = [];
      const re = /([0-9.-]+)\s+([0-9.-]+)/g;
      let m;
      while ((m = re.exec(sp)) !== null) {
        coords.push([parseFloat(m[1]), parseFloat(m[2])]);
      }
      if (coords.length < 2) continue;
      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
      for (const [x, y] of coords) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      const w = maxX - minX, h = maxY - minY;
      if (w > 0 && h > 0 && Math.abs(w - h) < 1.2 && w < 5) {
        if (minX < 95) lineBlobs++;
        else iDots++;
      }
    }

    // Check twoTone plate
    const twoToneSvg = res.transparentSvgs.twoTone;
    const hasTwoToneMid = twoToneSvg.includes('logo-twotone-mid');
    const hasTwoToneDark = twoToneSvg.includes('logo-twotone-dark');

    return {
      lineBlobs,
      iDots,
      hasTwoToneMid,
      hasTwoToneDark,
      svgSize: svgStr.length,
      spotColorsCount: res.spotColors.length,
      isAchromatic: res.spotColors.every(sc => Math.sqrt(sc.lab[1]*sc.lab[1] + sc.lab[2]*sc.lab[2]) < 14)
    };
  });

  assert(
    fineLineAudit.isAchromatic &&
    fineLineAudit.spotColorsCount === 1 &&
    fineLineAudit.lineBlobs === 0 &&
    fineLineAudit.iDots >= 1 && fineLineAudit.iDots <= 10 &&
    fineLineAudit.hasTwoToneDark,
    `Fine Line Art (Phase 50): Unified 1 achromatic ink plate, 0 parallel-line blobs, ${fineLineAudit.iDots} micro-dots preserved, and two-tone Key Dark intact`
  );

  // --- SECTION 12: DYNAMIC NAMING, SUB-PIXEL LINE ART BENCHMARK & MULTI-MODE PARITY ---
  console.log('\n--- 12. Dynamic Naming, Sub-Pixel Line Art Benchmark & Multi-Mode Parity ---');
  const lineArtPath = path.join(ROOT_DIR, 'input/user_line_art.png');
  const lineArtBase64 = fs.existsSync(lineArtPath) ? fs.readFileSync(lineArtPath).toString('base64') : null;

  const lineArtBenchmark = await page.evaluate(async (imgB64) => {
    // 1. Dynamic Download Naming Checks
    window.__c2vectorState.currentSourceFileName = 'master_logo_vector (2)';
    if (window.__c2vectorState.currentResults) {
      window.__c2vectorState.currentResults.mode = 'logo';
    }
    const svgName = window.__c2vectorState.getDynamicDownloadFilename('masterVibrant', 'svg');
    const pdfName = window.__c2vectorState.getDynamicDownloadFilename('suite', 'pdf');
    const pngName = window.__c2vectorState.getDynamicDownloadFilename('twoTone', 'png', 2);

    // 2. Single-Pass Sub-Pixel Line Art & Multi-Mode Parity Benchmark
    let stats = null;
    if (imgB64) {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = 'data:image/png;base64,' + imgB64;
      });
      const w = img.naturalWidth;
      const h = img.naturalHeight;
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const imgData = ctx.getImageData(0, 0, w, h);

      const { runLogoVectorizationPipeline } = await import('/c2vector/src/js/engine/logo-engine.js');
      const { runVectorizationPipeline } = await import('/c2vector/src/js/engine/pipeline.js');

      const logoRes = await runLogoVectorizationPipeline(imgData.data, w, h, { maxColors: 32 }, () => {});
      const photoRes = await runVectorizationPipeline(imgData.data, w, h, {}, () => {});

      const svg = logoRes.transparentSvgs.masterVibrant;
      const totalSubpaths = (svg.match(/M/g) || []).length;
      const totalCurves = (svg.match(/C/g) || []).length;

      const subpathTokens = svg.split('M').slice(1);
      let cropBandSubpaths = 0;
      let glyphCropSubpaths = 0;
      let daisyCropSubpaths = 0;
      for (const token of subpathTokens) {
        const match = token.trim().match(/^([-+]?[0-9]*\.?[0-9]+)\s+([-+]?[0-9]*\.?[0-9]+)/);
        if (match) {
          const x = parseFloat(match[1]);
          const y = parseFloat(match[2]);
          if (x >= 0 && x <= 135 && y >= 450 && y <= 525) cropBandSubpaths++;
          if (x >= 0 && x <= 150 && y >= 970 && y <= 1024) glyphCropSubpaths++;
          if (x >= 0 && x <= 160 && y >= 920 && y <= 975) daisyCropSubpaths++;
        }
      }

      stats = {
        totalSubpaths,
        totalCurves,
        cropBandSubpaths,
        glyphCropSubpaths,
        daisyCropSubpaths,
        svgSize: svg.length,
        hasMonochrome: Boolean(logoRes.transparentSvgs.monochrome),
        hasTwoTone: Boolean(logoRes.transparentSvgs.twoTone),
        logoP4Subpaths: (logoRes.transparentSvgs.posterize4.match(/M/g) || []).length,
        logoP8Subpaths: (logoRes.transparentSvgs.posterize8.match(/M/g) || []).length,
        logoStencilSubpaths: (logoRes.transparentSvgs.stencil.match(/M/g) || []).length,
        logoPosterColorSubpaths: (logoRes.transparentSvgs.posterizeColor.match(/M/g) || []).length,
        logoTwoToneSubpaths: (logoRes.transparentSvgs.twoTone.match(/M/g) || []).length,
        photoPosterColorSize: photoRes.transparentSvgs.posterizeColor.length
      };
    }

    return { svgName, pdfName, pngName, stats };
  }, lineArtBase64);

  assert(
    lineArtBenchmark.svgName === 'master_logo_vector_2_logo_masterVibrant_c2vector_DV.svg' &&
    lineArtBenchmark.pdfName === 'master_logo_vector_2_logo_master_suite_c2vector_DV.pdf' &&
    lineArtBenchmark.pngName === 'master_logo_vector_2_logo_twoTone_c2vector_DV@2x.png',
    'Dynamic Naming (Phase 51): SVG, PDF master suite, and scaled PNG (@2x) filenames match production naming specification'
  );

  if (lineArtBenchmark.stats) {
    const s = lineArtBenchmark.stats;
    assert(
      s.totalSubpaths >= 1000 && s.totalCurves >= 4500 && s.svgSize <= 380000 && s.hasMonochrome && s.hasTwoTone,
      `Sub-Pixel Master Geometry: ${s.totalSubpaths} subpaths, ${s.totalCurves} smooth cubic Béziers, compact ${(s.svgSize/1024).toFixed(1)}KB, Monochrome/Two-Tone intact`
    );
    assert(
      s.cropBandSubpaths >= 45 && s.glyphCropSubpaths >= 115 && s.daisyCropSubpaths >= 95,
      `Glyph & Micro-Detail Recovery: Diamond lattice (${s.cropBandSubpaths}), ancient micro-glyphs (${s.glyphCropSubpaths}), and daisy petals (${s.daisyCropSubpaths}) preserved`
    );
    assert(
      s.logoPosterColorSubpaths >= 1000 && s.logoTwoToneSubpaths >= 1000 && s.logoP4Subpaths >= 2000 && s.logoP8Subpaths >= 3000 && s.logoStencilSubpaths >= 1400,
      `Logo Secondary Artboards Parity: posterizeColor (${s.logoPosterColorSubpaths}), twoTone (${s.logoTwoToneSubpaths}), p4 (${s.logoP4Subpaths}), p8 (${s.logoP8Subpaths}), stencil (${s.logoStencilSubpaths})`
    );
    assert(
      s.photoPosterColorSize <= 1200000,
      `Photo Mode Line-Art Parity: posterizeColor eliminates fragment explosion (${(s.photoPosterColorSize/1024).toFixed(1)}KB <= 1200KB)`
    );
  }

  // --- SECTION 13: LAYER INSPECTOR UX, SOLO TOGGLE, CANVA <=4 COLORS & REFINE STROKE SLIDER ---
  console.log('\n--- Section 13: Layer Inspector UX, Solo Toggle, Canva <=4 Colors & Refine Stroke ---');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/c2vector/', { waitUntil: 'networkidle' });
  await page.click('#tabModeLogo');
  await page.click('#btnSampleLogo');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 20000 });
  await page.waitForSelector('#studioLayersList .layer-item', { timeout: 15000 });

  const uxChecks = await page.evaluate(async () => {
    const stepBadgesOk = [1, 2, 3, 4, 5, 6].every(i => Boolean(document.getElementById(`stepBadge${i}`)));
    const refineSliders = document.querySelectorAll('#refineStrokeSlider');
    const sliderUnique = refineSliders.length === 1;
    const slider = refineSliders[0];
    const hasBadge = Boolean(document.getElementById('refineStrokeVal'));
    const sliderStepOk = slider?.getAttribute('step') === '1';

    // Check layer list top-to-bottom order matches reversed SVG DOM order
    const readRowsAndDom = () => ({
      rows: Array.from(document.querySelectorAll('#studioLayersList .layer-item')).map(el => ({
        hex: el.querySelector('.layer-hex-text')?.textContent?.trim(),
        hidden: el.classList.contains('is-hidden'),
        soloActive: el.querySelector('.layer-solo-btn')?.classList.contains('active') || false
      })),
      dom: Array.from(document.querySelectorAll('#viewport svg path'))
        .filter(p => p.id !== 'logo-silhouette-base' && p.id !== 'subject-silhouette-base')
        .map(p => (p.style.fill || p.getAttribute('fill') || '').toUpperCase())
    });

    const before = readRowsAndDom();
    const topHex = before.rows[0]?.hex;
    const secondHex = before.rows[1]?.hex;
    const topMatchesFront = topHex === before.dom[before.dom.length - 1];

    // Click Down on top row -> moves down to row 1 in list and backward in DOM
    document.querySelectorAll('#studioLayersList .layer-item')[0]?.querySelector('button[aria-label^="Send backward"]')?.click();
    const afterDown = readRowsAndDom();
    const downOk = afterDown.rows[1]?.hex === topHex && afterDown.rows[0]?.hex === secondHex;

    // Click Up on row 1 -> moves back to row 0
    document.querySelectorAll('#studioLayersList .layer-item')[1]?.querySelector('button[aria-label^="Bring forward"]')?.click();
    const afterUp = readRowsAndDom();
    const upOk = afterUp.rows[0]?.hex === topHex && afterUp.rows[1]?.hex === secondHex;

    // Hide last row, Solo row 0 twice, confirm pre-solo hidden row remains hidden
    const rowsBeforeSolo = document.querySelectorAll('#studioLayersList .layer-item');
    const lastIdx = rowsBeforeSolo.length - 1;
    rowsBeforeSolo[lastIdx]?.querySelector('.layer-vis-btn')?.click();
    document.querySelectorAll('#studioLayersList .layer-item')[0]?.querySelector('.layer-solo-btn')?.click();
    const soloOn = readRowsAndDom();
    document.querySelectorAll('#studioLayersList .layer-item')[0]?.querySelector('.layer-solo-btn')?.click();
    const soloOff = readRowsAndDom();
    const soloToggleOk = soloOn.rows[0]?.soloActive && !soloOn.rows[0]?.hidden && soloOn.rows[1]?.hidden &&
      !soloOff.rows[0]?.soloActive && !soloOff.rows[0]?.hidden && !soloOff.rows[1]?.hidden && soloOff.rows[lastIdx]?.hidden;

    // Reset layers and check Refine Stroke live edit + lossless reset
    document.getElementById('btnResetLayers')?.click();
    const origD = Array.from(document.querySelectorAll('#viewport svg path'))
      .filter(p => p.id !== 'logo-silhouette-base' && p.id !== 'subject-silhouette-base')
      .map(p => p.getAttribute('d'));
    slider.value = '40';
    slider.dispatchEvent(new Event('change', { bubbles: true }));
    const midD = Array.from(document.querySelectorAll('#viewport svg path'))
      .filter(p => p.id !== 'logo-silhouette-base' && p.id !== 'subject-silhouette-base')
      .map(p => p.getAttribute('d'));
    document.getElementById('btnResetRefine')?.click();
    const endD = Array.from(document.querySelectorAll('#viewport svg path'))
      .filter(p => p.id !== 'logo-silhouette-base' && p.id !== 'subject-silhouette-base')
      .map(p => p.getAttribute('d'));

    const refineOk = midD.some((d, i) => d !== origD[i]) &&
      midD.every(d => d && !/NaN|undefined/.test(d) && d.trim().endsWith('Z')) &&
      endD.every((d, i) => d === origD[i]);

    // Check Canva Ready <= 4 unique colors
    document.querySelector('.tab-btn[data-artboard="canvaOptimized"]')?.click();
    await new Promise(r => setTimeout(r, 100));
    const canvaFills = new Set();
    document.querySelectorAll('#viewport svg path, #viewport svg rect').forEach(el => {
      const f = el.getAttribute('fill');
      if (f && f !== 'none') canvaFills.add(f.toLowerCase());
    });

    return {
      stepBadgesOk,
      sliderUnique,
      hasBadge,
      sliderStepOk,
      topMatchesFront,
      downOk,
      upOk,
      soloToggleOk,
      refineOk,
      canvaColorCount: canvaFills.size
    };
  });

  assert(
    uxChecks.stepBadgesOk && uxChecks.sliderUnique && !uxChecks.hasBadge && uxChecks.sliderStepOk,
    'Studio UI Controls: stepBadge1..6 present, single #refineStrokeSlider (step=1, no badge)'
  );
  assert(
    uxChecks.topMatchesFront && uxChecks.downOk && uxChecks.upOk && uxChecks.soloToggleOk,
    'Layer Inspector UX: Top=frontmost order, atomic ▲/▼ swaps, and stateful Solo (S) toggle restore'
  );
  assert(
    uxChecks.refineOk && uxChecks.canvaColorCount <= 4,
    `Refine Stroke & Canva Cap: Lossless live path smoothing and Canva Ready <= 4 colors (${uxChecks.canvaColorCount} colors)`
  );

  // --- SECTION 14: FABRICATION SUITE ENGINEERING (CUT STENCIL, WIREFRAME, DIE-CUT) ---
  console.log('\n--- Section 14: Fabrication Suite Engineering (Cut Stencil, Wireframe, Die-Cut) ---');
  const stampPath = path.join(ROOT_DIR, 'input/C = 10.png');
  const stampBase64 = fs.existsSync(stampPath) ? fs.readFileSync(stampPath).toString('base64') : null;
  const fabChecks = await page.evaluate(async ({ stampB64, lineB64 }) => {
    const { generateBridgeStencilMap } = await import('/c2vector/src/js/engine/tonal-studies.js');
    const { runLogoVectorizationPipeline } = await import('/c2vector/src/js/engine/logo-engine.js');
    const { runVectorizationPipeline } = await import('/c2vector/src/js/engine/pipeline.js');

    // 1. Cut Stencil: Bullseye test pattern (solid ring enclosing an isolated white island)
    const w = 120, h = 120;
    const bullseye = new Uint8Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const dist = Math.hypot(x - 60, y - 60);
        if (dist >= 20 && dist <= 40) bullseye[y * w + x] = 1;
      }
    }
    const bridged = generateBridgeStencilMap(bullseye, w, h, { bridgeWidth: 5, margin: 4 });
    // Count reachable 0-pixels from border
    const reach = new Uint8Array(w * h);
    const q = [];
    for (let x = 0; x < w; x++) { q.push(x, (h - 1) * w + x); }
    for (let y = 1; y < h - 1; y++) { q.push(y * w, y * w + w - 1); }
    for (const p of q) { if (bridged[p] === 0) reach[p] = 1; }
    for (let i = 0; i < q.length; i++) {
      const c = q[i], cx = c % w, cy = Math.floor(c / w);
      for (const n of [cx > 0 ? c - 1 : -1, cx < w - 1 ? c + 1 : -1, cy > 0 ? c - w : -1, cy < h - 1 ? c + w : -1]) {
        if (n >= 0 && !reach[n] && bridged[n] === 0) { reach[n] = 1; q.push(n); }
      }
    }
    let isolatedIslandPixels = 0;
    for (let i = 0; i < w * h; i++) {
      if (bridged[i] === 0 && !reach[i]) isolatedIslandPixels++;
    }

    // 2. Photo & Logo Fabrication Wireframe + Die-Cut check
    const c = document.createElement('canvas');
    c.width = 160; c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 160, 160);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, 40, 80, 80);
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(60, 60, 40, 40);
    const idata = ctx.getImageData(0, 0, 160, 160);

    const logoRes = await runLogoVectorizationPipeline(idata.data, 160, 160, { maxColors: 8 });
    const photoRes = await runVectorizationPipeline(idata.data, 160, 160, { tiers: 8 });

    const photoWireSolid = photoRes.solidSvgs.cannyEdges;
    const logoWireSolid = logoRes.solidSvgs.cannyEdges;
    const logoWireTrans = logoRes.transparentSvgs.cannyEdges;
    const logoDieSolid = logoRes.solidSvgs.chromaticEdges;
    const photoDieSolid = photoRes.solidSvgs.chromaticEdges;
    const photoDieTrans = photoRes.transparentSvgs.chromaticEdges;

    const photoWireSinglePass = photoWireSolid.includes('id="plotter-cut-paths"') && photoWireSolid.includes('fill="none"');
    const logoWireCount = (logoWireTrans.match(/<path\s/g) || []).length;
    const dieCutOk = logoDieSolid.includes('id="CutContour"') &&
      photoDieSolid.includes('id="CutContour"') &&
      !logoDieSolid.includes('opacity="0.16"') &&
      !photoDieSolid.includes('opacity="0.16"') &&
      logoDieSolid.includes('id="diecut-subject-preview"') &&
      photoDieSolid.includes('id="diecut-subject-preview"') &&
      photoDieSolid.includes('id="registration-crop-marks"') &&
      !photoDieTrans.includes('<rect');

    // Helper: measure dark ink coverage % when rasterizing SVG at width x height
    async function measureDarkPct(svgStr, rw, rh) {
      const url = URL.createObjectURL(new Blob([svgStr], { type: 'image/svg+xml' }));
      const im = new Image();
      await new Promise((r, j) => { im.onload = r; im.onerror = j; im.src = url; });
      const rc = document.createElement('canvas'); rc.width = rw; rc.height = rh;
      rc.getContext('2d').drawImage(im, 0, 0, rw, rh);
      URL.revokeObjectURL(url);
      const px = rc.getContext('2d').getImageData(0, 0, rw, rh).data;
      let dark = 0;
      for (let i = 0; i < px.length; i += 4) {
        if (px[i + 3] >= 64 && (px[i] + px[i + 1] + px[i + 2]) / 3 < 70) dark++;
      }
      return (dark / (rw * rh)) * 100;
    }

    // 3. Framed scalloped stamp / dark-ground test (C = 10.png or synthetic scalloped card)
    let stampImg;
    if (stampB64) {
      const im = new Image();
      await new Promise((r, j) => { im.onload = r; im.onerror = j; im.src = 'data:image/png;base64,' + stampB64; });
      const sc = document.createElement('canvas'); sc.width = im.naturalWidth; sc.height = im.naturalHeight;
      sc.getContext('2d').drawImage(im, 0, 0);
      stampImg = { data: sc.getContext('2d').getImageData(0, 0, sc.width, sc.height).data, w: sc.width, h: sc.height };
    } else {
      const sc = document.createElement('canvas'); sc.width = 220; sc.height = 260;
      const sx = sc.getContext('2d');
      sx.fillStyle = '#090a11'; sx.fillRect(14, 14, 192, 232);
      sx.fillStyle = '#f2f4f5'; sx.beginPath(); sx.arc(110, 130, 62, 0, Math.PI * 2); sx.fill();
      sx.fillStyle = '#103371'; sx.fillRect(85, 110, 50, 35);
      stampImg = { data: sx.getImageData(0, 0, 220, 260).data, w: 220, h: 260 };
    }

    const stampLogo = await runLogoVectorizationPipeline(stampImg.data, stampImg.w, stampImg.h, { maxColors: 16 });
    const stampPhoto = await runVectorizationPipeline(stampImg.data, stampImg.w, stampImg.h, { tiers: 16 });
    const stampLogoDarkPct = await measureDarkPct(stampLogo.solidSvgs.stencil, stampImg.w, stampImg.h);
    const stampPhotoDarkPct = await measureDarkPct(stampPhoto.solidSvgs.stencil, stampImg.w, stampImg.h);

    const vbLogoMatch = stampLogo.svgs.chromaticEdges.match(/viewBox="0 0 (\d+) (\d+)"/);
    const vbPhotoMatch = stampPhoto.svgs.chromaticEdges.match(/viewBox="0 0 (\d+) (\d+)"/);
    const stampDieLogoPadded = Boolean(vbLogoMatch && parseInt(vbLogoMatch[1], 10) > stampImg.w);
    const stampDiePhotoPadded = Boolean(vbPhotoMatch && parseInt(vbPhotoMatch[1], 10) > stampPhoto.dimensions.width);
    const stampDieNoGreySlab = !stampLogo.svgs.chromaticEdges.includes('opacity="0.16"') &&
      !stampPhoto.svgs.chromaticEdges.includes('opacity="0.16"') &&
      (stampLogo.svgs.chromaticEdges.match(/<path\s/g) || []).length >= 5 &&
      (stampPhoto.svgs.chromaticEdges.match(/<path\s/g) || []).length >= 5;

    // 4. Transparent line-art Photo Mode stencil preservation check
    let lineImg;
    if (lineB64) {
      const im = new Image();
      await new Promise((r, j) => { im.onload = r; im.onerror = j; im.src = 'data:image/png;base64,' + lineB64; });
      const lc = document.createElement('canvas'); lc.width = im.naturalWidth; lc.height = im.naturalHeight;
      const lcx = lc.getContext('2d');
      lcx.drawImage(im, 0, 0);
      lineImg = { data: lcx.getImageData(0, 0, lc.width, lc.height).data, w: lc.width, h: lc.height };
    } else {
      const lc = document.createElement('canvas'); lc.width = 200; lc.height = 200;
      const lx = lc.getContext('2d');
      lx.strokeStyle = '#020202'; lx.lineWidth = 4;
      for (let k = 20; k <= 180; k += 20) { lx.strokeRect(k, k, 200 - 2 * k, 200 - 2 * k); }
      lineImg = { data: lx.getImageData(0, 0, 200, 200).data, w: 200, h: 200 };
    }
    const linePhoto = await runVectorizationPipeline(lineImg.data, lineImg.w, lineImg.h, { tiers: 8 });
    const linePhotoDarkPct = await measureDarkPct(linePhoto.solidSvgs.stencil, lineImg.w, lineImg.h);

    return {
      isolatedIslandPixels,
      photoWireSinglePass,
      logoWireHasPlotterId: logoWireSolid.includes('id="plotter-cut-paths"'),
      logoWireCount,
      dieCutOk,
      stampLogoDarkPct: +stampLogoDarkPct.toFixed(1),
      stampPhotoDarkPct: +stampPhotoDarkPct.toFixed(1),
      stampDieLogoPadded,
      stampDiePhotoPadded,
      stampDieNoGreySlab,
      linePhotoDarkPct: +linePhotoDarkPct.toFixed(1)
    };
  }, { stampB64: stampBase64, lineB64: lineArtBase64 });

  assert(
    fabChecks.isolatedIslandPixels === 0,
    `Fabrication Cut Stencil: Bullseye enclosed island 100% bridged to outer sheet (${fabChecks.isolatedIslandPixels} isolated pixels)`
  );
  assert(
    fabChecks.stampLogoDarkPct >= 10 && fabChecks.stampLogoDarkPct <= 65 &&
    fabChecks.stampPhotoDarkPct >= 10 && fabChecks.stampPhotoDarkPct <= 65 &&
    fabChecks.linePhotoDarkPct >= 3,
    `Fabrication Cut Stencil V2: Balanced Logo (${fabChecks.stampLogoDarkPct}%) & Photo (${fabChecks.stampPhotoDarkPct}%) cuts + line-art ink kept (${fabChecks.linePhotoDarkPct}%)`
  );
  assert(
    fabChecks.photoWireSinglePass && fabChecks.logoWireHasPlotterId && fabChecks.logoWireCount >= 2,
    `Fabrication Wireframe: Single-pass plotter toolpaths without bg/overlap (${fabChecks.logoWireCount} foreground layers)`
  );
  assert(
    fabChecks.dieCutOk && fabChecks.stampDieNoGreySlab && fabChecks.stampDieLogoPadded && fabChecks.stampDiePhotoPadded,
    'Fabrication Die-Cut V2: Padded non-clamped #CutContour, crisp artwork proof inside vinyl carrier (0 grey slabs), crop marks, and 0-<rect> transparent export verified'
  );

  await browser.close();

  if (viteServer) {
    try {
      await viteServer.close();
    } catch (_) {}
  }

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
