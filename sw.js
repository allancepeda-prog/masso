/* Service worker de la app MASSO: instalación, pantalla sin conexión y notificaciones push. */
importScripts('config.js');
var CACHE = 'masso-' + self.MASSO_VERSION;
var ARCHIVOS = ['./', './index.html', './config.js', './manifest.webmanifest', './icon-192.png', './icon-512.png', './favicon-32.png'];

self.addEventListener('install', function (e) { e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ARCHIVOS); }).then(function () { return self.skipWaiting(); })); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); })); }).then(function () { return self.clients.claim(); }));
});
// Solo los archivos propios de la app; la plataforma (Google) siempre va en línea
self.addEventListener('fetch', function (e) {
  var u = new URL(e.request.url);
  if (u.origin !== self.location.origin || e.request.method !== 'GET') return;
  e.respondWith(fetch(e.request).then(function (r) { var c = r.clone(); caches.open(CACHE).then(function (k) { k.put(e.request, c); }); return r; })
    .catch(function () { return caches.match(e.request, { ignoreSearch: true }).then(function (r) { return r || caches.match('./index.html'); }); }));
});

// --- Identificador de suscripción (lo guarda la página al activar) ---
function idb() { return new Promise(function (ok, ko) { var r = indexedDB.open('masso', 1); r.onupgradeneeded = function () { r.result.createObjectStore('kv'); }; r.onsuccess = function () { ok(r.result); }; r.onerror = ko; }); }
function leerSid() { return idb().then(function (db) { return new Promise(function (ok) { var q = db.transaction('kv').objectStore('kv').get('sid'); q.onsuccess = function () { ok(q.result || ''); }; q.onerror = function () { ok(''); }; }); }); }

self.addEventListener('push', function (e) {
  e.waitUntil(leerSid().then(function (sid) {
    if (!sid) return [];
    return fetch(self.MASSO_EXEC + '?api=push&sid=' + encodeURIComponent(sid), { cache: 'no-store' }).then(function (r) { return r.json(); })
      .then(function (j) { return (j && j.mensajes) || []; }).catch(function () { return []; });
  }).then(function (lista) {
    if (!lista.length) lista = [{ titulo: 'MASSO', cuerpo: 'Tiene novedades en la plataforma.', url: '', tag: 'masso' }];
    return Promise.all(lista.map(function (m) {
      return self.registration.showNotification(m.titulo || 'MASSO', {
        body: m.cuerpo || '', tag: m.tag || 'masso', icon: 'icon-192.png', badge: 'favicon-32.png', lang: 'es-CL',
        data: { v: m.url || '' }, renotify: true
      });
    }));
  }));
});

self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var v = (e.notification.data && e.notification.data.v) || '';
  var destino = new URL('./' + (v ? '?v=' + encodeURIComponent(v) : ''), self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (cs) {
    for (var i = 0; i < cs.length; i++) { if (cs[i].url.indexOf(self.registration.scope) === 0) { cs[i].postMessage({ masso: 'ir', v: v }); return cs[i].focus(); } }
    return self.clients.openWindow(destino);
  }));
});
