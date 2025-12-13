
const CACHE_NAME = 'agencia-moon-v12-nuclear'; // VERSIÓN CRÍTICA
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg',
  'https://cdn.tailwindcss.com'
];

self.addEventListener('install', (event) => {
  self.skipWaiting(); // Activar inmediatamente sin esperar
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
          // Borrar TODO lo que no sea la versión actual
          if (cacheName !== CACHE_NAME) {
            console.log('🔥 Destruyendo caché viejo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Ignorar Firebase/API
  if (url.pathname.includes('firestore') || url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
    return;
  }

  // Network First para HTML (Siempre busca versión nueva)
  if (event.request.headers.get('accept').includes('text/html')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Stale-While-Revalidate para assets (Carga rápido, actualiza en fondo)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, networkResponse.clone());
            });
        }
        return networkResponse;
      });
      return cachedResponse || fetchPromise;
    })
  );
});
