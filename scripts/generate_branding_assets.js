const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');

const penPath = "M 25.332 19.578 C 24.655 21.341, 29.433 40.612, 31.022 42.526 C 31.581 43.200, 33.738 44.022, 35.816 44.355 C 38.441 44.774, 40.275 45.880, 41.827 47.979 C 43.055 49.641, 44.849 51, 45.814 51 C 47.682 51, 58 41.161, 58 39.379 C 58 38.797, 56.490 36.948, 54.645 35.268 C 52.301 33.136, 51.093 30.985, 50.637 28.133 C 50.002 24.161, 49.831 24.008, 44.242 22.436 C 41.084 21.548, 36.281 20.186, 33.568 19.410 C 27.286 17.614, 26.076 17.638, 25.332 19.578 M 34.500 26 C 36.343 27.924, 38.371 29, 40.152 29 C 43.750 29, 45.678 32.216, 44.124 35.626 C 43.412 37.190, 42.202 38, 40.578 38 C 37.977 38, 34.835 34.595, 35.599 32.604 C 35.845 31.962, 34.393 29.876, 32.373 27.969 C 29.930 25.662, 28.923 25.129, 29.368 26.379 C 29.735 27.412, 30.543 30.337, 31.162 32.879 C 32.904 40.025, 33.576 40.814, 38.569 41.563 C 42.697 42.182, 43.419 41.973, 46.131 39.375 C 48.703 36.911, 49.041 36.004, 48.511 33.001 C 47.360 26.480, 47.177 26.288, 40.513 24.614 C 31.754 22.413, 31.189 22.544, 34.500 26 M 39 33.500 C 39 34.417, 39.484 35.005, 40.075 34.808 C 40.666 34.611, 41.150 34.023, 41.150 33.500 C 41.150 32.977, 40.666 32.389, 40.075 32.192 C 39.484 31.995, 39 32.583, 39 33.500 M 47.699 41.796 C 44.803 44.762, 44.256 45.856, 45.200 46.800 C 46.144 47.744, 47.238 47.197, 50.204 44.301 C 54.054 40.542, 55.062 38, 52.703 38 C 51.990 38, 49.738 39.708, 47.699 41.796";

function getLogoSvg(size, bgRadius = 0) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    ${bgRadius > 0 ? `<rect width="24" height="24" rx="${bgRadius}" fill="#0b0d10"/>` : ''}
    <!-- Flowing Bézier Curve -->
    <path d="M 2 17 C 5 9, 10 9, 13 13 C 15 15.5, 18 16, 22 11" stroke="#f4ba00" stroke-width="2" stroke-linecap="round"/>
    
    <!-- Dashed Tangent Handle Guide Line -->
    <line x1="6" y1="9.5" x2="14" y2="9.5" stroke="#fedd3d" stroke-width="1.2" stroke-dasharray="1.5 1.5" opacity="0.9"/>
    
    <!-- Tangent Control Anchor Nodes -->
    <circle cx="6" cy="9.5" r="1.3" fill="#fbd32c"/>
    <circle cx="14" cy="9.5" r="1.3" fill="#fbd32c"/>
    
    <!-- Authentic Fountain Pen Nib from User -->
    <g transform="translate(13, 13) scale(0.36) rotate(-100) translate(-25.332, -19.578)" fill="#f4ba00" fill-rule="evenodd">
      <path d="${penPath}" />
    </g>
  </svg>
  `;
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // 1. Generate Favicon Suite
  const ICONS_DIR = '/home/drover/Projects/Vector/c2vector/assets/icons';
  if (!fs.existsSync(ICONS_DIR)) fs.mkdirSync(ICONS_DIR, { recursive: true });

  const iconSizes = [48, 96, 192, 512, 180];
  for (const sz of iconSizes) {
    const filename = sz === 180 ? 'apple-touch-icon.png' : sz === 512 ? 'icon-512x512.png' : `favicon-${sz}x${sz}.png`;
    const html = `
      <!DOCTYPE html>
      <html>
      <body style="margin:0; padding:0; width:${sz}px; height:${sz}px; background:#0b0d10; display:flex; align-items:center; justify-content:center; overflow:hidden;">
        <div style="width:${Math.round(sz * 0.72)}px; height:${Math.round(sz * 0.72)}px;">
          ${getLogoSvg('100%')}
        </div>
      </body>
      </html>
    `;
    await page.setViewportSize({ width: sz, height: sz });
    await page.setContent(html);
    await page.screenshot({ path: path.join(ICONS_DIR, filename), type: 'png' });
    console.log(`Generated ${filename} (${sz}x${sz})`);
  }

  // Generate favicon.ico (copy of 48x48)
  fs.copyFileSync(path.join(ICONS_DIR, 'favicon-48x48.png'), path.join(ICONS_DIR, 'favicon.ico'));
  console.log('Generated favicon.ico');

  // 2. Generate Open Graph Suite (strictly < 100KB per KI standard)
  const OG_DIR = '/home/drover/Projects/Vector/c2vector/assets/og';
  if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });

  const ogConfigs = [
    { name: 'og-image.jpg', w: 1200, h: 630 },
    { name: 'og-discover.jpg', w: 1200, h: 675 },
    { name: 'og-search.jpg', w: 1200, h: 900 },
    { name: 'og-square.jpg', w: 600, h: 600 }
  ];

  for (const cfg of ogConfigs) {
    const isSquare = cfg.w === cfg.h;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@600;700;800;900&display=swap" rel="stylesheet">
      </head>
      <body style="margin:0; padding:0; width:${cfg.w}px; height:${cfg.h}px; background:#0b0d10; font-family:'Plus Jakarta Sans',sans-serif; color:#f8fafc; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; overflow:hidden;">
        <!-- Subtle Vector Grid Background -->
        <div style="position:absolute; inset:0; background:radial-gradient(circle at 50% 30%, rgba(244,186,0,0.12) 0%, transparent 65%), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px); background-size: 100% 100%, 40px 40px, 40px 40px; pointer-events:none;"></div>
        
        <div style="z-index:2; display:flex; flex-direction:column; align-items:center; text-align:center; padding: 0 40px;">
          <!-- Brand Mark -->
          <div style="display:flex; align-items:center; gap:20px; margin-bottom:${isSquare ? '20px' : '28px'};">
            <div style="width:${isSquare ? '64px' : '84px'}; height:${isSquare ? '64px' : '84px'}; background:#14171d; border:1px solid #282d37; border-radius:18px; display:flex; align-items:center; justify-content:center; box-shadow:0 12px 32px rgba(0,0,0,0.6);">
              ${getLogoSvg(isSquare ? 50 : 68)}
            </div>
            <span style="font-size:${isSquare ? '42px' : '56px'}; font-weight:900; letter-spacing:-1.5px; color:#f8fafc;">c2vector</span>
          </div>

          <!-- Hero Headline -->
          <h1 style="font-size:${isSquare ? '28px' : '44px'}; font-weight:800; margin:0 0 16px 0; letter-spacing:-1px; line-height:1.2; color:#ffffff; max-width:850px;">
            Free PNG to SVG &amp; Image to Vector Converter
          </h1>

          <!-- Feature Pills -->
          <div style="display:flex; gap:12px; margin-bottom:${isSquare ? '24px' : '32px'}; flex-wrap:wrap; justify-content:center;">
            <span style="background:rgba(244,186,0,0.12); color:#f4ba00; border:1px solid rgba(244,186,0,0.3); padding:6px 16px; border-radius:999px; font-size:${isSquare ? '14px' : '17px'}; font-weight:700;">100% Private Client-Side</span>
            <span style="background:rgba(255,255,255,0.06); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); padding:6px 16px; border-radius:999px; font-size:${isSquare ? '14px' : '17px'}; font-weight:600;">0% AI Hallucination</span>
            <span style="background:rgba(255,255,255,0.06); color:#cbd5e1; border:1px solid rgba(255,255,255,0.1); padding:6px 16px; border-radius:999px; font-size:${isSquare ? '14px' : '17px'}; font-weight:600;">Continuous Bézier Splines</span>
          </div>

          <!-- Subtitle / URL -->
          <div style="font-size:${isSquare ? '15px' : '20px'}; color:#94a3b8; font-weight:500;">
            deekshithvodela.github.io/c2vector
          </div>
        </div>
      </body>
      </html>
    `;
    await page.setViewportSize({ width: cfg.w, height: cfg.h });
    await page.setContent(html);
    const destPath = path.join(OG_DIR, cfg.name);
    await page.screenshot({ path: destPath, type: 'jpeg', quality: 85 });
    const stat = fs.statSync(destPath);
    console.log(`Generated ${cfg.name} (${cfg.w}x${cfg.h}) - ${(stat.size / 1024).toFixed(1)} KB (target < 100 KB)`);
  }

  // 3. Generate Clean Universal Test Samples
  // A. Sample 3-Color Geometric Logo for testing sharp corners & typography
  const logoHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; width:600px; height:600px; background:#ffffff; display:flex; align-items:center; justify-content:center;">
      <svg width="500" height="500" viewBox="0 0 500 500" xmlns="http://www.w3.org/2000/svg">
        <!-- 3-Color Geometric Logo: Ruby Red (#e11d48), Golden Amber (#f4ba00), Midnight Slate (#0f172a) -->
        <!-- Sharp 90-degree outer shield boundary -->
        <polygon points="100,60 400,60 400,280 250,440 100,280" fill="#0f172a" />
        
        <!-- Crisp interior chevron (Golden Amber) -->
        <polygon points="140,100 360,100 360,260 250,380 140,260" fill="#f4ba00" />
        
        <!-- Inner Geometric Core (Ruby Red) -->
        <polygon points="180,140 320,140 320,240 250,320 180,240" fill="#e11d48" />
        
        <!-- Sharp Typography Letterforms: 'C2V' (testing 90-deg corners and dots) -->
        <rect x="230" y="165" width="40" height="40" fill="#ffffff" />
        <rect x="210" y="215" width="80" height="24" fill="#ffffff" />
      </svg>
    </body>
    </html>
  `;
  await page.setViewportSize({ width: 600, height: 600 });
  await page.setContent(logoHtml);
  await page.screenshot({ path: '/home/drover/Projects/Vector/c2vector/assets/sample_logo.png', type: 'png' });
  console.log('Generated c2vector/assets/sample_logo.png (3-Color Geometric Logo)');

  // B. Universal Photo Sample: Clean architectural geometric structure with rich sky, concrete, glass gradations
  const photoHtml = `
    <!DOCTYPE html>
    <html>
    <body style="margin:0; padding:0; width:800px; height:800px; background:#000000; display:flex; align-items:center; justify-content:center;">
      <svg width="800" height="800" viewBox="0 0 800 800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="skyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#0284c7" />
            <stop offset="50%" stop-color="#38bdf8" />
            <stop offset="100%" stop-color="#bae6fd" />
          </linearGradient>
          <linearGradient id="archGrad1" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#f8fafc" />
            <stop offset="50%" stop-color="#cbd5e1" />
            <stop offset="100%" stop-color="#64748b" />
          </linearGradient>
          <linearGradient id="archGrad2" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#334155" />
            <stop offset="50%" stop-color="#1e293b" />
            <stop offset="100%" stop-color="#0f172a" />
          </linearGradient>
          <linearGradient id="glassGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stop-color="#0369a1" />
            <stop offset="50%" stop-color="#0284c7" />
            <stop offset="100%" stop-color="#075985" />
          </linearGradient>
        </defs>
        
        <!-- Sky -->
        <rect width="800" height="800" fill="url(#skyGrad)" />
        
        <!-- Sun disk -->
        <circle cx="620" cy="180" r="70" fill="#fef08a" opacity="0.9" />
        
        <!-- Modern Architectural Facets -->
        <polygon points="120,800 350,220 520,800" fill="url(#archGrad1)" />
        <polygon points="350,220 520,800 680,800 480,340" fill="url(#archGrad2)" />
        <polygon points="260,800 350,220 400,800" fill="url(#glassGrad)" opacity="0.85" />
        
        <!-- Foreground Bridge Span -->
        <polygon points="0,680 800,620 800,740 0,800" fill="#0f172a" />
        <line x1="100" y1="672" x2="100" y2="790" stroke="#f4ba00" stroke-width="8" />
        <line x1="300" y1="657" x2="300" y2="775" stroke="#f4ba00" stroke-width="8" />
        <line x1="500" y1="642" x2="500" y2="760" stroke="#f4ba00" stroke-width="8" />
        <line x1="700" y1="627" x2="700" y2="745" stroke="#f4ba00" stroke-width="8" />
      </svg>
    </body>
    </html>
  `;
  await page.setViewportSize({ width: 800, height: 800 });
  await page.setContent(photoHtml);
  await page.screenshot({ path: '/home/drover/Projects/Vector/c2vector/assets/sample_photo.png', type: 'png' });
  console.log('Generated c2vector/assets/sample_photo.png (Universal Architecture Photo)');

  await browser.close();
  console.log('All branding assets successfully created!');
})();
