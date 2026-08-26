import { prepararEntorno, entrar, pedirCon, ADMIN, BASE, ORIGEN, PERFILES } from './preparar.mjs';

const resultados = [];
const marca = (modulo, ok, detalle) => {
  resultados.push({ modulo, ok, detalle });
  console.log(`${ok ? 'OK   ' : 'FALLA'} [${modulo}] ${detalle}`);
};

const { sesiones } = await prepararEntorno();

const pedir = (usuario, ruta, opciones = {}) => pedirCon(sesiones[usuario])(ruta, opciones);

console.log('=== A. ACCESO DE TODAS LAS CUENTAS ===');
marca('acceso', sesiones.admin.perfil?.rol === 'admin',
  `${ADMIN.usuario} (${sesiones.admin.perfil?.rol} / ${sesiones.admin.perfil?.sucursal})`);

for (const perfil of PERFILES.filter((p) => p.usuario !== 'qa.bloqueo')) {
  const sesion = sesiones[perfil.usuario];
  marca('acceso', sesion?.perfil?.rol === perfil.rol,
    `${perfil.usuario} (${sesion?.perfil?.rol ?? 'sin acceso'} / ${sesion?.perfil?.sucursal ?? '-'})`);
}

const claveMala = await entrar(ADMIN.usuario, 'clave-que-no-es-la-buena');
marca('acceso', claveMala.estado === 401, `una clave incorrecta se rechaza (${claveMala.estado})`);

console.log('\n=== B. CATALOGOS ===');
for (const catalogo of ['areas', 'sucursales', 'categorias', 'roles', 'permisos']) {
  const r = await pedir('admin', `/${catalogo}`);
  marca('catalogos', r.estado === 200 && (r.cuerpo.datos?.length ?? 0) > 0,
    `${catalogo}: ${r.cuerpo.datos?.length ?? 0} registros`);
}

console.log('\n=== C. CICLO DE VIDA DEL TICKET ===');
const creado = await pedir('qa.cliente2', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - impresora de la sucursal sin respuesta',
    descripcion: 'Prueba automatizada del ciclo completo de atencion.',
    categoria: 'PC',
    prioridad: 'Alta'
  }
});
marca('tickets', creado.estado === 201, `el cliente crea el ticket (${creado.estado})`);
const ticket = creado.cuerpo.datos;

const mio = await pedir('qa.cliente2', '/tickets');
marca('tickets', mio.cuerpo.datos?.every((t) => t.solicitante_id === sesiones['qa.cliente2'].perfil.id),
  'el cliente solo ve sus propios tickets');

const ajeno = await pedir('qa.cliente4', `/tickets/${ticket.id}`);
marca('tickets', ajeno.estado === 403 || ajeno.estado === 404,
  `un cliente de otra sucursal no accede al ticket ajeno (${ajeno.estado})`);

const todos = await pedir('qa.tecnico', '/tickets');
marca('tickets', todos.estado === 200 && todos.cuerpo.datos.length >= 1,
  `el tecnico ve la bandeja completa (${todos.cuerpo.datos?.length} tickets)`);

const asignado = await pedir('admin', `/tickets/${ticket.id}/asignar`, {
  metodo: 'PUT', cuerpo: { asignado_id: sesiones['qa.tecnico'].perfil.id }
});
marca('tickets', asignado.estado === 200 && asignado.cuerpo.datos?.estado === 'Asignado',
  `la asignacion deja el ticket Asignado (${asignado.estado})`);

const yaTomado = await pedir('qa.tecnico2', `/tickets/${ticket.id}/tomar`, { metodo: 'PUT' });
marca('tickets', yaTomado.estado === 409,
  `otro tecnico no puede tomar un ticket ya asignado (${yaTomado.estado})`);

const libre = await pedir('qa.cliente', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - equipo de deposito sin acceso a la red',
    descripcion: 'Prueba de la toma de atencion directa por un tecnico.',
    categoria: 'Red',
    prioridad: 'Media'
  }
});
const tomado = await pedir('qa.tecnico3', `/tickets/${libre.cuerpo.datos.id}/tomar`, { metodo: 'PUT' });
marca('tickets', tomado.estado === 200 && tomado.cuerpo.datos?.estado === 'Asignado',
  `un tecnico toma un ticket nuevo y queda Asignado (${tomado.estado})`);

const comentario = await pedir('qa.tecnico', `/tickets/${ticket.id}/comentarios`, {
  metodo: 'POST', cuerpo: { mensaje: 'Se revisa la cola de impresion en el equipo del usuario.' }
});
marca('tickets', comentario.estado === 201, `conversacion en el ticket (${comentario.estado})`);

const iniciado = await pedir('qa.tecnico', `/tickets/${ticket.id}/iniciar`, { metodo: 'PUT' });
marca('tickets', iniciado.estado === 200 && iniciado.cuerpo.datos?.estado === 'En Proceso',
  `al iniciar la atencion el ticket pasa a En Proceso (${iniciado.estado})`);

const resuelto = await pedir('qa.tecnico2', `/tickets/${ticket.id}/resolver`, {
  metodo: 'PUT', cuerpo: { solucion_detalle: 'Se reinstalo el controlador de impresion y se purgo la cola.' }
});
marca('tickets', resuelto.estado === 200 && resuelto.cuerpo.datos?.estado === 'Resuelto',
  `resolucion con solucion documentada (${resuelto.estado})`);

const cerrado = await pedir('qa.cliente2', `/tickets/${ticket.id}/cerrar`, { metodo: 'PUT' });
marca('tickets', cerrado.estado === 200 && cerrado.cuerpo.datos?.estado === 'Cerrado',
  `el solicitante da conformidad y cierra (${cerrado.estado})`);

const sinPermiso = await pedir('qa.cliente', `/tickets/${ticket.id}/asignar`, {
  metodo: 'PUT', cuerpo: { asignado_id: 1 }
});
marca('tickets', sinPermiso.estado === 403, `un cliente no puede asignar tickets (${sinPermiso.estado})`);

console.log('\n=== D. INVENTARIO ===');
const existentes = await pedir('admin', '/inventario/articulos');
marca('inventario', existentes.estado === 200, `catalogo de articulos (${existentes.cuerpo.datos?.length ?? 0})`);

if ((existentes.cuerpo.datos?.length ?? 0) === 0) {
  const alta = await pedir('admin', '/inventario/articulos', {
    metodo: 'POST',
    cuerpo: {
      codigo: 'QA-ART-01',
      nombre: 'QA - articulo para la bateria de pruebas',
      descripcion: 'Creado por la prueba automatizada para verificar entradas y salidas.',
      tipo: 'Consumible',
      unidad: 'Unidad',
      stock_minimo: 2,
      ubicacion: 'QA',
      estado: 'Disponible'
    }
  });
  marca('inventario', alta.estado === 201, `se da de alta un articulo de prueba (${alta.estado})`);
  await pedir('admin', `/inventario/articulos/${alta.cuerpo.datos.id}/movimientos`, {
    metodo: 'POST', cuerpo: { tipo: 'Entrada', cantidad: 20, motivo: 'QA - carga inicial de prueba' }
  });
}

const articulos = await pedir('admin', '/inventario/articulos');
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
const inventarioCliente = await pedir('qa.cliente2', '/inventario/articulos');
marca('inventario', inventarioCliente.estado === 403, `el cliente no accede al inventario (${inventarioCliente.estado})`);

console.log('\n=== E. EQUIPOS ===');
const equiposPrevios = await pedir('admin', '/equipos');
marca('equipos', equiposPrevios.estado === 200, `listado de equipos (${equiposPrevios.cuerpo.datos?.length ?? 0})`);

const conCredencial = (equiposPrevios.cuerpo.datos ?? []).find((e) => e.tiene_password);

if (!conCredencial) {
  const sugerido = await pedir('admin', '/equipos/siguiente-codigo?tipo=PC&ubicacion=QA');
  const alta = await pedir('admin', '/equipos', {
    metodo: 'POST',
    cuerpo: {
      codigo: sugerido.cuerpo.datos.codigo,
      nombre_equipo: 'QA-EQUIPO-CON-CREDENCIAL',
      tipo: 'PC',
      marca: 'Generico',
      sistema_operativo: 'Windows 11 Pro',
      ram_gb: 16,
      direccion_ip: '10.0.0.99',
      anydesk_id: '111 222 333',
      anydesk_password: 'ClaveRemota2026',
      estado: 'Operativo',
      activo: true
    }
  });
  marca('equipos', alta.estado === 201, `se da de alta un equipo de prueba (${alta.cuerpo.datos?.codigo})`);
}

const equipos = await pedir('admin', '/equipos');
const equipo = (equipos.cuerpo.datos ?? []).find((e) => e.tiene_password);

if (equipo) {
  marca('equipos', !('anydesk_password' in equipo) && !('anydesk_password_cifrada' in equipo),
    'el listado no expone la contraseña de AnyDesk');
  const revelada = await pedir('admin', `/equipos/${equipo.id}/credenciales`);
  marca('equipos', revelada.estado === 200 && revelada.cuerpo.datos !== undefined,
    'un administrador puede revelar la credencial bajo demanda');
  const negada = await pedir('qa.cliente2', `/equipos/${equipo.id}/credenciales`);
  marca('equipos', negada.estado === 403, `el cliente no puede revelarla (${negada.estado})`);
}

console.log('\n=== E2. NOMENCLATURA DE LOS EQUIPOS ===');
const nomenclatura = await pedir('admin', '/equipos/nomenclatura');
marca('equipos', nomenclatura.estado === 200 && nomenclatura.cuerpo.datos?.prefijos?.Servidor === 'SRV',
  `prefijos publicados: ${Object.values(nomenclatura.cuerpo.datos?.prefijos ?? {}).join(' ')}`);

const ESPERADOS = [
  ['PC', 'ADM', 'PC-ADM-001'],
  ['Camara', 'ALM', 'CAM-ALM-001'],
  ['Telefonia', 'ADM', 'TEL-ADM-001'],
  ['Switch', 'RACK01', 'SW-RACK01-001'],
  ['Servidor', 'IBS', 'SRV-IBS-001'],
  ['Laptop', 'VTA', 'LAP-VTA-001']
];

for (const [tipo, ubicacion, esperado] of ESPERADOS) {
  const sugerido = await pedir('admin', `/equipos/siguiente-codigo?tipo=${encodeURIComponent(tipo)}&ubicacion=${ubicacion}`);
  const codigo = sugerido.cuerpo.datos?.codigo;
  marca('equipos', codigo === esperado, `${tipo.padEnd(10)} en ${ubicacion.padEnd(7)} -> ${codigo}`);
}

const antesDeLaCamara = await pedir('admin', '/equipos/siguiente-codigo?tipo=Camara&ubicacion=QA');
const codigoCamara = antesDeLaCamara.cuerpo.datos.codigo;
const numeroPrevio = Number(codigoCamara.split('-')[2]);

const primero = await pedir('admin', '/equipos', {
  metodo: 'POST',
  cuerpo: { codigo: codigoCamara, nombre_equipo: 'QA-CAMARA-01', tipo: 'Camara', estado: 'Operativo', activo: true }
});
marca('equipos', primero.estado === 201, `se da de alta una camara con ${codigoCamara} (${primero.estado})`);

const correlativo = await pedir('admin', '/equipos/siguiente-codigo?tipo=Camara&ubicacion=QA');
const numeroNuevo = Number(correlativo.cuerpo.datos?.codigo.split('-')[2]);
marca('equipos', numeroNuevo === numeroPrevio + 1,
  `el correlativo avanza solo: ${codigoCamara} -> ${correlativo.cuerpo.datos?.codigo}`);

const prefijoAjeno = await pedir('admin', '/equipos', {
  metodo: 'POST',
  cuerpo: { codigo: 'PC-QA-900', nombre_equipo: 'QA-SERVIDOR-MAL', tipo: 'Servidor', estado: 'Operativo', activo: true }
});
marca('equipos', prefijoAjeno.estado === 400,
  `un servidor con prefijo de PC se rechaza (${prefijoAjeno.estado})`);

const sinGuiones = await pedir('admin', '/equipos', {
  metodo: 'POST',
  cuerpo: { codigo: 'PCQA002', nombre_equipo: 'QA-SIN-FORMATO', tipo: 'PC', estado: 'Operativo', activo: true }
});
marca('equipos', sinGuiones.estado === 400, `un codigo sin el formato se rechaza (${sinGuiones.estado})`);

const paraLaptop = await pedir('admin', '/equipos/siguiente-codigo?tipo=Laptop&ubicacion=QA');
const codigoLaptop = paraLaptop.cuerpo.datos.codigo;
const enMinusculas = await pedir('admin', '/equipos', {
  metodo: 'POST',
  cuerpo: {
    codigo: codigoLaptop.toLowerCase(),
    nombre_equipo: 'QA-LAPTOP-01', tipo: 'Laptop', estado: 'Operativo', activo: true
  }
});
marca('equipos', enMinusculas.cuerpo.datos?.codigo === codigoLaptop,
  `el codigo se normaliza a mayusculas: ${codigoLaptop.toLowerCase()} -> ${enMinusculas.cuerpo.datos?.codigo}`);

const ubicaciones = await pedir('admin', '/equipos/ubicaciones');
marca('equipos', (ubicaciones.cuerpo.datos ?? []).some((u) => u.codigo === 'QA'),
  `las ubicaciones en uso quedan a la vista (${(ubicaciones.cuerpo.datos ?? []).map((u) => u.codigo).join(' ')})`);

console.log('\n=== F. SOLICITUDES DE COMPRA ===');
const compra = await pedir('qa.cliente3', '/compras', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - equipo de reposicion para el area comercial',
    justificacion: 'El equipo actual no soporta el sistema de facturacion y detiene la atencion diaria.',
    tipo_equipo: 'Escritorio',
    cantidad: 1,
    especificaciones: 'Procesador de gama media, 16 GB de memoria, unidad de estado solido.',
    prioridad: 'Critica'
  }
});
marca('compras', compra.estado === 201, `el cliente registra la solicitud (${compra.estado})`);
const solicitud = compra.cuerpo.datos;
marca('compras', solicitud?.prioridad === 'Media',
  `al cliente se le ignora la prioridad del pedido: quedo en ${solicitud?.prioridad}`);

const revisionTecnico = await pedir('qa.tecnico', `/compras/${solicitud.id}/revisar`, {
  metodo: 'PUT', cuerpo: { observacion_ti: 'QA - revision sin permiso de priorizar.', prioridad: 'Critica' }
});
marca('compras', revisionTecnico.cuerpo.datos?.prioridad === 'Media',
  `un tecnico tampoco cambia la prioridad del pedido: sigue en ${revisionTecnico.cuerpo.datos?.prioridad}`);

const gerenciaAntes = await pedir('qa.gerente', `/compras/${solicitud.id}/aprobar-gerencia`, { metodo: 'PUT', cuerpo: {} });
marca('compras', gerenciaAntes.estado >= 400,
  `Gerencia no puede aprobar antes que TI (${gerenciaAntes.estado})`);

const ti = await pedir('admin', `/compras/${solicitud.id}/aprobar-ti`, {
  metodo: 'PUT',
  cuerpo: { observacion_ti: 'QA - requerimiento tecnico validado.', monto_estimado: 5200, prioridad: 'Alta' }
});
marca('compras', ti.estado === 200, `TI aprueba en primera instancia (${ti.estado})`);
marca('compras', ti.cuerpo.datos?.prioridad === 'Alta',
  `la administracion si fija la prioridad del pedido: ${ti.cuerpo.datos?.prioridad}`);

const clienteAprueba = await pedir('qa.cliente3', `/compras/${solicitud.id}/aprobar-gerencia`, { metodo: 'PUT', cuerpo: {} });
marca('compras', clienteAprueba.estado === 403, `un cliente no puede aprobar (${clienteAprueba.estado})`);

const gerencia = await pedir('qa.gerente', `/compras/${solicitud.id}/aprobar-gerencia`, {
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
const tableroCliente = await pedir('qa.cliente2', '/tickets/tablero');
marca('tablero', tableroCliente.cuerpo.datos?.graficos === null,
  'el cliente recibe sus indicadores sin los graficos globales');

const notificaciones = await pedir('qa.tecnico', '/notificaciones');
marca('notificaciones', notificaciones.estado === 200,
  `bandeja del tecnico (${notificaciones.cuerpo.datos?.length ?? 0} avisos)`);
const pendiente = notificaciones.cuerpo.datos?.find((n) => !n.leida);
if (pendiente) {
  const leida = await pedir('qa.tecnico', `/notificaciones/${pendiente.id}/leida`, { metodo: 'PUT' });
  marca('notificaciones', leida.estado === 200, `un aviso se marca como leido (${leida.estado})`);
}
const todasLeidas = await pedir('qa.tecnico', '/notificaciones/leidas', { metodo: 'PUT' });
marca('notificaciones', todasLeidas.estado === 200, `se marcan todas como leidas (${todasLeidas.estado})`);

console.log('\n=== H. AUDITORIA ===');
const auditoria = await pedir('admin', '/auditoria?limite=200');
const registros = auditoria.cuerpo.datos ?? [];
marca('auditoria', auditoria.estado === 200, `consulta del registro (${registros.length} filas)`);
for (const entidad of ['TICKET', 'COMPRA', 'INVENTARIO', 'SESION']) {
  marca('auditoria', registros.some((r) => r.entidad === entidad), `queda huella de ${entidad}`);
}
const auditoriaCliente = await pedir('qa.cliente2', '/auditoria');
marca('auditoria', auditoriaCliente.estado === 403, `el cliente no accede a la auditoria (${auditoriaCliente.estado})`);

console.log('\n=== H2. ALCANCE DE GERENCIA Y REPORTE MENSUAL ===');
const permisosGerente = sesiones['qa.gerente'].perfil.permisos;
marca('gerencia', !permisosGerente.includes('auditoria.ver'),
  'Gerencia no tiene el permiso de auditoria');
marca('gerencia', permisosGerente.includes('tickets.crear'),
  'Gerencia puede registrar tickets');

const auditoriaGerencia = await pedir('qa.gerente', '/auditoria');
marca('gerencia', auditoriaGerencia.estado === 403,
  `la bitacora le queda cerrada (${auditoriaGerencia.estado})`);

const ticketGerencia = await pedir('qa.gerente', '/tickets', {
  metodo: 'POST',
  cuerpo: {
    titulo: 'QA - Gerencia registra un requerimiento propio',
    descripcion: 'Se verifica que Gerencia pueda abrir tickets como cualquier area de la empresa.',
    categoria: 'Software',
    prioridad: 'Media'
  }
});
marca('gerencia', ticketGerencia.estado === 201, `Gerencia abre un ticket (${ticketGerencia.estado})`);

const tableroGerencia = await pedir('qa.gerente', '/tickets/tablero');
marca('gerencia', tableroGerencia.estado === 200, `Gerencia entra al tablero (${tableroGerencia.estado})`);

const mensual = await pedir('qa.gerente', '/tickets/mensual');
const reporte = mensual.cuerpo.datos;
marca('reporte', mensual.estado === 200 && reporte?.nombre !== undefined,
  `reporte del periodo: ${reporte?.nombre}`);
marca('reporte', typeof reporte?.totales?.creados === 'number'
  && typeof reporte?.totales?.atendidos === 'number'
  && typeof reporte?.totales?.resueltos === 'number'
  && typeof reporte?.totales?.cerrados === 'number',
  `registrados=${reporte?.totales?.creados} atendidos=${reporte?.totales?.atendidos} `
  + `resueltos=${reporte?.totales?.resueltos} cerrados=${reporte?.totales?.cerrados}`);
marca('reporte', reporte?.anterior?.nombre !== undefined,
  `compara contra ${reporte?.anterior?.nombre}`);
marca('reporte', Array.isArray(reporte?.porDia) && reporte.porDia.length >= 28,
  `desglose diario completo (${reporte?.porDia?.length} dias)`);
marca('reporte', Array.isArray(reporte?.categorias) && Array.isArray(reporte?.tecnicos),
  'incluye desglose por categoria y por tecnico');

const mesViejo = await pedir('qa.gerente', '/tickets/mensual?mes=2026-01');
marca('reporte', mesViejo.estado === 200 && mesViejo.cuerpo.datos?.mes === '2026-01',
  `admite consultar un mes anterior (${mesViejo.cuerpo.datos?.nombre})`);

const mesInvalido = await pedir('qa.gerente', '/tickets/mensual?mes=no-es-un-mes');
marca('reporte', mesInvalido.estado === 200 && /^\d{4}-\d{2}$/.test(mesInvalido.cuerpo.datos?.mes ?? ''),
  'un periodo mal escrito cae al mes vigente en lugar de fallar');

marca('reporte', !('tiempos' in (reporte ?? {})),
  'el reporte no publica tiempos ni demoras');
marca('reporte', Array.isArray(reporte?.tickets),
  `incluye el detalle de los tickets del periodo (${reporte?.tickets?.length})`);
marca('reporte', Array.isArray(reporte?.solicitantes),
  `incluye quien solicito mas tickets (${reporte?.solicitantes?.length})`);

const columnasDesglose = Object.keys(reporte?.categorias?.[0] ?? {});
marca('reporte',
  ['creados', 'abiertos', 'en_proceso', 'resueltos', 'cerrados'].every((c) => columnasDesglose.includes(c)),
  `cada desglose abre por estado: ${columnasDesglose.join(', ')}`);

const filtradoCategoria = await pedir('qa.gerente', '/tickets/mensual?categoria=Hardware');
const soloHardware = (filtradoCategoria.cuerpo.datos?.tickets ?? []).every((t) => t.categoria === 'Hardware');
marca('reporte', filtradoCategoria.estado === 200 && soloHardware,
  `filtra por categoria (${filtradoCategoria.cuerpo.datos?.tickets?.length} tickets, todos de Hardware)`);

const filtradoPrioridad = await pedir('qa.gerente', '/tickets/mensual?prioridad=Alta');
const soloAlta = (filtradoPrioridad.cuerpo.datos?.tickets ?? []).every((t) => t.prioridad === 'Alta');
marca('reporte', filtradoPrioridad.estado === 200 && soloAlta,
  `filtra por prioridad (${filtradoPrioridad.cuerpo.datos?.tickets?.length} tickets, todos de prioridad Alta)`);

const sucursales = (await pedir('admin', '/sucursales')).cuerpo.datos ?? [];
const filtradoSucursal = await pedir('qa.gerente', `/tickets/mensual?sucursal_id=${sucursales[0]?.id}`);
marca('reporte', filtradoSucursal.estado === 200 && filtradoSucursal.cuerpo.datos?.filtroSucursal === sucursales[0]?.nombre,
  `filtra por sucursal (${filtradoSucursal.cuerpo.datos?.filtroSucursal})`);

const mensualCliente = await pedir('qa.cliente2', '/tickets/mensual');
marca('reporte', mensualCliente.estado === 403,
  `un cliente no accede al reporte mensual (${mensualCliente.estado})`);

console.log('\n=== I. PAGINACION ===');
const pagina = await pedir('admin', '/tickets?limite=2&pagina=1');
marca('paginacion', pagina.cuerpo.datos?.length <= 2 && pagina.cuerpo.paginacion?.limite === 2,
  `limite respetado (${pagina.cuerpo.datos?.length} de ${pagina.cuerpo.paginacion?.total})`);
const excesivo = await pedir('admin', '/tickets?limite=100000');
marca('paginacion', excesivo.cuerpo.paginacion?.limite === 200,
  `un limite abusivo se acota a 200 (pedido 100000, aplicado ${excesivo.cuerpo.paginacion?.limite})`);

console.log('\n=== J. DOCUMENTOS PDF ===');
const sesionAdmin = sesiones.admin;
for (const [nombre, ruta] of [
  ['ficha del ticket', `/tickets/${ticket.id}/pdf`],
  ['reporte de tickets', '/tickets/reporte/pdf'],
  ['solicitud de compra', `/compras/${solicitud.id}/pdf`],
  ['reporte de inventario', '/inventario/reporte/pdf'],
  ['reporte mensual', '/tickets/mensual/pdf'],
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
  cuerpo: { titulo: 'x'.repeat(5000), descripcion: 'y'.repeat(50000), categoria: 'Red' }
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
