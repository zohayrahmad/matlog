/* Mat Log service worker.
   App files are network-first: online you always get the latest version,
   offline you get the last cached copy. Fonts are cache-first.
   Your training data lives in localStorage and is never touched here. */
const CACHE = 'matlog-v3';
const CORE = [
  './', './index.html', './manifest.webmanifest', './css/app.css?v=3',
  './js/data.js?v=3', './js/store.js?v=3', './js/analytics.js?v=3', './js/charts.js?v=3',
  './js/ui.js?v=3', './js/screens.js?v=3', './js/main.js?v=3',
  './icons/icon-192.png', './icons/apple-touch-icon.png', './icons/icon.svg',
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const sameOrigin = url => new URL(url).origin === self.location.origin;

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  if (req.mode === 'navigate' || sameOrigin(req.url)) {
    e.respondWith(
      fetch(req)
        .then(res => {
          if (res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req.mode === 'navigate' ? './index.html' : req, copy));
          }
          return res;
        })
        .catch(() => caches.match(req.mode === 'navigate' ? './index.html' : req, { ignoreSearch: req.mode === 'navigate' }))
    );
    return;
  }

  // third-party (fonts): cache-first, refresh in the background
  e.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req)
        .then(res => {
          if (res.ok || res.type === 'opaque') {
            const copy = res.clone();
            caches.open(CACHE).then(c => c.put(req, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
