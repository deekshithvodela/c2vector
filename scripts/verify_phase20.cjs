const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runTests() {
  console.log('🚀 Launching Playwright for Phase 20 Comprehensive Verification...');
  const browser = await chromium.launch({ headless: true });
  let failures = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failures++;
    }
  }

  try {
    // -------------------------------------------------------------
    // Test 1: Desktop Layout & Palette on Studio Page
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Desktop Studio (1280x800) ---');
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });

    // Check Pen Tool brand logo
    const penLogoPath = await page.$eval('.brand-logo svg path', el => el.getAttribute('d'));
    assert(penLogoPath.startsWith('M 25.332 19.578'), 'Brand logo uses exact pen tool nib SVG path');

    // Check Google Site Verification
    const gVerify = await page.$eval('meta[name="google-site-verification"]', el => el.getAttribute('content'));
    assert(gVerify === 'googleb30f9215a6887c17', 'Google site verification meta tag present with correct token');

    // Check GoatCounter
    const gcScript = await page.$eval('script[data-goatcounter]', el => el.getAttribute('data-goatcounter'));
    assert(gcScript === 'https://c2vector.goatcounter.com/count', 'GoatCounter analytics script present');

    // Check Palette (Zero Purple)
    const darkBg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    assert(darkBg === 'rgb(11, 13, 16)', `Dark mode background is pure neutral dark #0b0d10 (got ${darkBg})`);

    // Check 0% AI Hero Pill
    const heroPillText = await page.$eval('.hero-section .privacy-pill', el => el.innerText);
    assert(heroPillText.includes('0% Generative AI'), 'Hero privacy pill highlights "0% Generative AI"');

    // Check Footer Notice (0% AI Guarantee)
    const footerNotice = await page.$eval('.footer-bottom-notice', el => el.innerText);
    assert(footerNotice.includes('0% AI Processing Guarantee:') && !footerNotice.includes('Local Processing Notice:'), 'Footer replaces Local Notice with 0% AI Guarantee');

    // Screenshot Desktop Header
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_desktop_header_phase20.png'), clip: { x: 0, y: 0, width: 1280, height: 260 } });

    // -------------------------------------------------------------
    // Test 2: Accessible Modals Suite on Studio Page
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Accessible Modals Suite ---');
    // Open MIT Modal
    await page.click('#btnOpenMitModal');
    let isMitOpen = await page.$eval('#modalMitLicense', el => el.classList.contains('open'));
    assert(isMitOpen, 'MIT License modal opens on footer button click');
    await page.keyboard.press('Escape');
    isMitOpen = await page.$eval('#modalMitLicense', el => el.classList.contains('open'));
    assert(!isMitOpen, 'MIT License modal closes on Escape key');

    // Open Privacy Modal
    await page.click('#btnOpenPrivacyModal');
    let isPrivacyOpen = await page.$eval('#modalPrivacyPolicy', el => el.classList.contains('open'));
    assert(isPrivacyOpen, 'Privacy Policy modal opens on footer button click');
    // Capture screenshot of open modal
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_modal_dialog_phase20.png') });
    await page.click('#modalPrivacyPolicy [data-modal-close]');
    isPrivacyOpen = await page.$eval('#modalPrivacyPolicy', el => el.classList.contains('open'));
    assert(!isPrivacyOpen, 'Privacy Policy modal closes on [data-modal-close] button');

    // Open Disclosure Modal
    await page.click('#btnOpenDisclosureModal');
    let isDiscOpen = await page.$eval('#modalDisclosure', el => el.classList.contains('open'));
    assert(isDiscOpen, 'Disclosure modal opens on footer button click');
    await page.click('#modalDisclosure', { position: { x: 10, y: 10 } }); // click backdrop
    isDiscOpen = await page.$eval('#modalDisclosure', el => el.classList.contains('open'));
    assert(!isDiscOpen, 'Disclosure modal closes on backdrop click');

    await page.close();

    // -------------------------------------------------------------
    // Test 3: Mobile Viewport (375x667 iPhone SE) - Overflow & 2-Bar Header
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Mobile (375x667) Viewport Layout ---');
    const mobilePage = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await mobilePage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });

    // Assert Zero Horizontal Overflow
    const overflowInfo = await mobilePage.evaluate(() => {
      return {
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
        hasOverflow: document.documentElement.scrollWidth > window.innerWidth
      };
    });
    assert(!overflowInfo.hasOverflow, `Mobile screen has zero horizontal overflow (scrollWidth=${overflowInfo.scrollWidth}, innerWidth=${overflowInfo.innerWidth})`);

    // Verify 2-bar layout geometry
    const headerLayout = await mobilePage.evaluate(() => {
      const topBar = document.querySelector('.header-top-bar').getBoundingClientRect();
      const navBar = document.querySelector('.header-nav-bar').getBoundingClientRect();
      return {
        topBarHeight: topBar.height,
        topBarBottom: topBar.bottom,
        navBarTop: navBar.top,
        navBarHeight: navBar.height,
        isStacked: navBar.top >= topBar.bottom - 4
      };
    });
    assert(headerLayout.isStacked, `Header is cleanly stacked into 2 distinct rows on mobile (topBar bottom: ${headerLayout.topBarBottom}, navBar top: ${headerLayout.navBarTop})`);

    // Test Mobile Install Banner Button Height Optimization
    await mobilePage.evaluate(() => {
      const banner = document.getElementById('installBanner');
      if (banner) banner.style.display = 'flex';
    });
    const bannerButtonHeight = await mobilePage.$eval('#btnBannerInstall', el => el.offsetHeight);
    assert(bannerButtonHeight <= 42, `Mobile install banner button height is optimized to standard ${bannerButtonHeight}px (must be <= 42px, not stretched to 120px)`);

    // Screenshot Mobile Header & Banner
    await mobilePage.screenshot({ path: path.join(ARTIFACT_DIR, 'test_mobile_header_phase20.png'), clip: { x: 0, y: 0, width: 375, height: 320 } });
    await mobilePage.close();

    // -------------------------------------------------------------
    // Test 4: Workflow Page (workflow.html) Verification
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing Workflow Page (workflow.html) ---');
    const wfPage = await browser.newPage({ viewport: { width: 375, height: 667 } });
    await wfPage.goto(`${BASE_URL}/workflow.html`, { waitUntil: 'domcontentloaded' });

    // Check Pen Tool Logo
    const wfPenLogo = await wfPage.$eval('.brand-logo svg path', el => el.getAttribute('d'));
    assert(wfPenLogo.startsWith('M 25.332 19.578'), 'Workflow page uses exact pen tool nib logo');

    // Check Overflow on Workflow Page
    const wfOverflow = await wfPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth);
    assert(wfOverflow, 'Workflow page has zero horizontal overflow on mobile 375px');

    // Check 0% AI Guarantee in footer
    const wfFooterNotice = await wfPage.$eval('.footer-bottom-notice', el => el.innerText);
    assert(wfFooterNotice.includes('0% AI Processing Guarantee:'), 'Workflow page footer includes 0% AI Processing Guarantee');

    // Check Modals on Workflow Page
    await wfPage.click('#btnOpenPrivacyModal');
    const wfPrivacyOpen = await wfPage.$eval('#modalPrivacyPolicy', el => el.classList.contains('open'));
    assert(wfPrivacyOpen, 'Workflow page Privacy Policy modal opens cleanly');
    await wfPage.keyboard.press('Escape');

    await wfPage.close();

  } catch (err) {
    console.error('💥 Test suite execution error:', err);
    failures++;
  } finally {
    await browser.close();
  }

  if (failures === 0) {
    console.log('\n🎉 ALL PHASE 20 VERIFICATION TESTS PASSED PERFECTLY!\n');
    process.exit(0);
  } else {
    console.error(`\n❌ ${failures} VERIFICATION TESTS FAILED!\n`);
    process.exit(1);
  }
}

runTests();
