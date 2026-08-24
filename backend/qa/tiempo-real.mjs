import { io } from 'socket.io-client';
import { prepararEntorno } from './preparar.mjs';

const { sesiones } = await prepararEntorno();

const BASE = process.env.QA_BASE ?? 'http://localhost:4000';
const ORIGEN = 'http://localhost:5173';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const entrar = async (usuario, password) => {
  const respuesta = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password })
  });
  const pares = respuesta.headers.getSetCookie().map((c) => c.split(';')[0]);
  return {
    cookie: pares.join('; '),
    csrf: pares.find((p) => p.startsWith('tickets_csrf='))?.split('=')[1]
  };
};

console.log('=== CANAL EN TIEMPO REAL ===');

const tecnico = sesiones['qa.tecnico'];
const cliente = sesiones['qa.cliente4'];

const socket = io(BASE, { extraHeaders: { Cookie: tecnico.cookie }, transports: ['websocket', 'polling'] });

const esperar = (evento, ms) => new Promise((resolve) => {
  const temporizador = setTimeout(() => resolve(null), ms);
  socket.once(evento, (dato) => { clearTimeout(temporizador); resolve(dato); });
});

const conexion = await esperar('conexion:establecida', 8000);
marca(Boolean(conexion), `el tecnico entra al canal y queda en las salas: ${conexion?.salas?.join(', ') ?? 'ninguna'}`);
marca(conexion?.salas?.includes('sala:tecnicos'), 'queda suscrito a la sala del equipo tecnico');

const aviso = esperar('ticket:creado', 8000);
const creado = await fetch(`${BASE}/api/v1/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cliente.cookie, 'X-CSRF-Token': cliente.csrf, Origin: ORIGEN },
  body: JSON.stringify({
    titulo: 'QA - aviso en tiempo real hacia el equipo tecnico',
    descripcion: 'Se verifica que el ticket llega al canal de notificaciones sin recargar la pantalla.',
    categoria: 'Software',
    prioridad: 'Media'
  })
});
const recibido = await aviso;
marca(Boolean(recibido), `el aviso llega sin recargar: ticket ${recibido?.id ?? 'no recibido'}`);

const anonimo = io(BASE, { transports: ['websocket'], reconnection: false });
const rechazo = await new Promise((resolve) => {
  const temporizador = setTimeout(() => resolve(null), 6000);
  anonimo.on('connect_error', (error) => { clearTimeout(temporizador); resolve(error.message); });
  anonimo.on('connect', () => { clearTimeout(temporizador); resolve(null); });
});
marca(Boolean(rechazo), `una conexion sin sesion es rechazada: ${rechazo ?? 'fue admitida'}`);

socket.close();
anonimo.close();

console.log('\n========================================');
console.log(fallos === 0 ? 'TIEMPO REAL: TODAS LAS PRUEBAS PASARON' : `TIEMPO REAL: ${fallos} FALLA(S)`);
console.log('========================================');
console.log('ticket creado por la prueba:', (await creado.json()).datos?.id);
process.exit(fallos === 0 ? 0 : 1);
