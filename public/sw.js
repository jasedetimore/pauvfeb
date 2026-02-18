// This service worker immediately unregisters itself.
// It exists to replace any third-party (e.g. Cloudflare) service worker
// that was previously cached in users' browsers with a restrictive CSP.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.registration.unregister();
  self.clients.matchAll({ type: 'window' }).then((clients) => {
    clients.forEach((client) => client.navigate(client.url));
  });
});
