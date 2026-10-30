const fs = require('fs');
const path = require('path');
const { chromium } = require('/home/drover/Projects/sponsorship/node_modules/playwright');

const OG_DIR = path.join(__dirname, '../c2vector/assets/og');
if (!fs.existsSync(OG_DIR)) fs.mkdirSync(OG_DIR, { recursive: true });

const FONT_PATH = path.join(__dirname, 'fonts/PlusJakartaSans.ttf');
let fontBase64 = '';
if (fs.existsSync(FONT_PATH)) {
  fontBase64 = fs.readFileSync(FONT_PATH).toString('base64');
}

// Authentic C2Vector Fountain Pen Nib Path
const penPath = "M 25.332 19.578 C 24.655 21.341, 29.433 40.612, 31.022 42.526 C 31.581 43.200, 33.738 44.022, 35.816 44.355 C 38.441 44.774, 40.275 45.880, 41.827 47.979 C 43.055 49.641, 44.849 51, 45.814 51 C 47.682 51, 58 41.161, 58 39.379 C 58 38.797, 56.490 36.948, 54.645 35.268 C 52.301 33.136, 51.093 30.985, 50.637 28.133 C 50.002 24.161, 49.831 24.008, 44.242 22.436 C 41.084 21.548, 36.281 20.186, 33.568 19.410 C 27.286 17.614, 26.076 17.638, 25.332 19.578 M 34.500 26 C 36.343 27.924, 38.371 29, 40.152 29 C 43.750 29, 45.678 32.216, 44.124 35.626 C 43.412 37.190, 42.202 38, 40.578 38 C 37.977 38, 34.835 34.595, 35.599 32.604 C 35.845 31.962, 34.393 29.876, 32.373 27.969 C 29.930 25.662, 28.923 25.129, 29.368 26.379 C 29.735 27.412, 30.543 30.337, 31.162 32.879 C 32.904 40.025, 33.576 40.814, 38.569 41.563 C 42.697 42.182, 43.419 41.973, 46.131 39.375 C 48.703 36.911, 49.041 36.004, 48.511 33.001 C 47.360 26.480, 47.177 26.288, 40.513 24.614 C 31.754 22.413, 31.189 22.544, 34.500 26 M 39 33.500 C 39 34.417, 39.484 35.005, 40.075 34.808 C 40.666 34.611, 41.150 34.023, 41.150 33.500 C 41.150 32.977, 40.666 32.389, 40.075 32.192 C 39.484 31.995, 39 32.583, 39 33.500 M 47.699 41.796 C 44.803 44.762, 44.256 45.856, 45.200 46.800 C 46.144 47.744, 47.238 47.197, 50.204 44.301 C 54.054 40.542, 55.062 38, 52.703 38 C 51.990 38, 49.738 39.708, 47.699 41.796";

function getC2VectorLogoSvg(size = 48) {
  return `
  <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Flowing Bézier Curve -->
    <path d="M 2 17 C 5 9, 10 9, 13 13 C 15 15.5, 18 16, 22 11" stroke="#f4ba00" stroke-width="2" stroke-linecap="round"/>
    <!-- Dashed Tangent Handle Guide Line -->
    <line x1="6" y1="9.5" x2="14" y2="9.5" stroke="#fedd3d" stroke-width="1.2" stroke-dasharray="1.5 1.5" opacity="0.95"/>
    <!-- Tangent Control Anchor Nodes -->
    <circle cx="6" cy="9.5" r="1.3" fill="#fbd32c"/>
    <circle cx="14" cy="9.5" r="1.3" fill="#fbd32c"/>
    <!-- Authentic Fountain Pen Nib from User Drawing Curve at (13, 13) -->
    <g transform="translate(13, 13) scale(0.36) rotate(-100) translate(-25.332, -19.578)" fill="#f4ba00" fill-rule="evenodd">
      <path d="${penPath}" />
    </g>
  </svg>
  `;
}

// Authentic High-Precision Vector Studio Artboard Graphic (Yellow & B&W ONLY)
function getVectorShowcaseSvg() {
  return `
  <svg viewBox="0 0 460 380" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
    <!-- Background Blueprint CAD Grid -->
    <defs>
      <pattern id="cadGrid" width="30" height="30" patternUnits="userSpaceOnUse">
        <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#222630" stroke-width="0.8" opacity="0.7"/>
        <circle cx="30" cy="30" r="1" fill="#282d37" />
      </pattern>
      <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f4ba00"/>
        <stop offset="100%" stop-color="#fedd3d"/>
      </linearGradient>
      <linearGradient id="goldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stop-color="#f4ba00" stop-opacity="0.3"/>
        <stop offset="100%" stop-color="#f4ba00" stop-opacity="0.0"/>
      </linearGradient>
    </defs>

    <rect width="460" height="380" fill="#101318"/>
    <rect width="460" height="380" fill="url(#cadGrid)"/>

    <!-- Coordinate Axis Guides -->
    <line x1="230" y1="20" x2="230" y2="350" stroke="#f4ba00" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.35"/>
    <line x1="20" y1="185" x2="440" y2="185" stroke="#f4ba00" stroke-width="0.8" stroke-dasharray="3 3" opacity="0.35"/>

    <!-- Geometric Multi-Tier Vector Artwork (Pure Gold, White, Obsidian) -->
    <!-- Outer Vector Silhouette Crest -->
    <path d="M 230 45 L 350 115 L 350 245 L 230 315 L 110 245 L 110 115 Z" fill="#14171d" stroke="#f4ba00" stroke-width="2.5"/>
    <!-- Concentric Inner Vector Facet -->
    <path d="M 230 75 L 320 130 L 320 230 L 230 285 L 140 230 L 140 130 Z" fill="#1a1e26" stroke="#fedd3d" stroke-width="1.8"/>

    <!-- Stylized Central Vector Lion / Emblem in Pure Brand Gold -->
    <!-- Crown Facets -->
    <path d="M 230 100 L 260 145 L 200 145 Z" fill="url(#goldGrad)"/>
    <path d="M 170 120 L 205 155 L 160 170 Z" fill="#e0ab00"/>
    <path d="M 290 120 L 300 170 L 255 155 Z" fill="#fbd32c"/>
    
    <!-- Central Wing / Chevron Vector Planes -->
    <path d="M 230 160 L 290 200 L 230 255 L 170 200 Z" fill="#f4ba00"/>
    <path d="M 230 175 L 275 205 L 230 245 L 185 205 Z" fill="#0b0d10"/>
    <path d="M 230 190 L 255 210 L 230 232 L 205 210 Z" fill="#fedd3d"/>

    <!-- Tangent Curves & Flowing Bézier Splines -->
    <path d="M 80 200 C 120 280, 180 290, 230 290 C 280 290, 340 280, 380 200" stroke="#f4ba00" stroke-width="2" fill="none"/>
    <path d="M 95 180 C 130 90, 200 70, 230 70 C 260 70, 330 90, 365 180" stroke="#fedd3d" stroke-width="1.5" stroke-dasharray="4 3" fill="none"/>

    <!-- Live Bézier Tangent Control Handles & Lines -->
    <line x1="80" y1="200" x2="110" y2="260" stroke="#fedd3d" stroke-width="1.2" stroke-dasharray="2 2"/>
    <line x1="380" y1="200" x2="350" y2="260" stroke="#fedd3d" stroke-width="1.2" stroke-dasharray="2 2"/>
    <line x1="230" y1="45" x2="270" y2="45" stroke="#fbd32c" stroke-width="1.2" stroke-dasharray="2 2"/>
    <line x1="230" y1="45" x2="190" y2="45" stroke="#fbd32c" stroke-width="1.2" stroke-dasharray="2 2"/>

    <!-- Control Handle Circular Nodes -->
    <circle cx="110" cy="260" r="3.5" fill="#fedd3d" stroke="#0b0d10" stroke-width="1"/>
    <circle cx="350" cy="260" r="3.5" fill="#fedd3d" stroke="#0b0d10" stroke-width="1"/>
    <circle cx="270" cy="45" r="3.5" fill="#fbd32c" stroke="#0b0d10" stroke-width="1"/>
    <circle cx="190" cy="45" r="3.5" fill="#fbd32c" stroke="#0b0d10" stroke-width="1"/>

    <!-- Primary Bézier Square Anchor Nodes (Gold with White border) -->
    <rect x="226" y="41" width="8" height="8" fill="#f4ba00" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="346" y="111" width="8" height="8" fill="#f4ba00" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="346" y="241" width="8" height="8" fill="#f4ba00" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="226" y="311" width="8" height="8" fill="#f4ba00" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="106" y="241" width="8" height="8" fill="#f4ba00" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="106" y="111" width="8" height="8" fill="#f4ba00" stroke="#ffffff" stroke-width="1.5"/>

    <rect x="76" y="196" width="8" height="8" fill="#fedd3d" stroke="#ffffff" stroke-width="1.5"/>
    <rect x="376" y="196" width="8" height="8" fill="#fedd3d" stroke="#ffffff" stroke-width="1.5"/>

    <!-- Floating HUD Coordinate Tags (Monochrome & Gold) -->
    <g transform="translate(25, 25)">
      <rect width="135" height="24" rx="4" fill="#14171d" stroke="#282d37" stroke-width="1"/>
      <text x="8" y="16" fill="#f4ba00" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="700">NODE (230, 45)</text>
      <text x="96" y="16" fill="#94a3b8" font-family="'Plus Jakarta Sans', sans-serif" font-size="11">G1</text>
    </g>

    <g transform="translate(305, 25)">
      <rect width="130" height="24" rx="4" fill="#14171d" stroke="#282d37" stroke-width="1"/>
      <circle cx="14" cy="12" r="3.5" fill="#f4ba00"/>
      <text x="25" y="16" fill="#f3f4f6" font-family="'Plus Jakarta Sans', sans-serif" font-size="11" font-weight="600">Pure Bézier 60fps</text>
    </g>
  </svg>
  `;
}

// Generate complete HTML template for a target resolution
function generateHtml(cfg) {
  const isCompactSquare = cfg.name === 'og-square.jpg'; // 600x600 WhatsApp
  const isLargeSquare = cfg.w === cfg.h && !isCompactSquare; // 1200x1200

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <style>
      @font-face {
        font-family: 'Plus Jakarta Sans';
        src: url(data:font/truetype;charset=utf-8;base64,${fontBase64}) format('truetype');
        font-weight: 400 900;
        font-style: normal;
      }
      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }
      body {
        width: ${cfg.w}px;
        height: ${cfg.h}px;
        background: #0b0d10;
        font-family: 'Plus Jakarta Sans', sans-serif;
        color: #f3f4f6;
        position: relative;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      
      /* Subtle Ambient Gold Radial Glows */
      .glow-layer {
        position: absolute;
        inset: 0;
        background: 
          radial-gradient(circle at 82% 25%, rgba(244, 186, 0, 0.16) 0%, transparent 55%),
          radial-gradient(circle at 18% 85%, rgba(244, 186, 0, 0.08) 0%, transparent 45%);
        pointer-events: none;
      }

      /* Subtle Master Architectural Grid */
      .grid-layer {
        position: absolute;
        inset: 0;
        background-image: 
          linear-gradient(to right, rgba(255, 255, 255, 0.02) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(255, 255, 255, 0.02) 1px, transparent 1px);
        background-size: 40px 40px;
        pointer-events: none;
      }

      /* Card Border & Frame */
      .outer-frame {
        position: absolute;
        inset: 0;
        border: 2px solid #222630;
        pointer-events: none;
      }

      ${isCompactSquare ? `
        /* Compact WhatsApp Square (600x600) Layout */
        .container-compact {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          padding: 30px;
          z-index: 10;
          width: 100%;
        }
        .logo-box-compact {
          width: 80px;
          height: 80px;
          background: #14171d;
          border: 2px solid #f4ba00;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 35px rgba(0,0,0,0.8), 0 0 25px rgba(244, 186, 0, 0.2);
          margin-bottom: 20px;
        }
        .brand-name-compact {
          font-size: 38px;
          font-weight: 900;
          letter-spacing: -1px;
          color: #ffffff;
          margin-bottom: 6px;
        }
        .brand-name-compact span {
          color: #f4ba00;
        }
        .hero-h1-compact {
          font-size: 26px;
          font-weight: 800;
          color: #f3f4f6;
          line-height: 1.25;
          margin-bottom: 16px;
          max-width: 480px;
        }
        .hero-h1-compact em {
          font-style: normal;
          color: #f4ba00;
        }
        .pills-compact {
          display: flex;
          flex-direction: column;
          gap: 8px;
          align-items: center;
          margin-bottom: 24px;
        }
        .pill-compact {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 6px 14px;
          border-radius: 9999px;
          font-size: 13px;
          font-weight: 700;
        }
        .pill-gold-compact {
          background: rgba(244, 186, 0, 0.12);
          border: 1.5px solid #f4ba00;
          color: #f4ba00;
        }
        .pill-white-compact {
          background: #14171d;
          border: 1.5px solid #282d37;
          color: #f3f4f6;
        }
        .footer-tag-compact {
          font-size: 14px;
          color: #94a3b8;
          font-weight: 600;
          letter-spacing: 0.5px;
        }
      ` : isLargeSquare ? `
        /* 1:1 Large Square (1200x1200) Layout */
        .container-square {
          width: 100%;
          height: 100%;
          padding: 70px 80px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          z-index: 10;
        }
        .top-row {
          display: flex;
          align-items: center;
          gap: 28px;
        }
        .logo-box-lg {
          width: 100px;
          height: 100px;
          background: #14171d;
          border: 2px solid #f4ba00;
          border-radius: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 16px 40px rgba(0,0,0,0.8), 0 0 35px rgba(244, 186, 0, 0.25);
        }
        .brand-text-block {
          display: flex;
          flex-direction: column;
        }
        .brand-name-lg {
          font-size: 52px;
          font-weight: 900;
          letter-spacing: -1.5px;
          color: #ffffff;
        }
        .brand-name-lg span {
          color: #f4ba00;
        }
        .brand-subtitle-lg {
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 2.5px;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .heading-square {
          margin-top: 35px;
        }
        .h1-square {
          font-size: 62px;
          font-weight: 900;
          letter-spacing: -1.5px;
          line-height: 1.1;
          color: #ffffff;
          margin-bottom: 12px;
        }
        .h1-square em {
          font-style: normal;
          color: #f4ba00;
        }
        .sub-square {
          font-size: 24px;
          color: #94a3b8;
          font-weight: 500;
          margin-bottom: 28px;
        }
        .pills-row-lg {
          display: flex;
          gap: 14px;
          flex-wrap: wrap;
          margin-bottom: 35px;
        }
        .pill-lg {
          display: inline-flex;
          align-items: center;
          gap: 10px;
          padding: 10px 22px;
          border-radius: 9999px;
          font-size: 18px;
          font-weight: 700;
        }
        .pill-gold-lg {
          background: rgba(244, 186, 0, 0.12);
          border: 1.5px solid #f4ba00;
          color: #f4ba00;
        }
        .pill-white-lg {
          background: #14171d;
          border: 1.5px solid #282d37;
          color: #f3f4f6;
        }
        .showcase-container-sq {
          width: 100%;
          height: 480px;
          background: #14171d;
          border: 2px solid #282d37;
          border-radius: 20px;
          overflow: hidden;
          box-shadow: 0 25px 60px rgba(0,0,0,0.9);
          display: flex;
          flex-direction: column;
        }
        .showcase-header {
          height: 48px;
          background: #101216;
          border-bottom: 1.5px solid #222630;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
        }
        .showcase-tabs {
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .tab-item {
          padding: 5px 14px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 700;
        }
        .tab-active {
          background: rgba(244, 186, 0, 0.16);
          color: #f4ba00;
          border: 1px solid #f4ba00;
        }
        .tab-inactive {
          color: #94a3b8;
          border: 1px solid transparent;
        }
      ` : `
        /* Landscape Hero Formats: 1.91:1 (1200x630), 16:9 (1200x675), 4:3 (1200x900) */
        .container-landscape {
          width: 100%;
          height: 100%;
          padding: 60px 75px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          z-index: 10;
          gap: 50px;
        }
        .left-content {
          flex: 1.15;
          display: flex;
          flex-direction: column;
          justify-content: center;
        }
        .brand-lockup {
          display: flex;
          align-items: center;
          gap: 20px;
          margin-bottom: 28px;
        }
        .logo-box {
          width: 76px;
          height: 76px;
          background: #14171d;
          border: 2px solid #f4ba00;
          border-radius: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 14px 35px rgba(0,0,0,0.8), 0 0 25px rgba(244, 186, 0, 0.2);
        }
        .brand-text {
          display: flex;
          flex-direction: column;
        }
        .brand-name {
          font-size: 44px;
          font-weight: 900;
          letter-spacing: -1.2px;
          color: #ffffff;
        }
        .brand-name span {
          color: #f4ba00;
        }
        .brand-sub {
          font-size: 15px;
          font-weight: 700;
          letter-spacing: 2px;
          color: #94a3b8;
          text-transform: uppercase;
        }
        .h1-landscape {
          font-size: 46px;
          font-weight: 900;
          letter-spacing: -1px;
          line-height: 1.15;
          color: #ffffff;
          margin-bottom: 12px;
          max-width: 580px;
        }
        .h1-landscape em {
          font-style: normal;
          color: #f4ba00;
        }
        .desc-landscape {
          font-size: 18px;
          color: #94a3b8;
          font-weight: 500;
          line-height: 1.4;
          margin-bottom: 28px;
          max-width: 540px;
        }
        .pills-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;
        }
        .pill {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 9999px;
          font-size: 14.5px;
          font-weight: 700;
        }
        .pill-gold {
          background: rgba(244, 186, 0, 0.12);
          border: 1.5px solid #f4ba00;
          color: #f4ba00;
        }
        .pill-white {
          background: #14171d;
          border: 1.5px solid #282d37;
          color: #f3f4f6;
        }

        /* Right Showcase Window */
        .right-showcase {
          flex: 1;
          height: ${cfg.h > 700 ? '540px' : '470px'};
          background: #14171d;
          border: 2px solid #282d37;
          border-radius: 18px;
          overflow: hidden;
          box-shadow: 0 20px 50px rgba(0,0,0,0.85);
          display: flex;
          flex-direction: column;
        }
        .showcase-header {
          height: 44px;
          background: #101216;
          border-bottom: 1.5px solid #222630;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 18px;
        }
        .showcase-tabs {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        .tab-item {
          padding: 4px 12px;
          border-radius: 5px;
          font-size: 12px;
          font-weight: 700;
        }
        .tab-active {
          background: rgba(244, 186, 0, 0.14);
          color: #f4ba00;
          border: 1px solid #f4ba00;
        }
        .tab-inactive {
          color: #94a3b8;
          border: 1px solid transparent;
        }
        .showcase-status {
          font-size: 12px;
          color: #fedd3d;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .showcase-status::before {
          content: '';
          display: inline-block;
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #f4ba00;
        }
      `}
    </style>
  </head>
  <body>
    <div class="glow-layer"></div>
    <div class="grid-layer"></div>
    <div class="outer-frame"></div>

    ${isCompactSquare ? `
      <!-- WhatsApp Compact Square Card (600x600) -->
      <div class="container-compact">
        <div class="logo-box-compact">
          ${getC2VectorLogoSvg(54)}
        </div>
        <div class="brand-name-compact">C2<span>Vector</span></div>
        <h1 class="hero-h1-compact">Free Image to Vector<br>&amp; <em>SVG Converter</em></h1>
        
        <div class="pills-compact">
          <div class="pill-compact pill-gold-compact">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            0% Generative AI
          </div>
          <div class="pill-compact pill-white-compact">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
            100% Client-Side Private
          </div>
        </div>

        <div class="footer-tag-compact">deekshithvodela.github.io/c2vector</div>
      </div>
    ` : isLargeSquare ? `
      <!-- 1:1 Large Square Card (1200x1200) -->
      <div class="container-square">
        <div>
          <div class="top-row">
            <div class="logo-box-lg">
              ${getC2VectorLogoSvg(72)}
            </div>
            <div class="brand-text-block">
              <div class="brand-name-lg">C2<span>Vector</span></div>
              <div class="brand-subtitle-lg">Deterministic Mathematical Vectorizer</div>
            </div>
          </div>

          <div class="heading-square">
            <h1 class="h1-square">Free Image to Vector<br>&amp; <em>SVG Converter</em></h1>
            <p class="sub-square">100% In-Browser Vectorization • Zero Cloud Uploads • Infinite Bézier Scalability</p>
          </div>

          <div class="pills-row-lg">
            <div class="pill-lg pill-gold-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              0% Generative AI
            </div>
            <div class="pill-lg pill-gold-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              100% Client-Side
            </div>
            <div class="pill-lg pill-white-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Zero Cloud Uploads
            </div>
            <div class="pill-lg pill-white-lg">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 15c0-4.97 4.03-9 9-9"/></svg>
              Continuous Bézier Splines
            </div>
          </div>
        </div>

        <div class="showcase-container-sq">
          <div class="showcase-header">
            <div class="showcase-tabs">
              <span class="tab-item tab-active">Master Vector (Gold)</span>
              <span class="tab-item tab-inactive">Continuous Bézier</span>
              <span class="tab-item tab-inactive">Spot Colors</span>
            </div>
            <span style="font-size:13px; color:#fedd3d; font-weight:700;">Pure Mathematical Precision</span>
          </div>
          <div style="flex:1; width:100%; height:100%; overflow:hidden;">
            ${getVectorShowcaseSvg()}
          </div>
        </div>
      </div>
    ` : `
      <!-- Landscape Formats: 1.91:1 (1200x630), 16:9 (1200x675), 4:3 (1200x900) -->
      <div class="container-landscape">
        <div class="left-content">
          <div class="brand-lockup">
            <div class="logo-box">
              ${getC2VectorLogoSvg(56)}
            </div>
            <div class="brand-text">
              <div class="brand-name">C2<span>Vector</span></div>
              <div class="brand-sub">Deterministic Vector Studio</div>
            </div>
          </div>

          <h1 class="h1-landscape">Free Image to Vector<br>&amp; <em>SVG Converter</em></h1>
          <p class="desc-landscape">Transform raster graphics locally into infinitely scalable SVG vectors and print-ready PDF suites with 0 cloud dependencies.</p>

          <div class="pills-grid">
            <div class="pill pill-gold">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
              0% Generative AI
            </div>
            <div class="pill pill-gold">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
              100% Client-Side
            </div>
            <div class="pill pill-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
              Zero Cloud Uploads
            </div>
            <div class="pill pill-white">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="6" cy="18" r="3"/><circle cx="18" cy="6" r="3"/><path d="M6 15c0-4.97 4.03-9 9-9"/></svg>
              Continuous Bézier Splines
            </div>
          </div>
        </div>

        <div class="right-showcase">
          <div class="showcase-header">
            <div class="showcase-tabs">
              <span class="tab-item tab-active">Master Vector</span>
              <span class="tab-item tab-inactive">Continuous Paths</span>
              <span class="tab-item tab-inactive">Spot Colors</span>
            </div>
            <div class="showcase-status">Mathematical Studio</div>
          </div>
          <div style="flex:1; width:100%; height:100%; overflow:hidden;">
            ${getVectorShowcaseSvg()}
          </div>
        </div>
      </div>
    `}
  </body>
  </html>
  `;
}

async function run() {
  console.log('🎨 Launching Playwright to render Brand-Aligned OpenGraph Asset Suite (Yellow & B&W ONLY)...');
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const configs = [
    { name: 'og-image.jpg', w: 1200, h: 630, quality: 80 },      // 1.91:1 Landscape Hero (< 90 KB)
    { name: 'og-discover.jpg', w: 1200, h: 675, quality: 78 },   // 16:9 Google Discover (< 95 KB)
    { name: 'og-search.jpg', w: 1200, h: 900, quality: 76 },     // 4:3 Google Search Cards (< 95 KB)
    { name: 'og-image-1x1.jpg', w: 1200, h: 1200, quality: 70 }, // 1:1 High-Res Square (< 100 KB)
    { name: 'og-square.jpg', w: 600, h: 600, quality: 84 }       // 1:1 Compact WhatsApp Thumbnail (< 60 KB)
  ];

  for (const cfg of configs) {
    await page.setViewportSize({ width: cfg.w, height: cfg.h });
    const html = generateHtml(cfg);
    await page.setContent(html, { waitUntil: 'load' });
    // Wait for fonts & rendering
    await page.waitForTimeout(100);

    const destPath = path.join(OG_DIR, cfg.name);
    await page.screenshot({
      path: destPath,
      type: 'jpeg',
      quality: cfg.quality
    });

    const stat = fs.statSync(destPath);
    const sizeKb = (stat.size / 1024).toFixed(1);
    console.log(`✅ Synthesized ${cfg.name} (${cfg.w}x${cfg.h}) -> ${sizeKb} KB (Target < 100 KB)`);
  }

  await browser.close();
  console.log('🎉 OpenGraph asset suite generation complete!');
}

run().catch(err => {
  console.error('❌ Error generating OG cards:', err);
  process.exit(1);
});
