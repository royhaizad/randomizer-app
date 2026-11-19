// Offline support. Opens instantly from the saved copy, then quietly
// downloads any newer version in the background for next time.
const CACHE = 'randomizer-roy-v1';
const FILES = [
  './', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png',
  './fonts/plus-jakarta-sans-latin.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)));
  self.skipWaiting();
});

// Only this copy's old saved copies are cleared: /roy, /adam and /default keep their own.
const MINE = /^randomizer-roy-v\d+$/;
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => MINE.test(k) && k !== CACHE).map((k) => caches.delete(k))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  const fresh = fetch(req).then(async (res) => {
    if (res.ok) {
      const copy = res.clone();
      const cache = await caches.open(CACHE);
      await cache.put(req, copy);
    }
    return res;
  });
  e.waitUntil(fresh.catch(() => {}));
  e.respondWith(caches.match(req, { ignoreSearch: true }).then((cached) => cached || fresh));
});
