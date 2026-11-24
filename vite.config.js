import { defineConfig } from 'vite';
import { resolve } from 'path';
import fs from 'fs';

const buildVersion = 'v' + Date.now().toString(36);

function versionStampPlugin() {
  return {
    name: 'c2vector-version-stamp',
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
  plugins: [versionStampPlugin()],
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
