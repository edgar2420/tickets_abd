import { prepararEntorno, pedirCon } from './preparar.mjs';

const BASE = process.env.QA_API ?? 'http://localhost:4000/api/v1';
const ORIGEN = process.env.QA_ORIGEN ?? 'http://localhost:5173';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const { sesiones } = await prepararEntorno();
const pedir = (usuario, ruta, opciones = {}) => pedirCon(sesiones[usuario])(ruta, opciones);

const publico = async (ruta, opciones = {}) => {
  const respuesta = await fetch(BASE + ruta, {
    method: opciones.metodo ?? 'GET',
    headers: { Origin: ORIGEN, ...(opciones.cuerpo ? { 'Content-Type': 'application/json' } : {}) },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json().catch(() => ({})) };
};

const sello = Date.now().toString().slice(-6);
const CUENTA = `qa.registro${sello}`;
const OTRA = `qa.segunda${sello}`;
const CLAVE = 'ClaveDeRegistro2026';

const registrar = (usuario, nombre, areaId, sucursalId) => publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: { nombre, usuario, password: CLAVE, area_id: areaId, sucursal_id: sucursalId }
});

console.log('=== 1. EL CATALOGO PUBLICO ===');
const catalogo = await publico('/auth/catalogo-registro');
marca(catalogo.estado === 200, `se consulta sin sesion iniciada (${catalogo.estado})`);
marca((catalogo.cuerpo.datos?.areas ?? []).length > 0,
  `ofrece ${catalogo.cuerpo.datos?.areas?.length} areas`);
marca((catalogo.cuerpo.datos?.sucursales ?? []).length > 0,
  `ofrece ${catalogo.cuerpo.datos?.sucursales?.length} sucursales`);
marca(!JSON.stringify(catalogo.cuerpo).includes('password'),
  'el catalogo publico solo entrega nombres, nada mas');

const area = catalogo.cuerpo.datos.areas[0];
const sucursal = catalogo.cuerpo.datos.sucursales[0];

console.log('\n=== 2. LO QUE NO SE ADMITE ===');
const floja = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Prueba', usuario: CUENTA, password: 'corta',
    area_id: area.id, sucursal_id: sucursal.id
  }
});
marca(floja.estado === 400, `una contrasena floja se rechaza (${floja.estado})`);

const areaFalsa = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Prueba', usuario: CUENTA, password: CLAVE,
    area_id: 999999, sucursal_id: sucursal.id
  }
});
marca(areaFalsa.estado === 400, `un area inexistente se rechaza (${areaFalsa.estado})`);

console.log('\n=== 3. EL ALTA ===');
const alta = await registrar(CUENTA, 'QA Registro Prueba', area.id, sucursal.id);
marca(alta.estado === 201, `la cuenta se registra (${alta.estado})`);

const repetido = await registrar(CUENTA, 'QA Registro Repetido', area.id, sucursal.id);
marca(repetido.estado === 400, `un usuario ya tomado se rechaza (${repetido.estado})`);

// El servidor decide si la cuenta entra de una o espera aprobacion. La bateria
// comprueba lo que corresponda a como este configurado.
const inmediato = alta.cuerpo.datos?.acceso_inmediato === true;

console.log(`\n=== 4. EL ACCESO (modo ${inmediato ? 'inmediato' : 'con aprobacion'}) ===`);
const intento = await publico('/auth/login', { metodo: 'POST', cuerpo: { usuario: CUENTA, password: CLAVE } });

if (inmediato) {
  marca(intento.estado === 200, `entra apenas se registra (${intento.estado})`);
  marca(intento.cuerpo.usuario?.rol === 'cliente',
    `siempre con el rol mas limitado: ${intento.cuerpo.usuario?.rol}`);
  marca((intento.cuerpo.usuario?.permisos ?? []).every((c) => !c.startsWith('admin.')),
    'sin ningun permiso de administracion');
  marca(!(intento.cuerpo.usuario?.permisos ?? []).includes('tickets.ver_todos'),
    'y sin poder ver los tickets de los demas');
} else {
  marca(intento.estado === 403, `no puede entrar todavia (${intento.estado})`);
  marca(/aprueb/i.test(intento.cuerpo.mensaje ?? ''),
    `y se le explica por que: ${intento.cuerpo.mensaje}`);
}

console.log('\n=== 5. LA ADMINISTRACION SE ENTERA ===');
const avisos = await pedir('admin', '/notificaciones');
marca((avisos.cuerpo.datos ?? []).some((a) => ['CUENTA_NUEVA', 'CUENTA_PENDIENTE'].includes(a.tipo)),
  'le llega el aviso de cada alta');

const listado = await pedir('admin', `/usuarios?busqueda=${CUENTA}`);
const cuenta = (listado.cuerpo.datos ?? []).find((u) => u.usuario === CUENTA);
marca(Boolean(cuenta), `la cuenta figura en el listado: ${cuenta?.nombre}`);
marca(cuenta?.area === area.nombre && cuenta?.sucursal === sucursal.nombre,
  `con el area y la sucursal que eligio: ${cuenta?.area}, ${cuenta?.sucursal}`);
marca(cuenta?.registrado_solo === true, 'consta que se registro sola, no la creo un administrador');

console.log('\n=== 6. QUIEN MIRA Y QUIEN DECIDE ===');
const negadoCliente = await pedir('qa.cliente', '/usuarios/pendientes');
marca(negadoCliente.estado === 403, `un solicitante no ve las cuentas pendientes (${negadoCliente.estado})`);

const negadoTecnico = await pedir('qa.tecnico', '/usuarios/pendientes');
marca(negadoTecnico.estado === 403, `un tecnico tampoco (${negadoTecnico.estado})`);

const bandeja = await pedir('admin', '/usuarios/pendientes');
marca(bandeja.estado === 200, `la administracion si (${bandeja.estado})`);

const ajeno = await pedir('qa.cliente', `/usuarios/${cuenta.id}/aprobar`, { metodo: 'PUT', cuerpo: {} });
marca(ajeno.estado === 403, `un solicitante no puede aprobar cuentas (${ajeno.estado})`);

if (inmediato) {
  console.log('\n=== 7. CON ACCESO INMEDIATO ===');
  marca(!(bandeja.cuerpo.datos ?? []).some((u) => u.usuario === CUENTA),
    'la cuenta no queda esperando en la bandeja');

  const yaAprobada = await pedir('admin', `/usuarios/${cuenta.id}/aprobar`, { metodo: 'PUT', cuerpo: {} });
  marca(yaAprobada.estado === 400, `no se aprueba lo que ya estaba aprobado (${yaAprobada.estado})`);

  const noSeRetira = await pedir('admin', `/usuarios/${cuenta.id}/registro`, { metodo: 'DELETE' });
  marca(noSeRetira.estado === 400, `tampoco se retira por la via del rechazo (${noSeRetira.estado})`);

  // Lo que le queda a la administracion es desactivar la cuenta
  const desactivada = await pedir('admin', `/usuarios/${cuenta.id}`, {
    metodo: 'PUT',
    cuerpo: {
      nombre: cuenta.nombre, usuario: cuenta.usuario, email: cuenta.email,
      area_id: cuenta.area_id, sucursal_id: cuenta.sucursal_id, rol_id: cuenta.rol_id,
      activo: false
    }
  });
  marca(desactivada.estado === 200, `la administracion puede desactivarla (${desactivada.estado})`);

  const trasDesactivar = await publico('/auth/login', {
    metodo: 'POST', cuerpo: { usuario: CUENTA, password: CLAVE }
  });
  marca(trasDesactivar.estado === 403, `y entonces deja de entrar (${trasDesactivar.estado})`);
} else {
  console.log('\n=== 7. CON APROBACION PREVIA ===');
  marca((bandeja.cuerpo.datos ?? []).some((u) => u.usuario === CUENTA),
    'la solicitud espera en la bandeja');

  const aprobada = await pedir('admin', `/usuarios/${cuenta.id}/aprobar`, { metodo: 'PUT', cuerpo: {} });
  marca(aprobada.estado === 200, `la administracion la aprueba (${aprobada.estado})`);
  marca(aprobada.cuerpo.datos?.aprobado === true && aprobada.cuerpo.datos?.activo === true,
    'queda aprobada y activa');

  const dosVeces = await pedir('admin', `/usuarios/${cuenta.id}/aprobar`, { metodo: 'PUT', cuerpo: {} });
  marca(dosVeces.estado === 400, `no se aprueba dos veces (${dosVeces.estado})`);

  const entra = await publico('/auth/login', { metodo: 'POST', cuerpo: { usuario: CUENTA, password: CLAVE } });
  marca(entra.estado === 200, `ahora si entra (${entra.estado})`);

  const suyos = await fetch(BASE + '/notificaciones', {
    headers: { Authorization: 'Bearer ' + entra.cuerpo.token }
  });
  marca(((await suyos.json()).datos ?? []).some((a) => a.tipo === 'CUENTA_APROBADA'),
    'recibe el aviso de que su cuenta fue habilitada');

  const segunda = await registrar(OTRA, 'QA Segunda Solicitud', area.id, sucursal.id);
  marca(segunda.estado === 201, `se registra una segunda solicitud (${segunda.estado})`);

  const bandeja2 = await pedir('admin', '/usuarios/pendientes');
  const aRetirar = (bandeja2.cuerpo.datos ?? []).find((u) => u.usuario === OTRA);
  marca(Boolean(aRetirar), 'la segunda figura en la bandeja');

  const rechazo = await pedir('admin', `/usuarios/${aRetirar.id}/registro`, { metodo: 'DELETE' });
  marca(rechazo.estado === 200, `se retira la solicitud (${rechazo.estado})`);

  const trasRechazo = await publico('/auth/login', { metodo: 'POST', cuerpo: { usuario: OTRA, password: CLAVE } });
  marca(trasRechazo.estado === 401, `la cuenta rechazada ya no existe (${trasRechazo.estado})`);
}

console.log('\n========================================');
console.log(fallos === 0 ? 'REGISTRO DE CUENTAS: TODAS LAS PRUEBAS PASARON' : `REGISTRO DE CUENTAS: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
