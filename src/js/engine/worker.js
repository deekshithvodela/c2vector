/**
 * c2vector - Web Worker for Asynchronous Vectorization
 * Keeps the main UI thread 60fps responsive during heavy pixel and Bézier calculations
 */

import { runVectorizationPipeline } from './pipeline.js';
import { runLogoVectorizationPipeline } from './logo-engine.js';

self.onmessage = async (e) => {
  const { id, rawPixels, width, height, options } = e.data;

  try {
    const isLogo = options && options.mode === 'logo';
    const pipelineFn = isLogo ? runLogoVectorizationPipeline : runVectorizationPipeline;

    const results = await pipelineFn(
      rawPixels,
      width,
      height,
      options,
      (progress) => {
        self.postMessage({ type: 'progress', id, progress });
      }
    );

    self.postMessage({ type: 'done', id, results });
  } catch (err) {
    self.postMessage({ type: 'error', id, error: err.message || String(err) });
  }
};
