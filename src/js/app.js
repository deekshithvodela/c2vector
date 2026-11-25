/**
 * c2vector - Main Application Controller
 * Handles UI events, Web Worker orchestration, reactive telemetry, and multi-format vector exports
 */

import { compileMasterVectorPdf } from './export/pdf-builder.js';
import { exportSvgToPng } from './export/png-exporter.js';
import { refineSvgPathD } from './engine/path-refiner.js';

// Artboard metadata definitions
const ARTBOARD_METADATA = {
  masterVibrant: {
    title: 'Master Vibrant Vector v2 (Print-Ready)',
    subtitle: 'Calibrated with Tone Match Index for High-Gamut Print',
    filename: 'master_vibrant_vector_v2.svg'
  },
  masterFaithful: {
    title: 'Master Faithful Vector (HD Reference)',
    subtitle: '64 Color Tiers Authentic Source Match',
    filename: 'master_faithful_vector.svg'
  },
  canvaOptimized: {
    title: 'Canva-Optimized Master Vector (≤4 Editable Colors)',
    subtitle: 'Unlocks Canva Color Swatches, Flat SVG 1.1 & Hole-Safe Paths',
    filename: 'master_canva_optimized.svg'
  },
  posterizeColor: {
    title: 'Color Posterize Print Plate (8-Tone Planar)',
    subtitle: 'Bold Graphic Chromatic Planes for Silkscreen Art',
    filename: 'posterize_color_8tone.svg'
  },
  pixelMatch: {
    title: 'Seamless Pixel-Match Vector (Anti-Grid HD)',
    subtitle: 'Photorealistic Seamless Color Planes (Zero Grid Lines)',
    filename: 'seamless_pixel_match_hd.svg'
  },
  monochrome: {
    title: '1-Bit Otsu Monochrome Vector Mask',
    subtitle: 'Solid High-Contrast Black & White Vector Mask',
    filename: 'otsu_monochrome_mask.svg'
  },
  twoTone: {
    title: '2-Tone Duotone Print Plate (Key + Midtone Inks)',
    subtitle: 'Discrete 2-Level Ink Separation (Deep Shadows & Midtones)',
    filename: 'twotone_duotone_plate.svg'
  },
  posterize4: {
    title: '4-Tone Posterize Print Plate (Positive)',
    subtitle: 'Quantized Grayscale for Screenprint & Litho',
    filename: 'posterize_4tone_positive.svg'
  },
  posterize4Inverted: {
    title: '4-Tone Negative Plate (Inverted)',
    subtitle: 'Negative Plate for Dark Apparel & Laser Engraving',
    filename: 'posterize_4tone_negative.svg'
  },
  posterize8: {
    title: '8-Tone Posterize Print Plate (Positive)',
    subtitle: 'Graduated Grayscale Art Plate with Fine Modeling',
    filename: 'posterize_8tone_positive.svg'
  },
  posterize8Inverted: {
    title: '8-Tone Negative Plate (Inverted)',
    subtitle: 'Discharge Ink & Fine Art Lithography Plate',
    filename: 'posterize_8tone_negative.svg'
  },
  stencil: {
    title: 'Bridge-Connected Laser Cut Stencil',
    subtitle: 'Topologically Island-Bridged Laser & Plotter Cut Paths',
    filename: 'bridge_cut_stencil.svg'
  },
  cannyEdges: {
    title: 'CAD Plotter Wireframe (1-Pass Hairlines)',
    subtitle: 'Single-Line Centerline Vector Strokes for CNC, Laser & Plotters',
    filename: 'canny_hairline_wireframe.svg'
  },
  chromaticEdges: {
    title: 'Sticker Die-Cut Contour (#CutContour)',
    subtitle: 'Distance-Expanded Carrier Cushion, Magenta #CutContour & Crop Marks',
    filename: 'sticker_die_cut_contour.svg'
  }
};

// Logo-specific artboard metadata definitions
const LOGO_ARTBOARD_METADATA = {
  masterVibrant: {
    title: 'Master Spot-Color Vector (90° Corner Preserved)',
    subtitle: 'Calibrated Dominant Brand Colors with Sharp Right Angles',
    filename: 'master_logo_vector.svg'
  },
  masterFaithful: {
    title: 'Master Faithful Vector (Source Spot Match)',
    subtitle: 'Exact Source Spot Colors with Corner-Preserving Splines',
    filename: 'master_faithful_logo.svg'
  },
  canvaOptimized: {
    title: 'Canva-Optimized Master Logo (≤4 Editable Colors)',
    subtitle: 'Unlocks Canva Color Swatches, Flat SVG 1.1 & Hole-Safe Paths',
    filename: 'logo_canva_optimized.svg'
  },
  posterizeColor: {
    title: 'Spot-Color Reduction (Up to 8 Inks)',
    subtitle: 'Preserves up to 8 salient brand spot colors for multi-color screenprinting & embroidery',
    filename: 'logo_spot_color_8tone.svg'
  },
  pixelMatch: {
    title: 'Seamless Planar Vector (Zero-Gap Decal)',
    subtitle: 'Contiguous Boundary Fusion with Zero Inter-Path White Seams',
    filename: 'logo_seamless_planar.svg'
  },
  monochrome: {
    title: '1-Bit High-Contrast Silhouette (Vinyl Decal)',
    subtitle: 'Solid Black Vector Artwork on White Contrast Plate',
    filename: 'logo_monochrome_silhouette.svg'
  },
  twoTone: {
    title: '2-Tone Duotone Print Plate (Key + Midtone Inks)',
    subtitle: 'Discrete 2-Level Ink Separation (Deep Shadows & Midtones)',
    filename: 'logo_twotone_duotone.svg'
  },
  posterize4: {
    title: '4-Tone Grayscale Plate (Screenprint Separation)',
    subtitle: 'Discrete 4-Level Ink Steps (Shadows, Midtones, Highlights)',
    filename: 'logo_posterize_4tone.svg'
  },
  posterize4Inverted: {
    title: '4-Tone Negative Plate (Dark Apparel & Laser)',
    subtitle: 'Inverted Ink Plate for Dark Garments & Wood/Laser Engraving',
    filename: 'logo_posterize_4tone_negative.svg'
  },
  posterize8: {
    title: '8-Tone Grayscale Plate (Fine Art Litho Modeling)',
    subtitle: '8 Graduated Tonal Levels for Rich Shading & Depth',
    filename: 'logo_posterize_8tone.svg'
  },
  posterize8Inverted: {
    title: '8-Tone Negative Plate (Discharge Ink Plate)',
    subtitle: 'Inverted 8-Level Discharge Printing Plate for Dark Fabric',
    filename: 'logo_posterize_8tone_negative.svg'
  },
  stencil: {
    title: 'Bridge-Connected Stencil (Laser & Vinyl Plotter)',
    subtitle: 'Topologically Bridged Islands to Prevent Internal Loop Dropouts',
    filename: 'logo_cut_stencil.svg'
  },
  cannyEdges: {
    title: 'CAD Plotter Wireframe (Untrapped Cut Paths)',
    subtitle: 'Clean Single-Pass Spot Outlines Without 1px Overlap Traps',
    filename: 'logo_plotter_wireframe.svg'
  },
  chromaticEdges: {
    title: 'Sticker Die-Cut Contour (#CutContour)',
    subtitle: 'Expanded Vinyl Carrier Offset, Magenta #CutContour & Registration Marks',
    filename: 'logo_die_cut_contour.svg'
  }
};

// Application State
let worker = null;
let currentResults = null;
let activeArtboard = 'masterVibrant';
let currentZoom = 1;
let panX = 0;
let panY = 0;
let isPanning = false;
let startPointerX = 0;
let startPointerY = 0;
let initialPanX = 0;
let initialPanY = 0;
let isGridOn = false;
let deferredPrompt = null;
let currentEdgeOpacity = 0;
let areEdgesVisible = true;
let currentSourceFileName = 'c2vector_artwork';
let currentSourceImagePayload = null;
let currentStrokeWeight = 0;
let currentRefineStrength = 0;
let refineRafId = null;
let refineSyncTimer = null;
let currentColorBudget = 8;
let pendingColorBudget = 8;
let originalSvgsSnapshot = null;
let activeSoloPath = null;
let preSoloVisibility = null;
const origPathDMap = new WeakMap();

function cancelPendingRefine() {
  if (refineRafId !== null) {
    cancelAnimationFrame(refineRafId);
    refineRafId = null;
  }
  if (refineSyncTimer !== null) {
    clearTimeout(refineSyncTimer);
    refineSyncTimer = null;
  }
}

function flushPendingRefine() {
  if (refineRafId !== null) {
    cancelAnimationFrame(refineRafId);
    refineRafId = null;
    const val = parseInt(refineStrokeSlider?.value || '0', 10);
    applyRefineStroke(val, false);
  }
  if (refineSyncTimer !== null) {
    clearTimeout(refineSyncTimer);
    refineSyncTimer = null;
  }
}

// DOM References
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const btnBrowse = document.getElementById('btnBrowse');
const btnSample = document.getElementById('btnSample');

const btnThemeToggle = document.getElementById('btnThemeToggle');
const themeIconSun = document.getElementById('themeIconSun');
const themeIconMoon = document.getElementById('themeIconMoon');

const edgeOpacityControl = document.getElementById('edgeOpacityControl');
const edgeOpacitySlider = document.getElementById('edgeOpacitySlider');
const edgeOpacityVal = document.getElementById('edgeOpacityVal');
const btnToggleEdges = document.getElementById('btnToggleEdges');

const progressCard = document.getElementById('progressCard');
const progressTitle = document.getElementById('progressStatus');
const progressPercent = document.getElementById('progressPercent');
const progressBar = document.getElementById('progressBar');
const progressBarAria = document.getElementById('progressBarWrapper');

const workbench = document.getElementById('workbench');
const tabNav = document.getElementById('tabNav');
const viewport = document.getElementById('viewport');
const activeArtboardTitle = document.getElementById('activeArtboardTitle');
const btnToggleGrid = document.getElementById('btnToggleGrid');
const btnCenterCanvas = document.getElementById('btnCenterCanvas');

const metricRes = document.getElementById('metricRes');
const metricTiers = document.getElementById('metricTiers');
const metricTmi = document.getElementById('metricTmi');
const metricSize = document.getElementById('metricSize');

const workbenchPaletteCard = document.getElementById('workbenchPaletteCard');
const workbenchPaletteSwatches = document.getElementById('workbenchPaletteSwatches');
const paletteCountBadge = document.getElementById('paletteCountBadge');

// Flagship Vector Pro Studio Controls
const logoProStudioCard = document.getElementById('logoProStudioCard');
const colorBudgetLabel = document.getElementById('colorBudgetLabel');
const colorBudgetSlider = document.getElementById('colorBudgetSlider');
const colorBudgetVal = document.getElementById('colorBudgetVal');
const btnApplyColorBudget = document.getElementById('btnApplyColorBudget');
const presetChips = document.querySelectorAll('.preset-chip');
const strokeWeightSlider = document.getElementById('strokeWeightSlider');
const strokeWeightVal = document.getElementById('strokeWeightVal');
const btnResetStroke = document.getElementById('btnResetStroke');
const refineStrokeSlider = document.getElementById('refineStrokeSlider');
const btnResetRefine = document.getElementById('btnResetRefine');
const studioLayersList = document.getElementById('studioLayersList');
const btnResetLayers = document.getElementById('btnResetLayers');

const copyToast = document.getElementById('copyToast');
const toastMsg = document.getElementById('toastMsg');

const btnDownloadSvg = document.getElementById('btnDownloadSvg');
const btnDownloadPdf = document.getElementById('btnDownloadPdf');
const btnDownloadAllSvg = document.getElementById('btnDownloadAllSvg');

const pngModal = document.getElementById('pngModal');
const btnOpenPngModal = document.getElementById('btnOpenPngModal');
const btnClosePngModal = document.getElementById('btnClosePngModal');
const btnConfirmPng = document.getElementById('btnConfirmPng');

const btnInstallPwa = document.getElementById('btnInstallPwa');
const tabModePhoto = document.getElementById('tabModePhoto');
const tabModeLogo = document.getElementById('tabModeLogo');
const uploadTitle = document.getElementById('uploadTitle');
const uploadSubtitle = document.getElementById('uploadSubtitle');
const logoFileInput = document.getElementById('logoFileInput');
const btnBrowseLogo = document.getElementById('btnBrowseLogo');
const btnSampleLogo = document.getElementById('btnSampleLogo');

// Theme Switcher Controller
function updateThemeIcons(theme) {
  if (!themeIconSun || !themeIconMoon) return;
  if (theme === 'dark') {
    themeIconSun.style.display = 'block';
    themeIconMoon.style.display = 'none';
    if (btnThemeToggle) btnThemeToggle.setAttribute('aria-label', 'Switch to Light Mode');
  } else {
    themeIconSun.style.display = 'none';
    themeIconMoon.style.display = 'block';
    if (btnThemeToggle) btnThemeToggle.setAttribute('aria-label', 'Switch to Dark Mode');
  }
}

const initialTheme = document.documentElement.getAttribute('data-theme') || 'dark';
updateThemeIcons(initialTheme);

btnThemeToggle?.addEventListener('click', () => {
  const active = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const nextTheme = active === 'light' ? 'dark' : 'light';
  document.documentElement.setAttribute('data-theme', nextTheme);
  if (nextTheme === 'dark') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  localStorage.setItem('c2vector-theme', nextTheme);
  updateThemeIcons(nextTheme);
});

// Toast & Clipboard Helpers
let toastTimeout = null;
function showCopyToast(msg) {
  if (!copyToast) return;
  if (toastMsg) toastMsg.textContent = msg;
  copyToast.classList.add('visible');
  if (toastTimeout) clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    copyToast.classList.remove('visible');
  }, 2200);
}

async function copyHexToClipboard(hex, chipElem) {
  let copied = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(hex);
      copied = true;
    }
  } catch (_) {}

  if (!copied) {
    try {
      const ta = document.createElement('textarea');
      ta.value = hex;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      copied = true;
    } catch (_) {}
  }

  if (chipElem) {
    chipElem.classList.add('copied');
    setTimeout(() => chipElem.classList.remove('copied'), 1200);
  }
  showCopyToast(`Copied ${hex} to clipboard!`);
}

// Initialize Web Worker
function initWorker() {
  if (worker) {
    worker.terminate();
  }
  worker = new Worker(new URL('./engine/worker.js', import.meta.url), { type: 'module' });
  worker.onmessage = handleWorkerMessage;
  worker.onerror = (err) => {
    console.error('Vector worker runtime error:', err);
    alert('Worker error during vector synthesis: ' + (err.message || 'Unknown error'));
    hideProgress();
  };
}

// Version-Stamped Cache & Cookie Hygiene on Rollouts
const APP_VERSION = typeof __APP_VERSION__ !== 'undefined' ? __APP_VERSION__ : 'dev';
(function enforceCleanRolloutState() {
  try {
    const storedVersion = localStorage.getItem('c2vector-app-version');
    if (storedVersion && storedVersion !== APP_VERSION) {
      // Clear stale session state and expire any non-essential domain cookies on version upgrade
      sessionStorage.clear();
      if (document.cookie) {
        document.cookie.split(';').forEach((c) => {
          const name = c.split('=')[0].trim();
          if (name) {
            document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
          }
        });
      }
      const savedTheme = localStorage.getItem('c2vector-theme');
      if (savedTheme !== 'dark' && savedTheme !== 'light') {
        localStorage.removeItem('c2vector-theme');
      }
      if ('caches' in window && APP_VERSION !== 'dev') {
        const expectedCache = `c2vector-${APP_VERSION}`;
        caches.keys().then((keys) => {
          keys.filter((k) => k !== expectedCache).forEach((k) => caches.delete(k));
        }).catch(() => {});
      }
    }
    localStorage.setItem('c2vector-app-version', APP_VERSION);
  } catch {}
})();

// Service Worker Registration for PWA Offline Caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const hadController = Boolean(navigator.serviceWorker.controller);
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      // Only notify on genuine SW upgrade (never reload mid-session or on first install)
      if (hadController && typeof showCopyToast === 'function') {
        showCopyToast('App updated to latest version — refresh when ready');
      }
    });

    navigator.serviceWorker.register('./sw.js').then((reg) => {
      // Proactively check for updated worker on load
      reg.update().catch(() => {});
      console.log('c2vector PWA Service Worker registered:', reg.scope);
    }).catch((err) => {
      console.warn('PWA Service Worker registration skipped:', err);
    });
  });
}

// PWA Install Prompt Handling
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (btnInstallPwa && !isStandalone) {
    btnInstallPwa.style.display = 'inline-flex';
  }
});

window.addEventListener('appinstalled', () => {
  if (btnInstallPwa) btnInstallPwa.style.display = 'none';
  deferredPrompt = null;
});

async function triggerInstallPrompt() {
  if (!deferredPrompt) return;
  deferredPrompt.prompt();
  const { outcome } = await deferredPrompt.userChoice;
  if (outcome === 'accepted') {
    if (btnInstallPwa) btnInstallPwa.style.display = 'none';
  }
  deferredPrompt = null;
}

btnInstallPwa?.addEventListener('click', triggerInstallPrompt);

// Engine Mode Switcher (Logo & Typography default first, Photo / Decal second)
let currentEngineMode = 'logo';

function setEngineMode(mode) {
  currentEngineMode = mode;
  if (mode === 'logo') {
    tabModeLogo?.classList.add('active');
    tabModeLogo?.setAttribute('aria-selected', 'true');
    tabModePhoto?.classList.remove('active');
    tabModePhoto?.setAttribute('aria-selected', 'false');
    if (uploadTitle) uploadTitle.textContent = 'Drop your logo or graphic here or browse';
    if (uploadSubtitle) uploadSubtitle.textContent = 'Supports PNG, SVG, WebP, JPEG • Auto spot-color quantization, sharp 90° corner snapping & typography preservation';
    if (btnBrowse) btnBrowse.style.display = 'none';
    if (btnBrowseLogo) btnBrowseLogo.style.display = 'inline-flex';
    if (btnSample) btnSample.style.display = 'none';
    if (btnSampleLogo) btnSampleLogo.style.display = 'inline-flex';
  } else {
    tabModePhoto?.classList.add('active');
    tabModePhoto?.setAttribute('aria-selected', 'true');
    tabModeLogo?.classList.remove('active');
    tabModeLogo?.setAttribute('aria-selected', 'false');
    if (uploadTitle) uploadTitle.textContent = 'Drop your photo here or browse';
    if (uploadSubtitle) uploadSubtitle.textContent = 'Supports PNG, JPEG, WebP, AVIF • Auto-resampling, Canny edge detection & continuous Bézier curve fitting';
    if (btnBrowse) btnBrowse.style.display = 'inline-flex';
    if (btnBrowseLogo) btnBrowseLogo.style.display = 'none';
    if (btnSample) btnSample.style.display = 'inline-flex';
    if (btnSampleLogo) btnSampleLogo.style.display = 'none';
  }
}

tabModePhoto?.addEventListener('click', (e) => {
  e.stopPropagation();
  setEngineMode('photo');
});

tabModeLogo?.addEventListener('click', (e) => {
  e.stopPropagation();
  setEngineMode('logo');
});

// Drag and Drop Ingestion
['dragenter', 'dragover'].forEach(name => {
  dropzone?.addEventListener(name, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.add('drag-active');
  });
});

['dragleave', 'drop'].forEach(name => {
  dropzone?.addEventListener(name, (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropzone.classList.remove('drag-active');
  });
});

dropzone?.addEventListener('drop', (e) => {
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    processImageFile(files[0], currentEngineMode);
  }
});

dropzone?.addEventListener('click', (e) => {
  // If clicked directly outside buttons, trigger appropriate file input
  if (e.target.closest('button') || e.target.closest('input')) return;
  if (currentEngineMode === 'logo') {
    logoFileInput?.click();
  } else {
    fileInput?.click();
  }
});

btnBrowse?.addEventListener('click', (e) => {
  e.stopPropagation();
  fileInput?.click();
});

btnBrowseLogo?.addEventListener('click', (e) => {
  e.stopPropagation();
  logoFileInput?.click();
});

fileInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    processImageFile(file, currentEngineMode);
  }
  e.target.value = '';
});

logoFileInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    processImageFile(file, 'logo');
  }
  e.target.value = '';
});

btnSample?.addEventListener('click', (e) => {
  e.stopPropagation();
  processImageUrl('./assets/sample_photo.png', 'sample_photo.png', 'photo');
});

btnSampleLogo?.addEventListener('click', (e) => {
  e.stopPropagation();
  processImageUrl('./assets/sample_logo.png', 'sample_logo.png', 'logo');
});

// Process Image Ingestion
async function processImageFile(file, mode = currentEngineMode) {
  const objectUrl = URL.createObjectURL(file);
  await processImageUrl(objectUrl, file.name, mode);
  setTimeout(() => URL.revokeObjectURL(objectUrl), 10000);
}

async function processImageUrl(imageUrl, imageName, mode = currentEngineMode) {
  if (imageName) {
    currentSourceFileName = imageName.replace(/\.[^/.]+$/, '').trim();
  }
  showProgress();

  const img = new Image();
  img.crossOrigin = 'anonymous';
  img.src = imageUrl;

  try {
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = () => reject(new Error('Failed to load image at ' + imageUrl));
    });
    if ('decode' in img) {
      try {
        await img.decode();
      } catch (_) {}
    }
  } catch (err) {
    alert(err.message);
    hideProgress();
    return;
  }

  let w = img.naturalWidth || img.width;
  let h = img.naturalHeight || img.height;

  // Constrain uploaded artwork safely to HD budget (<= 1200px max edge)
  const maxDim = 1200;
  if (w > maxDim || h > maxDim) {
    if (w >= h) {
      h = Math.round(h * (maxDim / w));
      w = maxDim;
    } else {
      w = Math.round(w * (maxDim / h));
      h = maxDim;
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  
  // Draw raw image preserving native alpha channels
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Retain pristine source raster payload in memory for real-time spot color quantization tuning
  currentSourceImagePayload = {
    data: new Uint8ClampedArray(data),
    width: w,
    height: h,
    mode: mode,
    imageName: currentSourceFileName
  };

  // Proactive memory cleanup for large uploaded images
  canvas.width = 1;
  canvas.height = 1;
  img.src = '';

  initWorker();
  worker.postMessage({
    id: Date.now(),
    rawPixels: data,
    width: w,
    height: h,
    options: {
      mode: mode,
      tiers: mode === 'logo' ? 32 : 24,
      maxColors: 32
    }
  });
}

// Progress UI Functions
function showProgress() {
  if (workbench) {
    workbench.style.display = 'none';
  }
  if (progressCard) {
    progressCard.style.display = 'block';
    progressCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }
  updateProgress(1, 'Analyzing Photo Resolution...', 5);
  // Reset badges
  for (let i = 1; i <= 6; i++) {
    const badge = document.getElementById(`stepBadge${i}`);
    if (badge) {
      badge.classList.remove('active', 'complete');
    }
  }
}

function updateProgress(step, name, pct) {
  if (progressTitle) progressTitle.textContent = name;
  if (progressPercent) progressPercent.textContent = `${pct}%`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressBarAria) progressBarAria.setAttribute('aria-valuenow', pct);

  for (let i = 1; i <= 6; i++) {
    const badge = document.getElementById(`stepBadge${i}`);
    if (!badge) continue;
    if (i < step) {
      badge.classList.remove('active');
      badge.classList.add('complete');
    } else if (i === step) {
      badge.classList.add('active');
      badge.classList.remove('complete');
    } else {
      badge.classList.remove('active', 'complete');
    }
  }
}

function hideProgress() {
  if (progressCard) progressCard.style.display = 'none';
}

// Handle Worker Message
function handleWorkerMessage(e) {
  const { type, progress, results, error } = e.data;

  if (type === 'progress') {
    updateProgress(progress.step, progress.name, progress.pct);
  } else if (type === 'done') {
    updateProgress(6, 'Synthesis Complete', 100);
    currentResults = results;

    setTimeout(() => {
      hideProgress();
      renderWorkbench(results);
    }, 400);
  } else if (type === 'error') {
    alert('Vector synthesis error: ' + error);
    hideProgress();
  }
}

// Studio Workbench Display
function renderWorkbench(results) {
  if (!workbench) return;
  workbench.style.display = 'block';
  workbench.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // Clean initialization: reset magnification & pan to 1x baseline for each newly ingested image
  resetPanAndZoom();

  // Reset active artboard to masterVibrant for each newly ingested image
  activeArtboard = 'masterVibrant';
  if (tabNav) {
    tabNav.querySelectorAll('.tab-btn').forEach(b => {
      const isMaster = b.getAttribute('data-artboard') === 'masterVibrant';
      b.classList.toggle('active', isMaster);
      b.setAttribute('aria-selected', isMaster ? 'true' : 'false');
    });
  }

  // Update Telemetry metrics
  if (metricRes) metricRes.textContent = `${results.dimensions.width} × ${results.dimensions.height} px`;
  if (metricTiers) metricTiers.textContent = `${results.tiers} Distinct Tiers`;
  if (metricTmi && results.tmiReport) {
    metricTmi.textContent = `r = ${results.tmiReport.pearsonR.toFixed(3)}`;
  }

  // Populate Workbench Sidebar Color Palette
  if (paletteCountBadge && results.palette) {
    paletteCountBadge.textContent = `${results.palette.length} Colors`;
  }
  if (workbenchPaletteSwatches && results.palette) {
    workbenchPaletteSwatches.innerHTML = '';
    results.palette.forEach((c, idx) => {
      const chip = document.createElement('div');
      chip.className = 'swatch-chip';
      chip.style.backgroundColor = c.hex;
      chip.setAttribute('data-hex', c.hex);
      chip.setAttribute('role', 'button');
      chip.setAttribute('tabindex', '0');
      chip.setAttribute('aria-label', `Color ${c.hex}, Tier ${idx + 1}`);
      chip.title = `Tier ${idx + 1}: ${c.hex} (Click to copy)`;

      // Desktop Click Copy
      chip.addEventListener('click', () => copyHexToClipboard(c.hex, chip));
      chip.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          copyHexToClipboard(c.hex, chip);
        }
      });

      // Mobile Long-Press Copy (~400ms) with haptic feedback
      let touchTimer = null;
      let touchMoved = false;
      chip.addEventListener('touchstart', () => {
        touchMoved = false;
        touchTimer = setTimeout(() => {
          if (!touchMoved) {
            if (navigator.vibrate) {
              try { navigator.vibrate([30]); } catch (_) {}
            }
            copyHexToClipboard(c.hex, chip);
          }
        }, 400);
      }, { passive: true });

      chip.addEventListener('touchmove', () => {
        touchMoved = true;
        if (touchTimer) clearTimeout(touchTimer);
      }, { passive: true });

      chip.addEventListener('touchend', () => {
        if (touchTimer) clearTimeout(touchTimer);
      });

      workbenchPaletteSwatches.appendChild(chip);
    });
  }

  // Initialize alpha-only transparency grid state
  isGridOn = Boolean(results.isTransparentLogo || results.isTransparentImage || results.knockoutBackground);
  if (btnToggleGrid) {
    btnToggleGrid.classList.toggle('active', isGridOn);
    btnToggleGrid.setAttribute('aria-pressed', isGridOn ? 'true' : 'false');
    btnToggleGrid.title = isGridOn
      ? 'Transparency grid ON (alpha-only transparent SVG; click to show solid backdrop)'
      : 'Solid backdrop plate ON (click to toggle transparency grid)';
  }
  if (viewport) {
    viewport.classList.toggle('grid-pattern', isGridOn);
  }
  if (results.transparentSvgs && results.solidSvgs) {
    results.svgs = isGridOn ? results.transparentSvgs : results.solidSvgs;
  }

  // Snapshot original SVGs for non-destructive layer reset
  if (results) {
    originalSvgsSnapshot = {
      solid: results.solidSvgs ? { ...results.solidSvgs } : (results.svgs ? { ...results.svgs } : {}),
      transparent: results.transparentSvgs ? { ...results.transparentSvgs } : (results.svgs ? { ...results.svgs } : {})
    };
  }

  // Show Vector Pro Studio Card in BOTH Logo Mode and Photo Mode
  const isLogo = results && results.mode === 'logo';
  if (logoProStudioCard) {
    logoProStudioCard.style.display = 'flex';
  }

  // Synchronize color/tier budget slider with current results
  const unit = isLogo ? 'Inks' : 'Tiers';
  const budget = isLogo
    ? (results.options?.maxColors || results.tiers || 8)
    : (results.options?.tiers || results.tiers || 48);
  currentColorBudget = budget;
  pendingColorBudget = budget;
  if (colorBudgetLabel) {
    colorBudgetLabel.textContent = isLogo ? 'Spot Color Budget' : 'Color Tier Budget';
  }
  if (colorBudgetSlider) {
    colorBudgetSlider.max = isLogo ? '32' : '48';
    colorBudgetSlider.value = String(budget);
  }
  if (colorBudgetVal) colorBudgetVal.textContent = `${budget} ${unit}`;
  if (btnApplyColorBudget) btnApplyColorBudget.classList.remove('is-dirty');
  presetChips.forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.getAttribute('data-colors'), 10) === budget);
  });

  // Display default artboard
  displayActiveArtboard();
}

function displayActiveArtboard() {
  if (!currentResults || !viewport) return;
  const svgStr = currentResults.svgs[activeArtboard];
  if (!svgStr) return;

  activeSoloPath = null;
  preSoloVisibility = null;
  cancelPendingRefine();
  currentRefineStrength = 0;
  if (refineStrokeSlider) refineStrokeSlider.value = '0';

  viewport.innerHTML = svgStr;
  initializeBaseViewBox();

  if (viewport) {
    viewport.classList.toggle('grid-pattern', isGridOn);
  }

  const isLogo = currentResults && currentResults.mode === 'logo';
  const metaMap = isLogo ? LOGO_ARTBOARD_METADATA : ARTBOARD_METADATA;
  const meta = metaMap[activeArtboard] || { title: activeArtboard, subtitle: '' };
  if (activeArtboardTitle) {
    activeArtboardTitle.textContent = meta.title;
    activeArtboardTitle.title = meta.subtitle ? `${meta.title} — ${meta.subtitle}` : meta.title;
  }

  const kbSize = (new Blob([svgStr]).size / 1024).toFixed(1);
  if (metricSize) metricSize.textContent = `${kbSize} KB`;

  // Update Edge Opacity control state (greying out when inactive to eliminate layout shift)
  const hasContours = ['masterVibrant', 'masterFaithful'].includes(activeArtboard);
  if (edgeOpacityControl) {
    edgeOpacityControl.classList.toggle('disabled', !hasContours);
    edgeOpacityControl.setAttribute('aria-disabled', (!hasContours).toString());
    edgeOpacityControl.title = hasContours
      ? 'Adjust chromatic edge glaze opacity'
      : 'Edge glaze is only applicable to contour and master vector artboards';
  }
  if (edgeOpacitySlider) {
    edgeOpacitySlider.disabled = !hasContours;
    edgeOpacitySlider.value = Math.round(currentEdgeOpacity * 100);
  }
  if (btnToggleEdges) {
    btnToggleEdges.disabled = !hasContours;
  }
  if (edgeOpacityVal) {
    edgeOpacityVal.textContent = `${Math.round(currentEdgeOpacity * 100)}%`;
  }
  updateContourOpacityInViewport();
  syncContourOpacityInMemory();

  // Re-apply active stroke weight if non-zero
  if (currentStrokeWeight > 0) {
    applyStrokeWeight(currentStrokeWeight, false);
  }

  // Populate dynamic Studio Layers List for active artboard
  populateStudioLayersList();

  applySvgTransform(false);
}

function updateContourOpacityInViewport() {
  if (!viewport) return;
  const targetOpacity = areEdgesVisible ? currentEdgeOpacity : 0;
  const contourGroup = viewport.querySelector('#chromatic-structural-contours, #chromatic-outlines');
  if (contourGroup) {
    contourGroup.setAttribute('opacity', targetOpacity.toFixed(2));
    contourGroup.style.opacity = targetOpacity.toFixed(2);
    contourGroup.style.visibility = targetOpacity === 0 ? 'hidden' : 'visible';
  }
}

function syncContourOpacityInMemory() {
  if (!currentResults?.svgs?.[activeArtboard]) return;
  const targetOpacity = areEdgesVisible ? currentEdgeOpacity : 0;
  try {
    currentResults.svgs[activeArtboard] = currentResults.svgs[activeArtboard].replace(
      /(<g\s+id=["'](?:chromatic-structural-contours|chromatic-outlines)["'][^>]*\s+opacity=["'])[^"']*(")/,
      `$1${targetOpacity.toFixed(2)}$2`
    );
  } catch (err) {
    console.warn('In-memory SVG opacity sync skipped:', err);
  }
}

edgeOpacitySlider?.addEventListener('input', (e) => {
  const pct = parseInt(e.target.value, 10);
  currentEdgeOpacity = pct / 100;
  if (edgeOpacityVal) edgeOpacityVal.textContent = `${pct}%`;
  updateContourOpacityInViewport();
  syncContourOpacityInMemory();
});

edgeOpacitySlider?.addEventListener('change', () => {
  syncContourOpacityInMemory();
});

btnToggleEdges?.addEventListener('click', () => {
  areEdgesVisible = !areEdgesVisible;
  btnToggleEdges.classList.toggle('active', areEdgesVisible);
  btnToggleEdges.classList.toggle('muted', !areEdgesVisible);
  btnToggleEdges.textContent = areEdgesVisible ? 'Visible' : 'Hidden';
  updateContourOpacityInViewport();
  syncContourOpacityInMemory();
});

// --------------------------------------------------------------------------
// Flagship Logo Pro Studio: Real-Time Vector Layer, Stroke & Color Quantization
// --------------------------------------------------------------------------
function colorToHex(colorStr) {
  if (!colorStr) return '#000000';
  const clean = colorStr.trim();
  if (clean.startsWith('#')) {
    if (clean.length === 4) {
      return '#' + clean[1] + clean[1] + clean[2] + clean[2] + clean[3] + clean[3];
    }
    return clean.slice(0, 7);
  }
  const match = clean.match(/\d+/g);
  if (match && match.length >= 3) {
    const r = Math.min(255, Math.max(0, parseInt(match[0], 10))).toString(16).padStart(2, '0');
    const g = Math.min(255, Math.max(0, parseInt(match[1], 10))).toString(16).padStart(2, '0');
    const b = Math.min(255, Math.max(0, parseInt(match[2], 10))).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }
  return '#000000';
}

function syncViewportSvgToMemory() {
  if (!currentResults || !viewport) return;
  flushPendingRefine();
  const viewportSvg = viewport.querySelector('svg');
  if (viewportSvg) {
    const clone = viewportSvg.cloneNode(true);
    if (baseViewBox.width > 0 && baseViewBox.height > 0) {
      clone.setAttribute('viewBox', `${baseViewBox.minX} ${baseViewBox.minY} ${baseViewBox.width} ${baseViewBox.height}`);
    }
    const rawSvg = new XMLSerializer().serializeToString(clone);
    currentResults.svgs[activeArtboard] = rawSvg;
    const kbSize = (new Blob([rawSvg]).size / 1024).toFixed(1);
    if (metricSize) metricSize.textContent = `${kbSize} KB`;
  }
}

function getActiveSvgPaths() {
  if (!viewport) return [];
  const svg = viewport.querySelector('svg');
  if (!svg) return [];
  return Array.from(svg.querySelectorAll('path')).filter(p => {
    const fill = p.getAttribute('fill') || p.style.fill;
    return fill && fill !== 'none' && p.id !== 'logo-silhouette-base' && p.id !== 'subject-silhouette-base';
  });
}

function populateStudioLayersList() {
  if (!studioLayersList || !viewport) return;
  const prevScrollTop = studioLayersList.scrollTop;
  studioLayersList.innerHTML = '';

  const paths = getActiveSvgPaths();
  if (paths.length === 0) {
    const emptyMsg = document.createElement('div');
    emptyMsg.style.cssText = 'color: var(--text-muted); font-size: 0.72rem; padding: 8px; text-align: center;';
    emptyMsg.textContent = 'No editable vector paths on active artboard';
    studioLayersList.appendChild(emptyMsg);
    return;
  }

  // Group paths by normalized Hex Color so chunked or multi-path layers appear as clean swatches
  const groupMap = new Map();
  paths.forEach((path) => {
    const currentFill = path.style.fill || path.getAttribute('fill') || '#000000';
    const hexColor = colorToHex(currentFill).toLowerCase();
    if (!groupMap.has(hexColor)) {
      groupMap.set(hexColor, { hex: hexColor, paths: [] });
    }
    groupMap.get(hexColor).paths.push(path);
  });

  const colorGroups = Array.from(groupMap.values());
  const displayGroups = [...colorGroups].reverse();

  displayGroups.forEach((group, idx) => {
    const hexColor = group.hex;
    const groupPaths = group.paths;
    const layerId = groupPaths[0].id || `color-group-${idx + 1}`;
    const isHidden = groupPaths.every(p => p.style.display === 'none');

    const item = document.createElement('div');
    item.className = 'layer-item' + (isHidden ? ' is-hidden' : '');
    item.setAttribute('role', 'listitem');
    item.setAttribute('data-layer-id', layerId);

    // Left controls: Visibility toggle, Solo, Color chip, HEX label, Name
    const leftDiv = document.createElement('div');
    leftDiv.className = 'layer-left';

    const eyeHiddenSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
    const eyeVisibleSvg = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;

    // Visibility toggle (Eye)
    const visBtn = document.createElement('button');
    visBtn.type = 'button';
    visBtn.className = 'layer-vis-btn';
    visBtn.title = isHidden ? 'Show layer' : 'Hide layer';
    visBtn.setAttribute('aria-label', `Toggle visibility for layer ${idx + 1}`);
    visBtn.innerHTML = isHidden ? eyeHiddenSvg : eyeVisibleSvg;

    visBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeSoloPath) {
        activeSoloPath = null;
        preSoloVisibility = null;
      }
      const nowHidden = groupPaths.every(p => p.style.display === 'none');
      groupPaths.forEach(p => { p.style.display = nowHidden ? '' : 'none'; });
      item.classList.toggle('is-hidden', !nowHidden);
      visBtn.title = !nowHidden ? 'Show layer' : 'Hide layer';
      visBtn.innerHTML = !nowHidden ? eyeHiddenSvg : eyeVisibleSvg;
      populateStudioLayersList();
      syncViewportSvgToMemory();
    });

    // Solo button (S)
    const soloBtn = document.createElement('button');
    soloBtn.type = 'button';
    const isSoloActive = activeSoloPath === hexColor;
    soloBtn.className = 'layer-solo-btn' + (isSoloActive ? ' active' : '');
    soloBtn.title = isSoloActive ? 'Exit solo & restore active layers' : 'Solo isolate this color layer';
    soloBtn.setAttribute('aria-label', `Solo isolate layer ${idx + 1}`);
    soloBtn.textContent = 'S';
    soloBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeSoloPath === hexColor) {
        paths.forEach(p => {
          p.style.display = preSoloVisibility && preSoloVisibility.has(p) ? preSoloVisibility.get(p) : '';
        });
        activeSoloPath = null;
        preSoloVisibility = null;
      } else {
        if (!preSoloVisibility) {
          preSoloVisibility = new Map(paths.map(p => [p, p.style.display || '']));
        }
        activeSoloPath = hexColor;
        const activeSet = new Set(groupPaths);
        paths.forEach(p => { p.style.display = activeSet.has(p) ? '' : 'none'; });
      }
      populateStudioLayersList();
      syncViewportSvgToMemory();
    });

    // Color Swatch Chip & Native Color Picker
    const colorChip = document.createElement('label');
    colorChip.className = 'layer-color-chip';
    colorChip.style.backgroundColor = hexColor;
    colorChip.title = `Change layer color (${hexColor})`;

    const colorInput = document.createElement('input');
    colorInput.type = 'color';
    colorInput.className = 'layer-color-input';
    colorInput.value = hexColor;
    colorInput.setAttribute('aria-label', `Color picker for layer ${idx + 1}`);

    // Live recolor listener across all paths in the color group (0ms latency)
    colorInput.addEventListener('input', (e) => {
      const newHex = e.target.value;
      group.hex = newHex.toLowerCase();
      colorChip.style.backgroundColor = newHex;
      hexText.textContent = newHex.toUpperCase();
      groupPaths.forEach(p => {
        p.setAttribute('fill', newHex);
        p.style.fill = newHex;
        if (currentStrokeWeight > 0) {
          p.style.stroke = newHex;
          p.setAttribute('stroke', newHex);
        }
      });
      syncViewportSvgToMemory();
    });

    colorChip.appendChild(colorInput);

    // HEX Text Label
    const hexText = document.createElement('span');
    hexText.className = 'layer-hex-text';
    hexText.textContent = hexColor.toUpperCase();
    hexText.title = 'Click to copy HEX code';
    hexText.addEventListener('click', (e) => {
      e.stopPropagation();
      copyHexToClipboard(group.hex, colorChip);
    });

    // Layer Name / Path Count Badge
    const nameSpan = document.createElement('span');
    nameSpan.className = 'layer-name';
    nameSpan.textContent = groupPaths.length > 1 ? `L${idx + 1} ×${groupPaths.length}` : `L${idx + 1}`;
    nameSpan.title = `${layerId} (${groupPaths.length} path${groupPaths.length > 1 ? 's' : ''})`;

    leftDiv.appendChild(visBtn);
    leftDiv.appendChild(soloBtn);
    leftDiv.appendChild(colorChip);
    leftDiv.appendChild(hexText);
    leftDiv.appendChild(nameSpan);

    // Right controls: Reorder Up, Reorder Down, Delete
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'layer-actions';

    // Move Up (Bring forward: move last path's nextSibling before first path, or shift each forward)
    const upBtn = document.createElement('button');
    upBtn.type = 'button';
    upBtn.className = 'layer-action-btn';
    upBtn.title = 'Bring forward (higher layer order)';
    upBtn.setAttribute('aria-label', `Bring forward layer ${idx + 1}`);
    upBtn.textContent = '▲';
    upBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      let moved = false;
      const groupAbove = idx > 0 ? displayGroups[idx - 1] : null;
      const anchor = groupAbove ? groupAbove.paths[groupAbove.paths.length - 1] : null;
      if (anchor && groupPaths.every(p => p.parentNode === anchor.parentNode)) {
        const ref = anchor.nextSibling;
        groupPaths.forEach(p => anchor.parentNode.insertBefore(p, ref));
        moved = true;
      } else {
        for (let k = groupPaths.length - 1; k >= 0; k--) {
          const p = groupPaths[k];
          if (p.nextElementSibling && !groupPaths.includes(p.nextElementSibling)) {
            p.parentNode.insertBefore(p.nextElementSibling, p);
            moved = true;
          }
        }
      }
      if (moved) {
        populateStudioLayersList();
        syncViewportSvgToMemory();
      }
    });

    // Move Down (Send backward)
    const downBtn = document.createElement('button');
    downBtn.type = 'button';
    downBtn.className = 'layer-action-btn';
    downBtn.title = 'Send backward (lower layer order)';
    downBtn.setAttribute('aria-label', `Send backward layer ${idx + 1}`);
    downBtn.textContent = '▼';
    downBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      let moved = false;
      const groupBelow = idx < displayGroups.length - 1 ? displayGroups[idx + 1] : null;
      const anchor = groupBelow ? groupBelow.paths[0] : null;
      if (anchor && groupPaths.every(p => p.parentNode === anchor.parentNode)) {
        groupPaths.forEach(p => anchor.parentNode.insertBefore(p, anchor));
        moved = true;
      } else {
        for (let k = 0; k < groupPaths.length; k++) {
          const p = groupPaths[k];
          const prev = p.previousElementSibling;
          if (
            prev &&
            prev.tagName?.toLowerCase() === 'path' &&
            prev.id !== 'logo-silhouette-base' &&
            prev.id !== 'subject-silhouette-base' &&
            !groupPaths.includes(prev)
          ) {
            p.parentNode.insertBefore(p, prev);
            moved = true;
          }
        }
      }
      if (moved) {
        populateStudioLayersList();
        syncViewportSvgToMemory();
      }
    });

    // Delete Layer Group (✕)
    const delBtn = document.createElement('button');
    delBtn.type = 'button';
    delBtn.className = 'layer-action-btn del';
    delBtn.title = 'Delete this color layer from vector SVG';
    delBtn.setAttribute('aria-label', `Delete layer ${idx + 1}`);
    delBtn.textContent = '✕';
    delBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      groupPaths.forEach(p => p.remove());
      populateStudioLayersList();
      syncViewportSvgToMemory();
    });

    actionsDiv.appendChild(upBtn);
    actionsDiv.appendChild(downBtn);
    actionsDiv.appendChild(delBtn);

    item.appendChild(leftDiv);
    item.appendChild(actionsDiv);
    studioLayersList.appendChild(item);
  });

  studioLayersList.scrollTop = prevScrollTop;
}

function applyStrokeWeight(val, shouldSync = true) {
  currentStrokeWeight = val;
  if (strokeWeightVal) {
    strokeWeightVal.textContent = `${val.toFixed(1)} px`;
  }
  const paths = getActiveSvgPaths();
  paths.forEach(p => {
    if (val <= 0) {
      p.style.stroke = '';
      p.style.strokeWidth = '';
      p.style.strokeLinejoin = '';
      p.style.strokeLinecap = '';
      p.style.paintOrder = '';
      p.removeAttribute('stroke');
      p.removeAttribute('stroke-width');
      p.removeAttribute('stroke-linejoin');
      p.removeAttribute('stroke-linecap');
      p.removeAttribute('paint-order');
    } else {
      const fill = p.style.fill || p.getAttribute('fill') || '#000000';
      p.style.stroke = fill;
      p.style.strokeWidth = `${val}px`;
      p.style.strokeLinejoin = 'round';
      p.style.strokeLinecap = 'round';
      p.style.paintOrder = 'stroke fill';
      p.setAttribute('stroke', fill);
      p.setAttribute('stroke-width', String(val));
      p.setAttribute('stroke-linejoin', 'round');
      p.setAttribute('stroke-linecap', 'round');
      p.setAttribute('paint-order', 'stroke fill');
    }
  });

  if (shouldSync) {
    syncViewportSvgToMemory();
  }
}

function applyRefineStroke(val, shouldSync = true) {
  currentRefineStrength = val;
  const paths = getActiveSvgPaths();
  paths.forEach(p => {
    if (!origPathDMap.has(p)) {
      origPathDMap.set(p, p.getAttribute('d') || '');
    }
    const origD = origPathDMap.get(p);
    if (!origD) return;
    p.setAttribute('d', val <= 0 ? origD : refineSvgPathD(origD, val, p));
  });

  if (shouldSync) {
    syncViewportSvgToMemory();
  }
}

function handleColorBudgetChange(budget) {
  pendingColorBudget = budget;
  const isLogo = currentSourceImagePayload?.mode === 'logo' || currentResults?.mode === 'logo';
  const unit = isLogo ? 'Inks' : 'Tiers';
  if (colorBudgetVal) {
    colorBudgetVal.textContent = `${budget} ${unit}`;
  }
  presetChips.forEach(chip => {
    chip.classList.toggle('active', parseInt(chip.getAttribute('data-colors'), 10) === budget);
  });
  if (btnApplyColorBudget) {
    btnApplyColorBudget.classList.toggle('is-dirty', budget !== currentColorBudget);
  }
}

function recomputeColorBudget(budget) {
  if (!currentSourceImagePayload) return;
  currentColorBudget = budget;
  pendingColorBudget = budget;
  if (btnApplyColorBudget) {
    btnApplyColorBudget.classList.remove('is-dirty');
  }
  showProgress();
  initWorker();
  worker.postMessage({
    id: Date.now(),
    rawPixels: currentSourceImagePayload.data,
    width: currentSourceImagePayload.width,
    height: currentSourceImagePayload.height,
    options: {
      mode: currentSourceImagePayload.mode,
      tiers: budget,
      maxColors: budget
    }
  });
}

// Vector Pro Studio Event Listeners
strokeWeightSlider?.addEventListener('input', (e) => {
  const val = parseFloat(e.target.value);
  applyStrokeWeight(val);
});

btnResetStroke?.addEventListener('click', () => {
  if (strokeWeightSlider) strokeWeightSlider.value = '0';
  applyStrokeWeight(0);
});

refineStrokeSlider?.addEventListener('input', (e) => {
  const val = parseInt(e.target.value, 10);
  if (refineRafId !== null) cancelAnimationFrame(refineRafId);
  refineRafId = requestAnimationFrame(() => {
    refineRafId = null;
    applyRefineStroke(val, false);
  });
  if (refineSyncTimer !== null) clearTimeout(refineSyncTimer);
  refineSyncTimer = setTimeout(() => {
    refineSyncTimer = null;
    syncViewportSvgToMemory();
  }, 150);
});

refineStrokeSlider?.addEventListener('change', (e) => {
  const val = parseInt(e.target.value, 10);
  cancelPendingRefine();
  applyRefineStroke(val, true);
});

btnResetRefine?.addEventListener('click', () => {
  cancelPendingRefine();
  if (refineStrokeSlider) refineStrokeSlider.value = '0';
  applyRefineStroke(0, true);
});

btnResetLayers?.addEventListener('click', () => {
  if (!currentResults || !originalSvgsSnapshot) return;
  const targetMap = isGridOn ? originalSvgsSnapshot.transparent : originalSvgsSnapshot.solid;
  const originalSvg = targetMap?.[activeArtboard];
  if (originalSvg) {
    currentResults.svgs[activeArtboard] = originalSvg;
    displayActiveArtboard();
    showCopyToast('Layers reset to original vector state');
  }
});

colorBudgetSlider?.addEventListener('input', (e) => {
  const budget = parseInt(e.target.value, 10);
  handleColorBudgetChange(budget);
});

colorBudgetSlider?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    recomputeColorBudget(pendingColorBudget);
  }
});

presetChips.forEach(chip => {
  chip.addEventListener('click', () => {
    const budget = parseInt(chip.getAttribute('data-colors'), 10);
    if (colorBudgetSlider) colorBudgetSlider.value = String(budget);
    handleColorBudgetChange(budget);
  });
});

btnApplyColorBudget?.addEventListener('click', () => {
  recomputeColorBudget(pendingColorBudget);
});

// --------------------------------------------------------------------------
// Ultra-Crisp Native SVG ViewBox Zoom & 360-Degree Pan Engine (Zero Blur)
// --------------------------------------------------------------------------
let baseViewBox = { minX: 0, minY: 0, width: 1000, height: 1000 };
let animationFrameId = null;
let rafRenderScheduled = false;

function initializeBaseViewBox() {
  const svg = viewport?.querySelector('svg');
  if (!svg) return;
  const vbAttr = svg.getAttribute('viewBox');
  if (vbAttr) {
    const parts = vbAttr.trim().split(/\s+/).map(Number);
    if (parts.length === 4 && !parts.some(isNaN)) {
      baseViewBox = { minX: parts[0], minY: parts[1], width: parts[2], height: parts[3] };
      return;
    }
  }
  const w = parseFloat(svg.getAttribute('width')) || (currentResults?.dimensions?.width) || 1000;
  const h = parseFloat(svg.getAttribute('height')) || (currentResults?.dimensions?.height) || 1000;
  baseViewBox = { minX: 0, minY: 0, width: w, height: h };
  svg.setAttribute('viewBox', `${baseViewBox.minX} ${baseViewBox.minY} ${w} ${h}`);
}

function getClampedPan(zoom, px, py) {
  if (zoom <= 1) return { panX: 0, panY: 0 };
  const vpRect = viewport ? viewport.getBoundingClientRect() : { width: 800, height: 500 };
  const vpWidth = vpRect.width || 800;
  const vpHeight = vpRect.height || 500;
  // Soft boundary envelope: allows full exploration across edges with 25% comfort padding
  const maxPanX = ((zoom - 1) * vpWidth) / 2 + (vpWidth * 0.25);
  const maxPanY = ((zoom - 1) * vpHeight) / 2 + (vpHeight * 0.25);
  return {
    panX: Math.max(-maxPanX, Math.min(maxPanX, px)),
    panY: Math.max(-maxPanY, Math.min(maxPanY, py))
  };
}

function renderViewBox() {
  const svg = viewport?.querySelector('svg');
  if (!svg || !baseViewBox.width || !baseViewBox.height) return;

  const clamped = getClampedPan(currentZoom, panX, panY);
  panX = clamped.panX;
  panY = clamped.panY;

  const vbW = baseViewBox.width / currentZoom;
  const vbH = baseViewBox.height / currentZoom;

  const centerX = baseViewBox.minX + baseViewBox.width / 2;
  const centerY = baseViewBox.minY + baseViewBox.height / 2;

  const vpRect = viewport.getBoundingClientRect();
  const vpWidth = vpRect.width || baseViewBox.width;
  const vpHeight = vpRect.height || baseViewBox.height;

  // Scale factor between screen pixels and SVG coordinate units
  const scaleFactor = Math.max(baseViewBox.width / vpWidth, baseViewBox.height / vpHeight);

  const minX = (centerX - vbW / 2) - (panX * scaleFactor / currentZoom);
  const minY = (centerY - vbH / 2) - (panY * scaleFactor / currentZoom);

  // Directly adjust SVG viewBox for 100% infinite mathematical vector rendering at screen resolution
  svg.setAttribute('viewBox', `${minX.toFixed(2)} ${minY.toFixed(2)} ${vbW.toFixed(2)} ${vbH.toFixed(2)}`);
  svg.style.transform = 'none';

  if (currentZoom > 1) {
    viewport?.classList.add('can-pan');
  } else {
    viewport?.classList.remove('can-pan');
  }
}

function scheduleRender() {
  if (!rafRenderScheduled) {
    rafRenderScheduled = true;
    requestAnimationFrame(() => {
      renderViewBox();
      rafRenderScheduled = false;
    });
  }
}

function animateTo(targetZoom, targetPanX, targetPanY, duration = 250) {
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  const startZoom = currentZoom;
  const startPanX = panX;
  const startPanY = panY;
  const startTime = performance.now();

  function step(now) {
    const elapsed = now - startTime;
    const progress = Math.min(1, elapsed / duration);
    // Smooth organic cubic ease-out
    const ease = 1 - Math.pow(1 - progress, 3);

    currentZoom = startZoom + (targetZoom - startZoom) * ease;
    panX = startPanX + (targetPanX - startPanX) * ease;
    panY = startPanY + (targetPanY - startPanY) * ease;

    renderViewBox();

    if (progress < 1) {
      animationFrameId = requestAnimationFrame(step);
    } else {
      currentZoom = targetZoom;
      panX = targetPanX;
      panY = targetPanY;
      renderViewBox();
      animationFrameId = null;
    }
  }

  animationFrameId = requestAnimationFrame(step);
}

function applySvgTransform(animate = true) {
  if (animate) {
    animateTo(currentZoom, panX, panY, 250);
  } else {
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }
    renderViewBox();
  }
}

function resetPanAndZoom() {
  currentZoom = 1;
  panX = 0;
  panY = 0;
  isPanning = false;
  viewport?.classList.remove('can-pan', 'is-panning');
  document.querySelectorAll('.zoom-btn[data-zoom]').forEach(b => {
    b.classList.toggle('active', b.getAttribute('data-zoom') === '1');
  });
  applySvgTransform(true);
}

// Expose state for telemetry, benchmarks, and automated verification
window.__c2vectorState = {
  get panX() { return panX; },
  set panX(v) { panX = v; },
  get panY() { return panY; },
  set panY(v) { panY = v; },
  get currentZoom() { return currentZoom; },
  set currentZoom(v) { currentZoom = v; },
  get isGridOn() { return isGridOn; },
  set isGridOn(v) { isGridOn = v; },
  get currentSourceFileName() { return currentSourceFileName; },
  set currentSourceFileName(v) { currentSourceFileName = v; },
  get currentResults() { return currentResults; },
  get baseViewBox() { return baseViewBox; },
  get currentStrokeWeight() { return currentStrokeWeight; },
  get currentColorBudget() { return currentColorBudget; },
  applyStrokeWeight,
  handleColorBudgetChange,
  populateStudioLayersList,
  syncViewportSvgToMemory,
  applySvgTransform,
  resetPanAndZoom,
  renderViewBox,
  formatDownloadableSvg,
  getDynamicDownloadFilename
};

tabNav?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  const targetArtboard = btn.getAttribute('data-artboard');
  if (!targetArtboard || !currentResults?.svgs[targetArtboard]) return;

  syncViewportSvgToMemory();

  tabNav.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
  });

  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');

  activeArtboard = targetArtboard;
  panX = 0;
  panY = 0;
  displayActiveArtboard();
});

// Step-by-Step Pipeline Quick Switch Handlers
document.querySelectorAll('button[data-switch-artboard]').forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.getAttribute('data-switch-artboard');
    if (!target) return;
    const tabBtn = tabNav?.querySelector(`.tab-btn[data-artboard="${target}"]`);
    if (tabBtn) {
      tabBtn.click();
      viewport?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  });
});

// Viewport Zoom Button Controls
document.querySelectorAll('.zoom-btn[data-zoom]').forEach(btn => {
  btn.addEventListener('click', () => {
    const zoom = parseInt(btn.getAttribute('data-zoom') || '1', 10);
    if (zoom === 1) {
      resetPanAndZoom();
      return;
    }
    document.querySelectorAll('.zoom-btn[data-zoom]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    currentZoom = zoom;
    applySvgTransform(true);
  });
});

// 360-Degree Mouse Drag Panning (All Directions) with rAF Batching
viewport?.addEventListener('mousedown', (e) => {
  if (currentZoom <= 1 || e.button !== 0) return;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  isPanning = true;
  startPointerX = e.clientX;
  startPointerY = e.clientY;
  initialPanX = panX;
  initialPanY = panY;
  viewport.classList.add('is-panning');
  e.preventDefault();
});

window.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  panX = initialPanX + (e.clientX - startPointerX);
  panY = initialPanY + (e.clientY - startPointerY);
  scheduleRender();
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    viewport?.classList.remove('is-panning');
    scheduleRender();
  }
});

// 360-Degree Mobile Touch Drag Panning (Single Finger) with rAF Batching
viewport?.addEventListener('touchstart', (e) => {
  if (currentZoom <= 1 || e.touches.length !== 1) return;
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  isPanning = true;
  startPointerX = e.touches[0].clientX;
  startPointerY = e.touches[0].clientY;
  initialPanX = panX;
  initialPanY = panY;
  viewport.classList.add('is-panning');
}, { passive: true });

viewport?.addEventListener('touchmove', (e) => {
  if (!isPanning || e.touches.length !== 1) return;
  panX = initialPanX + (e.touches[0].clientX - startPointerX);
  panY = initialPanY + (e.touches[0].clientY - startPointerY);
  scheduleRender();
  e.preventDefault(); // Prevent page scroll while exploring zoomed vector
}, { passive: false });

viewport?.addEventListener('touchend', () => {
  if (isPanning) {
    isPanning = false;
    viewport?.classList.remove('is-panning');
  }
});

// 360-Degree Mouse Wheel Panning with rAF Batching
viewport?.addEventListener('wheel', (e) => {
  if (currentZoom <= 1) return;
  e.preventDefault();
  panX -= e.deltaX * 0.8;
  panY -= e.deltaY * 0.8;
  scheduleRender();
}, { passive: false });

btnToggleGrid?.addEventListener('click', () => {
  if (!currentResults) return;
  isGridOn = !isGridOn;
  btnToggleGrid.classList.toggle('active', isGridOn);
  btnToggleGrid.setAttribute('aria-pressed', isGridOn ? 'true' : 'false');
  btnToggleGrid.title = isGridOn
    ? 'Transparency grid ON (alpha-only transparent SVG; click to show solid backdrop)'
    : 'Solid backdrop plate ON (click to toggle transparency grid)';

  viewport.classList.toggle('grid-pattern', isGridOn);

  if (currentResults.transparentSvgs && currentResults.solidSvgs) {
    currentResults.svgs = isGridOn ? currentResults.transparentSvgs : currentResults.solidSvgs;
  }
  displayActiveArtboard();
});

btnCenterCanvas?.addEventListener('click', () => {
  panX = 0;
  panY = 0;
  applySvgTransform(true);
  btnCenterCanvas.classList.add('active');
  setTimeout(() => btnCenterCanvas.classList.remove('active'), 250);
});

// Export Triggers
/**
 * Generates dynamic production download filenames according to standard:
 * {original_filename}_{mode}_{artboard}_c2vector_DV.{ext}
 */
export function getDynamicDownloadFilename(artboardKey, ext = 'svg', scale = null) {
  const isLogo = currentResults && currentResults.mode === 'logo';
  const mode = isLogo ? 'logo' : 'photo';
  const rawBase = (currentSourceFileName || 'c2vector_artwork')
    .replace(/\.[^/.]+$/, '')
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
  const baseName = rawBase || 'artwork';
  const cleanArtboard = (artboardKey || 'masterVibrant')
    .replace(/[^a-zA-Z0-9_-]/g, '_');

  if (ext === 'pdf') {
    return `${baseName}_${mode}_master_suite_c2vector_DV.pdf`;
  }
  if (scale) {
    return `${baseName}_${mode}_${cleanArtboard}_c2vector_DV@${scale}x.${ext}`;
  }
  return `${baseName}_${mode}_${cleanArtboard}_c2vector_DV.${ext}`;
}

/**
 * Formats an SVG string into an official, standalone SVG 1.1 vector document
 * Complete with XML declaration and W3C SVG 1.1 DTD preamble for 100% vector fidelity in
 * Adobe Illustrator, CorelDRAW, Inkscape, Figma, Canva, and CNC/laser plotters.
 */
export function formatDownloadableSvg(svgStr) {
  if (!svgStr) return '';
  let clean = svgStr.trim();
  // Strip any pre-existing XML declaration or DOCTYPE to prevent duplication
  clean = clean.replace(/<\?xml[\s\S]*?\?>\s*/gi, '');
  clean = clean.replace(/<!DOCTYPE[\s\S]*?>\s*/gi, '');
  // Ensure version="1.1" and xmlns:xlink namespace are present on root <svg>
  if (!clean.includes('version=')) {
    clean = clean.replace('<svg ', '<svg version="1.1" ');
  }
  if (!clean.includes('xmlns:xlink=')) {
    clean = clean.replace('<svg ', '<svg xmlns:xlink="http://www.w3.org/1999/xlink" ');
  }
  return `<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n${clean}\n`;
}

btnDownloadSvg?.addEventListener('click', () => {
  if (!currentResults) return;
  syncViewportSvgToMemory();
  const rawSvg = currentResults.svgs[activeArtboard];
  const svgStr = formatDownloadableSvg(rawSvg);
  const filename = getDynamicDownloadFilename(activeArtboard, 'svg');

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

btnDownloadPdf?.addEventListener('click', async () => {
  if (!currentResults) return;
  syncViewportSvgToMemory();
  const origHtml = btnDownloadPdf.innerHTML;
  btnDownloadPdf.disabled = true;
  btnDownloadPdf.innerHTML = `<span>Compiling Vector PDF...</span>`;

  try {
    const pdfFilename = getDynamicDownloadFilename('suite', 'pdf');
    await compileMasterVectorPdf(currentResults, pdfFilename, ({ current, total, text }) => {
      btnDownloadPdf.innerHTML = `<span>Page ${current}/${total}: ${text}</span>`;
    });
  } catch (err) {
    console.error('PDF generation error:', err);
    alert('Error generating vector PDF: ' + err.message);
  } finally {
    btnDownloadPdf.disabled = false;
    btnDownloadPdf.innerHTML = origHtml;
  }
});

btnDownloadAllSvg?.addEventListener('click', async () => {
  if (!currentResults) return;
  syncViewportSvgToMemory();
  const svgsSnapshot = { ...currentResults.svgs };
  const keys = Object.keys(svgsSnapshot);
  const origHtml = btnDownloadAllSvg.innerHTML;
  btnDownloadAllSvg.disabled = true;

  try {
    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      const filename = getDynamicDownloadFilename(key, 'svg');
      const rawSvg = svgsSnapshot[key];
      if (!rawSvg) continue;
      btnDownloadAllSvg.textContent = `Downloading ${i + 1}/${keys.length}...`;
      const svgStr = formatDownloadableSvg(rawSvg);

      const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 4000);
      await new Promise(r => setTimeout(r, 200));
    }
  } finally {
    btnDownloadAllSvg.disabled = false;
    btnDownloadAllSvg.innerHTML = origHtml;
  }
});

// Secondary PNG Modal
btnOpenPngModal?.addEventListener('click', () => {
  if (!currentResults) return;
  pngModal?.classList.add('open');
});

btnClosePngModal?.addEventListener('click', () => {
  pngModal?.classList.remove('open');
});

pngModal?.addEventListener('click', (e) => {
  if (e.target === pngModal) {
    pngModal.classList.remove('open');
  }
});

btnConfirmPng?.addEventListener('click', async () => {
  if (!currentResults) return;
  syncViewportSvgToMemory();
  const checked = document.querySelector('input[name="pngScale"]:checked');
  const scale = parseInt(checked?.value || '2', 10);
  const svgStr = currentResults.svgs[activeArtboard];
  const filename = getDynamicDownloadFilename(activeArtboard, 'png', scale);

  const origText = btnConfirmPng.textContent;
  btnConfirmPng.disabled = true;
  btnConfirmPng.textContent = 'Rendering Offscreen Canvas...';

  try {
    await exportSvgToPng(svgStr, scale, filename);
    pngModal?.classList.remove('open');
  } catch (err) {
    alert('PNG rasterization failed: ' + err.message);
  } finally {
    btnConfirmPng.disabled = false;
    btnConfirmPng.textContent = origText;
  }
});

// Accessible Modals Suite Controller (MIT License, Privacy Policy, Disclosure)
const modalMit = document.getElementById('modalMitLicense');
const modalPrivacy = document.getElementById('modalPrivacyPolicy');
const modalDisclosure = document.getElementById('modalDisclosure');

document.getElementById('btnOpenMitModal')?.addEventListener('click', () => modalMit?.classList.add('open'));
document.getElementById('btnOpenPrivacyModal')?.addEventListener('click', () => modalPrivacy?.classList.add('open'));
document.getElementById('btnOpenDisclosureModal')?.addEventListener('click', () => modalDisclosure?.classList.add('open'));

document.querySelectorAll('[data-modal-close]').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.closest('.modal-overlay')?.classList.remove('open');
  });
});

[modalMit, modalPrivacy, modalDisclosure].forEach(modal => {
  modal?.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });
});

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    [modalMit, modalPrivacy, modalDisclosure, pngModal].forEach(m => m?.classList.remove('open'));
  }
});

