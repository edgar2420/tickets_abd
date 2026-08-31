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
const CLAVE = 'ClaveDeRegistro2026';

console.log('=== 1. EL CATALOGO PUBLICO ===');
const catalogo = await publico('/auth/catalogo-registro');
marca(catalogo.estado === 200, `se consulta sin sesion iniciada (${catalogo.estado})`);
marca((catalogo.cuerpo.datos?.areas ?? []).length > 0,
  `ofrece ${catalogo.cuerpo.datos?.areas?.length} areas`);
marca((catalogo.cuerpo.datos?.sucursales ?? []).length > 0,
  `ofrece ${catalogo.cuerpo.datos?.sucursales?.length} sucursales`);
marca(!JSON.stringify(catalogo.cuerpo).includes('password'),
  'el catalogo publico no filtra nada mas que nombres');

const area = catalogo.cuerpo.datos.areas[0];
const sucursal = catalogo.cuerpo.datos.sucursales[0];

console.log('\n=== 2. QUIEN SE REGISTRA ===');
const cortita = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Prueba', usuario: CUENTA, password: 'corta',
    area_id: area.id, sucursal_id: sucursal.id
  }
});
marca(cortita.estado === 400, `una contrasena floja se rechaza (${cortita.estado})`);

const sinArea = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Prueba', usuario: CUENTA, password: CLAVE,
    area_id: 999999, sucursal_id: sucursal.id
  }
});
marca(sinArea.estado === 400, `un area inexistente se rechaza (${sinArea.estado})`);

const alta = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Prueba', usuario: CUENTA, email: `${CUENTA}@empresa.bo`,
    password: CLAVE, area_id: area.id, sucursal_id: sucursal.id
  }
});
marca(alta.estado === 201, `la solicitud se registra (${alta.estado})`);
marca(/aprobacion/i.test(alta.cuerpo.mensaje ?? ''),
  `se avisa que falta la aprobacion: ${alta.cuerpo.mensaje}`);

const repetido = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Repetido', usuario: CUENTA, password: CLAVE,
    area_id: area.id, sucursal_id: sucursal.id
  }
});
marca(repetido.estado === 400, `un usuario ya tomado se rechaza (${repetido.estado})`);

console.log('\n=== 3. NO ENTRA HASTA QUE LA APRUEBEN ===');
const sinAprobar = await publico('/auth/login', {
  metodo: 'POST', cuerpo: { usuario: CUENTA, password: CLAVE }
});
marca(sinAprobar.estado === 403, `no puede entrar todavia (${sinAprobar.estado})`);
marca(/aprueb/i.test(sinAprobar.cuerpo.mensaje ?? ''),
  `y se le explica por que: ${sinAprobar.cuerpo.mensaje}`);

console.log('\n=== 4. QUIEN PUEDE APROBAR ===');
const negado = await pedir('qa.cliente', '/usuarios/pendientes');
marca(negado.estado === 403, `un solicitante no ve las cuentas pendientes (${negado.estado})`);

const negadoTecnico = await pedir('qa.tecnico', '/usuarios/pendientes');
marca(negadoTecnico.estado === 403, `un tecnico tampoco (${negadoTecnico.estado})`);

const pendientes = await pedir('admin', '/usuarios/pendientes');
marca(pendientes.estado === 200, `la administracion si (${pendientes.estado})`);
const cuenta = (pendientes.cuerpo.datos ?? []).find((u) => u.usuario === CUENTA);
marca(Boolean(cuenta), `la solicitud figura en la bandeja: ${cuenta?.nombre}`);
marca(cuenta?.area === area.nombre && cuenta?.sucursal === sucursal.nombre,
  `con el area y la sucursal que eligio: ${cuenta?.area}, ${cuenta?.sucursal}`);
marca(cuenta?.registrado_solo === true, 'consta que se registro sola');

const intentoAjeno = await pedir('qa.cliente', `/usuarios/${cuenta.id}/aprobar`, {
  metodo: 'PUT', cuerpo: {}
});
marca(intentoAjeno.estado === 403, `un solicitante no puede aprobarla (${intentoAjeno.estado})`);

console.log('\n=== 5. LA APROBACION ===');
const aprobada = await pedir('admin', `/usuarios/${cuenta.id}/aprobar`, {
  metodo: 'PUT', cuerpo: {}
});
marca(aprobada.estado === 200, `la administracion la aprueba (${aprobada.estado})`);
marca(aprobada.cuerpo.datos?.aprobado === true && aprobada.cuerpo.datos?.activo === true,
  'queda aprobada y activa');

const dosVeces = await pedir('admin', `/usuarios/${cuenta.id}/aprobar`, { metodo: 'PUT', cuerpo: {} });
marca(dosVeces.estado === 400, `no se aprueba dos veces (${dosVeces.estado})`);

const entra = await publico('/auth/login', { metodo: 'POST', cuerpo: { usuario: CUENTA, password: CLAVE } });
marca(entra.estado === 200, `ahora si entra (${entra.estado})`);
marca(entra.cuerpo.usuario?.rol === 'cliente',
  `nace con el rol mas limitado: ${entra.cuerpo.usuario?.rol}`);

const avisos = await fetch(BASE + '/notificaciones', {
  headers: { Authorization: 'Bearer ' + entra.cuerpo.token }
});
const listaAvisos = (await avisos.json()).datos ?? [];
marca(listaAvisos.some((a) => a.tipo === 'CUENTA_APROBADA'),
  'recibe el aviso de que su cuenta fue habilitada');

console.log('\n=== 6. EL RECHAZO ===');
const otra = `qa.rechazo${sello}`;
const segunda = await publico('/auth/registro', {
  metodo: 'POST',
  cuerpo: {
    nombre: 'QA Registro Rechazado', usuario: otra, password: CLAVE,
    area_id: area.id, sucursal_id: sucursal.id
  }
});
marca(segunda.estado === 201, `se registra la segunda solicitud (${segunda.estado})`);
const pendientes2 = await pedir('admin', '/usuarios/pendientes');
const aRechazar = (pendientes2.cuerpo.datos ?? []).find((u) => u.usuario === otra);
marca(Boolean(aRechazar), 'la segunda solicitud figura en la bandeja');

const rechazo = await pedir('admin', `/usuarios/${aRechazar.id}/registro`, { metodo: 'DELETE' });
marca(rechazo.estado === 200, `se retira la solicitud (${rechazo.estado})`);

const trasRechazo = await publico('/auth/login', { metodo: 'POST', cuerpo: { usuario: otra, password: CLAVE } });
marca(trasRechazo.estado === 401, `la cuenta rechazada ya no existe (${trasRechazo.estado})`);

const noSeRechazaAprobada = await pedir('admin', `/usuarios/${cuenta.id}/registro`, { metodo: 'DELETE' });
marca(noSeRechazaAprobada.estado === 400,
  `una cuenta ya aprobada no se retira por esta via (${noSeRechazaAprobada.estado})`);

console.log('\n========================================');
console.log(fallos === 0 ? 'REGISTRO DE CUENTAS: TODAS LAS PRUEBAS PASARON' : `REGISTRO DE CUENTAS: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
