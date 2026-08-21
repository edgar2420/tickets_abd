const BASE = 'http://localhost:4000/api/v1';
// El servidor exige que toda escritura con cookie declare un origen autorizado,
// tal como lo hace un navegador. Las pruebas se presentan igual.
const ORIGEN = 'http://localhost:5173';

const resultados = [];
const marca = (modulo, ok, detalle) => {
  resultados.push({ modulo, ok, detalle });
  console.log(`${ok ? 'OK   ' : 'FALLA'} [${modulo}] ${detalle}`);
};

const sesiones = new Map();

const entrar = async (usuario, password) => {
  const respuesta = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usuario, password })
  });
  if (respuesta.status !== 200) return null;
  const cookies = respuesta.headers.getSetCookie();
  const pares = cookies.map((c) => c.split(';')[0]);
  const csrf = pares.find((p) => p.startsWith('tickets_csrf='))?.split('=')[1];
  const sesion = { cookie: pares.join('; '), csrf, perfil: (await respuesta.json()).usuario };
  sesiones.set(usuario, sesion);
  return sesion;
};

const pedir = async (usuario, ruta, opciones = {}) => {
  const sesion = sesiones.get(usuario);
  const cabeceras = { Cookie: sesion.cookie, 'X-CSRF-Token': sesion.csrf, Origin: ORIGEN };
  if (opciones.cuerpo) cabeceras['Content-Type'] = 'application/json';
  const respuesta = await fetch(BASE + ruta, {
    method: opciones.metodo ?? 'GET',
    headers: cabeceras,
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });
  const cuerpo = await respuesta.json().catch(() => ({}));
  return { estado: respuesta.status, cuerpo };
};

console.log('=== A. ACCESO DE TODAS LAS CUENTAS ===');
const cuentas = [
  ['admin', 'Admin123*', 'admin'],
  ['gerente', 'Prueba123*', 'gerencia'],
  ['tecnico', 'Prueba123*', 'tecnico_l1'],
  ['tecnico2', 'Prueba123*', 'tecnico_l1'],
  ['tecnico3', 'Prueba123*', 'tecnico_l2'],
  ['solicitante', 'Prueba123*', 'cliente'],
  ['lapaz', 'Prueba123*', 'cliente'],
  ['cochabamba', 'Prueba123*', 'cliente'],
  ['sucre', 'Prueba123*', 'cliente'],
  ['silos', 'Prueba123*', 'cliente']
];
for (const [usuario, password, rolEsperado] of cuentas) {
  const sesion = await entrar(usuario, password);
  marca('acceso', Boolean(sesion) && sesion.perfil.rol === rolEsperado,
    `${usuario} (${sesion?.perfil?.rol ?? 'sin acceso'} / ${sesion?.perfil?.sucursal ?? '-'})`);
}

console.log('\n=== B. CATALOGOS ===');
for (const catalogo of ['areas', 'sucursales', 'categorias', 'roles', 'permisos']) {
  const r = await pedir('admin', `/${catalogo}`);
  marca('catalogos', r.estado === 200 && (r.cuerpo.datos?.length ?? 0) > 0,
    `${catalogo}: ${r.cuerpo.datos?.length ?? 0} registros`);
}

console.log('\n=== C. CICLO DE VIDA DEL TICKET ===');
const creado = await pedir('lapaz', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - impresora de la sucursal sin respuesta',
    descripcion: 'Prueba automatizada del ciclo completo de atencion.',
    categoria: 'Hardware',
    prioridad: 'Alta'
  }
});
marca('tickets', creado.estado === 201, `el cliente crea el ticket (${creado.estado})`);
const ticket = creado.cuerpo.datos;

const mio = await pedir('lapaz', '/tickets');
marca('tickets', mio.cuerpo.datos?.every((t) => t.solicitante_id === sesiones.get('lapaz').perfil.id),
  'el cliente solo ve sus propios tickets');

const ajeno = await pedir('sucre', `/tickets/${ticket.id}`);
marca('tickets', ajeno.estado === 403 || ajeno.estado === 404,
  `un cliente de otra sucursal no accede al ticket ajeno (${ajeno.estado})`);

const todos = await pedir('tecnico', '/tickets');
marca('tickets', todos.estado === 200 && todos.cuerpo.datos.length >= 1,
  `el tecnico ve la bandeja completa (${todos.cuerpo.datos?.length} tickets)`);

const asignado = await pedir('admin', `/tickets/${ticket.id}/asignar`, {
  metodo: 'PUT', cuerpo: { asignado_id: sesiones.get('tecnico').perfil.id }
});
marca('tickets', asignado.estado === 200 && asignado.cuerpo.datos?.estado === 'En Proceso',
  `la asignacion deja el ticket En Proceso (${asignado.estado})`);

const yaTomado = await pedir('tecnico2', `/tickets/${ticket.id}/tomar`, { metodo: 'PUT' });
marca('tickets', yaTomado.estado === 409,
  `otro tecnico no puede tomar un ticket ya asignado (${yaTomado.estado})`);

const libre = await pedir('silos', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - equipo de deposito sin acceso a la red',
    descripcion: 'Prueba de la toma de atencion directa por un tecnico.',
    categoria: 'Redes',
    prioridad: 'Media'
  }
});
const tomado = await pedir('tecnico3', `/tickets/${libre.cuerpo.datos.id}/tomar`, { metodo: 'PUT' });
marca('tickets', tomado.estado === 200 && tomado.cuerpo.datos?.estado === 'En Proceso',
  `un tecnico toma un ticket abierto y pasa a En Proceso (${tomado.estado})`);

const comentario = await pedir('tecnico', `/tickets/${ticket.id}/comentarios`, {
  metodo: 'POST', cuerpo: { mensaje: 'Se revisa la cola de impresion en el equipo del usuario.' }
});
marca('tickets', comentario.estado === 201, `conversacion en el ticket (${comentario.estado})`);

const resuelto = await pedir('tecnico2', `/tickets/${ticket.id}/resolver`, {
  metodo: 'PUT', cuerpo: { solucion_detalle: 'Se reinstalo el controlador de impresion y se purgo la cola.' }
});
marca('tickets', resuelto.estado === 200 && resuelto.cuerpo.datos?.estado === 'Resuelto',
  `resolucion con solucion documentada (${resuelto.estado})`);

const cerrado = await pedir('lapaz', `/tickets/${ticket.id}/cerrar`, { metodo: 'PUT' });
marca('tickets', cerrado.estado === 200 && cerrado.cuerpo.datos?.estado === 'Cerrado',
  `el solicitante da conformidad y cierra (${cerrado.estado})`);

const sinPermiso = await pedir('solicitante', `/tickets/${ticket.id}/asignar`, {
  metodo: 'PUT', cuerpo: { asignado_id: 1 }
});
marca('tickets', sinPermiso.estado === 403, `un cliente no puede asignar tickets (${sinPermiso.estado})`);

console.log('\n=== D. INVENTARIO ===');
const articulos = await pedir('admin', '/inventario/articulos');
marca('inventario', articulos.estado === 200, `catalogo de articulos (${articulos.cuerpo.datos?.length ?? 0})`);
const articulo = articulos.cuerpo.datos?.[0];
if (articulo) {
  const antes = Number(articulo.stock_actual);
  const entrada = await pedir('admin', `/inventario/articulos/${articulo.id}/movimientos`, {
    metodo: 'POST', cuerpo: { tipo: 'Entrada', cantidad: 5, motivo: 'QA - ingreso de prueba' }
  });
  const salida = await pedir('admin', `/inventario/articulos/${articulo.id}/movimientos`, {
    metodo: 'POST', cuerpo: { tipo: 'Salida', cantidad: 5, motivo: 'QA - egreso de prueba' }
  });
  const despues = await pedir('admin', `/inventario/articulos/${articulo.id}`);
  marca('inventario', entrada.estado === 201 && salida.estado === 201, 'entrada y salida registradas');
  marca('inventario', Number(despues.cuerpo.datos?.stock_actual) === antes,
    `el stock vuelve a su valor original (${antes})`);
  const excesiva = await pedir('admin', `/inventario/articulos/${articulo.id}/movimientos`, {
    metodo: 'POST', cuerpo: { tipo: 'Salida', cantidad: 999999, motivo: 'QA - egreso imposible' }
  });
  marca('inventario', excesiva.estado >= 400, `se rechaza una salida sin existencias (${excesiva.estado})`);
}
const inventarioCliente = await pedir('lapaz', '/inventario/articulos');
marca('inventario', inventarioCliente.estado === 403, `el cliente no accede al inventario (${inventarioCliente.estado})`);

console.log('\n=== E. EQUIPOS ===');
const equipos = await pedir('admin', '/equipos');
marca('equipos', equipos.estado === 200, `listado de equipos (${equipos.cuerpo.datos?.length ?? 0})`);
const equipo = equipos.cuerpo.datos?.[0];
if (equipo) {
  marca('equipos', !('anydesk_password' in equipo) && !('anydesk_password_cifrada' in equipo),
    'el listado no expone la contrasena de AnyDesk');
  const revelada = await pedir('admin', `/equipos/${equipo.id}/credenciales`);
  marca('equipos', revelada.estado === 200 && revelada.cuerpo.datos !== undefined,
    'un administrador puede revelar la credencial bajo demanda');
  const negada = await pedir('lapaz', `/equipos/${equipo.id}/credenciales`);
  marca('equipos', negada.estado === 403, `el cliente no puede revelarla (${negada.estado})`);
}

console.log('\n=== F. SOLICITUDES DE COMPRA ===');
const compra = await pedir('cochabamba', '/compras', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - equipo de reposicion para el area comercial',
    justificacion: 'El equipo actual no soporta el sistema de facturacion y detiene la atencion diaria.',
    tipo_equipo: 'Escritorio',
    cantidad: 1,
    especificaciones: 'Procesador de gama media, 16 GB de memoria, unidad de estado solido.',
    prioridad: 'Media'
  }
});
marca('compras', compra.estado === 201, `el cliente registra la solicitud (${compra.estado})`);
const solicitud = compra.cuerpo.datos;

const gerenciaAntes = await pedir('gerente', `/compras/${solicitud.id}/aprobar-gerencia`, { metodo: 'PUT', cuerpo: {} });
marca('compras', gerenciaAntes.estado >= 400,
  `Gerencia no puede aprobar antes que TI (${gerenciaAntes.estado})`);

const ti = await pedir('admin', `/compras/${solicitud.id}/aprobar-ti`, {
  metodo: 'PUT', cuerpo: { observacion_ti: 'QA - requerimiento tecnico validado.', monto_estimado: 5200 }
});
marca('compras', ti.estado === 200, `TI aprueba en primera instancia (${ti.estado})`);

const clienteAprueba = await pedir('cochabamba', `/compras/${solicitud.id}/aprobar-gerencia`, { metodo: 'PUT', cuerpo: {} });
marca('compras', clienteAprueba.estado === 403, `un cliente no puede aprobar (${clienteAprueba.estado})`);

const gerencia = await pedir('gerente', `/compras/${solicitud.id}/aprobar-gerencia`, {
  metodo: 'PUT', cuerpo: { observacion_gerencia: 'QA - presupuesto autorizado.' }
});
marca('compras', gerencia.estado === 200, `Gerencia aprueba en segunda instancia (${gerencia.estado})`);

const final = await pedir('admin', `/compras/${solicitud.id}`);
const datosFinal = final.cuerpo.datos;
marca('compras', datosFinal?.estado === 'Aprobada por Gerencia', `estado final: ${datosFinal?.estado}`);
marca('compras', Boolean(datosFinal?.aprobado_por_nombre) && Boolean(datosFinal?.fecha_aprobacion),
  `consta quien aprobo por Gerencia: ${datosFinal?.aprobado_por_nombre} (${datosFinal?.aprobado_por_rol}) el ${datosFinal?.fecha_aprobacion}`);
marca('compras', Boolean(datosFinal?.revisado_por_nombre) && Boolean(datosFinal?.fecha_revision),
  `consta quien aprobo por TI: ${datosFinal?.revisado_por_nombre} (${datosFinal?.revisado_por_rol})`);

console.log('\n=== G. TABLERO Y NOTIFICACIONES ===');
const tablero = await pedir('admin', '/tickets/tablero');
const est = tablero.cuerpo.datos?.resumen;
const graficos = tablero.cuerpo.datos?.graficos;
marca('tablero', tablero.estado === 200 && est?.total !== undefined,
  `indicadores: total=${est?.total} abiertos=${est?.abiertos} proceso=${est?.en_proceso} resueltos=${est?.resueltos} criticos=${est?.criticos}`);
marca('tablero', !('horas_promedio_resolucion' in (est ?? {})), 'no se publica el tiempo promedio de resolucion');
marca('tablero', Array.isArray(graficos?.porCategoria), `desglose por categoria (${graficos?.porCategoria?.length ?? 0})`);
marca('tablero', Array.isArray(graficos?.porSolicitante), `desglose por solicitante (${graficos?.porSolicitante?.length ?? 0})`);
const tableroCliente = await pedir('lapaz', '/tickets/tablero');
marca('tablero', tableroCliente.cuerpo.datos?.graficos === null,
  'el cliente recibe sus indicadores sin los graficos globales');

const notificaciones = await pedir('tecnico', '/notificaciones');
marca('notificaciones', notificaciones.estado === 200,
  `bandeja del tecnico (${notificaciones.cuerpo.datos?.length ?? 0} avisos)`);
const pendiente = notificaciones.cuerpo.datos?.find((n) => !n.leida);
if (pendiente) {
  const leida = await pedir('tecnico', `/notificaciones/${pendiente.id}/leida`, { metodo: 'PUT' });
  marca('notificaciones', leida.estado === 200, `un aviso se marca como leido (${leida.estado})`);
}
const todasLeidas = await pedir('tecnico', '/notificaciones/leidas', { metodo: 'PUT' });
marca('notificaciones', todasLeidas.estado === 200, `se marcan todas como leidas (${todasLeidas.estado})`);

console.log('\n=== H. AUDITORIA ===');
const auditoria = await pedir('admin', '/auditoria?limite=200');
const registros = auditoria.cuerpo.datos ?? [];
marca('auditoria', auditoria.estado === 200, `consulta del registro (${registros.length} filas)`);
for (const entidad of ['TICKET', 'COMPRA', 'INVENTARIO', 'SESION']) {
  marca('auditoria', registros.some((r) => r.entidad === entidad), `queda huella de ${entidad}`);
}
const auditoriaCliente = await pedir('lapaz', '/auditoria');
marca('auditoria', auditoriaCliente.estado === 403, `el cliente no accede a la auditoria (${auditoriaCliente.estado})`);

console.log('\n=== I. PAGINACION ===');
const pagina = await pedir('admin', '/tickets?limite=2&pagina=1');
marca('paginacion', pagina.cuerpo.datos?.length <= 2 && pagina.cuerpo.paginacion?.limite === 2,
  `limite respetado (${pagina.cuerpo.datos?.length} de ${pagina.cuerpo.paginacion?.total})`);
const excesivo = await pedir('admin', '/tickets?limite=100000');
marca('paginacion', excesivo.cuerpo.paginacion?.limite === 200,
  `un limite abusivo se acota a 200 (pedido 100000, aplicado ${excesivo.cuerpo.paginacion?.limite})`);

console.log('\n=== J. DOCUMENTOS PDF ===');
const sesionAdmin = sesiones.get('admin');
for (const [nombre, ruta] of [
  ['ficha del ticket', `/tickets/${ticket.id}/pdf`],
  ['reporte de tickets', '/tickets/reporte/pdf'],
  ['solicitud de compra', `/compras/${solicitud.id}/pdf`],
  ['reporte de inventario', '/inventario/reporte/pdf'],
  ['reporte de auditoria', '/auditoria/pdf'],
  ['matriz de permisos', '/auditoria/matriz-rbac/pdf'],
  ['reporte de equipos', '/equipos/reporte/pdf'],
  ['reporte de compras', '/compras/reporte/pdf']
]) {
  const respuesta = await fetch(BASE + ruta, { headers: { Cookie: sesionAdmin.cookie, Origin: ORIGEN } });
  const bytes = respuesta.ok ? (await respuesta.arrayBuffer()).byteLength : 0;
  marca('pdf', respuesta.ok && bytes > 1500, `${nombre}: ${respuesta.status}, ${bytes} bytes`);
}

console.log('\n=== K. VALIDACION DE ENTRADA ===');
const vacio = await pedir('admin', '/tickets', { metodo: 'POST', cuerpo: { titulo: '', descripcion: '' } });
marca('validacion', vacio.estado === 400, `se rechaza un ticket sin datos (${vacio.estado})`);
const inyeccion = await pedir('admin', '/tickets?estado=' + encodeURIComponent("' OR 1=1--"));
marca('validacion', inyeccion.estado < 500, `un filtro con inyeccion no rompe el servicio (${inyeccion.estado})`);
const desbordado = await pedir('admin', '/tickets', {
  metodo: 'POST',
  cuerpo: { titulo: 'x'.repeat(5000), descripcion: 'y'.repeat(50000), categoria: 'Redes' }
});
marca('validacion', desbordado.estado === 400, `se rechaza un texto desmedido (${desbordado.estado})`);

console.log('\n========================================');
const fallos = resultados.filter((r) => !r.ok);
const porModulo = {};
for (const r of resultados) {
  porModulo[r.modulo] ??= { total: 0, ok: 0 };
  porModulo[r.modulo].total += 1;
  if (r.ok) porModulo[r.modulo].ok += 1;
}
for (const [modulo, cuenta] of Object.entries(porModulo)) {
  console.log(`${cuenta.ok === cuenta.total ? 'OK   ' : 'FALLA'} ${modulo.padEnd(16)} ${cuenta.ok}/${cuenta.total}`);
}
console.log('----------------------------------------');
console.log(`TOTAL ${resultados.length - fallos.length}/${resultados.length}`);
if (fallos.length) {
  console.log('\nPENDIENTES:');
  fallos.forEach((f) => console.log(`  [${f.modulo}] ${f.detalle}`));
}
console.log('\nticket de prueba:', ticket?.id, '| solicitud de prueba:', solicitud?.id);
process.exit(fallos.length ? 1 : 0);
