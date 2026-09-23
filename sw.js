// Cambia il numero di versione a ogni aggiornamento dell'app
const CACHE = 'menu-app-v3';
const LOCAL = ['./', './index.html', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', './icons/apple-touch-icon.png', './vendor/fonts.css', './vendor/html2canvas.min.js', './vendor/jspdf.umd.min.js', './assets/domenica-pecore.jpg', './assets/domenica-girasole.jpg', './assets/domenica-muretto.jpg', './assets/comunione.jpg'];
const CDN = [];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => c.addAll(LOCAL).then(() => c.addAll(CDN).catch(() => {})))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin === location.origin) {
    // File dell'app: prima la rete (per ricevere gli aggiornamenti), poi la copia salvata
    e.respondWith(fetch(e.request).then(r => {
      const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); return r;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
    return;
  }
  // Librerie e caratteri: prima la copia salvata, così funziona anche offline
  e.respondWith(caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok || r.type === 'opaque') { const cp = r.clone(); caches.open(CACHE).then(c => c.put(e.request, cp)); }
    return r;
  })));
});
