const VERSION = 'tickets-ti-v1';
const CASCARA = '/index.html';

const NUNCA_SE_GUARDA = ['/api/', '/socket.io/'];

self.addEventListener('install', (evento) => {
  evento.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll([CASCARA, '/favicon.svg', '/icono-192.png', '/icono-512.png']))
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (evento) => {
  evento.waitUntil(
    caches.keys()
      .then((nombres) => Promise.all(
        nombres.filter((nombre) => nombre !== VERSION).map((nombre) => caches.delete(nombre))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (evento) => {
  if (evento.data === 'saltar-espera') self.skipWaiting();
});

const esDeLaCasa = (url) => url.origin === self.location.origin;

const esDatoVivo = (url) => NUNCA_SE_GUARDA.some((trozo) => url.pathname.startsWith(trozo));

const esRecursoConHuella = (url) => url.pathname.startsWith('/assets/')
  || /\.(png|svg|jpg|jpeg|webp|woff2?)$/i.test(url.pathname);

self.addEventListener('fetch', (evento) => {
  const peticion = evento.request;
  if (peticion.method !== 'GET') return;

  const url = new URL(peticion.url);
  if (!esDeLaCasa(url)) return;

  // los datos de la sesion jamas se guardan: cada quien ve lo suyo y siempre al dia
  if (esDatoVivo(url)) return;

  if (peticion.mode === 'navigate') {
    evento.respondWith(
      fetch(peticion)
        .then((respuesta) => {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(CASCARA, copia)).catch(() => {});
          return respuesta;
        })
        .catch(() => caches.match(CASCARA).then((guardada) => guardada ?? Response.error()))
    );
    return;
  }

  if (esRecursoConHuella(url)) {
    evento.respondWith(
      caches.match(peticion).then((guardada) => guardada ?? fetch(peticion).then((respuesta) => {
        if (respuesta.ok && respuesta.type === 'basic') {
          const copia = respuesta.clone();
          caches.open(VERSION).then((cache) => cache.put(peticion, copia)).catch(() => {});
        }
        return respuesta;
      }))
    );
  }
});
