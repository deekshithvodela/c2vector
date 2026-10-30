const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';

async function debugAboutPage() {
  console.log('🔍 Comprehensive Debugging of About Page (about.html)...\n');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

  const consoleLogs = [];
  const networkErrors = [];

  page.on('console', msg => consoleLogs.push({ type: msg.type(), text: msg.text() }));
  page.on('pageerror', err => consoleLogs.push({ type: 'pageerror', text: err.message }));
  page.on('requestfailed', req => networkErrors.push({ url: req.url(), failure: req.failure()?.errorText }));

  // 1. Load Page
  const response = await page.goto(`${BASE_URL}/about.html`, { waitUntil: 'networkidle' });
  console.log(`HTTP Status: ${response.status()}`);

  // 2. Network Errors
  console.log('\n--- Network Failures ---');
  if (networkErrors.length === 0) {
    console.log('✅ Zero network request failures.');
  } else {
    networkErrors.forEach(e => console.error(`❌ Request failed: ${e.url} - ${e.failure}`));
  }

  // 3. Console Errors
  console.log('\n--- Console Logs & Errors ---');
  if (consoleLogs.length === 0) {
    console.log('✅ Zero console errors or warnings.');
  } else {
    consoleLogs.forEach(c => console.log(`[${c.type}] ${c.text}`));
  }

  // 4. Modal Triggers & Behavior
  console.log('\n--- Modal Testing ---');
  for (const modalType of ['Mit', 'Privacy', 'Disclosure']) {
    const btnId = `btnOpen${modalType}Modal`;
    const modalId = `modal${modalType === 'Mit' ? 'MitLicense' : modalType === 'Privacy' ? 'PrivacyPolicy' : 'Disclosure'}`;
    const btn = await page.$(`#${btnId}`);
    if (!btn) {
      console.error(`❌ Trigger button #${btnId} not found!`);
      continue;
    }
    await page.click(`#${btnId}`);
    const isOpen = await page.$eval(`#${modalId}`, el => el.classList.contains('open'));
    console.log(`Modal #${modalId} opened: ${isOpen ? '✅' : '❌'}`);
    
    // Test close button
    const closeBtn = await page.$(`#${modalId} [data-modal-close]`);
    if (closeBtn) {
      await closeBtn.click();
      const isClosed = await page.$eval(`#${modalId}`, el => !el.classList.contains('open'));
      console.log(`Modal #${modalId} closed via close button: ${isClosed ? '✅' : '❌'}`);
    }
  }

  // 5. Theme Toggle Testing
  console.log('\n--- Theme Toggle Testing ---');
  const initialTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log(`Initial theme: ${initialTheme}`);
  await page.click('#btnThemeToggle');
  const toggledTheme = await page.evaluate(() => document.documentElement.getAttribute('data-theme'));
  console.log(`Toggled theme: ${toggledTheme}`);
  const hasDarkClass = await page.evaluate(() => document.documentElement.classList.contains('dark'));
  console.log(`document.documentElement has 'dark' class: ${hasDarkClass} (expected ${toggledTheme === 'dark'})`);
  await page.click('#btnThemeToggle'); // Toggle back

  // 6. Responsive Overflow Checks
  console.log('\n--- Viewport Overflow Testing ---');
  for (const w of [1280, 768, 480, 375, 320]) {
    await page.setViewportSize({ width: w, height: 800 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
    console.log(`Viewport ${w}px overflow: ${overflow ? '❌ OVERFLOW' : '✅ 0px'}`);
    if (overflow) {
      const offendingEls = await page.evaluate(() => {
        const offending = [];
        document.querySelectorAll('*').forEach(el => {
          if (el.scrollWidth > window.innerWidth || el.getBoundingClientRect().right > window.innerWidth) {
            offending.push({ tag: el.tagName, class: el.className, id: el.id, scrollW: el.scrollWidth, right: el.getBoundingClientRect().right });
          }
        });
        return offending.slice(0, 5);
      });
      console.log('Offending elements:', offendingEls);
    }
  }

  // 7. Check All Links & Anchors
  console.log('\n--- Link Target Verification ---');
  const links = await page.$$eval('a[href]', els => els.map(a => ({ text: a.textContent.trim(), href: a.getAttribute('href') })));
  for (const link of links) {
    if (link.href.startsWith('#') || link.href.startsWith('mailto:') || link.href.startsWith('http')) {
      continue;
    }
    const resolvedUrl = new URL(link.href, page.url()).href;
    try {
      const res = await page.request.get(resolvedUrl);
      if (res.status() !== 200) {
        console.error(`❌ Broken internal link: "${link.text}" -> ${link.href} (HTTP ${res.status()})`);
      } else {
        console.log(`✅ Valid internal link: "${link.text}" -> ${link.href}`);
      }
    } catch (e) {
      console.error(`❌ Error checking link ${link.href}:`, e.message);
    }
  }

  // 8. Capture Full-Page Screenshots in Dark & Light
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'about_debug_desktop_dark.png'), fullPage: true });

  await page.evaluate(() => {
    document.documentElement.setAttribute('data-theme', 'light');
    document.documentElement.classList.remove('dark');
  });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'about_debug_desktop_light.png'), fullPage: true });

  await browser.close();
  console.log('\nDebugging pass completed.');
}

debugAboutPage().catch(console.error);
