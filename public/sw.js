const CACHE_NAME = 'mi-finanzas-v4'; // Incrementar versión fuerza limpieza
const ASSETS_TO_CACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE)));
  self.skipWaiting(); // Activar inmediatamente
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(key => key !== CACHE_NAME).map(key => {
        console.log('[SW] Limpiando caché antiguo:', key);
        return caches.delete(key);
      })
    ))
  );
  self.clients.claim(); // Tomar control inmediato
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      // Estrategia Network First para asegurar datos frescos si hay red
      return fetch(event.request).then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached); // Fallback a caché si no hay internet
    })
  );
});