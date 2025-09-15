// Service Worker for YouTube Music Desktop App PWA
const CACHE_NAME = 'youtube-music-v1';
const STATIC_CACHE_NAME = 'youtube-music-static-v1';
const DYNAMIC_CACHE_NAME = 'youtube-music-dynamic-v1';

// Files to cache for offline use
const STATIC_FILES = [
  '/',
  '/index.html',
  '/youtube-music.css',
  '/assets/youtube-music.png',
  '/assets/youtube-music.svg',
  '/assets/youtube-music-tray.png',
  '/assets/youtube-music-tray-paused.png'
];

// Cache strategies
const NETWORK_FIRST = [
  'https://music.youtube.com/sw.js',
  'https://music.youtube.com/manifest.json'
];

const CACHE_FIRST = [
  '/assets/',
  'https://fonts.googleapis.com',
  'https://fonts.gstatic.com'
];

// Install event - cache static files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static files');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('[SW] Static files cached successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
              console.log('[SW] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('[SW] Service worker activated');
        return self.clients.claim();
      })
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

  // Network first strategy for specific URLs
  if (NETWORK_FIRST.some(pattern => url.includes(pattern))) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Cache first strategy for assets and fonts
  if (CACHE_FIRST.some(pattern => url.includes(pattern))) {
    event.respondWith(cacheFirst(request));
    return;
  }

  // Default: Network first with cache fallback
  event.respondWith(networkFirstWithFallback(request));
});

// Network first strategy
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log('[SW] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline page for navigation requests
    if (request.mode === 'navigate') {
      return caches.match('/offline.html');
    }
    
    throw error;
  }
}

// Cache first strategy
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
    console.error('[SW] Cache first failed for:', request.url, error);
    throw error;
  }
}

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
      return new Response(`
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
      `, {
        headers: { 'Content-Type': 'text/html' },
        status: 200
      });
    }
    
    throw error;
  }
}

// Background sync for when connection is restored
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync triggered:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  // Implement background sync logic here
  console.log('[SW] Performing background sync...');
}

// Push notifications (if needed later)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received:', event);
  
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/assets/youtube-music.png',
      badge: '/assets/youtube-music-tray.png',
      data: data
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title || 'YouTube Music', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked:', event);
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data?.url || '/')
  );
});
