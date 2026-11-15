// Dalan PWA Cache with 60-day (2-month) invalidation strategy
const CACHE_NAME = 'dalan-cache-v3';
const CACHE_DURATION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days (~2 months)
const TIMESTAMP_KEY = 'dalan-cache-timestamp';

const ASSETS_TO_CACHE = [
  '/',
  '/styles.css',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/Vazirmatn-Regular.ttf'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      try {
        const metadata = new Response(JSON.stringify({ cachedAt: Date.now() }));
        await cache.put(TIMESTAMP_KEY, metadata);
      } catch (e) {
        // ignore
      }
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        return cachedResponse;
      }
      try {
        const networkResponse = await fetch(event.request);
        if (networkResponse.ok && (
          event.request.url.includes('/tessdata/') || 
          event.request.url.includes('.ttf') || 
          event.request.url.includes('.wasm')
        )) {
          cache.put(event.request, networkResponse.clone());
        }
        return networkResponse;
      } catch (err) {
        return cachedResponse || new Response('Offline', { status: 503 });
      }
    })
  );
});
