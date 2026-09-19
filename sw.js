// sw.js — eenvoudige offline-cache.
// Strategie: netwerk eerst, cache als terugval. Zo zie je altijd de
// nieuwste versie zodra je online bent, maar werkt de app ook zonder net.
const CACHE = 'spacetime-forge-v6';
const BESTANDEN = [
  './',
  './index.html',
  './css/thema.css',
  './js/register.js',
  './js/fysica.js',
  './js/teken.js',
  './js/modules/welkom.js',
  './js/modules/lichtkegel.js',
  './js/modules/gelijktijdigheid.js',
  './js/modules/minkowski.js',
  './js/modules/minkowski-pro.js',
  './js/modules/lichtklok.js',
  './js/modules/epstein.js',
  './manifest.json',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(BESTANDEN))
      .catch((err) => console.warn('Cache vullen deels mislukt:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((namen) =>
      Promise.all(namen.filter((n) => n !== CACHE).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const kopie = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, kopie)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((r) => r || caches.match('./index.html')))
  );
});
