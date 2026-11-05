/**
 * c2vector - Service Worker (Offline & PWA Caching)
 * Provides 100% offline capability and instant app launching
 */

const CACHE_NAME = 'c2vector-v11';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './workflow/',
  './workflow/index.html',
  './about/',
  './about/index.html',
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
      console.log('[Service Worker] Precaching application shell & vendor assets');
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
  // Cache-first with network fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        // Cache valid responses dynamically
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      }).catch(() => {
        // Fallback to cached index.html for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
