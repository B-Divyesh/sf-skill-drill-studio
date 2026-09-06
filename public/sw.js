const CACHE = 'skill-drill-studio-v3';
const SHELL = ['/', '/demo', '/index.html', '/assets/night-workshop-800.webp', '/assets/sample-workbench.svg', '/assets/fonts/atkinson-regular.woff2', '/assets/fonts/atkinson-bold.woff2', '/assets/fonts/fraunces-semibold.woff2', '/favicon.svg'];
self.addEventListener('install', (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())));
self.addEventListener('activate', (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))).then(() => self.clients.claim())));
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== location.origin) return;
  event.respondWith((async () => {
    const cached = await caches.match(event.request);
    if (cached) return cached;
    try {
      const response = await fetch(event.request);
      if (response.ok) {
        const cache = await caches.open(CACHE);
        await cache.put(event.request, response.clone());
      }
      return response;
    } catch {
      return (await caches.match('/index.html')) || Response.error();
    }
  })());
});
