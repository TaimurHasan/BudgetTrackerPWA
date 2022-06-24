// files that will be stored in cache for offline retrieval
const FILES_TO_CACHE = [
    './',
    './index.html',
    './css/styles.css',
    './js/index.js',
    './js/idb.js',
];

const APP_PREFIX = 'BudgetTracker-';
const VERSION = 'version_01';
const CACHE_NAME = APP_PREFIX + VERSION;
const DATA_CACHE_NAME = APP_PREFIX + '-DATA-' + VERSION;

self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log(`installing cache : ${CACHE_NAME}`)
            return cache.addAll(FILES_TO_CACHE)
        })
    );

    // used with self.clients.claim() for service worker to take immediate control
    self.skipWaiting();
});

self.addEventListener('activate', function(e) {
    e.waitUntil(
        // get all items from cache with keys()
        caches.keys().then(function (keyList) {
            let cacheKeepList = keyList.filter(function(key) {
                return key.indexOf(APP_PREFIX);
            })

            cacheKeepList.push(CACHE_NAME);

            return Promise.all(
                keyList.map(function(key, i) {
                    // if not in the cacheKeepList
                    if(cacheKeepList.indexOf(key) === -1) {
                        console.log(`delete cache : ${keyList[i]}`);
                        return caches.delete(keyList[i]);
                    }
                })
            )
        })
    )

    // give service worker control over api
    self.clients.claim();
});

self.addEventListener('fetch', function(e) {
    console.log(`fetch request : ${e.request.url}`)
    
    if(e.request.url.includes('/api/')) {
        e.respondWith(
            caches.open(DATA_CACHE_NAME).then(cache => {
                return fetch(e.request)
                    .then(response => {
                        if(response.ok) {
                            cache.put(e.request.url, response.clone());
                        }
                        return response;
                    })
                    .catch(err => {
                        // network failure, get from cache
                        return cache.match(e.request)
                    });
            })
        );

        return;
    };

    // response for non-api requests
    e.respondWith(
        caches.match(e.request).then(function (request) {
            if(request) {
                console.log(`responding with cache : ${e.request.url}`)
                return request;
            } else {
                console.log(`file is not cached, fetching : ${e.request.url}`)
                return fetch(e.request);
            }
        })
    )
})