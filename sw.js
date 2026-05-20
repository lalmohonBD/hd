const CACHE = 'retailer-v1';
const OFFLINE_URL = '/hd/index.html'; // আপনার main file এর নাম

const FILES = [
  '/hd/',
  '/hd/index.html',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-database-compat.js',
  'https://www.gstatic.com/firebasejs/9.6.10/firebase-auth-compat.js',
  'https://fonts.googleapis.com/css2?family=Hind+Siliguri:wght@400;500;600;700&display=swap'
];

// Install — cache files
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(FILES)).catch(() => {})
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — cache first for app shell, network first for Firebase
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Firebase requests — always network, no cache
  if (url.hostname.includes('firebasedatabase') || url.hostname.includes('googleapis')) {
    e.respondWith(
      fetch(e.request).catch(() => new Response(JSON.stringify(null), {
        headers: { 'Content-Type': 'application/json' }
      }))
    );
    return;
  }

  // App shell — cache first, fallback to offline page
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE).then(cache => cache.put(e.request, clone));
        return res;
      }).catch(() => caches.match(OFFLINE_URL));
    })
  );
});
