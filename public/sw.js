/**
 * c2vector - Service Worker (Offline & PWA Caching)
 * Provides 100% offline capability and instant app launching
 */

const CACHE_NAME = 'c2vector-__SW_CACHE_VERSION__';
const PRECACHE_ASSETS = [
  './manifest.webmanifest',
  './favicon.ico',
  './vendor/jspdf.umd.min.js',
  './vendor/svg2pdf.umd.min.js',
  './assets/sample_photo.png',
  './assets/sample_logo.png',
  './assets/icons/favicon-48x48.png',
  './assets/icons/favicon-96x96.png',
  './assets/icons/favicon-192x192.png',
  './assets/icons/icon-512x512.png',
  './assets/icons/apple-touch-icon.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching static assets for', CACHE_NAME);
      return cache.addAll(PRECACHE_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);
  const isNavigation =
    event.request.mode === 'navigate' ||
    url.pathname.endsWith('.html') ||
    url.pathname.endsWith('/') ||
    url.pathname.endsWith('sw.js') ||
    url.pathname.endsWith('manifest.webmanifest');

  // Network-First for HTML/navigation so new deployments never serve stale index.html referencing deleted chunk hashes
  if (isNavigation) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
          return networkResponse;
        })
        .catch(() => caches.match(event.request).then((cached) => cached || caches.match('./index.html')))
    );
    return;
  }

  // Cache-First for content-hashed Vite bundles and static assets
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.ok && networkResponse.type === 'basic') {
          const contentType = networkResponse.headers.get('content-type') || '';
          const isScriptOrStyle = url.pathname.endsWith('.js') || url.pathname.endsWith('.css');
          // Never cache an HTML 404 fallback under a JS/CSS asset key
          if (!(isScriptOrStyle && contentType.includes('text/html'))) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseToCache));
          }
        }
        return networkResponse;
      });
    })
  );
});
