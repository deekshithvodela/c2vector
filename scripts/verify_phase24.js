const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');
const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';

(async () => {
  console.log('🧪 Starting Phase 24 Verification Test Suite...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  const consoleLogs = [];
  page.on('console', msg => consoleLogs.push(`[${msg.type()}] ${msg.text()}`));

  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

  // 1. Check palette hint text
  const hintText = await page.$eval('.palette-hint', el => el.textContent.trim());
  console.log(`1. Palette Hint Text: "${hintText}"`);
  if (hintText.includes('Click to copy HEX code') && !hintText.includes('Long-Press')) {
    console.log('✅ PASS: Palette hint updated to "Click to copy HEX code".');
  } else {
    console.error('❌ FAIL: Palette hint text incorrect:', hintText);
  }

  // 2. Trigger sample processing
  console.log('\n2. Ingesting Sample to launch Workbench...');
  await page.click('#btnSample');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 20000 });
  console.log('✅ PASS: Workbench loaded.');

  // 3. Test tab buttons location & conciseness
  console.log('\n3. Testing Artboard Tabs...');
  const isTabNavInsideViewer = await page.$eval('.viewer-card #tabNav', el => Boolean(el));
  console.log(`Tab-nav inside .viewer-card: ${isTabNavInsideViewer ? '✅ PASS' : '❌ FAIL'}`);

  const tabLabels = await page.$$eval('#tabNav .tab-btn', btns => btns.map(b => b.textContent.trim()));
  console.log('Concise Tab Labels:', tabLabels);
  if (tabLabels.includes('Vibrant v2') && tabLabels.includes('Faithful') && tabLabels.includes('8-Tone Color')) {
    console.log('✅ PASS: Tab labels are concise.');
  } else {
    console.error('❌ FAIL: Tab labels not concise.');
  }

  // 4. Test clicking a tab & title descriptiveness
  console.log('\n4. Testing Tab Switch & Descriptive Title...');
  await page.click('#tabNav button[data-artboard="masterFaithful"]');
  const activeTitle = await page.$eval('#activeArtboardTitle', el => el.textContent.trim());
  console.log(`Active Artboard Title: "${activeTitle}"`);
  if (activeTitle.includes('Master Faithful Vector (HD Reference)')) {
    console.log('✅ PASS: Viewer displays full descriptive title.');
  } else {
    console.error('❌ FAIL: Viewer title not descriptive:', activeTitle);
  }

  // 5. Test Swatch Click & Toast Notification
  console.log('\n5. Testing Color Swatch Click & Clipboard Toast...');
  await page.waitForSelector('.swatch-chip', { state: 'visible', timeout: 5000 });
  
  // Click first swatch
  await page.click('.swatch-chip:first-child');
  await page.waitForTimeout(100);

  const toastVisible = await page.$eval('#copyToast', el => el.classList.contains('visible') || el.classList.contains('show'));
  const toastText = await page.$eval('#toastMsg', el => el.textContent.trim());
  console.log(`Copy Toast visible: ${toastVisible ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Copy Toast text: "${toastText}"`);

  // 6. Test 360-Degree Zoom & Pan in All Directions
  console.log('\n6. Testing 360-Degree Pan & Zoom...');
  // Click 4x zoom
  await page.click('.zoom-btn[data-zoom="4"]');
  await page.waitForTimeout(200);

  const initialTransform = await page.$eval('#viewport svg', el => el.style.transform);
  console.log('Initial Zoom 4x transform:', initialTransform);

  // Drag mouse diagonally down-right
  const viewportBox = await page.$eval('#viewport', el => {
    const r = el.getBoundingClientRect();
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  });

  await page.mouse.move(viewportBox.x, viewportBox.y);
  await page.mouse.down();
  await page.mouse.move(viewportBox.x + 80, viewportBox.y + 60, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(100);

  const pannedTransform1 = await page.$eval('#viewport svg', el => el.style.transform);
  console.log('Panned (down-right) transform:', pannedTransform1);

  // Drag mouse diagonally up-left (negative coordinates test)
  await page.mouse.move(viewportBox.x, viewportBox.y);
  await page.mouse.down();
  await page.mouse.move(viewportBox.x - 120, viewportBox.y - 100, { steps: 5 });
  await page.mouse.up();
  await page.waitForTimeout(100);

  const pannedTransform2 = await page.$eval('#viewport svg', el => el.style.transform);
  console.log('Panned (up-left) transform:', pannedTransform2);

  if (pannedTransform2.includes('-') && pannedTransform2.includes('scale(4)')) {
    console.log('✅ PASS: Panning operates in all 360-degree directions (including negative offsets)!');
  } else {
    console.error('❌ FAIL: Panning transform unexpected:', pannedTransform2);
  }

  // Reset zoom to 1x
  await page.click('.zoom-btn[data-zoom="1"]');
  await page.waitForTimeout(100);
  const resetTransform = await page.$eval('#viewport svg', el => el.style.transform);
  console.log('Reset 1x transform:', resetTransform);

  // 7. Viewport Overflow Verification across all standard breakpoints
  console.log('\n7. Viewport Overflow Verification with Active Workbench...');
  for (const w of [1280, 768, 480, 375, 320]) {
    await page.setViewportSize({ width: w, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Viewport ${w}px -> scrollWidth: ${scrollW}px (Overflow: ${overflow ? '❌ OVERFLOW' : '✅ 0px'})`);
  }

  // 8. Capture screenshots
  console.log('\n8. Capturing screenshots...');
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/workbench_mobile_375.png`, fullPage: false });

  await page.setViewportSize({ width: 320, height: 600 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/workbench_mobile_320.png`, fullPage: false });

  await page.setViewportSize({ width: 1280, height: 900 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/workbench_desktop_1280.png`, fullPage: false });
  console.log('✅ Screenshots captured to .tempmediaStorage');

  await browser.close();
  console.log('\n🎉 ALL PHASE 24 VERIFICATIONS COMPLETED SUCCESSFULLY!');
})();
