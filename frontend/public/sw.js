// SERS Service Worker — v1.2.0
// Strategy: Cache First for static assets, Network First for API calls

const CACHE_NAME = 'sers-v1.2.0';
const STATIC_ASSETS = [
    '/',
    '/marketplace',
    '/services',
    '/offline',
    '/logo.png',
    '/icon.svg',
];

// ─── Install: precache static assets ─────────────────────────
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS).catch((err) => {
                console.warn('[SW] Precache partial failure:', err);
            });
        }).then(() => self.skipWaiting())
    );
});

// ─── Activate: delete old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(
                keys
                    .filter((key) => key !== CACHE_NAME)
                    .map((key) => caches.delete(key))
            )
        ).then(() => self.clients.claim())
    );
});

// ─── Fetch strategy ──────────────────────────────────────────
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Skip: non-GET, chrome-extension, API calls (always network)
    if (
        request.method !== 'GET' ||
        url.protocol === 'chrome-extension:' ||
        url.pathname.startsWith('/api/')
    ) {
        return;
    }

    // Cache-first for _next/static (JS/CSS bundles) and images
    if (
        url.pathname.startsWith('/_next/static/') ||
        url.pathname.startsWith('/images/') ||
        /\.(png|jpg|jpeg|svg|webp|woff2?|ico)$/.test(url.pathname)
    ) {
        event.respondWith(cacheFirst(request));
        return;
    }

    // Network-first for HTML pages (SSR/SSG)
    if (request.headers.get('accept')?.includes('text/html')) {
        event.respondWith(networkFirst(request));
        return;
    }
});

// ─── Strategies ──────────────────────────────────────────────
async function cacheFirst(request) {
    const cached = await caches.match(request);
    if (cached) return cached;

    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        return new Response('Offline', { status: 503 });
    }
}

async function networkFirst(request) {
    try {
        const networkResponse = await fetch(request);
        if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            cache.put(request, networkResponse.clone());
        }
        return networkResponse;
    } catch {
        const cached = await caches.match(request);
        return cached || caches.match('/offline') || new Response('Offline', { status: 503 });
    }
}

// ─── Push Notifications (future use) ─────────────────────────
self.addEventListener('push', (event) => {
    if (!event.data) return;
    const data = event.data.json();
    event.waitUntil(
        self.registration.showNotification(data.title || 'SERS', {
            body: data.body || '',
            icon: '/logo.png',
            badge: '/icon.svg',
            dir: 'rtl',
            lang: 'ar',
            data: data.url ? { url: data.url } : {},
        })
    );
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/';
    event.waitUntil(clients.openWindow(url));
});
