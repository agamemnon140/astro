const CACHE_NAME = 'astro-v11';
const ASSETS = [
  './',
  './index.html',
  './astro.html',
  './styles.css',
  './core.js',
  './astronomy.js',
  './charts.js',
  './ui.js',
  './app.js',
  './vendor/suncalc.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => /^astro-v\d+$/.test(k) && k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== self.location.origin) return;
  const entry = new URL('./', self.registration.scope).href;
  const shell = new URL('./index.html', entry).href;
  // Shared query parameters describe state; all app entry points use the same shell.
  if (e.request.mode === 'navigate' && [entry,shell,new URL('./astro.html',entry).href].includes(url.origin+url.pathname)) {
    e.respondWith(caches.open(CACHE_NAME).then(async c => (await c.match(shell)) || fetch(e.request)));
    return;
  }
  // A missing script/image must never receive an HTML fallback.
  e.respondWith(caches.open(CACHE_NAME).then(async c => (await c.match(e.request)) || fetch(e.request)));
});
