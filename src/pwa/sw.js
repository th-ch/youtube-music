const CACHE_NAME = 'youtube-music-v1';
const STATIC_CACHE_NAME = 'youtube-music-static-v1';
const DYNAMIC_CACHE_NAME = 'youtube-music-dynamic-v1';

const STATIC_FILES = [
  '/',
  '/index.html',
  '/youtube-music.css',
  '/assets/youtube-music.png',
  '/assets/youtube-music.svg',
  '/assets/youtube-music-tray.png',
  '/assets/youtube-music-tray-paused.png',
];

const NETWORK_FIRST = [
  'https://music.youtube.com/sw.js',
  'https://music.youtube.com/manifest.json',
];

const CACHE_FIRST = [
  '/assets/',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Failed to cache static files:', error);
      }),
  );
});

self.addEventListener('activate', (event) => {
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
              return caches.delete(cacheName);
            }
          }),
        );
      })
      .then(() => {
        return self.clients.claim();
      }),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const { url, method } = request;

  if (method !== 'GET') {
    return;
  }

  if (!url.startsWith('http')) {
    return;
  }

  if (NETWORK_FIRST.some((pattern) => url.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  if (CACHE_FIRST.some((pattern) => url.includes(pattern))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  event.respondWith(networkFirstWithFallback(request));
});

async function networkFirst(request) {
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

    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }

    throw error;
  }
}

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);

  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    throw error;
  }
}

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
              background: #000;
              color: #fff;
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
            <p>You're currently offline. Please check your internet connection.</p>
            <button class="retry-btn" onclick="window.location.reload()">Retry</button>
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

self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  console.log('Performing background sync...');
}

self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/youtube-music.png',
      badge: '/assets/youtube-music-tray.png',
      data: data,
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'YouTube Music',
        options,
      ),
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
