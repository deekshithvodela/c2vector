import pkg from '/home/drover/Projects/sponsorship/node_modules/playwright/index.js';
const { chromium } = pkg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runVerification() {
  console.log('====================================================');
  console.log('   C2Vector Phase 26 Verification Suite Starting   ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, detail = '') {
    if (condition) {
      console.log(`\x1b[32m[PASS]\x1b[0m ${testName} ${detail ? '(' + detail + ')' : ''}`);
      passed++;
    } else {
      console.error(`\x1b[31m[FAIL]\x1b[0m ${testName} ${detail ? '(' + detail + ')' : ''}`);
      failed++;
    }
  }

  // --------------------------------------------------------------------------
  // Test 1: Content Purge Checks (Static File Scan)
  // --------------------------------------------------------------------------
  console.log('--- Test Suite 1: Content Purge Verifications ---');
  const c2vectorDir = path.resolve(__dirname, '../c2vector');
  const htmlFiles = ['index.html', 'about.html', 'workflow.html'];

  let totalPngToSvgOccurrences = 0;
  let totalHallucinationOccurrences = 0;

  for (const file of htmlFiles) {
    const content = fs.readFileSync(path.join(c2vectorDir, file), 'utf8');
    const matchesPng = content.match(/png to svg/gi);
    if (matchesPng) totalPngToSvgOccurrences += matchesPng.length;

    const matchesHallucination = content.match(/hallucination/gi);
    if (matchesHallucination) totalHallucinationOccurrences += matchesHallucination.length;
  }

  assert(totalPngToSvgOccurrences === 0, 'Zero occurrences of "PNG to SVG" across all HTML files', `count: ${totalPngToSvgOccurrences}`);
  assert(totalHallucinationOccurrences === 0, 'Zero occurrences of "hallucination" across all HTML files', `count: ${totalHallucinationOccurrences}`);

  // Check 0% Generative AI in index.html
  const indexContent = fs.readFileSync(path.join(c2vectorDir, 'index.html'), 'utf8');
  assert(indexContent.includes('0% Generative AI'), 'index.html hero pill contains "0% Generative AI"');
  assert(indexContent.includes('<h1 id="hero-title">Free Image to Vector &amp; SVG Converter</h1>'), 'index.html hero title is universal "Free Image to Vector & SVG Converter"');

  // --------------------------------------------------------------------------
  // Test 2: OpenGraph Images Size & Standards Check
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 2: OpenGraph Images Suite (< 100 KB Ceiling) ---');
  const ogFiles = [
    { name: 'og-image.jpg', maxKb: 95 },
    { name: 'og-discover.jpg', maxKb: 95 },
    { name: 'og-search.jpg', maxKb: 95 },
    { name: 'og-image-1x1.jpg', maxKb: 95 },
    { name: 'og-square.jpg', maxKb: 95 }
  ];

  for (const f of ogFiles) {
    const p = path.join(c2vectorDir, 'assets/og', f.name);
    const exists = fs.existsSync(p);
    assert(exists, `OG file exists: ${f.name}`);
    if (exists) {
      const kb = fs.statSync(p).size / 1024;
      assert(kb < f.maxKb, `OG file within < 100 KB tier: ${f.name}`, `${kb.toFixed(1)} KB`);
    }
  }

  // --------------------------------------------------------------------------
  // Test 3: Playwright Browser Tests (Layout Stability & Mobile Sizing)
  // --------------------------------------------------------------------------
  console.log('\n--- Test Suite 3: Playwright Browser Automation ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

    // Click Try with Sample Photo
    console.log('[INFO] Launching vectorization using #btnSample...');
    await page.click('#btnSample');

    // Wait for vectorization complete
    await page.waitForSelector('#workbench', { state: 'visible', timeout: 20000 });
    await page.waitForSelector('#viewport svg', { state: 'attached', timeout: 20000 });
    console.log('[INFO] Vectorization finished, workbench stage active.');

    // 1. Check Desktop Layout Shift on Edge Glaze Control
    console.log('\n--- Test 3.1: Zero-CLS Edge Glaze Disabled State ---');
    const edgeControl = page.locator('#edgeOpacityControl');
    const slider = page.locator('#edgeOpacitySlider');
    const btnToggle = page.locator('#btnToggleEdges');

    // On activeArtboard = masterVibrant (has contours):
    let isDisabled = await edgeControl.evaluate(el => el.classList.contains('disabled'));
    assert(!isDisabled, 'Edge glaze control is active on masterVibrant artboard');
    assert(await slider.isEnabled(), 'Slider is enabled on masterVibrant');

    const bbox1 = await edgeControl.boundingBox();

    // Switch to posterizeColor (no contours)
    await page.click('#tabNav button[data-artboard="posterizeColor"]');
    await page.waitForTimeout(200);

    isDisabled = await edgeControl.evaluate(el => el.classList.contains('disabled'));
    assert(isDisabled, 'Edge glaze control receives .disabled class on posterizeColor');
    assert(await slider.isDisabled(), 'Slider input is disabled on posterizeColor');
    assert(await btnToggle.isDisabled(), 'Toggle edges button is disabled on posterizeColor');

    const bbox2 = await edgeControl.boundingBox();
    assert(bbox2 !== null, 'Edge glaze control remains rendered in layout flow (not display: none)');
    if (bbox1 && bbox2) {
      const deltaY = Math.abs(bbox1.y - bbox2.y);
      const deltaH = Math.abs(bbox1.height - bbox2.height);
      assert(deltaY < 1.0, 'Zero vertical layout shift on toolbar when switching to non-contour artboard', `deltaY: ${deltaY.toFixed(2)}px`);
      assert(deltaH < 1.0, 'Zero height shift on edge glaze container', `deltaH: ${deltaH.toFixed(2)}px`);
    }

    // Switch to pixelMatch (no contours)
    await page.click('#tabNav button[data-artboard="pixelMatch"]');
    await page.waitForTimeout(200);
    const isPixelMatchDisabled = await edgeControl.evaluate(el => el.classList.contains('disabled'));
    assert(isPixelMatchDisabled, 'Edge glaze control remains disabled on pixelMatch');

    // Switch back to masterFaithful (has contours)
    await page.click('#tabNav button[data-artboard="masterFaithful"]');
    await page.waitForTimeout(200);
    const isFaithfulEnabled = await edgeControl.evaluate(el => !el.classList.contains('disabled'));
    assert(isFaithfulEnabled, 'Edge glaze control cleanly re-activates on masterFaithful');

    // 2. Mobile Viewport Touch & Sizing Validation (375x667)
    console.log('\n--- Test 3.2: Mobile Viewport (375x667) Zoom & Grid Sizing ---');
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(300);

    const zoomBtns = page.locator('.zoom-btn:not(#btnToggleGrid)');
    const count = await zoomBtns.count();
    for (let i = 0; i < count; i++) {
      const btn = zoomBtns.nth(i);
      const box = await btn.boundingBox();
      assert(box.height >= 34, `Mobile Zoom Button #${i+1} height >= 34px`, `${box.height}px`);
      assert(box.width >= 30, `Mobile Zoom Button #${i+1} width >= 30px`, `${box.width}px`);
    }

    const gridBtn = page.locator('#btnToggleGrid');
    const gridBox = await gridBtn.boundingBox();
    assert(gridBox.height >= 34, 'Mobile Grid Button height >= 34px', `${gridBox.height}px`);
    assert(gridBox.width >= 48, 'Mobile Grid Button width >= 48px', `${gridBox.width}px`);

    const gridIcon = page.locator('#btnToggleGrid svg');
    const iconBox = await gridIcon.boundingBox();
    assert(iconBox.width >= 12, 'Mobile Grid Icon width >= 12px', `${iconBox.width}px`);

    const hasTextOverflow = await gridBtn.evaluate(el => el.scrollWidth > el.offsetWidth);
    assert(!hasTextOverflow, 'Mobile Grid Button has zero text overflow');

    // Capture mobile screenshot
    const mobileArtifact = path.resolve(__dirname, '../../.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage/mobile_phase26_verified.png');
    fs.mkdirSync(path.dirname(mobileArtifact), { recursive: true });
    await page.screenshot({ path: mobileArtifact, fullPage: false });
    console.log(`[SCREENSHOT] Mobile screenshot captured: ${mobileArtifact}`);

    // Desktop Screenshot
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.waitForTimeout(300);
    const desktopArtifact = path.resolve(__dirname, '../../.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage/desktop_phase26_verified.png');
    await page.screenshot({ path: desktopArtifact, fullPage: false });
    console.log(`[SCREENSHOT] Desktop screenshot captured: ${desktopArtifact}`);

    // 3. Logo Engine Multi-Color Discovery Test in Browser (Native ES Module)
    console.log('\n--- Test 3.3: Logo Engine Dynamic Spot Colors (>6 Colors) ---');
    const detectedColorsCount = await page.evaluate(async () => {
      const { detectSpotColors } = await import('./js/engine/logo-engine.js');
      const w = 400, h = 400;
      const pixels = new Uint8ClampedArray(w * h * 4);
      
      const testColors = [
        [230, 25, 75],
        [245, 130, 48],
        [255, 225, 25],
        [60, 180, 75],
        [70, 240, 240],
        [0, 130, 200],
        [145, 30, 180],
        [240, 50, 230]
      ];

      for (let y = 0; y < h; y++) {
        const band = Math.min(7, Math.floor(y / (h / 8)));
        const [r, g, b] = testColors[band];
        for (let x = 0; x < w; x++) {
          const idx = (y * w + x) * 4;
          pixels[idx] = r;
          pixels[idx + 1] = g;
          pixels[idx + 2] = b;
          pixels[idx + 3] = 255;
        }
      }

      const detected = detectSpotColors(pixels, w, h, 32);
      return detected.length;
    });

    assert(detectedColorsCount >= 8, 'Logo engine detects all 8 distinct spot colors without 6-color truncation', `detected: ${detectedColorsCount} colors`);

  } catch (err) {
    console.error('Playwright verification error:', err);
    failed++;
  } finally {
    await browser.close();
  }

  // --------------------------------------------------------------------------
  // Final Summary
  // --------------------------------------------------------------------------
  console.log('\n====================================================');
  console.log(`Phase 26 Verification Complete: ${passed} PASSED, ${failed} FAILED`);
  console.log('====================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification();
