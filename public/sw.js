const CACHE_NAME = 'kiratabi-shell-v2';

const PRECACHE_URLS = [
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/japan.topojson',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => Promise.allSettled(PRECACHE_URLS.map((url) => cache.add(url))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== CACHE_NAME)
            .map((oldKey) => caches.delete(oldKey))
        )
      )
      .then(() => self.clients.claim())
  );
});

function fetchWithTimeout(request, timeoutMs) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        reject(new Error('SW network timeout'));
      }
    }, timeoutMs);

    fetch(request)
      .then((response) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          resolve(response);
        }
      })
      .catch((err) => {
        clearTimeout(timer);
        if (!settled) {
          settled = true;
          reject(err);
        }
      });
  });
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Never intercept non-GET requests
  if (request.method !== 'GET') return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // NEVER intercept API routes, admin/partner portals, or HMR
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/kira-system-panel-9f2') ||
    url.pathname.startsWith('/biz-portal-secure-8f92a1b3') ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.hostname.startsWith('ops-vault-') ||
    url.hostname.startsWith('partner.') ||
    url.hostname.startsWith('biz.')
  ) {
    return;
  }

  // 1. Immutable hashed bundles & pre-cached static assets -> Cache-First
  if (
    url.pathname.startsWith('/_next/static/') ||
    PRECACHE_URLS.includes(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkRes;
        });
      })
    );
    return;
  }

  // 2. HTML Navigation requests -> Network-First with 4s timeout fallback to cache
  const acceptHeader = request.headers.get('accept') || '';
  if (request.mode === 'navigate' || acceptHeader.includes('text/html')) {
    event.respondWith(
      fetchWithTimeout(request, 4000)
        .then((networkRes) => {
          if (networkRes && networkRes.status === 200) {
            const clone = networkRes.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone)).catch(() => {});
          }
          return networkRes;
        })
        .catch(async () => {
          const cachedExact = await caches.match(request);
          if (cachedExact) return cachedExact;
          const cachedByPath = await caches.match(url.pathname);
          if (cachedByPath) return cachedByPath;
          const cachedHome = await caches.match('/');
          if (cachedHome) return cachedHome;
          return fetch(request);
        })
    );
  }
});
