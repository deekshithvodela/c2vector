const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } });

  console.log('--- Testing Workbench on Mobile (375px) ---');
  await page.goto('http://localhost:8080/', { waitUntil: 'networkidle' });

  // Click Try Sample Photo to trigger workbench processing
  await page.click('#btnSample');

  // Wait for #workbench to become visible
  await page.waitForSelector('#workbench', { state: 'visible', timeout: 15000 });
  console.log('✅ Workbench displayed!');

  for (const w of [375, 320]) {
    await page.setViewportSize({ width: w, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
    console.log(`Viewport ${w}px -> scrollWidth: ${scrollW}px (Overflow: ${overflow ? '❌ YES' : '✅ 0px'})`);

    if (overflow) {
      const offending = await page.evaluate(() => {
        const list = [];
        document.querySelectorAll('*').forEach(el => {
          const rect = el.getBoundingClientRect();
          if (el.scrollWidth > window.innerWidth || rect.right > window.innerWidth) {
            list.push({
              tag: el.tagName,
              id: el.id,
              class: el.className,
              scrollW: el.scrollWidth,
              right: rect.right
            });
          }
        });
        return list.slice(0, 10);
      });
      console.log('Offending elements at', w, 'px:', offending);
    }
  }

  await browser.close();
})();
