const fs = require('fs');
const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');

// Pen nib normalized path from media_1793368291760.png
// The tip is at (25.332, 19.578). In a 32x32 viewbox, we can transform it so the tip touches the anchor node.
const svgContent = `
<svg width="64" height="64" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <!-- Dynamic Bézier Curve -->
  <path d="M 3 23 C 6 13, 11 11, 15 16 C 18 20, 22 21, 28 15" stroke="#f4ba00" stroke-width="2.2" stroke-linecap="round"/>
  
  <!-- Tangent Handle Guide Line with Dash -->
  <line x1="7" y1="11.5" x2="16" y2="11.5" stroke="#fedd3d" stroke-width="1.2" stroke-dasharray="2 1.5" opacity="0.85"/>
  
  <!-- Tangent Control Anchor Nodes -->
  <circle cx="7" cy="11.5" r="1.6" fill="#fbd32c"/>
  <circle cx="16" cy="11.5" r="1.6" fill="#fbd32c"/>
  
  <!-- Authentic Tilted Fountain Pen Nib from media_1793368291760.png -->
  <!-- Transformed so the nib tip rests precisely at (15, 16) drawing the curve -->
  <g transform="translate(15, 16) scale(0.38) rotate(-18) translate(-25.33, -19.58)" fill="#f4ba00" fill-rule="evenodd">
    <path d="M 25.332 19.578 C 24.655 21.341, 29.433 40.612, 31.022 42.526 C 31.581 43.200, 33.738 44.022, 35.816 44.355 C 38.441 44.774, 40.275 45.880, 41.827 47.979 C 43.055 49.641, 44.849 51, 45.814 51 C 47.682 51, 58 41.161, 58 39.379 C 58 38.797, 56.490 36.948, 54.645 35.268 C 52.301 33.136, 51.093 30.985, 50.637 28.133 C 50.002 24.161, 49.831 24.008, 44.242 22.436 C 41.084 21.548, 36.281 20.186, 33.568 19.410 C 27.286 17.614, 26.076 17.638, 25.332 19.578 M 34.500 26 C 36.343 27.924, 38.371 29, 40.152 29 C 43.750 29, 45.678 32.216, 44.124 35.626 C 43.412 37.190, 42.202 38, 40.578 38 C 37.977 38, 34.835 34.595, 35.599 32.604 C 35.845 31.962, 34.393 29.876, 32.373 27.969 C 29.930 25.662, 28.923 25.129, 29.368 26.379 C 29.735 27.412, 30.543 30.337, 31.162 32.879 C 32.904 40.025, 33.576 40.814, 38.569 41.563 C 42.697 42.182, 43.419 41.973, 46.131 39.375 C 48.703 36.911, 49.041 36.004, 48.511 33.001 C 47.360 26.480, 47.177 26.288, 40.513 24.614 C 31.754 22.413, 31.189 22.544, 34.500 26 M 39 33.500 C 39 34.417, 39.484 35.005, 40.075 34.808 C 40.666 34.611, 41.150 34.023, 41.150 33.500 C 41.150 32.977, 40.666 32.389, 40.075 32.192 C 39.484 31.995, 39 32.583, 39 33.500 M 47.699 41.796 C 44.803 44.762, 44.256 45.856, 45.200 46.800 C 46.144 47.744, 47.238 47.197, 50.204 44.301 C 54.054 40.542, 55.062 38, 52.703 38 C 51.990 38, 49.738 39.708, 47.699 41.796" />
  </g>
</svg>
`;

const html = `
<!DOCTYPE html>
<html>
<body style="background: #0b0d10; display:flex; align-items:center; justify-content:center; height:100vh; margin:0;">
  <div style="background:#14171d; padding:20px; border-radius:12px; border:1px solid #282d37; display:flex; gap:20px; align-items:center;">
    ${svgContent}
    <div style="font-family:sans-serif; color:#f3f4f6; font-size:24px; font-weight:800;">c2vector</div>
  </div>
</body>
</html>
`;

fs.writeFileSync('/home/drover/Projects/Vector/scripts/test_logo.html', html);

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 300, height: 160 } });
  await page.goto('file:///home/drover/Projects/Vector/scripts/test_logo.html');
  await page.screenshot({ path: '/home/drover/.gemini/antigravity-ide/brain/707012b4-7cd2-44d9-a41a-2adb7ae1ed50/.tempmediaStorage/test_combined_logo.png' });
  await browser.close();
  console.log('Logo preview captured!');
})();
