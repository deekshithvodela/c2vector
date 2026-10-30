import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pkg from '/home/drover/Projects/sponsorship/node_modules/playwright/index.js';
const { chromium } = pkg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = 'http://localhost:8080';
const OG_DIR = path.join(__dirname, '../c2vector/assets/og');

async function verify() {
  console.log('====================================================');
  console.log('🧪 Starting Comprehensive Phase 27 Verification Suite');
  console.log('====================================================');
  let passed = 0;
  let total = 0;

  function assert(condition, message) {
    total++;
    if (condition) {
      console.log(`  ✅ [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  ❌ [FAIL] ${message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 1: OpenGraph Asset Suite & File Size Compliance (< 100 KB)
  // --------------------------------------------------------------------------
  console.log('\n--- 1. OpenGraph Multi-Aspect Asset Suite & File Size Verification ---');
  const expectedOg = [
    { file: 'og-image.jpg', w: 1200, h: 630, maxKb: 90 },
    { file: 'og-discover.jpg', w: 1200, h: 675, maxKb: 95 },
    { file: 'og-search.jpg', w: 1200, h: 900, maxKb: 95 },
    { file: 'og-image-1x1.jpg', w: 1200, h: 1200, maxKb: 100 },
    { file: 'og-square.jpg', w: 600, h: 600, maxKb: 60 }
  ];

  for (const item of expectedOg) {
    const filePath = path.join(OG_DIR, item.file);
    const exists = fs.existsSync(filePath);
    assert(exists, `${item.file} exists on disk`);

    if (exists) {
      const stats = fs.statSync(filePath);
      const sizeKb = stats.size / 1024;
      assert(
        sizeKb < item.maxKb && sizeKb < 100,
        `${item.file} size is ${sizeKb.toFixed(1)} KB (Target < ${item.maxKb} KB, Hard limit < 100 KB)`
      );
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 2: Strict Yellow + Black/White Color Palette Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Color Palette Purity Verification (Yellow & B&W ONLY) ---');
  // Inspect scripts/generate_luxury_og.js to verify zero foreign colors
  const genScript = fs.readFileSync(path.join(__dirname, 'generate_luxury_og.js'), 'utf8');
  assert(!genScript.includes('#0ea5e9') && !genScript.includes('#38bdf8'), 'Zero sky blue / cyan accents in OG script');
  assert(!genScript.includes('#a855f7') && !genScript.includes('#8b5cf6'), 'Zero purple / violet accents in OG script');
  assert(!genScript.includes('#22c55e') && !genScript.includes('#10b981') && !genScript.includes('#4ade80'), 'Zero green accents in OG script');
  assert(!genScript.includes('#ef4444') && !genScript.includes('#f43f5e'), 'Zero red accents in OG script');
  assert(genScript.includes('#f4ba00') && genScript.includes('#fedd3d') && genScript.includes('#fbd32c'), 'Brand golden yellow palette (#f4ba00, #fedd3d, #fbd32c) strictly configured');

  // --------------------------------------------------------------------------
  // TEST SUITE 3: Clean URLs Server & Directory Resolution (HTTP 200 OK)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Clean URLs Route & Server Resolution (HTTP 200 OK) ---');
  const routesToTest = [
    { url: `${BASE_URL}/`, titleContains: 'c2vector' },
    { url: `${BASE_URL}/about`, titleContains: 'About c2vector' },
    { url: `${BASE_URL}/about/`, titleContains: 'About c2vector' },
    { url: `${BASE_URL}/workflow`, titleContains: 'Vectorization Architecture' },
    { url: `${BASE_URL}/workflow/`, titleContains: 'Vectorization Architecture' }
  ];

  for (const r of routesToTest) {
    try {
      const res = await fetch(r.url);
      assert(res.status === 200, `GET ${r.url} returned HTTP 200 OK`);
      const text = await res.text();
      assert(text.includes(r.titleContains), `GET ${r.url} contains expected title keyword "${r.titleContains}"`);
    } catch (e) {
      assert(false, `GET ${r.url} failed with error: ${e.message}`);
    }
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 4: Zero .html in Internal Hyperlinks & Canonical Tags
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Zero .html in Internal Navigation & Canonical Tags ---');
  const filesToCheck = [
    'c2vector/index.html',
    'c2vector/about/index.html',
    'c2vector/workflow/index.html',
    'c2vector/about.html',
    'c2vector/workflow.html'
  ];

  for (const relFile of filesToCheck) {
    const fullPath = path.join(__dirname, '..', relFile);
    if (!fs.existsSync(fullPath)) {
      assert(false, `File ${relFile} exists`);
      continue;
    }
    const html = fs.readFileSync(fullPath, 'utf8');

    // Check canonical link
    const canonicalMatch = html.match(/<link\s+rel="canonical"\s+href="([^"]+)"/i);
    if (canonicalMatch) {
      const canonicalUrl = canonicalMatch[1];
      assert(!canonicalUrl.endsWith('.html'), `${relFile} canonical URL does not end with .html (${canonicalUrl})`);
    } else {
      assert(false, `${relFile} has canonical link`);
    }

    // Check OpenGraph URL
    const ogUrlMatch = html.match(/<meta\s+property="og:url"\s+content="([^"]+)"/i);
    if (ogUrlMatch) {
      assert(!ogUrlMatch[1].endsWith('.html'), `${relFile} og:url does not end with .html (${ogUrlMatch[1]})`);
    }

    // Check Twitter URL
    const twUrlMatch = html.match(/<meta\s+name="twitter:url"\s+content="([^"]+)"/i);
    if (twUrlMatch) {
      assert(!twUrlMatch[1].endsWith('.html'), `${relFile} twitter:url does not end with .html (${twUrlMatch[1]})`);
    }

    // Check navigation hrefs
    const navHrefMatches = [...html.matchAll(/<a\s+[^>]*href="([^"]+)"/gi)].map(m => m[1]);
    const internalHtmlHrefs = navHrefMatches.filter(h => 
      (h.includes('about.html') || h.includes('workflow.html')) && !h.startsWith('http')
    );
    assert(
      internalHtmlHrefs.length === 0,
      `${relFile} has 0 internal hrefs containing about.html or workflow.html (found: ${internalHtmlHrefs.length})`
    );
  }

  // --------------------------------------------------------------------------
  // TEST SUITE 5: Sitemap & Service Worker Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 5. Sitemap & Service Worker Clean URL Verification ---');
  const sitemapContent = fs.readFileSync(path.join(__dirname, '../c2vector/sitemap.xml'), 'utf8');
  assert(!sitemapContent.includes('.html'), 'sitemap.xml contains zero .html URLs');
  assert(sitemapContent.includes('c2vector/workflow/'), 'sitemap.xml contains clean c2vector/workflow/');
  assert(sitemapContent.includes('c2vector/about/'), 'sitemap.xml contains clean c2vector/about/');

  const swContent = fs.readFileSync(path.join(__dirname, '../c2vector/sw.js'), 'utf8');
  assert(swContent.includes('c2vector-v6'), 'Service Worker cache bumped to c2vector-v6');
  assert(swContent.includes("'./workflow/'"), 'Service Worker precaches ./workflow/');
  assert(swContent.includes("'./about/'"), 'Service Worker precaches ./about/');

  // --------------------------------------------------------------------------
  // TEST SUITE 6: Playwright Interactive Browser Navigation Flow
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Playwright Headless Browser Navigation Flow ---');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Visit Studio
  await page.goto(`${BASE_URL}/`, { waitUntil: 'networkidle' });
  let currentUrl = page.url();
  let title = await page.title();
  assert(title.includes('c2vector'), `Studio loaded: ${title}`);

  // 2. Click Workflow Link
  await page.click('nav.header-nav-bar a[href="workflow/"]');
  await page.waitForLoadState('networkidle');
  currentUrl = page.url();
  title = await page.title();
  assert(currentUrl.includes('/workflow'), `Navigated cleanly to Workflow: ${currentUrl}`);
  assert(title.includes('Vectorization Architecture'), `Workflow title verified: ${title}`);

  // 3. Click About Link from Workflow
  await page.click('nav.header-nav-bar a[href="../about/"]');
  await page.waitForLoadState('networkidle');
  currentUrl = page.url();
  title = await page.title();
  assert(currentUrl.includes('/about'), `Navigated cleanly to About: ${currentUrl}`);
  assert(title.includes('About c2vector'), `About title verified: ${title}`);

  // 4. Click Studio Link from About
  await page.click('nav.header-nav-bar a[href="../"]');
  await page.waitForLoadState('networkidle');
  currentUrl = page.url();
  title = await page.title();
  assert(title.includes('c2vector'), `Navigated cleanly back to Studio: ${currentUrl}`);

  // Capture desktop screenshot
  const screenshotDir = path.join(__dirname, '../c2vector/assets');
  await page.screenshot({ path: path.join(screenshotDir, 'clean_urls_verified.png') });
  assert(fs.existsSync(path.join(screenshotDir, 'clean_urls_verified.png')), 'Captured clean_urls_verified.png screenshot');

  await browser.close();

  console.log('\n====================================================');
  console.log(`🏁 Phase 27 Verification Complete: ${passed} / ${total} Tests Passed`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

verify().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
