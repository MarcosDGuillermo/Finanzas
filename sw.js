// Service worker de Finanzas: guarda la "cáscara" de la app para que abra rápido y sin señal.
// Los datos NO pasan por acá: van por POST a Apps Script y nunca se guardan en esta caché.
const CACHE = 'finanzas-v1';
const BASE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(BASE); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (claves) {
    return Promise.all(claves.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;                          // las consultas a la planilla van directo
  if (new URL(req.url).origin !== self.location.origin) return;   // fuentes y Apps Script: directo a la red
  // Red primero: con señal siempre tomás la última versión que subas a GitHub; sin señal, la guardada
  e.respondWith(
    fetch(req).then(function (res) {
      if (res.ok) { const copia = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copia); }); }
      return res;
    }).catch(function () {
      return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); });
    })
  );
});
