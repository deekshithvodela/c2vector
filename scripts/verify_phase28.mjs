import fs from 'fs';
import path from 'path';
import http from 'http';
import pkg from '/home/drover/Projects/sponsorship/node_modules/playwright/index.js';
const { chromium } = pkg;

const BASE_DIR = '/home/drover/Projects/Vector';
const TARGET_FILES = [
  'c2vector/about.html',
  'c2vector/about/index.html'
];

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ [PASS] ${message}`);
  } else {
    failedTests++;
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

async function runVerification() {
  console.log('\n====================================================');
  console.log('🚀 Phase 28 Automated Verification & Production Audit');
  console.log('====================================================\n');

  console.log('--- 1. Static AST & Lint Diagnostic Audit ---');
  for (const relPath of TARGET_FILES) {
    const fullPath = path.join(BASE_DIR, relPath);
    assert(fs.existsSync(fullPath), `${relPath} exists on filesystem`);
    const content = fs.readFileSync(fullPath, 'utf8');

    // Rule 1: Zero catch (e) unused variable warnings
    const hasUnusedCatch = /catch\s*\([a-zA-Z0-9_$]+\)/.test(content);
    assert(!hasUnusedCatch, `${relPath} contains 0 unused catch variable declarations`);

    // Rule 2: Zero unescaped &display=swap entity warnings
    const hasUnescapedDisplay = /href="[^"]*&display=swap[^"]*"/.test(content);
    assert(!hasUnescapedDisplay, `${relPath} contains 0 unescaped &display=swap entities`);

    // Rule 3: 100% of <button> tags specify explicit type="..."
    const buttonMatches = content.match(/<button\b[^>]*>/g) || [];
    assert(buttonMatches.length === 10, `${relPath} contains expected 10 interactive button elements (found ${buttonMatches.length})`);
    const unTypedButtons = buttonMatches.filter(b => !b.includes('type='));
    assert(unTypedButtons.length === 0, `${relPath} has 100% explicit button types (0 un-typed buttons)`);

    // Rule 4: 100% of <svg> tags specify aria-hidden="true" or accessible aria attributes
    const svgMatches = content.match(/<svg\b[^>]*>/g) || [];
    assert(svgMatches.length === 22, `${relPath} contains expected 22 SVG icons (found ${svgMatches.length})`);
    const unAriaSvgs = svgMatches.filter(s => !s.includes('aria-hidden') && !s.includes('aria-label'));
    assert(unAriaSvgs.length === 0, `${relPath} has 100% accessible SVGs (0 missing aria attributes)`);

    // Rule 5: Zero protocol-relative script tags
    const hasProtocolRelative = /src="\/\/[^"]*"/.test(content);
    assert(!hasProtocolRelative, `${relPath} contains 0 protocol-relative src="// references`);

    // Rule 6: Explicit HTTPS for GoatCounter
    const hasHttpsGoatcounter = content.includes('src="https://gc.zgo.at/count.js"');
    assert(hasHttpsGoatcounter, `${relPath} uses explicit HTTPS for analytics (https://gc.zgo.at/count.js)`);

    // Rule 7: Zero plaintext personal email exposure
    const hasPlainEmail = content.includes('mailto:deekshithvodela@gmail.com');
    assert(!hasPlainEmail, `${relPath} contains 0 plaintext personal email exposures`);

    // Rule 8: Protected entity-encoded email present
    const hasEncodedEmail = content.includes('mailto:&#100;&#101;&#101;&#107;&#115;&#104;&#105;&#116;&#104;');
    assert(hasEncodedEmail, `${relPath} protects developer contact via HTML entity encoding`);

    // Rule 9: Hoisted font preconnect early in <head> (before JSON-LD)
    const preconnectIndex = content.indexOf('<link rel="preconnect" href="https://fonts.googleapis.com">');
    const jsonLdIndex = content.indexOf('application/ld+json');
    assert(preconnectIndex > 0 && preconnectIndex < jsonLdIndex, `${relPath} font preconnect is hoisted early in <head> before JSON-LD metadata`);
  }

  console.log('\n--- 2. Dev Server Clean URL & HTTP Header Verification ---');
  const serverUrls = [
    'http://localhost:8080/about',
    'http://localhost:8080/about/'
  ];

  for (const testUrl of serverUrls) {
    await new Promise((resolve) => {
      http.get(testUrl, (res) => {
        assert(res.statusCode === 200, `GET ${testUrl} returned HTTP 200 OK`);
        assert(res.headers['content-type']?.includes('text/html'), `GET ${testUrl} returned text/html content-type`);
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          assert(data.includes('About C2Vector'), `GET ${testUrl} contains expected brand title`);
          resolve();
        });
      }).on('error', (err) => {
        assert(false, `GET ${testUrl} failed: ${err.message}`);
        resolve();
      });
    });
  }

  console.log('\n--- 3. Playwright Headless Browser Interaction & Layout Audit ---');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Test desktop navigation
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:8080/about/', { waitUntil: 'networkidle' });
  
  const pageTitle = await page.title();
  assert(pageTitle.includes('About c2vector'), `Page title loaded: "${pageTitle}"`);

  // Theme toggle check
  const htmlThemeInitial = await page.getAttribute('html', 'data-theme');
  assert(htmlThemeInitial === 'dark', `Initial theme is dark mode (found: ${htmlThemeInitial})`);

  await page.click('#btnThemeToggle');
  const htmlThemeToggled = await page.getAttribute('html', 'data-theme');
  assert(htmlThemeToggled === 'light', `Clicking theme toggle toggles theme to light mode (found: ${htmlThemeToggled})`);

  await page.click('#btnThemeToggle');
  const htmlThemeRestored = await page.getAttribute('html', 'data-theme');
  assert(htmlThemeRestored === 'dark', `Clicking theme toggle again restores dark mode (found: ${htmlThemeRestored})`);

  // Modal interaction check (MIT License)
  await page.click('#btnOpenMitModal');
  const mitModalOpen = await page.evaluate(() => document.getElementById('modalMitLicense').classList.contains('open'));
  assert(mitModalOpen, `Clicking MIT License link opens #modalMitLicense modal dialog`);

  await page.click('#modalMitLicense .modal-close-btn');
  const mitModalClosed = await page.evaluate(() => !document.getElementById('modalMitLicense').classList.contains('open'));
  assert(mitModalClosed, `Clicking modal-close-btn successfully closes #modalMitLicense`);

  // Modal interaction check (Privacy Policy with footer button)
  await page.click('#btnOpenPrivacyModal');
  const privacyModalOpen = await page.evaluate(() => document.getElementById('modalPrivacyPolicy').classList.contains('open'));
  assert(privacyModalOpen, `Clicking Privacy Policy link opens #modalPrivacyPolicy modal dialog`);

  await page.click('#modalPrivacyPolicy .modal-footer button');
  const privacyModalClosed = await page.evaluate(() => !document.getElementById('modalPrivacyPolicy').classList.contains('open'));
  assert(privacyModalClosed, `Clicking footer close button successfully closes #modalPrivacyPolicy`);

  // Mobile viewport check & horizontal overflow check
  await page.setViewportSize({ width: 375, height: 812 });
  await page.reload({ waitUntil: 'networkidle' });

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  const innerWidth = await page.evaluate(() => window.innerWidth);
  assert(scrollWidth <= innerWidth, `Mobile viewport (375px) has zero horizontal overflow (scrollWidth: ${scrollWidth}px, innerWidth: ${innerWidth}px)`);

  const screenshotPath = path.join(BASE_DIR, 'c2vector/assets/og/about_phase28_verified.png');
  await page.screenshot({ path: screenshotPath, fullPage: false });
  assert(fs.existsSync(screenshotPath), `Captured visual verification screenshot at about_phase28_verified.png`);

  await browser.close();

  console.log('\n====================================================');
  console.log(`🏁 Phase 28 Verification Summary: ${passedTests} / ${totalTests} Tests Passed (${failedTests} Failed)`);
  console.log('====================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  }
}

runVerification().catch(err => {
  console.error('Fatal verification runner error:', err);
  process.exit(1);
});
