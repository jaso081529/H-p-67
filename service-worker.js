// HP67 AuftragsApp V2 — Service Worker (stale-while-revalidate, v3)
const CACHE_NAME = 'hp67-v3';
const PRECACHE_URLS = [
  './',
  './index.html',
  './icon.svg',
  './manifest.webmanifest'
];

// Google Fonts to cache
const FONT_ORIGINS = [
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// ─── Install: precache core assets ───────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// ─── Activate: clean up old caches ───────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch: stale-while-revalidate ───────────────────────────────────
self.addEventListener('fetch', event => {
  const { request } = event;

  // Only handle GET requests
  if (request.method !== 'GET') return;

  // Check if this is a Google Fonts request
  const isFont = FONT_ORIGINS.some(origin => request.url.startsWith(origin));

  event.respondWith(
    caches.open(CACHE_NAME).then(cache =>
      cache.match(request).then(cachedResponse => {
        // Always fetch a fresh copy in the background
        const fetchPromise = fetch(request).then(networkResponse => {
          // Cache the fresh response for next time (only valid responses)
          if (networkResponse && networkResponse.ok) {
            cache.put(request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => {
          // Network failed — the cached version (if any) is already being returned
          return cachedResponse;
        });

        // Return cached version immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    )
  );
});