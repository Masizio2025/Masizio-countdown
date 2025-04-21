const CACHE_NAME = 'masizio-countdown-cache-v4'; // *** VERSIONE CACHE INCREMENTATA ***
// Aggiorna gli URL se cambiano nel tuo repository!
const urlsToCache = [
  '.', // Richiesta radice del scope
  '/Masizio-countdown/index.html', // Percorso esplicito per l'HTML
  '/Masizio-countdown/manifest.json', // Percorso esplicito per il manifest
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/logomasizio.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/bolla.jpg',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/firework.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/iconsmall192.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/iconsmall512.png',
  // *** AGGIUNTE IMMAGINI WEDSHOOTS ***
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/QR2.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/e668daf0c714437e8fa565d02540109c9ff3b858/apple-store-badge.svg',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/e668daf0c714437e8fa565d02540109c9ff3b858/google-play-badge.svg'
];

// Evento Install
self.addEventListener('install', event => {
  console.log(`Service Worker: Installazione ${CACHE_NAME}...`);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`Service Worker: Caching files ${CACHE_NAME}...`);
        const cachePromises = urlsToCache.map(urlToCache => {
            // Usa Request object per gestire correttamente URL esterni nel caching
            const request = new Request(urlToCache, { mode: 'cors' }); // Prova CORS se sono URL esterni
            return cache.add(request).catch(err => {
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

// Evento Fetch (Cache First, Network Fallback con cache opzionale)
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) { return response; } // Da Cache

                // Clona la richiesta perché può essere letta una sola volta
                var fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(networkResponse => {
                    // Controlla risposta valida e se è un URL che volevamo cachare
                    // (Relax sulla condizione urlsToCache per flessibilità)
                    if(!networkResponse || networkResponse.status !== 200 /* || networkResponse.type !== 'basic' */ ) {
                       return networkResponse; // Non mettere in cache errori o risposte non-basic (come CORS opache)
                    }

                    var responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, responseToCache);
                     });
                    return networkResponse;
                }).catch(error => {
                     console.error('Service Worker: Errore fetch rete:', error);
                     // Potresti restituire una risposta offline generica qui
                     // return new Response('<h1>Sei offline</h1>', { headers: { 'Content-Type': 'text/html' } });
                });
            })
    );
});
