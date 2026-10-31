import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: process.env.BASE_URL || '/c2vector/',
  publicDir: 'public',
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
