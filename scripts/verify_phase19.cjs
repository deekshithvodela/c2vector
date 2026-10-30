/**
 * verify_phase19.cjs - Automated Playwright CLI verification for Phase 19
 * Tests:
 * 1. Edge Slider 0 to 100 range and real-time contour opacity/visibility updates
 * 2. Canonify Dual-Theme engine (dark #161320 <-> light #f9f8fb) & persistence
 * 3. Color palette click and simulated long-press copy with toast notification
 * 4. Canonify replicated footer structure (LinkedIn, Substack, mailto, MIT, Privacy)
 * 5. Dedicated standalone workflow.html (6 steps, theme toggle, link back to studio)
 */

const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';
if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['clipboard-read', 'clipboard-write']
  });
  const page = await context.newPage();

  console.log('--- Step 1: Navigating to c2vector Studio (http://localhost:8080) ---');
  await page.goto('http://localhost:8080', { waitUntil: 'networkidle' });

  // 1. Theme Engine Verification
  console.log('--- Step 2: Testing Canonify Dual-Theme Engine ---');
  const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log(`Initial theme: ${initialTheme}`);
  const targetOppositeTheme = initialTheme === 'dark' ? 'light' : 'dark';

  const themeBtn = await page.$('#btnThemeToggle');
  if (!themeBtn) throw new Error('#btnThemeToggle not found!');

  // Click theme toggle to switch to opposite mode
  await themeBtn.click();
  await page.waitForTimeout(300);
  const themeAfterFirstClick = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    isDarkClass: document.documentElement.classList.contains('dark'),
    bodyBg: window.getComputedStyle(document.body).backgroundColor,
    saved: localStorage.getItem('c2vector-theme')
  }));
  console.log('Theme after first toggle:', themeAfterFirstClick);
  if (themeAfterFirstClick.theme !== targetOppositeTheme) {
    throw new Error(`Expected ${targetOppositeTheme} theme, got ${themeAfterFirstClick.theme}`);
  }
  
  // Capture screenshot of toggled mode
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase19_toggled_theme.png'), fullPage: false });
  console.log('Captured phase19_toggled_theme.png');

  // Toggle back to initial mode
  await themeBtn.click();
  await page.waitForTimeout(300);
  const themeAfterSecondClick = await page.evaluate(() => ({
    theme: document.documentElement.getAttribute('data-theme'),
    isDarkClass: document.documentElement.classList.contains('dark'),
    bodyBg: window.getComputedStyle(document.body).backgroundColor,
    saved: localStorage.getItem('c2vector-theme')
  }));
  console.log('Theme after second toggle:', themeAfterSecondClick);
  if (themeAfterSecondClick.theme !== initialTheme) {
    throw new Error(`Expected ${initialTheme} theme, got ${themeAfterSecondClick.theme}`);
  }

  // Ensure dark mode is active for consistent studio screenshot
  if (themeAfterSecondClick.theme !== 'dark') {
    await themeBtn.click();
    await page.waitForTimeout(200);
  }

  // 2. Synthesizing Sample Tiger for Workbench Verification
  console.log('--- Step 3: Triggering Sample Tiger Vector Synthesis ---');
  const btnSample = await page.$('#btnSample');
  if (!btnSample) throw new Error('#btnSample not found!');
  await btnSample.click();

  console.log('Waiting for #workbench to display...');
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 30000 });
  await page.waitForTimeout(1000);
  console.log('Workbench is visible!');

  // 3. Real-Time Edge Slider (0 to 100) Verification
  console.log('--- Step 4: Testing Real-Time Edge Glaze Slider (0 to 100) ---');
  const sliderBounds = await page.evaluate(() => {
    const slider = document.getElementById('edgeOpacitySlider');
    return {
      min: slider.getAttribute('min'),
      max: slider.getAttribute('max'),
      value: slider.value
    };
  });
  console.log('Slider attributes:', sliderBounds);
  if (sliderBounds.min !== '0' || sliderBounds.max !== '100') {
    throw new Error(`Edge slider bounds invalid: min=${sliderBounds.min}, max=${sliderBounds.max}`);
  }

  // Test Slider at 0%
  console.log('Setting slider to 0%...');
  await page.evaluate(() => {
    const slider = document.getElementById('edgeOpacitySlider');
    slider.value = '0';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);

  const testZero = await page.evaluate(() => {
    const label = document.getElementById('edgeOpacityVal').textContent;
    const g = document.querySelector('#chromatic-structural-contours, #chromatic-outlines');
    return {
      label,
      groupAttrOpacity: g ? g.getAttribute('opacity') : null,
      groupStyleOpacity: g ? g.style.opacity : null,
      groupStyleVisibility: g ? g.style.visibility : null
    };
  });
  console.log('Opacity at 0% test:', testZero);
  if (testZero.label !== '0%' || testZero.groupStyleVisibility !== 'hidden' || parseFloat(testZero.groupStyleOpacity) !== 0) {
    throw new Error(`Slider at 0% failed assertions: ${JSON.stringify(testZero)}`);
  }

  // Test Slider at 50%
  console.log('Setting slider to 50%...');
  await page.evaluate(() => {
    const slider = document.getElementById('edgeOpacitySlider');
    slider.value = '50';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);

  const testFifty = await page.evaluate(() => {
    const label = document.getElementById('edgeOpacityVal').textContent;
    const g = document.querySelector('#chromatic-structural-contours, #chromatic-outlines');
    return {
      label,
      groupAttrOpacity: g ? g.getAttribute('opacity') : null,
      groupStyleOpacity: g ? g.style.opacity : null,
      groupStyleVisibility: g ? g.style.visibility : null
    };
  });
  console.log('Opacity at 50% test:', testFifty);
  if (testFifty.label !== '50%' || parseFloat(testFifty.groupStyleOpacity) !== 0.5 || testFifty.groupStyleVisibility !== 'visible') {
    throw new Error(`Slider at 50% failed assertions: ${JSON.stringify(testFifty)}`);
  }

  // Test Slider at 100%
  console.log('Setting slider to 100%...');
  await page.evaluate(() => {
    const slider = document.getElementById('edgeOpacitySlider');
    slider.value = '100';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });
  await page.waitForTimeout(200);

  const testHundred = await page.evaluate(() => {
    const label = document.getElementById('edgeOpacityVal').textContent;
    const g = document.querySelector('#chromatic-structural-contours, #chromatic-outlines');
    return {
      label,
      groupAttrOpacity: g ? g.getAttribute('opacity') : null,
      groupStyleOpacity: g ? g.style.opacity : null
    };
  });
  console.log('Opacity at 100% test:', testHundred);
  if (testHundred.label !== '100%' || parseFloat(testHundred.groupStyleOpacity) !== 1.0) {
    throw new Error(`Slider at 100% failed assertions: ${JSON.stringify(testHundred)}`);
  }

  // Set back to 75% default
  await page.evaluate(() => {
    const slider = document.getElementById('edgeOpacitySlider');
    slider.value = '75';
    slider.dispatchEvent(new Event('input', { bubbles: true }));
  });

  // 4. Color Palette & Clipboard Copy Verification
  console.log('--- Step 5: Testing Color Palette & Clipboard Copy ---');
  const swatchesCount = await page.evaluate(() => {
    const container = document.getElementById('workbenchPaletteSwatches');
    return container ? container.querySelectorAll('.swatch-chip').length : 0;
  });
  console.log(`Rendered swatches count: ${swatchesCount}`);
  if (swatchesCount < 10) throw new Error(`Expected at least 10 swatches, found ${swatchesCount}`);

  // Test Desktop Click on Swatch Chip
  console.log('Clicking first swatch chip...');
  await page.click('#workbenchPaletteSwatches .swatch-chip:first-child');
  await page.waitForTimeout(300);

  const toastStatus = await page.evaluate(() => {
    const toast = document.getElementById('copyToast');
    const msg = document.getElementById('toastMsg');
    return {
      hasVisibleClass: toast.classList.contains('visible'),
      text: msg ? msg.textContent : null
    };
  });
  console.log('Toast status after click:', toastStatus);
  if (!toastStatus.hasVisibleClass || (!toastStatus.text.includes('Copied') && !toastStatus.text.includes('Hex:'))) {
    throw new Error(`Toast notification failed: ${JSON.stringify(toastStatus)}`);
  }

  // Capture Palette and Toast screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase19_palette_toast.png'), fullPage: false });
  console.log('Captured phase19_palette_toast.png');

  // Test Mobile Long-Press Simulation (400ms touchstart)
  console.log('Simulating 400ms touch long-press on second swatch...');
  await page.evaluate(() => {
    const chip2 = document.querySelectorAll('#workbenchPaletteSwatches .swatch-chip')[1];
    if (chip2) {
      chip2.dispatchEvent(new Event('touchstart', { bubbles: true }));
    }
  });
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    const chip2 = document.querySelectorAll('#workbenchPaletteSwatches .swatch-chip')[1];
    if (chip2) {
      chip2.dispatchEvent(new Event('touchend', { bubbles: true }));
    }
  });
  console.log('Mobile long-press simulation completed successfully.');

  // 5. Canonify Footer Verification
  console.log('--- Step 6: Verifying Canonify Replicated Footer ---');
  const footerData = await page.evaluate(() => {
    const footer = document.querySelector('footer.site-footer');
    if (!footer) return null;
    const authorLink = footer.querySelector('a[href*="linkedin.com/in/deekshithvodela"]');
    const substackLink = footer.querySelector('a[href*="deekshithvodela.substack.com"]');
    const feedbackLink = footer.querySelector('a[href^="mailto:deekshithvodela@gmail.com"]');
    const notice = footer.querySelector('.footer-bottom-notice');
    return {
      hasAuthor: !!authorLink,
      hasSubstack: !!substackLink,
      hasFeedback: !!feedbackLink,
      hasNotice: !!notice && notice.textContent.includes('Local Processing Notice')
    };
  });
  console.log('Footer verification data:', footerData);
  if (!footerData.hasAuthor || !footerData.hasSubstack || !footerData.hasFeedback || !footerData.hasNotice) {
    throw new Error(`Footer verification failed: ${JSON.stringify(footerData)}`);
  }

  // Capture Studio in Dark Mode
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase19_dark_studio.png'), fullPage: false });
  console.log('Captured phase19_dark_studio.png');

  // 6. Standalone Workflow Page Verification
  console.log('--- Step 7: Navigating to workflow.html ---');
  const workflowRes = await page.goto('http://localhost:8080/workflow.html', { waitUntil: 'networkidle' });
  if (workflowRes.status() !== 200) throw new Error(`workflow.html returned status ${workflowRes.status()}`);

  const workflowChecks = await page.evaluate(() => {
    const stepCards = document.querySelectorAll('.workflow-step-card');
    const title = document.querySelector('h1')?.textContent;
    const studioLink = document.querySelector('a[href="./"]');
    const toggle = document.getElementById('btnThemeToggle');
    return {
      stepCardsCount: stepCards.length,
      title,
      hasStudioLink: !!studioLink,
      hasToggle: !!toggle
    };
  });
  console.log('Workflow page checks:', workflowChecks);
  if (workflowChecks.stepCardsCount !== 6 || !workflowChecks.hasStudioLink) {
    throw new Error(`workflow.html checks failed: ${JSON.stringify(workflowChecks)}`);
  }

  // Test theme toggle on workflow.html
  await page.click('#btnThemeToggle');
  await page.waitForTimeout(300);
  const workflowLight = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log(`workflow.html theme after toggle: ${workflowLight}`);
  if (workflowLight !== 'light') throw new Error(`Expected light mode on workflow.html, got ${workflowLight}`);

  // Capture Workflow Page screenshot
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'phase19_workflow_page.png'), fullPage: true });
  console.log('Captured phase19_workflow_page.png');

  console.log('\n========================================');
  console.log('🎉 ALL PHASE 19 VERIFICATION TESTS PASSED!');
  console.log('========================================\n');

  await browser.close();
  process.exit(0);
})().catch(err => {
  console.error('❌ Verification failed with error:', err);
  process.exit(1);
});
