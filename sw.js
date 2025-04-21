const CACHE_NAME = 'masizio-countdown-cache-v2'; // Incrementato versione cache
// Aggiorna gli URL se cambiano nel tuo repository!
const urlsToCache = [
  '.', // La pagina principale (index.html) -> Assicurati che il server lo interpreti correttamente
  'index.html', // Aggiungi esplicitamente index.html per sicurezza
  'manifest.json', // Aggiungi il manifest
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/logomasizio.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/bolla.jpg',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/firework.png',
  'https://raw.githubusercontent.com/Masizio2025/Masizio-countdown/refs/heads/main/iconsmall.png' // AGGIUNTA ICONA
];

// Evento Install
self.addEventListener('install', event => {
  console.log('Service Worker: Installazione v2...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Service Worker: Caching files v2...');
        // Gestione errori addAll
        const cachePromises = urlsToCache.map(urlToCache => {
            return cache.add(urlToCache).catch(err => {
                console.warn(`Failed to cache ${urlToCache}: ${err}`);
            });
        });
        return Promise.all(cachePromises);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
          console.error('Service Worker: Caching fallito:', error);
      })
  );
});

// Evento Activate
self.addEventListener('activate', event => {
    console.log('Service Worker: Attivazione v2...');
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

// Evento Fetch
self.addEventListener('fetch', event => {
    // Non logghiamo ogni fetch per evitare troppo rumore in console
    // console.log('Service Worker: Fetching', event.request.url);
    // Usa strategia Cache First
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Se trovato in cache, ritorna la risposta dalla cache
                if (response) {
                    // console.log('Service Worker: Risposta trovata in cache per', event.request.url);
                    return response;
                }
                // Altrimenti, prova a recuperare dalla rete
                // console.log('Service Worker: Risposta non trovata in cache, fetching dalla rete per', event.request.url);
                return fetch(event.request).then(
                    // Opzionale: Metti in cache la nuova risorsa recuperata dalla rete
                    function(networkResponse) {
                        // Controlla se abbiamo ricevuto una risposta valida
                        if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic' || !urlsToCache.includes(event.request.url) ) {
                           // Non mettere in cache risposte non valide o risorse non previste
                           return networkResponse;
                        }
                        // Importante: Clona la risposta. Una risposta è uno Stream e
                        // può essere consumata una sola volta. Dobbiamo clonarla per passarla
                        // sia al browser che alla cache.
                        var responseToCache = networkResponse.clone();
                        caches.open(CACHE_NAME)
                          .then(function(cache) {
                            // console.log('Service Worker: Caching nuova risorsa dalla rete:', event.request.url);
                            cache.put(event.request, responseToCache);
                          });
                        return networkResponse;
                    }
                ).catch(error => {
                     console.error('Service Worker: Errore durante il fetch dalla rete:', error);
                     // Qui potresti restituire una pagina/risorsa offline generica se fallisce sia cache che rete
                });
            })
    );
});
