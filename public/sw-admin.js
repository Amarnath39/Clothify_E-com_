// Admin Panel Service Worker v1.0.0
// Scoped to /admin/ routes only - does NOT affect buyer/public routes

const CACHE_VERSION = 'v1.0.2';
const CACHE_PREFIX = 'swaarasya-admin';

const CACHE_NAMES = {
    static: `${CACHE_PREFIX}-static-${CACHE_VERSION}`,
    pages: `${CACHE_PREFIX}-pages-${CACHE_VERSION}`,
    offline: `${CACHE_PREFIX}-offline-${CACHE_VERSION}`,
};

// Resources to cache immediately on install
const PRECACHE_ASSETS = [
    '/offline-admin.html',
    '/assets/static/logo/android-chrome-192x192.png',
    '/assets/static/logo/android-chrome-512x512.png',
    '/assets/static/logo/saw.svg',
];

// Install event - precache essential assets
self.addEventListener('install', (event) => {
    console.log('[Admin SW] Installing service worker...');

    event.waitUntil(
        caches.open(CACHE_NAMES.offline).then((cache) => {
            console.log('[Admin SW] Precaching offline assets');
            return cache.addAll(PRECACHE_ASSETS);
        })
    );

    // Activate immediately
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Admin SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old admin caches
                    if (cacheName.startsWith(CACHE_PREFIX) && !Object.values(CACHE_NAMES).includes(cacheName)) {
                        console.log('[Admin SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Take control of all clients immediately
    return self.clients.claim();
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle requests within /admin/ scope
    if (!url.pathname.startsWith('/admin/')) {
        return; // Let browser handle non-admin requests normally
    }

    // Strategy 1: Network-First for Admin API calls (CRITICAL for inventory accuracy)
    if (url.pathname.startsWith('/api/admin/')) {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Strategy 2: Cache-First for static admin assets
    if (
        url.pathname.startsWith('/admin/_next/static/') ||
        url.pathname.startsWith('/assets/static/') ||
        url.pathname.includes('fonts.googleapis.com') ||
        url.pathname.includes('fonts.gstatic.com') ||
        request.destination === 'image' ||
        request.destination === 'font' ||
        request.destination === 'style' ||
        request.destination === 'script'
    ) {
        event.respondWith(cacheFirstStrategy(request));
        return;
    }

    // Strategy 3: Network-First for admin HTML pages
    if (request.destination === 'document' || request.mode === 'navigate') {
        event.respondWith(networkFirstStrategy(request));
        return;
    }

    // Default: Network-First for everything else
    event.respondWith(networkFirstStrategy(request));
});

// Network-First Strategy (for API calls and dynamic content)
async function networkFirstStrategy(request) {
    try {
        const networkResponse = await fetch(request);

        // Cache successful GET responses only
        if (request.method === 'GET' && networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAMES.pages);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[Admin SW] Network request failed, trying cache:', request.url);

        const cachedResponse = await caches.match(request);

        if (cachedResponse) {
            return cachedResponse;
        }

        // If it's a navigation request and offline, show offline page
        if (request.mode === 'navigate') {
            const offlinePage = await caches.match('/offline-admin.html');
            if (offlinePage) {
                return offlinePage;
            }
        }

        // Return error response
        return new Response('Network error occurred', {
            status: 408,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Cache-First Strategy (for static assets)
async function cacheFirstStrategy(request) {
    const cachedResponse = await caches.match(request);

    if (cachedResponse) {
        // Return cached version immediately
        return cachedResponse;
    }

    try {
        const networkResponse = await fetch(request);

        // Cache the new resource
        if (networkResponse && networkResponse.status === 200) {
            const cache = await caches.open(CACHE_NAMES.static);
            cache.put(request, networkResponse.clone());
        }

        return networkResponse;
    } catch (error) {
        console.log('[Admin SW] Failed to fetch:', request.url);

        // For images, could return a placeholder
        if (request.destination === 'image') {
            return new Response('', {
                status: 404,
                statusText: 'Image not found',
            });
        }

        return new Response('Resource not available', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
        });
    }
}

// Listen for messages from clients (for update notifications)
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('[Admin SW] Received SKIP_WAITING message');
        self.skipWaiting();
    }

    if (event.data && event.data.type === 'GET_VERSION') {
        event.ports[0].postMessage({ version: CACHE_VERSION });
    }
});
