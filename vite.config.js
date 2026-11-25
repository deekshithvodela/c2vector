import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

const buildVersion = 'v' + Date.now().toString(36);

const PROD_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://gc.zgo.at",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' https://fonts.gstatic.com data:",
  "img-src 'self' data: blob: https:",
  "worker-src 'self' blob:",
  "connect-src 'self' blob: data: https://c2vector.goatcounter.com https://gc.zgo.at",
  "object-src 'none'",
  "base-uri 'self'"
].join('; ');

function productionSecurityPlugin() {
  let isBuild = false;
  return {
    name: 'c2vector-production-security',
    configResolved(config) {
      isBuild = config.command === 'build';
    },
    transformIndexHtml(html) {
      if (!isBuild || html.includes('http-equiv="Content-Security-Policy"')) return html;
      return html.replace(
        /<meta name="viewport"[^>]*>/,
        (match) => `${match}\n  <meta http-equiv="Content-Security-Policy" content="${PROD_CSP}">`
      );
    },
    writeBundle(options) {
      const outDir = options.dir || resolve(__dirname, 'dist');
      const swPath = resolve(outDir, 'sw.js');
      if (fs.existsSync(swPath)) {
        const content = fs.readFileSync(swPath, 'utf8');
        fs.writeFileSync(swPath, content.replace(/__SW_CACHE_VERSION__/g, buildVersion), 'utf8');
      }
    }
  };
}

export default defineConfig({
  base: process.env.BASE_URL || '/c2vector/',
  publicDir: 'public',
  define: {
    __APP_VERSION__: JSON.stringify(buildVersion)
  },
  plugins: [productionSecurityPlugin()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about/index.html'),
        workflow: resolve(__dirname, 'workflow/index.html')
      }
    }
  },
  server: {
    port: 5173,
    open: false
  }
});
