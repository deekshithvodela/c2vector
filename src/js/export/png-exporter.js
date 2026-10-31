/**
 * c2vector - Secondary High-Resolution PNG Exporter
 * Renders SVG vectors to offscreen canvas at user-selected scale (1x, 2x, 4x HD) and triggers PNG download
 */

export async function exportSvgToPng(svgString, scale = 2, filename = 'c2vector_export.png') {
  return new Promise((resolve, reject) => {
    try {
      const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const img = new Image();

      img.onload = () => {
        const width = img.width * scale || 1920;
        const height = img.height * scale || 1920;

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        // Crisp image rendering
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);
        URL.revokeObjectURL(url);

        canvas.toBlob((pngBlob) => {
          if (!pngBlob) {
            reject(new Error('Failed to generate PNG blob'));
            return;
          }

          const pngUrl = URL.createObjectURL(pngBlob);
          const link = document.createElement('a');
          link.href = pngUrl;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          setTimeout(() => URL.revokeObjectURL(pngUrl), 5000);
          resolve(true);
        }, 'image/png');
      };

      img.onerror = (err) => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load SVG for PNG rasterization: ' + (err.message || err)));
      };

      img.src = url;
    } catch (e) {
      reject(e);
    }
  });
}
