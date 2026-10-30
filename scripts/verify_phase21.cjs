const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');
const path = require('path');
const fs = require('fs');

const BASE_URL = 'http://localhost:8080';
const ARTIFACT_DIR = '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage';

if (!fs.existsSync(ARTIFACT_DIR)) {
  fs.mkdirSync(ARTIFACT_DIR, { recursive: true });
}

async function runTests() {
  console.log('🚀 Launching Playwright for Phase 21 & Phase 22 Comprehensive Verification...');
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
    // Test 1: Desktop Studio (index.html)
    // -------------------------------------------------------------
    console.log('\n--- 1. Testing Desktop Studio (index.html) ---');
    const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await page.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });

    // 1. Refined Brand Logo: Pen nib + Bézier curve + tangent handles
    const hasBezierPath = await page.$eval('.brand-logo svg path[stroke="#f4ba00"]', el => el !== null).catch(() => false);
    const hasPenNibPath = await page.$eval('.brand-logo svg g path', el => el.getAttribute('d').startsWith('M 25.332 19.578')).catch(() => false);
    assert(hasBezierPath && hasPenNibPath, 'Brand logo combines flowing Bézier curve and authentic fountain pen nib');

    // 2. Install PWA Button: Icon-only, no text
    const installBtnText = await page.$eval('#btnInstallPwa', el => el.textContent.trim()).catch(() => '');
    assert(installBtnText === '', `Install button is icon-only with zero text (got "${installBtnText}")`);

    // 3. Badges Removed
    const pwaBadgeCount = await page.$$eval('.brand-badge', els => els.length);
    assert(pwaBadgeCount === 0, 'All brand badges ("PWA • LOCAL", "ARCHITECTURE") completely removed');

    // 4. Install banner removed
    const installBanner = await page.$('#installBanner');
    assert(installBanner === null, 'Install banner element completely removed from DOM');

    // 5. Footer notice removed
    const footerNotice = await page.$('.footer-bottom-notice');
    assert(footerNotice === null, 'Footer bottom notice div completely removed from DOM (zero blank space)');

    // 6. Navigation sub-bar & Footer links contain About
    const subBarAbout = await page.$eval('.header-nav-bar a[href="about.html"]', el => el.textContent.trim()).catch(() => '');
    const footerAbout = await page.$eval('.footer-meta-links a[href="./about.html"]', el => el.textContent.trim()).catch(() => '');
    assert(subBarAbout === 'About' && footerAbout === 'About', 'Navigation sub-bar and footer both link to about.html');

    // 7. Engine Mode Tabs
    const tabPhotoActive = await page.$eval('#tabModePhoto', el => el.classList.contains('active'));
    assert(tabPhotoActive, 'Photo Mode tab is initially active');

    // Toggle to Logo Mode
    await page.click('#tabModeLogo');
    const tabLogoActive = await page.$eval('#tabModeLogo', el => el.classList.contains('active'));
    const browseLogoVisible = await page.$eval('#btnBrowseLogo', el => el.offsetParent !== null);
    const sampleLogoVisible = await page.$eval('#btnSampleLogo', el => el.offsetParent !== null);
    assert(tabLogoActive && browseLogoVisible && sampleLogoVisible, 'Logo Mode tab activates and displays Logo upload & sample buttons');

    // Switch back to Photo Mode
    await page.click('#tabModePhoto');
    const browsePhotoVisible = await page.$eval('#btnBrowse', el => el.offsetParent !== null);
    assert(browsePhotoVisible, 'Switching back to Photo Mode displays Photo upload button');

    // Screenshot Desktop
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test_desktop_studio_phase21.png'), fullPage: false });

    // -------------------------------------------------------------
    // Test 2: Mobile Navbar Horizontal Overflow (320px & 375px)
    // -------------------------------------------------------------
    console.log('\n--- 2. Testing Mobile Navbar Overflow (320px & 375px) ---');
    for (const width of [320, 375]) {
      const mobPage = await browser.newPage({ viewport: { width, height: 667 } });
      await mobPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'domcontentloaded' });

      const hasDocOverflow = await mobPage.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
      const hasNavOverflow = await mobPage.evaluate(() => {
        const nav = document.querySelector('.header-nav-bar');
        return nav ? nav.scrollWidth > nav.clientWidth : false;
      });
      const hasHeaderOverflow = await mobPage.evaluate(() => {
        const header = document.querySelector('.header-container');
        return header ? header.scrollWidth > header.clientWidth : false;
      });

      assert(!hasDocOverflow, `Document has 0px horizontal overflow at ${width}px viewport`);
      assert(!hasNavOverflow, `Sub-bar nav has 0px horizontal overflow at ${width}px viewport`);
      assert(!hasHeaderOverflow, `Header container has 0px horizontal overflow at ${width}px viewport`);

      await mobPage.screenshot({ path: path.join(ARTIFACT_DIR, `test_mobile_${width}px_header.png`), clip: { x: 0, y: 0, width, height: 180 } });
      await mobPage.close();
    }

    // -------------------------------------------------------------
    // Test 3: Workflow Page (workflow.html)
    // -------------------------------------------------------------
    console.log('\n--- 3. Testing Workflow Page (workflow.html) ---');
    const wfPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    await wfPage.goto(`${BASE_URL}/workflow.html`, { waitUntil: 'domcontentloaded' });

    const wfLogo = await wfPage.$eval('.brand-logo svg g path', el => el.getAttribute('d').startsWith('M 25.332 19.578')).catch(() => false);
    const wfBadge = await wfPage.$('.brand-badge');
    const wfFooterNotice = await wfPage.$('.footer-bottom-notice');
    const wfAboutLink = await wfPage.$eval('.header-nav-bar a[href="about.html"]', el => el.textContent.trim()).catch(() => '');

    assert(wfLogo, 'Workflow page features refined brand logo');
    assert(wfBadge === null, 'Workflow page has ARCHITECTURE badge removed');
    assert(wfFooterNotice === null, 'Workflow page footer notice div removed');
    assert(wfAboutLink === 'About', 'Workflow page sub-bar links to About');
    await wfPage.close();

    // -------------------------------------------------------------
    // Test 4: About Page (about.html) & SEO
    // -------------------------------------------------------------
    console.log('\n--- 4. Testing About Page (about.html) ---');
    const aboutPage = await browser.newPage({ viewport: { width: 1280, height: 800 } });
    const response = await aboutPage.goto(`${BASE_URL}/about.html`, { waitUntil: 'domcontentloaded' });
    assert(response.status() === 200, 'about.html returns HTTP 200 OK');

    const h1Text = await aboutPage.$eval('h1', el => el.textContent.trim());
    assert(h1Text.includes('About c2vector Studio'), `H1 heading is prominent: "${h1Text}"`);

    // Verify FAQ schema
    const schemaTypes = await aboutPage.$$eval('script[type="application/ld+json"]', scripts => {
      const types = [];
      for (const s of scripts) {
        try {
          const json = JSON.parse(s.textContent);
          if (json['@graph']) {
            json['@graph'].forEach(g => types.push(g['@type']));
          } else {
            types.push(json['@type']);
          }
        } catch (e) {}
      }
      return types;
    });
    assert(schemaTypes.includes('FAQPage') && schemaTypes.includes('AboutPage'), 'Schema.org JSON-LD contains valid AboutPage and FAQPage schemas');

    // Verify Comparison Table
    const tableHeaders = await aboutPage.$$eval('.comparison-table th', ths => ths.map(t => t.textContent.trim()));
    assert(tableHeaders.includes('c2vector Studio') && tableHeaders.includes('Generative AI Models'), 'Comparison table compares c2vector Studio vs Cloud vs Generative AI');

    await aboutPage.screenshot({ path: path.join(ARTIFACT_DIR, 'test_about_page_desktop.png'), fullPage: false });
    await aboutPage.close();

    // -------------------------------------------------------------
    // Test 5: Live Vectorization in Studio (Logo Mode)
    // -------------------------------------------------------------
    console.log('\n--- 5. Testing Live In-Browser Logo Vectorization ---');
    const studioPage = await browser.newPage({ viewport: { width: 1280, height: 850 } });
    await studioPage.goto(`${BASE_URL}/index.html`, { waitUntil: 'networkidle' });

    // Switch to Logo Mode and click Sample Logo
    await studioPage.click('#tabModeLogo');
    await studioPage.click('#btnSampleLogo');

    // Wait for workbench to appear (max 15s)
    console.log('  ⏳ Waiting for Web Worker logo vectorization to complete...');
    await studioPage.waitForFunction(() => {
      const wb = document.getElementById('workbench');
      return wb && wb.style.display !== 'none';
    }, { timeout: 20000 });

    const isWorkbenchVisible = await studioPage.$eval('#workbench', el => el.style.display !== 'none');
    assert(isWorkbenchVisible, 'Studio workbench is displayed after logo vectorization');

    // Check generated SVG content
    const svgPathCount = await studioPage.$$eval('#viewport svg path', paths => paths.length);
    assert(svgPathCount >= 1, `Vector preview contains rendered vector paths (count: ${svgPathCount})`);

    // Screenshot Workbench
    await studioPage.screenshot({ path: path.join(ARTIFACT_DIR, 'test_studio_logo_workbench_live.png'), fullPage: false });
    await studioPage.close();

    // -------------------------------------------------------------
    // Test 6: Purge of Tiger References
    // -------------------------------------------------------------
    console.log('\n--- 6. Testing Absolute Zero Tiger References ---');
    const htmlFiles = ['c2vector/index.html', 'c2vector/workflow.html', 'c2vector/about.html'];
    let tigerFound = false;
    for (const f of htmlFiles) {
      const content = fs.readFileSync(path.join('/home/drover/Projects/Vector', f), 'utf8');
      if (/tiger/i.test(content)) {
        console.error(`  ❌ Found "tiger" reference in ${f}`);
        tigerFound = true;
      }
    }
    assert(!tigerFound, 'Zero tiger references found in public HTML files');

  } catch (err) {
    console.error('Unhandled test execution error:', err);
    failures++;
  } finally {
    await browser.close();
  }

  console.log(`\n==============================================`);
  if (failures === 0) {
    console.log('🎉 ALL PHASE 21 & PHASE 22 VERIFICATION TESTS PASSED!');
  } else {
    console.error(`💥 VERIFICATION COMPLETED WITH ${failures} FAILURE(S).`);
    process.exit(1);
  }
}

runTests();
