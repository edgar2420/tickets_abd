import { io } from 'socket.io-client';

const BASE = process.env.QA_BASE ?? 'http://localhost:4000';
const ORIGEN = 'http://localhost:5173';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const entrar = async (usuario, password) => {
  const respuesta = await fetch(`${BASE}/api/v1/auth/login`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password })
  });
  const pares = respuesta.headers.getSetCookie().map((c) => c.split(';')[0]);
  return {
    cookie: pares.join('; '),
    csrf: pares.find((p) => p.startsWith('tickets_csrf='))?.split('=')[1]
  };
};

const pedir = (sesion, ruta, metodo = 'GET', cuerpo) => fetch(BASE + '/api/v1' + ruta, {
  method: metodo,
  headers: {
    Cookie: sesion.cookie, 'X-CSRF-Token': sesion.csrf, Origin: ORIGEN,
    ...(cuerpo ? { 'Content-Type': 'application/json' } : {})
  },
  body: cuerpo ? JSON.stringify(cuerpo) : undefined
}).then(async (r) => ({ estado: r.status, cuerpo: await r.json().catch(() => ({})) }));

console.log('=== EL CIRCUITO DE COMPRAS LLEGA EN TIEMPO REAL ===');

const gerente = await entrar('gerente', 'Prueba123*');
const ti = await entrar('admin', 'Admin123*');
const cliente = await entrar('cochabamba', 'Prueba123*');

const socketGerente = io(BASE, { extraHeaders: { Cookie: gerente.cookie }, transports: ['websocket', 'polling'] });
const socketTi = io(BASE, { extraHeaders: { Cookie: ti.cookie }, transports: ['websocket', 'polling'] });

const conexion = (socket) => new Promise((resolver) => {
  const t = setTimeout(() => resolver(null), 8000);
  socket.once('conexion:establecida', (d) => { clearTimeout(t); resolver(d); });
});

const salasGerente = (await conexion(socketGerente))?.salas ?? [];
const salasTi = (await conexion(socketTi))?.salas ?? [];
marca(salasGerente.includes('sala:compras'), `Gerencia entra a la sala de compras: ${salasGerente.join(', ')}`);
marca(salasTi.includes('sala:compras'), `TI tambien la recibe: ${salasTi.join(', ')}`);

const esperar = (socket, evento) => new Promise((resolver) => {
  const t = setTimeout(() => resolver(null), 8000);
  socket.once(evento, (d) => { clearTimeout(t); resolver(d); });
});

const avisoAlta = esperar(socketGerente, 'compra:creada');
const alta = await pedir(cliente, '/compras', 'POST', {
  titulo: 'QA - equipo para la prueba de tiempo real',
  justificacion: 'Se verifica que Gerencia vea el circuito avanzar sin recargar la pantalla.',
  tipo_equipo: 'Laptop', cantidad: 1, prioridad: 'Alta'
});
const solicitud = alta.cuerpo.datos;
const recibidaAlta = await avisoAlta;
marca(Boolean(recibidaAlta), `Gerencia ve la solicitud nueva al instante (${solicitud?.id ?? 'sin id'})`);

const avisoTi = esperar(socketGerente, 'compra:actualizada');
await pedir(ti, `/compras/${solicitud.id}/aprobar-ti`, 'PUT', {
  observacion_ti: 'Viabilidad tecnica confirmada.', monto_estimado: 7350.5,
  equipo_sugerido: 'Laptop de 14 pulgadas, procesador de gama media, 16 GB de memoria y disco solido de 512 GB'
});
const trasTi = await avisoTi;
marca(trasTi?.estado === 'Aprobada por TI',
  `Gerencia ve que TI aprobo, sin recargar: ${trasTi?.estado ?? 'no llego'}`);
marca(Number(trasTi?.monto_estimado) === 7350.5,
  `el monto referencial viaja en el aviso: ${trasTi?.monto_estimado}`);
marca(typeof trasTi?.equipo_sugerido === 'string' && trasTi.equipo_sugerido.length > 10,
  `el equipo sugerido por TI llega a Gerencia: ${trasTi?.equipo_sugerido?.slice(0, 45)}...`);
marca(!('proveedor_sugerido' in (trasTi ?? {})),
  'la solicitud ya no arrastra un proveedor');

const avisoSolicitante = esperar(socketTi, 'compra:actualizada');
await pedir(gerente, `/compras/${solicitud.id}/aprobar-gerencia`, 'PUT', {
  observacion_gerencia: 'Presupuesto autorizado.'
});
const trasGerencia = await avisoSolicitante;
marca(trasGerencia?.estado === 'Aprobada por Gerencia',
  `TI ve la aprobacion de Gerencia, sin recargar: ${trasGerencia?.estado ?? 'no llego'}`);

socketGerente.close();
socketTi.close();

console.log('\n========================================');
console.log(fallos === 0 ? 'COMPRAS EN TIEMPO REAL: TODAS LAS PRUEBAS PASARON' : `COMPRAS EN TIEMPO REAL: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
