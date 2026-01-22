const CACHE_NAME = 'biomada-v1';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './a-propos.html',
  './produits.html',
  './travaillons-ensemble.html',
  './css/style.css',
  './css/header.css',
  './css/footer.css',
  './css/background.css',
  './bootstrap-5.0.2-dist/bootstrap-5.0.2-dist/css/bootstrap.min.css',
  './bootstrap-5.0.2-dist/bootstrap-5.0.2-dist/js/bootstrap.bundle.min.js'
];

// Install Event: Cache core assets
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching core assets');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event: Stale-While-Revalidate pattern
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return;

  // Strategy: Try network first, fall back to cache for HTML
  // Strategy: Cache first, fall back to network for images/fonts (adjust as needed)
  
  const url = new URL(event.request.url);

  // For images and fonts: Cache First
  if (url.pathname.match(/\.(jpg|jpeg|png|gif|svg|woff|woff2|ttf|eot)$/)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        return cachedResponse || fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
      })
    );
  } else {
    // For other content (HTML, CSS, JS): Stale-While-Revalidate
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        });
        return cachedResponse || fetchPromise;
      })
    );
  }
});
