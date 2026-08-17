/* Service Worker — Simulatore Cedolino
   Cache-first: consente l'uso completo offline dopo la prima visita. */

const CACHE_NOME = 'sim-cedolino-v1';
const FILE_DA_CACHE = [
  './',
  './index.html',
  './style.css',
  './script.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(CACHE_NOME).then((cache) => cache.addAll(FILE_DA_CACHE))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys().then((nomi) =>
      Promise.all(nomi.filter((n) => n !== CACHE_NOME).map((n) => caches.delete(n)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (evento) => {
  // Le richieste ai font Google restano di rete (non critiche, fallback di sistema previsto in CSS)
  if(evento.request.url.includes('fonts.googleapis.com') || evento.request.url.includes('fonts.gstatic.com')) return;

  evento.respondWith(
    caches.match(evento.request).then((rispostaCache) => {
      return rispostaCache || fetch(evento.request).then((rispostaRete) => {
        return caches.open(CACHE_NOME).then((cache) => {
          cache.put(evento.request, rispostaRete.clone());
          return rispostaRete;
        });
      }).catch(() => rispostaCache);
    })
  );
});
