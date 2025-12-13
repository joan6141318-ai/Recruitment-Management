const CACHE_NAME = 'agencia-moon-v3';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Estrategia para Firestore/API: Network Only (No cachear datos en tiempo real)
  if (url.pathname.includes('firestore') || url.hostname.includes('firebase')) {
    return;
  }

  // Estrategia para Assets estáticos (JS, CSS, Imágenes): Stale-While-Revalidate
  // Esto permite que la app funcione offline cacheando lo que Vite genera
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        const fetchPromise = fetch(event.request).then((networkResponse) => {
          // Solo cachear respuestas válidas y seguras
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
          return networkResponse;
        });
        
        // Devolver caché si existe, si no, esperar a la red
        return cachedResponse || fetchPromise;
      })
  );
});