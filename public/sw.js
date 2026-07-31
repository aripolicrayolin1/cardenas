/**
 * Service worker de AgroTech.
 *
 * Su razón de ser es el argumento central del proyecto: que la app FUNCIONE SIN
 * CONEXIÓN. Sin esto, aunque el diagnóstico por sensores sea local, la app ni
 * siquiera abriría sin señal porque el navegador no podría descargar el HTML ni
 * el JavaScript. El service worker guarda una copia y la sirve cuando no hay red.
 *
 * Estrategia:
 *   - Navegación (páginas): red primero, y si falla, la última copia en caché.
 *     Así el agricultor ve contenido fresco con señal y algo utilizable sin ella.
 *   - Estáticos (JS, CSS, imágenes): caché primero, con relleno desde la red.
 *   - Nunca se cachean las llamadas a APIs externas (Firebase, Open-Meteo,
 *     Gemini): esos datos deben ser frescos o fallar de forma visible, no
 *     servirse rancios desde la caché.
 */

const CACHE = 'agrotech-v1';
const APP_SHELL = ['/', '/manifest.json', '/icono.svg'];

// Hosts cuyas respuestas NUNCA se cachean: datos vivos o privados.
const SIN_CACHE = [
  'firestore.googleapis.com',
  'firebasedatabase.app',
  'identitytoolkit.googleapis.com',
  'securetoken.googleapis.com',
  'api.open-meteo.com',
  'power.larc.nasa.gov',
  'nominatim.openstreetmap.org',
  'generativelanguage.googleapis.com',
  'api.telegram.org',
  'my-api.plantnet.org',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((claves) => Promise.all(claves.filter((c) => c !== CACHE).map((c) => caches.delete(c))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);

  // Datos vivos/privados: directo a la red, sin tocar la caché.
  if (SIN_CACHE.some((host) => url.hostname.includes(host))) return;

  // Navegación: red primero, caché de respaldo.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copia = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copia));
          return res;
        })
        .catch(() => caches.match(req).then((r) => r || caches.match('/')))
    );
    return;
  }

  // Estáticos del propio origen: caché primero.
  if (url.origin === self.location.origin) {
    event.respondWith(
      caches.match(req).then(
        (enCache) =>
          enCache ||
          fetch(req).then((res) => {
            const copia = res.clone();
            caches.open(CACHE).then((c) => c.put(req, copia));
            return res;
          })
      )
    );
  }
});
