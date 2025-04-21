const CACHE_NAME = 'masizio-countdown-cache-v3'; // *** VERSIONE CACHE INCREMENTATA ***
// Aggiorna gli URL se cambiano nel tuo repository!
const urlsToCache = [
  '.',
  'index.html', // Meglio essere espliciti
  'manifest.json',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/logomasizio.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/bolla.jpg',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/firework.png',
  // *** AGGIUNTE NUOVE ICONE ***
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/iconsmall192.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/iconsmall512.png'
];

// Evento Install
self.addEventListener('install', event => {
  console.log(`Service Worker: Installazione ${CACHE_NAME}...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Service Worker: Caching files ${CACHE_NAME}...`);
        const cachePromises = urlsToCache.map(urlToCache => {
            return cache.add(urlToCache).catch(err => {
                console.warn(`Failed to cache ${urlToCache}: ${err}`);
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch(error => { console.error('Service Worker: Caching fallito:', error); })
  );
});

// Evento Activate
self.addEventListener('activate', event => {
    console.log(`Service Worker: Attivazione ${CACHE_NAME}...`);
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        console.log('Service Worker: Rimozione vecchia cache', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

// Evento Fetch (Cache First)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) { return response; } // Da Cache
                // Altrimenti Rete (con cache opzionale della risposta)
                return fetch(event.request).then(networkResponse => {
                    if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || !urlsToCache.includes(event.request.url) ) {
                       return networkResponse;
                    }
                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => { cache.put(event.request, responseToCache); });
                    return networkResponse;
                }).catch(error => { console.error('Service Worker: Errore fetch rete:', error); });
            })
    );
});
