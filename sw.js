/* sw.js — Service Worker：离线缓存 */

const CACHE_NAME = 'shengshi-v25';
const ASSETS = [
  './',
  './index.html',
  './css/style.css',
  './js/data.js',
  './js/factoryProducts.js',
  './js/logistics.js',
  './js/state.js',
  './js/engine.js',
  './js/time.js',
  './js/employees.js',
  './js/ui.js',
  './js/pages/home.js',
  './js/pages/deposit.js',
  './js/pages/stocks.js',
  './js/pages/stockDetail.js',
  './js/pages/funds.js',
  './js/pages/metals.js',
  './js/pages/industry.js',
  './js/pages/staff.js',
  './js/pages/warehouse.js',
  './js/pages/overview.js',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE_NAME && caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(cached => {
      return cached || fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && e.request.method === 'GET') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
