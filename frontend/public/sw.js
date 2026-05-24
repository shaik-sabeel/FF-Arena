const CACHE_NAME = 'ff-arena-cache-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/logo.svg',
  '/manifest.json'
];

// Install Event - Caches App Shell Assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching offline assets');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event - Cleans Up Old Caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Network First with Cache Fallback
self.addEventListener('fetch', (event) => {
  // Ignore API requests and non-GET requests
  if (event.request.url.includes('/api/') || event.request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone it and save to cache
        if (response && response.status === 200) {
          const responseCopy = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseCopy);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try fetching from cache
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If navigation page, return index.html cache fallback
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
