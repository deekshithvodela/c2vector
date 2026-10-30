const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');
const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  // 1. Desktop Dark
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:8080/about.html', { waitUntil: 'networkidle' });
  await page.screenshot({ path: `${ARTIFACT_DIR}/about_desktop_dark.png`, fullPage: false });

  // 2. Mobile 375 Dark
  await page.setViewportSize({ width: 375, height: 812 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/about_mobile_375_dark.png`, fullPage: false });

  // 3. Mobile 320 Dark
  await page.setViewportSize({ width: 320, height: 600 });
  await page.screenshot({ path: `${ARTIFACT_DIR}/about_mobile_320_dark.png`, fullPage: false });

  // 4. Mobile 375 Light
  await page.setViewportSize({ width: 375, height: 812 });
  await page.click('#btnThemeToggle');
  await page.waitForTimeout(400); // Wait for transition
  await page.screenshot({ path: `${ARTIFACT_DIR}/about_mobile_375_light.png`, fullPage: false });

  await browser.close();
  console.log('Screenshots captured successfully.');
})();
