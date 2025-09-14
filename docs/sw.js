// Service Worker for YouTube Music Desktop App PWA (Docs Site)
const CACHE_NAME = 'youtube-music-docs-v1';
const STATIC_CACHE_NAME = 'youtube-music-docs-static-v1';
const DYNAMIC_CACHE_NAME = 'youtube-music-docs-dynamic-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/index.html',
  '/style/style.css',
  '/style/fonts.css',
  '/js/main.js',
  '/img/youtube-music.png',
  '/img/youtube-music.svg',
  '/favicon/favicon.ico',
  '/favicon/favicon_32.png',
  '/favicon/favicon_48.png',
  '/favicon/favicon_96.png',
  '/favicon/favicon_144.png',
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker for docs...');

  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(
          STATIC_FILES.map((url) => {
            // Handle root path
            if (url === '/') {
              return '/youtube-music/';
            }
            return '/youtube-music' + url;
          }),
        );
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error);
      }),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');

  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== STATIC_CACHE_NAME &&
              cacheName !== DYNAMIC_CACHE_NAME
            ) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      }),
  );
});

// Fetch event - handle requests with caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  // Only handle GET requests
  if (method !== 'GET') {
    return;
  }

  // Skip non-http(s) requests
  if (!url.startsWith('http')) {
    return;
  }

  // Default: Network first with cache fallback
  event.respondWith(networkFirstWithFallback(request));
});

// Network first with cache fallback
async function networkFirstWithFallback(request) {
  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
      return cachedResponse;
    }

    // For navigation requests, return a basic offline page
    if (request.mode === 'navigate') {
      return new Response(
        `
        <!DOCTYPE html>
        <html>
        <head>
          <title>YouTube Music - Offline</title>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              padding: 50px;
              background: #3f4042;
              color: #fff;
              margin: 0;
            }
            .offline-container {
              max-width: 500px;
              margin: 0 auto;
            }
            .offline-icon {
              font-size: 64px;
              margin-bottom: 20px;
            }
            .retry-btn {
              background: #ff0000;
              color: white;
              border: none;
              padding: 12px 24px;
              border-radius: 4px;
              cursor: pointer;
              margin-top: 20px;
            }
          </style>
        </head>
        <body>
          <div class="offline-container">
            <div class="offline-icon">🎵</div>
            <h1>YouTube Music</h1>
            <p>You're currently offline. The docs site is cached for offline viewing.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry Connection</button>
          </div>
        </body>
        </html>
      `,
        {
          headers: { 'Content-Type': 'text/html' },
          status: 200,
        },
      );
    }

    throw error;
  }
}
