const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');
const fs = require('fs');
const path = require('path');

const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';
if (!fs.existsSync(ARTIFACT_DIR)) fs.mkdirSync(ARTIFACT_DIR, { recursive: true });

(async () => {
  console.log('🧪 Starting Phase 25 Verification Test Suite...\n');
  const browser = await chromium.launch({ headless: true });
  let failures = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`✅ PASS: ${message}`);
    } else {
      console.error(`❌ FAIL: ${message}`);
      failures++;
    }
  }

  // =========================================================================
  // 1. Mobile & Desktop Navigation Bar Positioning
  // =========================================================================
  console.log('--- Test 1: Navigation Bar Position (Desktop vs Mobile) ---');
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

  const mobileNavPosition = await page.$eval('header.app-header', el => getComputedStyle(el).position);
  console.log(`Mobile (375px) navbar position: "${mobileNavPosition}"`);
  assert(mobileNavPosition === 'relative' || mobileNavPosition === 'static', 'Mobile navbar is relative/static (scrolls up naturally with page)');

  await page.setViewportSize({ width: 1280, height: 800 });
  const desktopNavPosition = await page.$eval('header.app-header', el => getComputedStyle(el).position);
  console.log(`Desktop (1280px) navbar position: "${desktopNavPosition}"`);
  assert(desktopNavPosition === 'sticky', 'Desktop navbar remains sticky at top');

  // =========================================================================
  // 2. Brand Unification & CTA Polish
  // =========================================================================
  console.log('\n--- Test 2: C2Vector Brand Unification & CTA Polish ---');
  const indexBrand = await page.$eval('.brand-title', el => el.textContent.trim());
  assert(indexBrand === 'C2Vector', `Studio navbar brand is "C2Vector" (got: "${indexBrand}")`);

  await page.goto('http://localhost:8080/workflow.html', { waitUntil: 'networkidle' });
  const workflowBrand = await page.$eval('.brand-title', el => el.textContent.trim());
  assert(workflowBrand === 'C2Vector', `Workflow navbar brand is "C2Vector" (got: "${workflowBrand}")`);
  const workflowCtaText = await page.$eval('.workflow-cta-card a', el => el.textContent.trim());
  assert(workflowCtaText.includes('Open C2Vector'), `Workflow bottom CTA is "Open C2Vector" (got: "${workflowCtaText}")`);

  await page.goto('http://localhost:8080/about.html', { waitUntil: 'networkidle' });
  const aboutBrand = await page.$eval('.brand-title', el => el.textContent.trim());
  assert(aboutBrand === 'C2Vector', `About navbar brand is "C2Vector" (got: "${aboutBrand}")`);
  const aboutHeroCta = await page.$eval('.about-hero .btn-primary', el => el.textContent.trim());
  assert(aboutHeroCta.includes('Launch C2Vector'), `About hero CTA is "Launch C2Vector" (got: "${aboutHeroCta}")`);
  const aboutBottomCta = await page.$eval('.about-cta a', el => el.textContent.trim());
  assert(aboutBottomCta.includes('Open C2Vector'), `About bottom CTA is "Open C2Vector" (got: "${aboutBottomCta}")`);
  const tableTh = await page.$eval('.comparison-table th.highlight', el => el.textContent.trim());
  assert(tableTh === 'C2Vector Studio', `Comparison table column header is "C2Vector Studio" (got: "${tableTh}")`);

  // =========================================================================
  // 3. Gibberish Text & Symbol Elimination
  // =========================================================================
  console.log('\n--- Test 3: Gibberish & Raw Formula Elimination ---');
  const workflowBody = await page.evaluate(async () => {
    const res = await fetch('/workflow.html');
    return await res.text();
  });
  const hasRawLatex = /\$(?:t\^|\sigma_B|\(G_x|M = \\sqrt|M \\ge|T_{\\text|L\^\*a\^\*b\^\*|\\Delta E|r = \\frac|C\(t\)|G\^1|\\alpha_{\\text)/.test(workflowBody);
  assert(!hasRawLatex, 'Zero raw LaTeX syntax found in workflow.html (all converted to semantic HTML typography)');

  const indexHtml = fs.readFileSync('./c2vector/index.html', 'utf8');
  const aboutHtml = fs.readFileSync('./c2vector/about.html', 'utf8');
  const hasRawEmojis = /[\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{2600}-\u{26FF}]/u.test(indexHtml.match(/<main[\s\S]*?<\/main>/)[0]);
  assert(!hasRawEmojis, 'Zero raw emojis in index.html main content (replaced with SVG icons)');

  // =========================================================================
  // 4. Workbench Sidebar Panel Ordering
  // =========================================================================
  console.log('\n--- Test 4: Workbench Sidebar Panel Ordering ---');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });
  const panelOrder = await page.evaluate(() => {
    const aside = document.querySelector('aside.panel-card');
    const titles = Array.from(aside.querySelectorAll('.panel-section-title')).map(el => el.textContent.trim());
    return titles;
  });
  console.log('Sidebar section titles order:', panelOrder);
  assert(panelOrder[0].includes('Primary Vector Export'), '1st section is Primary Vector Export (Downloads)');
  assert(panelOrder[1].includes('Secondary Raster Export'), '2nd section is Secondary Raster Export (Downloads)');
  assert(panelOrder[2].includes('Synthesized Color Palette'), '3rd section is Synthesized Color Palette');
  assert(panelOrder[3].includes('Vector Telemetry'), '4th section is Vector Telemetry (Details)');

  // =========================================================================
  // 5. SVG Display Window Layout Stability (CLS = 0.000)
  // =========================================================================
  console.log('\n--- Test 5: SVG Display Window Layout Shift (CLS) Stability ---');
  await page.click('#btnSample');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 15000 });
  await page.waitForSelector('#viewport svg', { state: 'attached', timeout: 15000 });

  const tabButtons = await page.$$eval('#tabNav .tab-btn', btns => btns.map(b => b.getAttribute('data-artboard')));
  console.log(`Found ${tabButtons.length} artboards to test for toolbar stability...`);

  let initialTitleH = await page.$eval('.viewer-title-box', el => Math.round(el.getBoundingClientRect().height));

  let layoutShiftDetected = false;
  for (const artboard of tabButtons) {
    await page.click(`#tabNav .tab-btn[data-artboard="${artboard}"]`);
    await page.waitForTimeout(50);
    const currentH = await page.$eval('.viewer-title-box', el => Math.round(el.getBoundingClientRect().height));
    const currentTitle = await page.$eval('#activeArtboardTitle', el => el.textContent.trim());
    if (Math.abs(currentH - initialTitleH) > 1) {
      console.warn(`Shift detected on "${artboard}" (${currentTitle}): height ${initialTitleH} -> ${currentH}`);
      layoutShiftDetected = true;
    }
  }
  assert(!layoutShiftDetected, 'Viewer title container height remained 100% stable across all artboards (Zero CLS from title length)');

  // =========================================================================
  // 6. Google Search Central & OpenGraph Image Suite
  // =========================================================================
  console.log('\n--- Test 6: Google Search Central & OpenGraph Standards ---');
  const ogFiles = ['og-image.jpg', 'og-discover.jpg', 'og-search.jpg', 'og-image-1x1.jpg', 'og-square.jpg'];
  for (const f of ogFiles) {
    const full = path.join('./c2vector/assets/og', f);
    const exists = fs.existsSync(full);
    const sizeKb = exists ? fs.statSync(full).size / 1024 : 0;
    assert(exists && sizeKb < 100, `OG Asset ${f} exists and is < 100 KB (${sizeKb.toFixed(1)} KB)`);
  }

  // Check Schema.org JSON-LD images on index.html
  const indexJsonLdImages = await page.evaluate(() => {
    const script = document.querySelector('script[type="application/ld+json"]');
    if (!script) return [];
    const data = JSON.parse(script.textContent);
    return data.image || [];
  });
  assert(indexJsonLdImages.length >= 3, `Index JSON-LD structured data contains multi-aspect image array (${indexJsonLdImages.length} images)`);

  // =========================================================================
  // 7. Viewport Horizontal Overflow Check
  // =========================================================================
  console.log('\n--- Test 7: Mobile Viewport Horizontal Overflow ---');
  const viewports = [1280, 768, 480, 375, 320];
  for (const w of viewports) {
    await page.setViewportSize({ width: w, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    assert(overflow <= 0, `Viewport ${w}px horizontal overflow is strictly 0px (measured: ${overflow}px)`);
  }

  // Capture verification screenshots
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_mobile_workbench_375.png') });
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase25_desktop_workbench_1280.png') });
  console.log(`\n📸 Screenshots captured to ${ARTIFACT_DIR}`);

  await browser.close();

  if (failures === 0) {
    console.log('\n🎉 ALL PHASE 25 ASSERTIONS PASSED WITH 0 FAILURES!');
    process.exit(0);
  } else {
    console.error(`\n💥 Phase 25 Verification completed with ${failures} failure(s).`);
    process.exit(1);
  }
})();
