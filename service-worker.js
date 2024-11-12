// Versão do cache e nome dinâmico
const CACHE_VERSION = 'v1.0.3';  // Atualize esta versão
const CACHE_NAME = `meu-site-cache-${CACHE_VERSION}`;
const urlsToCache = [
    '/nota/', // Página inicial
    '/nota/index.html',
    '/nota/notas/icon-192x192.png',
    '/nota/notas/icon-512x512.png',
    '/nota/notas/style.css',
    '/nota/notas/script.js',

    '/nota/outros/bootstrap.bundle.min.js',
    '/nota/outros/bootstrap.min.css',
    '/nota/outros/manifest.json',
    '/nota/outros/crypto-js.min.js',

    '/nota/formatar/formatar.html',
    '/nota/formatar/formatar.css',
    '/nota/formatar/formatar.js',
    '/nota/formatar/f-192x192.png',

    '/nota/quiz/quiz.html',
    '/nota/quiz/quiz.css',
    '/nota/quiz/quiz.js',
    '/nota/quiz/acertou.mp3',
    '/nota/quiz/conclusao.mp3',
    '/nota/quiz/errou.mp3',
    '/nota/quiz/fracasso.mp3',
    '/nota/quiz/timeout.mp3',
    '/nota/quiz/q-192x192.png'
];

// Instala e cacheia os arquivos
self.addEventListener('install', (event) => {
    console.log('Instalando Service Worker...');

    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Cache atualizado com sucesso!');
                return Promise.all(
                    urlsToCache.map((url) => {
                        return fetch(url)
                            .then((response) => {
                                if (response.ok) {
                                    console.log(`Recurso encontrado: ${url}`);
                                    return cache.put(url, response.clone());
                                } else {
                                    console.error(`Falha ao obter o arquivo: ${url}`);
                                }
                            })
                            .catch((error) => {
                                console.error(`Erro ao buscar arquivo ${url}:`, error);
                            });
                    })
                );
            })
            .then(() => self.skipWaiting())  // Força o SW a se tornar ativo imediatamente
            .catch((error) => console.error('Erro ao tentar abrir cache:', error))
    );
});

// Ativa o Service Worker e limpa caches antigos
self.addEventListener('activate', (event) => {
    console.log('Ativando Service Worker...');
    event.waitUntil(
        caches.keys().then((cacheNames) =>
            Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log(`Cache antigo excluído: ${cacheName}`);
                        return caches.delete(cacheName);
                    }
                })
            )
        )
    );
    return self.clients.claim();
});

// Intercepta as requisições de rede
self.addEventListener('fetch', (event) => {
    const requestUrl = new URL(event.request.url);

    if (event.request.method !== 'GET') {
        return;
    }

    if (requestUrl.hostname.includes('gist.githubusercontent.com')) {
        event.respondWith(fetch(event.request));
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then((cachedResponse) => {
                if (cachedResponse) {
                    console.log(`Recurso encontrado no cache: ${event.request.url}`);
                    return cachedResponse;
                }

                return fetch(event.request)
                    .then((networkResponse) => {
                        if (networkResponse && networkResponse.status === 200) {
                            const responseClone = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then((cache) => {
                                    cache.put(event.request, responseClone);
                                })
                                .catch((error) => console.warn('Falha ao salvar no cache:', error));

                            return networkResponse;
                        }

                        return networkResponse || new Response('Falha na resposta da rede', {
                            status: 500,
                            statusText: 'Erro na rede',
                        });
                    })
                    .catch((error) => {
                        console.error('Erro ao buscar recurso:', error);
                        return caches.match('/offline.html') || new Response('Página não encontrada', {
                            status: 404,
                            statusText: 'Página não encontrada',
                        });
                    });
            })
    );
});


