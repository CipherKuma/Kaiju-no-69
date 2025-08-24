// Service Worker for Kaiju No. 69
const CACHE_NAME = 'kaiju-v1';
const STATIC_CACHE_NAME = 'kaiju-static-v1';
const DYNAMIC_CACHE_NAME = 'kaiju-dynamic-v1';

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/marketplace',
  '/offline.html',
  '/manifest.json',
  // Add more static assets as needed
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[SW] Installing Service Worker...');
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .catch((err) => {
        console.log('[SW] Error caching static assets:', err);
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating Service Worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== STATIC_CACHE_NAME && cacheName !== DYNAMIC_CACHE_NAME) {
            console.log('[SW] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategies
const isNavigationRequest = (request) => {
  return request.mode === 'navigate';
};

const isImageRequest = (request) => {
  return request.destination === 'image';
};

const isApiRequest = (request) => {
  return request.url.includes('/api/');
};

// Network-first strategy for API calls
const networkFirst = async (request) => {
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
    throw error;
  }
};

// Cache-first strategy for static assets
const cacheFirst = async (request) => {
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
    // Return offline page for navigation requests
    if (isNavigationRequest(request)) {
      return caches.match('/offline.html');
    }
    throw error;
  }
};

// Fetch event - handle requests
self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Skip non-http(s) requests
  if (!request.url.startsWith('http')) {
    return;
  }

  // Handle different request types
  if (isApiRequest(request)) {
    // Network-first for API calls
    event.respondWith(networkFirst(request));
  } else if (isImageRequest(request) || request.destination === 'style' || request.destination === 'script') {
    // Cache-first for static assets
    event.respondWith(cacheFirst(request));
  } else if (isNavigationRequest(request)) {
    // Network-first with offline fallback for navigation
    event.respondWith(
      fetch(request).catch(() => caches.match('/offline.html'))
    );
  } else {
    // Default: try network, fallback to cache
    event.respondWith(
      fetch(request).catch(() => caches.match(request))
    );
  }
});

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[SW] Background sync:', event.tag);
  
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  }
});

async function syncGameData() {
  try {
    // Implement game data sync logic here
    console.log('[SW] Syncing game data...');
  } catch (error) {
    console.error('[SW] Error syncing game data:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New Kaiju activity!',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('Kaiju No. 69', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    // Open the app
    event.waitUntil(
      clients.openWindow('/dashboard')
    );
  }
});