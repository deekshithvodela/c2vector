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
    subtitle: 'Island-Bridged Cut Ribs to Prevent Internal Loop Dropouts',
    filename: 'logo_cut_stencil.svg'
  },
  cannyEdges: {
    title: 'CAD Plotter Wireframe (Hairline Cut Paths)',
    subtitle: 'Luminous Technical Outlines on Obsidian Plate for CNC & Vinyl Cutters',
    filename: 'logo_plotter_hairline_cut.svg'
  },
  chromaticEdges: {
    title: 'Color Registration Traps & Die-Cut Contours',
    subtitle: 'Color-Coded Spot Registration Boundaries and Overlap Proofs',
    filename: 'logo_chromatic_registration.svg'
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
const btnCenterCanvas = document.getElementById('btnCenterCanvas');

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
  worker = new Worker(new URL('./engine/worker.js', import.meta.url), { type: 'module' });
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
    processImageFile(file, currentEngineMode);
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

  // Initialize background knockout & grid state based on detected transparency
  isGridOn = Boolean(results.isTransparentLogo || results.isTransparentImage || results.knockoutBackground);
  if (btnToggleGrid) {
    btnToggleGrid.classList.toggle('active', isGridOn);
    btnToggleGrid.setAttribute('aria-pressed', isGridOn ? 'true' : 'false');
    btnToggleGrid.title = isGridOn
      ? 'Background removed: Transparent SVG (Click to restore solid background)'
      : 'Solid background (Click to remove background for transparent SVG)';
  }
  if (viewport) {
    viewport.classList.toggle('grid-pattern', isGridOn);
  }
  if (results.transparentSvgs && results.solidSvgs) {
    results.svgs = isGridOn ? results.transparentSvgs : results.solidSvgs;
  }

  // Display default artboard
  displayActiveArtboard();
}

function displayActiveArtboard() {
  if (!currentResults || !viewport) return;
  const svgStr = currentResults.svgs[activeArtboard];
  if (!svgStr) return;

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
  get currentResults() { return currentResults; },
  get baseViewBox() { return baseViewBox; },
  applySvgTransform,
  resetPanAndZoom,
  renderViewBox,
  formatDownloadableSvg
};

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
    ? 'Background removed: Transparent SVG (Click to restore solid background)'
    : 'Solid background (Click to remove background for transparent SVG)';

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
  const rawSvg = currentResults.svgs[activeArtboard];
  const svgStr = formatDownloadableSvg(rawSvg);
  const isLogo = currentResults && currentResults.mode === 'logo';
  const metaMap = isLogo ? LOGO_ARTBOARD_METADATA : ARTBOARD_METADATA;
  const meta = metaMap[activeArtboard] || { filename: `${activeArtboard}.svg` };

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
  const isLogo = currentResults && currentResults.mode === 'logo';
  const metaMap = isLogo ? LOGO_ARTBOARD_METADATA : ARTBOARD_METADATA;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const meta = metaMap[key] || { filename: `${key}.svg` };
    const rawSvg = currentResults.svgs[key];
    if (!rawSvg) continue;
    const svgStr = formatDownloadableSvg(rawSvg);

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
  const isLogo = currentResults && currentResults.mode === 'logo';
  const metaMap = isLogo ? LOGO_ARTBOARD_METADATA : ARTBOARD_METADATA;
  const meta = metaMap[activeArtboard] || { filename: `${activeArtboard}.svg` };
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

