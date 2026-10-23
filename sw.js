// Service worker: aplikace se po prvním otevření načte i bez internetu a jde "přidat na plochu".
// Modely Whisperu si ukládá knihovna transformers.js sama (Cache API), tady se o ně nestaráme.
const CACHE = 'titulky-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k.startsWith('titulky-') && k !== CACHE) await caches.delete(k);
    await self.clients.claim();
  })());
});

// Vlastní soubory aplikace: nejdřív síť (ať máš vždy nejnovější verzi), bez internetu z cache.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const res = await fetch(req);
      if (res.ok) cache.put(req, res.clone());
      return res;
    } catch {
      const hit = await cache.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw new Error('offline');
    }
  })());
});
