var CACHE_VERSION = 'v1';
var CACHE_PAGES = 'doc-pages-' + CACHE_VERSION;
var CACHE_STATIC = 'doc-static-' + CACHE_VERSION;
var CACHE_IMAGES = 'doc-images-' + CACHE_VERSION;
var IMAGE_CACHE_LIMIT = 100 * 1024 * 1024;
var NETWORK_TIMEOUT = 3000;

var EXCLUDE_PATTERNS = ['/wp-admin', '/wp-json/', 'admin-ajax.php', 'wp-login.php', 'preview=true'];

var IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|ico|bmp|avif)(\?.*)?$/i;

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(CACHE_PAGES).then(function (cache) {
            return cache.add('/offline');
        }).then(function () {
            return self.skipWaiting();
        })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (names) {
            return Promise.all(
                names.filter(function (name) {
                    return name.startsWith('doc-') &&
                        name !== CACHE_PAGES &&
                        name !== CACHE_STATIC &&
                        name !== CACHE_IMAGES;
                }).map(function (name) {
                    return caches.delete(name);
                })
            );
        }).then(function () {
            return self.clients.claim();
        })
    );
});

self.addEventListener('fetch', function (event) {
    var request = event.request;

    if (request.method !== 'GET') return;

    var url = request.url;
    for (var i = 0; i < EXCLUDE_PATTERNS.length; i++) {
        if (url.indexOf(EXCLUDE_PATTERNS[i]) !== -1) return;
    }

    if (IMAGE_EXTENSIONS.test(url)) {
        event.respondWith(cacheFirstImage(request));
        return;
    }

    if (isStaticAsset(url)) {
        event.respondWith(staleWhileRevalidate(request, CACHE_STATIC));
        return;
    }

    var accept = request.headers.get('Accept') || '';
    if (accept.indexOf('text/html') !== -1) {
        event.respondWith(networkFirstPage(request));
        return;
    }
});

function isStaticAsset(url) {
    return /\.(css|js|woff2?|ttf|eot)(\?.*)?$/i.test(url) ||
        url.indexOf('/wp-includes/') !== -1 ||
        url.indexOf('/wp-content/themes/') !== -1;
}

function networkFirstPage(request) {
    return new Promise(function (resolve) {
        var timer = setTimeout(function () {
            timer = null;
            caches.match(request).then(function (cached) {
                if (cached) {
                    resolve(cached);
                }
            });
        }, NETWORK_TIMEOUT);

        fetch(request).then(function (response) {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            if (response && response.ok) {
                var clone = response.clone();
                caches.open(CACHE_PAGES).then(function (cache) {
                    cache.put(request, clone);
                });
            }
            resolve(response);
        }).catch(function () {
            if (timer) {
                clearTimeout(timer);
                timer = null;
            }
            caches.match(request).then(function (cached) {
                resolve(cached || caches.match('/offline').then(function (offline) {
                    return offline || new Response('Offline', {
                        status: 503,
                        headers: { 'Content-Type': 'text/plain' }
                    });
                }));
            });
        });
    });
}

function staleWhileRevalidate(request, cacheName) {
    return caches.open(cacheName).then(function (cache) {
        return cache.match(request).then(function (cached) {
            var fetchPromise = fetch(request).then(function (response) {
                if (response && response.ok) {
                    cache.put(request, response.clone());
                }
                return response;
            }).catch(function () {
                return cached;
            });
            return cached || fetchPromise;
        });
    });
}

function cacheFirstImage(request) {
    return caches.open(CACHE_IMAGES).then(function (cache) {
        return cache.match(request).then(function (cached) {
            if (cached) return cached;
            return fetch(request).then(function (response) {
                if (response && response.ok) {
                    cache.put(request, response.clone());
                    trimImageCache();
                }
                return response;
            }).catch(function () {
                return new Response(
                    '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">' +
                    '<rect fill="#e0e0e0" width="200" height="150"/>' +
                    '<text fill="#999" font-family="sans-serif" font-size="14" text-anchor="middle" x="100" y="80">' +
                    'Offline</text></svg>',
                    { headers: { 'Content-Type': 'image/svg+xml' } }
                );
            });
        });
    });
}

var _trimming = false;
function trimImageCache() {
    if (_trimming) return;
    _trimming = true;
    setTimeout(function () {
        caches.open(CACHE_IMAGES).then(function (cache) {
            return cache.keys().then(function (keys) {
                if (keys.length < 50) {
                    _trimming = false;
                    return;
                }
                var entries = [];
                return Promise.all(keys.map(function (req) {
                    return cache.match(req).then(function (res) {
                        var size = parseInt(res.headers.get('Content-Length') || '0', 10);
                        var date = res.headers.get('Date') || '';
                        entries.push({ request: req, size: size, date: new Date(date || 0).getTime() });
                    });
                })).then(function () {
                    var total = 0;
                    for (var i = 0; i < entries.length; i++) total += entries[i].size;
                    if (total <= IMAGE_CACHE_LIMIT) {
                        _trimming = false;
                        return;
                    }
                    entries.sort(function (a, b) { return a.date - b.date; });
                    var deletePromises = [];
                    for (var j = 0; j < entries.length && total > IMAGE_CACHE_LIMIT; j++) {
                        total -= entries[j].size;
                        deletePromises.push(cache.delete(entries[j].request));
                    }
                    return Promise.all(deletePromises);
                }).then(function () {
                    _trimming = false;
                });
            });
        }).catch(function () {
            _trimming = false;
        });
    }, 5000);
}
