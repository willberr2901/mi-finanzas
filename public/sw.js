// ✅ VERSIÓN DEL CACHÉ - CAMBIAR ESTO FORZA LIMPIEZA TOTAL
const CACHE_NAME = 'mi-finanzas-v5'; // Cambiado de v4 a v5
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon-192.png',
  '/icon-512.png'
];

self.addEventListener('install', (event) => {
  console.log('[SW] Instalando nueva versión...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Cacheando assets...');
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting(); // Activar inmediatamente sin esperar
});

self.addEventListener('activate', (event) => {
  console.log('[SW] Activando nueva versión...');
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME) // Eliminar todos los cachés antiguos
          .map((key) => {
            console.log('[SW] Eliminando caché antiguo:', key);
            return caches.delete(key);
          })
      );
    })
  );
  self.clients.claim(); // Tomar control inmediato de todas las pestañas
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Para API requests → Network First
  if (url.pathname.startsWith('/api')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // Para assets estáticos → Cache First, pero con validación
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) {
        // Validar si hay versión más reciente en red
        return fetch(request).then((response) => {
          if (response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, clone);
            });
            return response;
          }
          return cached;
        }).catch(() => cached);
      }
      
      // Si no hay caché, obtener de red
      return fetch(request).then((response) => {
        if (response.ok && request.method === 'GET') {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, clone);
          });
        }
        return response;
      });
    })
  );
});

// Mensajes del cliente
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});