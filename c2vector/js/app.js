/**
 * c2vector - Main Application Controller
 * Handles UI events, Web Worker orchestration, reactive telemetry, and multi-format vector exports
 */

import { compileMasterVectorPdf } from './export/pdf-builder.js';
import { exportSvgToPng } from './export/png-exporter.js';

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
    subtitle: 'Island-Bridged Laser & Plotter Vector Cut Paths',
    filename: 'bridge_cut_stencil.svg'
  },
  cannyEdges: {
    title: 'Canny Sub-Pixel Hairline Edges (1-px Outlines)',
    subtitle: '1-px Non-Maximum Suppression Ridges',
    filename: 'canny_hairline_edges.svg'
  },
  chromaticEdges: {
    title: 'Translucent Chromatic Contours (70%-80% Glaze)',
    subtitle: '70%–80% Opacity Glaze (Zero Flat Black Ink)',
    filename: 'translucent_chromatic_contours.svg'
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
let currentEdgeOpacity = 0.75;
let areEdgesVisible = true;

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

const metricRes = document.getElementById('metricRes');
const metricTiers = document.getElementById('metricTiers');
const metricTmi = document.getElementById('metricTmi');
const metricSize = document.getElementById('metricSize');

const workbenchPaletteCard = document.getElementById('workbenchPaletteCard');
const workbenchPaletteSwatches = document.getElementById('workbenchPaletteSwatches');
const paletteCountBadge = document.getElementById('paletteCountBadge');

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
  worker = new Worker('./js/engine/worker.js', { type: 'module' });
  worker.onmessage = handleWorkerMessage;
  worker.onerror = (err) => {
    console.error('Vector worker runtime error:', err);
    alert('Worker error during vector synthesis: ' + (err.message || 'Unknown error'));
    hideProgress();
  };
}

// Service Worker Registration for PWA Offline Caching
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').then((reg) => {
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

// Engine Mode Switcher (Photo vs Logo & Typography)
let currentEngineMode = 'photo';

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
    processImageFile(file, 'photo');
  }
});

logoFileInput?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) {
    processImageFile(file, 'logo');
  }
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

  // Constrain uploaded photos safely to HD budget (<= 1024px max edge)
  const maxDim = mode === 'logo' ? 1200 : 1024;
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
  
  if (mode === 'photo') {
    // Photos: guardrail against alpha transparency: pre-fill with solid white
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(img, 0, 0, w, h);
  const imgData = ctx.getImageData(0, 0, w, h);

  initWorker();
  worker.postMessage({
    id: Date.now(),
    rawPixels: imgData.data,
    width: w,
    height: h,
    options: {
      mode: mode,
      tiers: mode === 'logo' ? 32 : 48,
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
    const badge = document.getElementById(`step${i}`);
    if (badge) {
      badge.classList.remove('active', 'done');
    }
  }
}

function updateProgress(step, name, pct) {
  if (progressTitle) progressTitle.textContent = name;
  if (progressPercent) progressPercent.textContent = `${pct}%`;
  if (progressBar) progressBar.style.width = `${pct}%`;
  if (progressBarAria) progressBarAria.setAttribute('aria-valuenow', pct);

  for (let i = 1; i <= 6; i++) {
    const badge = document.getElementById(`step${i}`);
    if (!badge) continue;
    if (i < step) {
      badge.classList.remove('active');
      badge.classList.add('done');
    } else if (i === step) {
      badge.classList.add('active');
      badge.classList.remove('done');
    } else {
      badge.classList.remove('active', 'done');
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

  // Display default artboard
  displayActiveArtboard();
}

function displayActiveArtboard() {
  if (!currentResults || !viewport) return;
  const svgStr = currentResults.svgs[activeArtboard];
  if (!svgStr) return;

  viewport.innerHTML = svgStr;

  const meta = ARTBOARD_METADATA[activeArtboard] || { title: activeArtboard, subtitle: '' };
  if (activeArtboardTitle) {
    activeArtboardTitle.textContent = meta.title;
    activeArtboardTitle.title = meta.subtitle ? `${meta.title} — ${meta.subtitle}` : meta.title;
  }

  const kbSize = (new Blob([svgStr]).size / 1024).toFixed(1);
  if (metricSize) metricSize.textContent = `${kbSize} KB`;

  // Update Edge Opacity control state (greying out when inactive to eliminate layout shift)
  const hasContours = ['masterVibrant', 'masterFaithful', 'chromaticEdges'].includes(activeArtboard);
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
  // Also synchronize in-memory SVG string so exported SVGs & PDF match user's slider setting
  if (currentResults && currentResults.svgs && currentResults.svgs[activeArtboard]) {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(currentResults.svgs[activeArtboard], 'image/svg+xml');
      const g = doc.querySelector('#chromatic-structural-contours, #chromatic-outlines');
      if (g) {
        g.setAttribute('opacity', targetOpacity.toFixed(2));
        g.style.opacity = targetOpacity.toFixed(2);
        g.style.visibility = targetOpacity === 0 ? 'hidden' : 'visible';
        currentResults.svgs[activeArtboard] = new XMLSerializer().serializeToString(doc);
      }
    } catch (err) {
      console.warn('In-memory SVG opacity sync skipped:', err);
    }
  }
}

edgeOpacitySlider?.addEventListener('input', (e) => {
  const pct = parseInt(e.target.value, 10);
  currentEdgeOpacity = pct / 100;
  if (edgeOpacityVal) edgeOpacityVal.textContent = `${pct}%`;
  updateContourOpacityInViewport();
});

btnToggleEdges?.addEventListener('click', () => {
  areEdgesVisible = !areEdgesVisible;
  btnToggleEdges.classList.toggle('active', areEdgesVisible);
  btnToggleEdges.classList.toggle('muted', !areEdgesVisible);
  btnToggleEdges.textContent = areEdgesVisible ? 'Visible' : 'Hidden';
  updateContourOpacityInViewport();
});

// 360-Degree Pan & Zoom Transform Engine
function applySvgTransform(animate = true) {
  const svg = viewport?.querySelector('svg');
  if (!svg) return;
  svg.style.transformOrigin = 'center center';
  svg.style.transition = animate ? 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)' : 'none';
  svg.style.transform = `translate(${panX}px, ${panY}px) scale(${currentZoom})`;
  if (currentZoom > 1) {
    viewport?.classList.add('can-pan');
  } else {
    viewport?.classList.remove('can-pan');
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

// Tab Switching (Integrated directly inside viewer window)
tabNav?.addEventListener('click', (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  const targetArtboard = btn.getAttribute('data-artboard');
  if (!targetArtboard || !currentResults?.svgs[targetArtboard]) return;

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

// 360-Degree Mouse Drag Panning (All Directions)
viewport?.addEventListener('mousedown', (e) => {
  if (currentZoom <= 1 || e.button !== 0) return;
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
  applySvgTransform(false);
});

window.addEventListener('mouseup', () => {
  if (isPanning) {
    isPanning = false;
    viewport?.classList.remove('is-panning');
    applySvgTransform(false);
  }
});

// 360-Degree Mobile Touch Drag Panning (Single Finger)
viewport?.addEventListener('touchstart', (e) => {
  if (currentZoom <= 1 || e.touches.length !== 1) return;
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
  applySvgTransform(false);
  e.preventDefault(); // Prevent page scroll while exploring zoomed vector
}, { passive: false });

viewport?.addEventListener('touchend', () => {
  if (isPanning) {
    isPanning = false;
    viewport?.classList.remove('is-panning');
  }
});

// 360-Degree Mouse Wheel Panning
viewport?.addEventListener('wheel', (e) => {
  if (currentZoom <= 1) return;
  e.preventDefault();
  panX -= e.deltaX * 0.8;
  panY -= e.deltaY * 0.8;
  applySvgTransform(false);
}, { passive: false });

btnToggleGrid?.addEventListener('click', () => {
  isGridOn = !isGridOn;
  viewport.classList.toggle('grid-pattern', isGridOn);
  btnToggleGrid.classList.toggle('active', isGridOn);
});

// Export Triggers
btnDownloadSvg?.addEventListener('click', () => {
  if (!currentResults) return;
  const svgStr = currentResults.svgs[activeArtboard];
  const meta = ARTBOARD_METADATA[activeArtboard] || { filename: `${activeArtboard}.svg` };

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = meta.filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
});

btnDownloadPdf?.addEventListener('click', async () => {
  if (!currentResults) return;
  const origHtml = btnDownloadPdf.innerHTML;
  btnDownloadPdf.disabled = true;
  btnDownloadPdf.innerHTML = `<span>Compiling Vector PDF...</span>`;

  try {
    await compileMasterVectorPdf(currentResults, 'c2vector_master_suite.pdf', ({ current, total, text }) => {
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
  const keys = Object.keys(currentResults.svgs);

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const meta = ARTBOARD_METADATA[key] || { filename: `${key}.svg` };
    const svgStr = currentResults.svgs[key];
    if (!svgStr) continue;

    const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = meta.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    await new Promise(r => setTimeout(r, 200));
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
  const checked = document.querySelector('input[name="pngScale"]:checked');
  const scale = parseInt(checked?.value || '2', 10);
  const svgStr = currentResults.svgs[activeArtboard];
  const meta = ARTBOARD_METADATA[activeArtboard] || { filename: `${activeArtboard}.svg` };
  const filename = meta.filename.replace('.svg', `@${scale}x.png`);

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

