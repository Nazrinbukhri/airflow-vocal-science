/* CHESS MASTER AI service worker.
 * The build step (scripts/build-sw.mjs) replaces the two placeholders below with
 * the build id and the list of every file in the static export, so all core
 * lessons and the board work offline after the first visit.
 */
const VERSION = '__BUILD_VERSION__';
const PRECACHE = [] /*__PRECACHE_LIST__*/;
const CACHE = `cma-${VERSION}`;
const NAV_TIMEOUT_MS = 3500;

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // Add one by one so a single failed file does not abort the whole install.
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))));
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith('cma-') && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })(),
  );
});

function pageKey(url) {
  // Static export uses trailing slashes: /learn -> /learn/
  const u = new URL(url);
  if (!u.pathname.endsWith('/') && !/\.[a-z0-9]+$/i.test(u.pathname)) u.pathname += '/';
  if (u.pathname.endsWith('/index.html')) u.pathname = u.pathname.slice(0, -'index.html'.length);
  return u.origin + u.pathname;
}

async function fromCache(request, key) {
  const cache = await caches.open(CACHE);
  return (await cache.match(key ?? request, { ignoreSearch: true })) || undefined;
}

async function networkFirstPage(request) {
  const cache = await caches.open(CACHE);
  const key = pageKey(request.url);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), NAV_TIMEOUT_MS)),
    ]);
    if (response.ok) cache.put(key, response.clone());
    return response;
  } catch {
    return (
      (await fromCache(request, key)) ||
      (await fromCache(request, new URL('/', request.url).href)) ||
      new Response('<h1>Luar talian</h1><p>Halaman ini belum disimpan untuk kegunaan luar talian.</p>', {
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
        status: 503,
      })
    );
  }
}

async function cacheFirst(request) {
  const hit = await fromCache(request);
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request) {
  const hit = await fromCache(request);
  const network = fetch(request)
    .then(async (response) => {
      if (response.ok) (await caches.open(CACHE)).put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return hit || (await network) || Response.error();
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(networkFirstPage(request));
  } else if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(cacheFirst(request));
  } else {
    event.respondWith(staleWhileRevalidate(request));
  }
});
