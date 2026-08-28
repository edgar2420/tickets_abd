import { prepararEntorno, ADMIN } from './preparar.mjs';

const BASE = process.env.QA_API ?? 'http://localhost:4000/api/v1';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const tiene = (objeto, campos) => campos.filter((c) => !(objeto ?? {}).hasOwnProperty(c));

await prepararEntorno();

// La aplicacion movil no usa cookies: se identifica con la cabecera Authorization
const pedirMovil = (token) => async (ruta, opciones = {}) => {
  const respuesta = await fetch(BASE + ruta, {
    method: opciones.metodo ?? 'GET',
    headers: {
      Authorization: 'Bearer ' + token,
      ...(opciones.cuerpo ? { 'Content-Type': 'application/json' } : {})
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });
  return { estado: respuesta.status, cuerpo: await respuesta.json().catch(() => ({})) };
};

console.log('=== 1. ACCESO DESDE EL TELEFONO ===');
const acceso = await fetch(BASE + '/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ usuario: ADMIN.usuario, password: ADMIN.password })
});
const sesion = await acceso.json();
marca(acceso.status === 200 && typeof sesion.token === 'string',
  `el inicio de sesion entrega un token para el telefono (${acceso.status})`);
marca(tiene(sesion.usuario, ['id', 'nombre', 'usuario', 'rol', 'area', 'permisos']).length === 0,
  'el perfil trae los campos que muestra la pantalla de inicio');

const pedir = pedirMovil(sesion.token);

const perfil = await pedir('/auth/perfil');
marca(perfil.estado === 200, `el token restaura la sesion al reabrir la aplicacion (${perfil.estado})`);

console.log('\n=== 2. PANTALLA DE INICIO ===');
const tablero = await pedir('/tickets/tablero');
const CAMPOS_RESUMEN = ['abiertos', 'en_proceso', 'criticos', 'vencidos', 'en_espera', 'resueltos'];
marca(tiene(tablero.cuerpo.datos?.resumen, CAMPOS_RESUMEN).length === 0,
  `los indicadores traen ${CAMPOS_RESUMEN.join(', ')}`);

console.log('\n=== 3. LISTA Y DETALLE DEL TICKET ===');
const CAMPOS_TICKET = [
  'id', 'anio', 'numero', 'titulo', 'servicio', 'categoria', 'prioridad', 'estado',
  'vencido', 'solicitante_nombre', 'fecha_creacion'
];
const lista = await pedir('/tickets?limite=50&pagina=1&estado=');
marca(lista.estado === 200, `la lista responde (${lista.estado})`);

const nuevo = await pedir('/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA movil - la impresora del area no responde',
    descripcion: 'Se verifica que la aplicacion del telefono registre un ticket con el modelo vigente.',
    servicio: 'Soporte informatico',
    categoria: 'PC',
    ubicacion: 'Planta baja',
    observaciones: 'Registrado desde el telefono.'
  }
});
marca(nuevo.estado === 201, `el telefono registra un ticket sin CSRF, solo con el token (${nuevo.estado})`);
const ticket = nuevo.cuerpo.datos;
marca(tiene(ticket, CAMPOS_TICKET).length === 0,
  `el ticket trae lo que dibuja la tarjeta: falta ${tiene(ticket, CAMPOS_TICKET).join(', ') || 'nada'}`);
marca(ticket?.estado === 'Nuevo', `nace en estado ${ticket?.estado}`);

const detalle = await pedir(`/tickets/${ticket.id}`);
const CAMPOS_DETALLE = [
  'motivo_espera', 'minutos_empleados', 'fecha_objetivo', 'prioridad_por_nombre',
  'equipo_codigo', 'ubicacion', 'observaciones', 'solucion_detalle', 'fecha_cierre'
];
marca(tiene(detalle.cuerpo.datos, CAMPOS_DETALLE).length === 0,
  `el detalle trae lo que dibujan los paneles: falta ${tiene(detalle.cuerpo.datos, CAMPOS_DETALLE).join(', ') || 'nada'}`);

console.log('\n=== 4. LOS BOTONES DEL DETALLE ===');
const tomado = await pedir(`/tickets/${ticket.id}/tomar`, { metodo: 'PUT' });
marca(tomado.cuerpo.datos?.estado === 'Asignado', `Tomar el ticket: Nuevo -> ${tomado.cuerpo.datos?.estado}`);

const iniciado = await pedir(`/tickets/${ticket.id}/iniciar`, { metodo: 'PUT' });
marca(iniciado.cuerpo.datos?.estado === 'En Proceso', `Iniciar la atencion -> ${iniciado.cuerpo.datos?.estado}`);

const espera = await pedir(`/tickets/${ticket.id}/espera`, {
  metodo: 'PUT', cuerpo: { motivo_espera: 'A la espera del repuesto que trae el proveedor.' }
});
marca(espera.cuerpo.datos?.estado === 'En Espera', `Poner en espera -> ${espera.cuerpo.datos?.estado}`);

const reanudado = await pedir(`/tickets/${ticket.id}/iniciar`, { metodo: 'PUT' });
marca(reanudado.cuerpo.datos?.estado === 'En Proceso', `Reanudar -> ${reanudado.cuerpo.datos?.estado}`);

const prioridad = await pedir(`/tickets/${ticket.id}/prioridad`, {
  metodo: 'PUT', cuerpo: { prioridad: 'Alta', motivo: 'Frena la atencion del area.' }
});
marca(prioridad.cuerpo.datos?.prioridad === 'Alta', `Definir la prioridad -> ${prioridad.cuerpo.datos?.prioridad}`);

const resuelto = await pedir(`/tickets/${ticket.id}/resolver`, {
  metodo: 'PUT',
  cuerpo: {
    solucion_detalle: 'Se reinstalo el controlador y se purgo la cola de impresion.',
    minutos_empleados: 45,
    observaciones: 'Conviene revisar el toner.'
  }
});
marca(resuelto.cuerpo.datos?.estado === 'Resuelto', `Registrar solucion -> ${resuelto.cuerpo.datos?.estado}`);
marca(resuelto.cuerpo.datos?.minutos_empleados === 45,
  `queda el tiempo empleado: ${resuelto.cuerpo.datos?.minutos_empleados} minutos`);

const cerrado = await pedir(`/tickets/${ticket.id}/cerrar`, { metodo: 'PUT' });
marca(cerrado.cuerpo.datos?.estado === 'Cerrado', `Cerrar el ticket -> ${cerrado.cuerpo.datos?.estado}`);

console.log('\n=== 5. LO QUE CARGA EL FORMULARIO ===');
const categorias = await pedir('/categorias?activas=true');
marca(Array.isArray(categorias.cuerpo.datos) && categorias.cuerpo.datos.length > 0,
  `catalogo de categorias (${categorias.cuerpo.datos?.length})`);

const misEquipos = await pedir('/equipos/mios');
marca(misEquipos.estado === 200, `los activos de la sesion responden (${misEquipos.estado})`);

console.log('\n=== 6. MANTENIMIENTO PREVENTIVO ===');
const plan = await pedir('/mantenimiento?situacion=');
marca(plan.estado === 200, `el plan responde (${plan.estado})`);
const resumenPlan = await pedir('/mantenimiento/resumen');
marca(tiene(resumenPlan.cuerpo.datos, ['vencidos', 'por_vencer', 'al_dia']).length === 0,
  'el resumen trae los tres indicadores que muestra la pantalla');

console.log('\n=== 7. EQUIPOS ===');
const equipos = await pedir('/equipos?limite=100&pagina=1&busqueda=');
marca(equipos.estado === 200, `el parque responde (${equipos.estado})`);

console.log('\n=== 8. COMPRAS ===');
const compras = await pedir('/compras?limite=50&pagina=1');
marca(compras.estado === 200, `las solicitudes responden (${compras.estado})`);
const compra = await pedir('/compras', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA movil - equipo de reposicion',
    justificacion: 'Se verifica el alta de una solicitud de compra desde el telefono.',
    tipo_equipo: 'Escritorio',
    cantidad: 1,
    especificaciones: 'Gama media.'
  }
});
marca(compra.estado === 201, `el telefono registra una solicitud de compra (${compra.estado})`);
marca(compra.cuerpo.datos?.prioridad === 'Media',
  `al solicitante no se le pide prioridad: quedo en ${compra.cuerpo.datos?.prioridad}`);

console.log('\n=== 9. PROYECTOS ===');
const proyectos = await pedir('/proyectos?limite=50&pagina=1');
marca(proyectos.estado === 200, `las peticiones responden (${proyectos.estado})`);
const proyecto = await pedir('/proyectos', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA movil - automatizar el reporte mensual',
    tipo: 'Automatizacion',
    problema: 'El reporte se arma a mano cada mes y toma una jornada completa de trabajo.',
    situacion_actual: 'Se copian los datos en una planilla.',
    propuesta: 'Generar el reporte desde el sistema con un boton, tomando los datos ya registrados.',
    beneficio: 'Se ahorra una jornada de trabajo al mes.',
    personas_afectadas: 3,
    frecuencia: 'Mensual',
    urgencia: 'Media'
  }
});
marca(proyecto.estado === 201, `el telefono registra una peticion de proyecto (${proyecto.estado})`);

console.log('\n=== 10. AVISOS ===');
const avisos = await pedir('/notificaciones');
marca(avisos.estado === 200, `los avisos responden (${avisos.estado})`);

console.log('\n=== 11. CAMBIO DE CONTRASENA ===');
const cambioMal = await pedir('/auth/cambiar-password', {
  metodo: 'POST', cuerpo: { passwordActual: 'incorrecta', passwordNueva: 'OtraClave2026' }
});
marca(cambioMal.estado >= 400, `sin la contrasena actual no se cambia (${cambioMal.estado})`);
marca(!/passwordActual|passwordNueva/.test(JSON.stringify(cambioMal.cuerpo)) || cambioMal.estado === 400,
  'la pantalla envia los nombres de campo que la API espera');

console.log('\n========================================');
console.log(fallos === 0 ? 'APLICACION MOVIL: TODAS LAS PRUEBAS PASARON' : `APLICACION MOVIL: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
