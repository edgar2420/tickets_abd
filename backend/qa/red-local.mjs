import dotenv from 'dotenv';
import { direccionesLocales } from '../src/config/env.js';

dotenv.config();

const IP = process.argv[2] ?? direccionesLocales()[0];

if (!IP) {
  console.error('No se encontro ninguna direccion de red. Conecte el equipo a la red local.');
  process.exit(1);
}
const WEB = `http://${IP}:5173`;

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

console.log(`=== ACCESO DESDE LA RED: ${WEB} ===`);

const portada = await fetch(WEB, { redirect: 'manual' }).catch(() => null);
marca(Boolean(portada?.ok), `el servidor web responde (${portada?.status ?? 'sin respuesta'})`);

const login = await fetch(`${WEB}/api/v1/auth/login`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Origin: WEB, Referer: `${WEB}/` },
  body: JSON.stringify({ usuario: process.env.QA_ADMIN_USUARIO ?? process.env.ADMIN_USUARIO ?? 'admin',
    password: process.env.QA_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? '24112001Edgar' })
});
marca(login.status === 200, `el inicio de sesion atraviesa el proxy (${login.status})`);

const pares = login.headers.getSetCookie().map((c) => c.split(';')[0]);
const cookie = pares.join('; ');
const csrf = pares.find((p) => p.startsWith('tickets_csrf='))?.split('=')[1];
marca(Boolean(csrf), 'el navegador recibe la cookie de verificacion de origen');

const listado = await fetch(`${WEB}/api/v1/tickets?limite=5`, {
  headers: { Cookie: cookie, Origin: WEB }
});
marca(listado.status === 200, `una consulta autenticada responde (${listado.status})`);

const escritura = await fetch(`${WEB}/api/v1/tickets`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: cookie, 'X-CSRF-Token': csrf, Origin: WEB },
  body: JSON.stringify({
    titulo: 'QA - prueba de acceso desde otra maquina de la red',
    descripcion: 'Se verifica que una escritura desde la red local supere la verificacion de origen.',
    categoria: 'Redes',
    prioridad: 'Baja'
  })
});
marca(escritura.status === 201, `una escritura supera la verificacion de origen (${escritura.status})`);

const ajeno = await fetch(`${WEB}/api/v1/tickets`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', Cookie: cookie,
    'X-CSRF-Token': csrf, Origin: 'http://maquina-intrusa.local:5173'
  },
  body: JSON.stringify({ titulo: 'QA - desde un origen ajeno', descripcion: 'No deberia entrar.', categoria: 'Redes' })
});
marca(ajeno.status === 403, `un origen ajeno a la red sigue rechazado (${ajeno.status})`);

const socket = await fetch(`${WEB}/socket.io/?EIO=4&transport=polling`, { headers: { Cookie: cookie } });
marca(socket.ok, `el canal de tiempo real atraviesa el proxy (${socket.status})`);

console.log('\n========================================');
console.log(fallos === 0 ? 'RED LOCAL: TODO ACCESIBLE' : `RED LOCAL: ${fallos} PROBLEMA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
