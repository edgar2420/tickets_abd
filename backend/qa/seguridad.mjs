import http from 'node:http';

const BASE = 'http://localhost:4000/api/v1';
const ORIGEN = 'http://localhost:5173';

const pedirCrudo = (ruta, cabeceras) => new Promise((resolve) => {
  const peticion = http.request(
    { host: 'localhost', port: 4000, path: ruta, method: 'GET', headers: cabeceras },
    (res) => {
      res.resume();
      res.on('end', () => resolve({ estado: res.statusCode, cabeceras: res.headers }));
    }
  );
  peticion.end();
});
let fallos = 0;
const marca = (ok, t) => { if (!ok) fallos += 1; console.log(`${ok ? 'OK  ' : 'FALLA'} ${t}`); };

const leerCookies = (respuesta) => {
  const crudas = respuesta.headers.getSetCookie?.() ?? [];
  const mapa = {};
  for (const cruda of crudas) {
    const [par, ...atributos] = cruda.split(';');
    const [nombre, valor] = par.split('=');
    mapa[nombre.trim()] = { valor, atributos: atributos.map((a) => a.trim().toLowerCase()) };
  }
  return mapa;
};

console.log('=== 1. LA SESION VIAJA EN COOKIE httpOnly ===');
const respuestaLogin = await fetch(BASE + '/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario: 'admin', password: 'Admin123*' })
});
const cookies = leerCookies(respuestaLogin);
const sesion = await respuestaLogin.json();

marca(Boolean(cookies.tickets_sesion), 'el inicio de sesion entrega la cookie de sesion');
marca(cookies.tickets_sesion?.atributos.includes('httponly'),
  `la cookie de sesion es httpOnly (${cookies.tickets_sesion?.atributos.join(', ')})`);
marca(cookies.tickets_sesion?.atributos.includes('samesite=strict'), 'la cookie es SameSite=Strict');
marca(!cookies.tickets_csrf?.atributos.includes('httponly'), 'la cookie de CSRF si es legible por la aplicacion');
marca(Boolean(sesion.csrf), 'la respuesta incluye el token de verificacion de origen');

const galleta = `tickets_sesion=${cookies.tickets_sesion.valor}; tickets_csrf=${cookies.tickets_csrf.valor}`;
const csrf = cookies.tickets_csrf.valor;

console.log('\n=== 2. AUTENTICACION POR COOKIE ===');
const conCookie = await fetch(BASE + '/tickets?limite=1', { headers: { Cookie: galleta } });
marca(conCookie.status === 200, `la cookie autentica una consulta (${conCookie.status})`);
const sinNada = await fetch(BASE + '/tickets');
marca(sinNada.status === 401, `sin credencial se rechaza (${sinNada.status})`);

console.log('\n=== 3. PROTECCION CONTRA PETICIONES FORJADAS ===');
const sinCabecera = await fetch(BASE + '/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: galleta, Origin: ORIGEN },
  body: JSON.stringify({ titulo: 'QA - intento de falsificacion externa', descripcion: 'Peticion sin token de origen valido.', categoria: 'Redes' })
});
marca(sinCabecera.status === 403, `escritura con cookie pero sin cabecera CSRF: rechazada (${sinCabecera.status})`);

const cabeceraFalsa = await fetch(BASE + '/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: galleta, 'X-CSRF-Token': 'a'.repeat(48), Origin: ORIGEN },
  body: JSON.stringify({ titulo: 'QA - intento con token de origen invalido', descripcion: 'Peticion con cabecera falsificada.', categoria: 'Redes' })
});
marca(cabeceraFalsa.status === 403, `escritura con token de origen invalido: rechazada (${cabeceraFalsa.status})`);

const legitima = await fetch(BASE + '/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: galleta, 'X-CSRF-Token': csrf, Origin: ORIGEN },
  body: JSON.stringify({
    titulo: 'QA - verificacion del circuito con proteccion de origen',
    descripcion: 'Ticket creado por la prueba de seguridad con la cabecera correcta.',
    categoria: 'Redes', prioridad: 'Baja'
  })
});
marca(legitima.status === 201, `escritura legitima aceptada (${legitima.status})`);
const ticketCreado = (await legitima.json()).datos;

console.log('\n=== 3b. VERIFICACION DEL ORIGEN DECLARADO ===');
const origenAjeno = await fetch(BASE + '/tickets', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json', Cookie: galleta,
    'X-CSRF-Token': csrf, Origin: 'https://sitio-malicioso.example'
  },
  body: JSON.stringify({ titulo: 'QA - escritura desde un origen ajeno', descripcion: 'Peticion emitida desde un sitio no autorizado.', categoria: 'Redes' })
});
marca(origenAjeno.status === 403, `una escritura desde un origen ajeno se rechaza (${origenAjeno.status})`);

const sinOrigen = await fetch(BASE + '/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Cookie: galleta, 'X-CSRF-Token': csrf },
  body: JSON.stringify({ titulo: 'QA - escritura sin declarar origen', descripcion: 'Peticion con cookie que no declara de donde parte.', categoria: 'Redes' })
});
marca(sinOrigen.status === 403, `una escritura con cookie que no declara origen se rechaza (${sinOrigen.status})`);

console.log('\n=== 4. EL CLIENTE MOVIL SIGUE OPERANDO CON CABECERA ===');
const conBearer = await fetch(BASE + '/tickets?limite=1', {
  headers: { Authorization: 'Bearer ' + sesion.token }
});
marca(conBearer.status === 200, `la cabecera Authorization autentica (${conBearer.status})`);
const escrituraBearer = await fetch(BASE + '/tickets', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sesion.token },
  body: JSON.stringify({
    titulo: 'QA - verificacion del acceso desde la aplicacion movil',
    descripcion: 'El esquema con cabecera no requiere token de origen porque no es explotable por CSRF.',
    categoria: 'Redes', prioridad: 'Baja'
  })
});
marca(escrituraBearer.status === 201, `escritura con cabecera, sin CSRF, aceptada (${escrituraBearer.status})`);
const ticketMovil = (await escrituraBearer.json()).datos;

console.log('\n=== 5. CABECERAS DE SEGURIDAD ===');
const cabeceras = (await fetch('http://localhost:4000/salud')).headers;
for (const [cabecera, esperado] of [
  ['content-security-policy', null],
  ['x-content-type-options', 'nosniff'],
  ['x-frame-options', 'SAMEORIGIN'],
  ['referrer-policy', 'no-referrer']
]) {
  const valor = cabeceras.get(cabecera);
  marca(Boolean(valor) && (!esperado || valor === esperado), `${cabecera}: ${valor ?? 'ausente'}`);
}
marca(cabeceras.get('x-powered-by') === null, 'no se anuncia la tecnologia del servidor');

console.log('\n=== 6. BLOQUEO POR INTENTOS FALLIDOS ===');
let ultimo = 0;
for (let i = 1; i <= 6; i += 1) {
  const r = await fetch(BASE + '/auth/login', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario: 'oruro', password: 'clave-incorrecta' })
  });
  ultimo = r.status;
}
marca(ultimo === 403, `tras varios intentos fallidos la cuenta queda bloqueada (${ultimo})`);
const bloqueada = await fetch(BASE + '/auth/login', {
  method: 'POST', headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario: 'oruro', password: 'Prueba123*' })
});
const mensajeBloqueo = (await bloqueada.json()).mensaje;
marca(bloqueada.status === 403, `ni con la clave correcta entra mientras dura el bloqueo: ${mensajeBloqueo}`);

console.log('\n=== 7. CACHE DE CATALOGOS ===');
const primera = await fetch(BASE + '/areas', { headers: { Cookie: galleta } });
const control = primera.headers.get('cache-control');
const etiqueta = primera.headers.get('etag');
marca(control?.includes('private'), `Cache-Control: ${control}`);
marca(Boolean(etiqueta), `etiqueta de entidad presente: ${etiqueta?.slice(0, 20)}`);
const revalidada = await pedirCrudo('/api/v1/areas', { Cookie: galleta, 'If-None-Match': etiqueta });
marca(revalidada.estado === 304, `una consulta repetida se resuelve con ${revalidada.estado} sin reenviar el cuerpo`);

console.log('\n=== 8. CIERRE DE SESION ===');
const salida = await fetch(BASE + '/auth/logout', {
  method: 'POST', headers: { Cookie: galleta, 'X-CSRF-Token': csrf, Origin: ORIGEN }
});
const cookiesSalida = leerCookies(salida);
marca(salida.status === 200, 'cierre de sesion aceptado');
marca(cookiesSalida.tickets_sesion?.valor === '', 'la cookie de sesion se vacia al salir');

console.log('\n=== 9. LA API ESTA CERRADA POR OMISION ===');
for (const ruta of ['/areas', '/usuarios', '/inventario/articulos', '/equipos', '/compras', '/auditoria', '/notificaciones']) {
  const abierta = await fetch(BASE + ruta);
  marca(abierta.status === 401, `${ruta} sin credencial: ${abierta.status}`);
}
const inexistente = await fetch(BASE + '/ruta-que-no-existe');
marca(inexistente.status === 401, `una ruta desconocida tampoco se atiende sin sesion (${inexistente.status})`);

console.log('\n========================================');
console.log(fallos === 0 ? 'SEGURIDAD: TODAS LAS PRUEBAS PASARON' : `SEGURIDAD: ${fallos} FALLA(S)`);
console.log('========================================');
console.log('tickets creados por la prueba:', [ticketCreado?.id, ticketMovil?.id].join(', '));
process.exit(fallos === 0 ? 0 : 1);
