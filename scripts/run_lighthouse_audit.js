const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const CHROME_PATH = '/home/drover/.cache/ms-playwright/chromium-1248/chrome-linux64/chrome';
process.env.CHROME_PATH = CHROME_PATH;

const PAGES = [
  { name: 'Studio Workbench (index.html)', path: 'index.html' },
  { name: 'Workflow Documentation (workflow.html)', path: 'workflow.html' },
  { name: 'About & Educational Hub (about.html)', path: 'about.html' }
];

const BASE_URL = 'http://localhost:8080';
const results = [];

async function runAudit() {
  console.log('⚡ Starting Comprehensive PageSpeed Insights & Lighthouse Audit...\n');

  for (const page of PAGES) {
    for (const formFactor of ['desktop', 'mobile']) {
      const url = `${BASE_URL}/${page.path}`;
      console.log(`Running Lighthouse for: ${page.name} [${formFactor.toUpperCase()}]...`);

      const flags = [
        `--chrome-flags="--headless --no-sandbox --disable-gpu --disable-dev-shm-usage"`,
        `--output=json`,
        `--preset=${formFactor === 'desktop' ? 'desktop' : 'perf'}`,
        `--only-categories=performance,accessibility,best-practices,seo`,
        `--quiet`
      ].join(' ');

      const tmpJson = path.join(__dirname, `lh_${page.path.replace('.html', '')}_${formFactor}.json`);
      const cmd = `CHROME_PATH="${CHROME_PATH}" npx -y lighthouse ${url} ${flags} --output-path="${tmpJson}"`;

      try {
        execSync(cmd, { stdio: 'pipe', timeout: 60000 });
        if (fs.existsSync(tmpJson)) {
          const data = JSON.parse(fs.readFileSync(tmpJson, 'utf8'));
          fs.unlinkSync(tmpJson);

          const categories = data.categories || {};
          const audits = data.audits || {};

          const scores = {
            page: page.name,
            file: page.path,
            device: formFactor,
            performance: Math.round((categories.performance?.score || 0) * 100),
            accessibility: Math.round((categories.accessibility?.score || 0) * 100),
            bestPractices: Math.round((categories['best-practices']?.score || 0) * 100),
            seo: Math.round((categories.seo?.score || 0) * 100),
            fcp: audits['first-contentful-paint']?.displayValue || 'N/A',
            lcp: audits['largest-contentful-paint']?.displayValue || 'N/A',
            tbt: audits['total-blocking-time']?.displayValue || 'N/A',
            cls: audits['cumulative-layout-shift']?.displayValue || 'N/A'
          };

          results.push(scores);
          console.log(`  -> Scores: Perf: ${scores.performance} | A11y: ${scores.accessibility} | BP: ${scores.bestPractices} | SEO: ${scores.seo} | FCP: ${scores.fcp} | LCP: ${scores.lcp}`);
        }
      } catch (err) {
        console.error(`  ❌ Lighthouse error on ${page.path} [${formFactor}]:`, err.message);
      }
    }
  }

  // Print Summary Table
  console.log('\n========================================================================================================');
  console.log('🏁 LIGHTHOUSE AUDIT CORE SUMMARY REPORT');
  console.log('========================================================================================================');
  console.table(results.map(r => ({
    Page: r.page,
    Device: r.device.toUpperCase(),
    Performance: `${r.performance}%`,
    Accessibility: `${r.accessibility}%`,
    'Best Practices': `${r.bestPractices}%`,
    SEO: `${r.seo}%`,
    FCP: r.fcp,
    LCP: r.lcp,
    TBT: r.tbt,
    CLS: r.cls
  })));

  // Output JSON for report.md
  fs.writeFileSync(path.join(__dirname, 'lighthouse_results.json'), JSON.stringify(results, null, 2));
}

runAudit();
