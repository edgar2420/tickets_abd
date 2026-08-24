import { ADMIN, prepararEntorno } from './preparar.mjs';

const WEB = process.env.QA_WEB ?? 'http://localhost:5173';

await prepararEntorno();

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const galletas = new Map();

const guardar = (respuesta) => {
  for (const cruda of respuesta.headers.getSetCookie()) {
    const [nombre, valor] = cruda.split(';')[0].split('=');
    if (valor === '') galletas.delete(nombre);
    else galletas.set(nombre, valor);
  }
};

const cabeceraGalletas = () => [...galletas].map(([n, v]) => `${n}=${v}`).join('; ');

const navegar = async (ruta, opciones = {}) => {
  const cabeceras = { Origin: WEB, Referer: `${WEB}/`, ...(opciones.cabeceras ?? {}) };
  if (galletas.size) cabeceras.Cookie = cabeceraGalletas();
  if (galletas.has('tickets_csrf')) cabeceras['X-CSRF-Token'] = galletas.get('tickets_csrf');
  if (opciones.cuerpo) cabeceras['Content-Type'] = 'application/json';

  const respuesta = await fetch(`${WEB}${ruta}`, {
    method: opciones.metodo ?? 'GET',
    headers: cabeceras,
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined,
    redirect: 'manual'
  });
  guardar(respuesta);

  const tipo = respuesta.headers.get('content-type') ?? '';
  const cuerpo = tipo.includes('json') ? await respuesta.json().catch(() => ({})) : await respuesta.text();
  return { estado: respuesta.status, cuerpo, cabeceras: respuesta.headers };
};

console.log('=== 1. LA APLICACION WEB SE SIRVE ===');
const portada = await navegar('/');
marca(portada.estado === 200, `el servidor web responde la portada (${portada.estado})`);
marca(typeof portada.cuerpo === 'string' && portada.cuerpo.includes('<div id="root"'),
  'la portada entrega el contenedor de la aplicacion');

console.log('\n=== 2. SIN SESION NO SE VE NADA ===');
const cerrado = await navegar('/api/v1/tickets');
marca(cerrado.estado === 401, `el listado de tickets exige sesion (${cerrado.estado})`);
marca(galletas.size === 0, 'el navegador no recibio ninguna cookie antes de identificarse');

console.log('\n=== 3. INICIO DE SESION ===');
const malas = await navegar('/api/v1/auth/login', {
  metodo: 'POST', cuerpo: { usuario: ADMIN.usuario, password: 'clave-que-no-es' }
});
marca(malas.estado === 401, `una clave incorrecta se rechaza (${malas.estado})`);

const acceso = await navegar('/api/v1/auth/login', {
  metodo: 'POST', cuerpo: { usuario: ADMIN.usuario, password: ADMIN.password }
});
marca(acceso.estado === 200, `el administrador entra (${acceso.estado})`);
marca(galletas.has('tickets_sesion'), 'el navegador guarda la cookie de sesion');
marca(galletas.has('tickets_csrf'), 'el navegador guarda el token de verificacion de origen');
marca(acceso.cuerpo.usuario?.nombre !== undefined,
  `identidad recibida: ${acceso.cuerpo.usuario?.nombre} (${acceso.cuerpo.usuario?.rol}, ${acceso.cuerpo.usuario?.sucursal})`);
marca(acceso.cuerpo.usuario?.password_hash === undefined, 'la respuesta no incluye rastro de la contrasena');

console.log('\n=== 4. LAS PANTALLAS CARGAN SUS DATOS ===');
const pantallas = [
  ['Tablero', '/api/v1/tickets/tablero'],
  ['Tickets', '/api/v1/tickets?limite=25&pagina=1'],
  ['Inventario', '/api/v1/inventario/articulos'],
  ['Equipos', '/api/v1/equipos'],
  ['Compras', '/api/v1/compras'],
  ['Usuarios', '/api/v1/usuarios'],
  ['Roles', '/api/v1/roles'],
  ['Areas', '/api/v1/areas'],
  ['Sucursales', '/api/v1/sucursales'],
  ['Categorias', '/api/v1/categorias'],
  ['Auditoria', '/api/v1/auditoria?limite=25'],
  ['Notificaciones', '/api/v1/notificaciones']
];
for (const [nombre, ruta] of pantallas) {
  const pantalla = await navegar(ruta);
  const datos = pantalla.cuerpo?.datos;
  const cuantos = Array.isArray(datos) ? `${datos.length} registros` : 'indicadores';
  marca(pantalla.estado === 200, `${nombre.padEnd(15)} ${pantalla.estado}  ${cuantos}`);
}

console.log('\n=== 5. UN TICKET DE PRINCIPIO A FIN ===');
const nuevo = await navegar('/api/v1/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - prueba de recorrido completo desde el navegador',
    descripcion: 'Ticket creado por la prueba de extremo a extremo que atraviesa el servidor web.',
    categoria: 'PC',
    prioridad: 'Alta'
  }
});
marca(nuevo.estado === 201, `se registra el ticket (${nuevo.estado})`);
const ticket = nuevo.cuerpo.datos;

const detalle = await navegar(`/api/v1/tickets/${ticket.id}`);
marca(detalle.estado === 200 && detalle.cuerpo.datos?.titulo === ticket.titulo,
  `se abre la ficha del ticket ${ticket.id}`);

const mensaje = await navegar(`/api/v1/tickets/${ticket.id}/comentarios`, {
  metodo: 'POST', cuerpo: { mensaje: 'Prueba de la conversacion dentro del ticket.' }
});
marca(mensaje.estado === 201, `se escribe en la conversacion (${mensaje.estado})`);

const tomar = await navegar(`/api/v1/tickets/${ticket.id}/tomar`, { metodo: 'PUT' });
marca(tomar.cuerpo.datos?.estado === 'Asignado', `se toma el ticket (${tomar.estado})`);

const iniciar = await navegar(`/api/v1/tickets/${ticket.id}/iniciar`, { metodo: 'PUT' });
marca(iniciar.cuerpo.datos?.estado === 'En Proceso', `se inicia la atencion (${iniciar.estado})`);

const resolver = await navegar(`/api/v1/tickets/${ticket.id}/resolver`, {
  metodo: 'PUT',
  cuerpo: {
    solucion_detalle: 'Prueba de extremo a extremo concluida correctamente.',
    minutos_empleados: 25
  }
});
marca(resolver.estado === 200 && resolver.cuerpo.datos?.estado === 'Resuelto',
  `se resuelve con la solucion documentada (${resolver.estado})`);

console.log('\n=== 6. DESCARGA DE UN DOCUMENTO PDF ===');
const pdf = await fetch(`${WEB}/api/v1/tickets/${ticket.id}/pdf`, {
  headers: { Cookie: cabeceraGalletas(), Origin: WEB }
});
const bytes = pdf.ok ? (await pdf.arrayBuffer()).byteLength : 0;
marca(pdf.ok && bytes > 1500, `la ficha en PDF se descarga (${pdf.status}, ${bytes} bytes)`);

console.log('\n=== 7. CIERRE DE SESION ===');
const salida = await navegar('/api/v1/auth/logout', { metodo: 'POST' });
marca(salida.estado === 200, `el cierre de sesion se acepta (${salida.estado})`);
marca(!galletas.has('tickets_sesion'), 'el navegador se queda sin cookie de sesion');

const despues = await navegar('/api/v1/tickets');
marca(despues.estado === 401, `tras salir ya no se accede a los datos (${despues.estado})`);

console.log('\n========================================');
console.log(fallos === 0 ? 'NAVEGADOR: TODAS LAS PRUEBAS PASARON' : `NAVEGADOR: ${fallos} FALLA(S)`);
console.log('========================================');
console.log('ticket creado por la prueba:', ticket?.id);
process.exit(fallos === 0 ? 0 : 1);
