import path from 'node:path';
import { DocumentoPDF, PALETA } from './documento.js';
import { env } from '../../config/env.js';

const fecha = (valor) => (valor ? new Date(valor).toLocaleString('es-BO') : null);

export { duracionLegible } from '../../modules/tickets/modelo.js';
import { duracionLegible } from '../../modules/tickets/modelo.js';
const soloFecha = (valor) => (valor ? new Date(valor).toLocaleDateString('es-BO') : '-');

export { codigoTicket } from '../../modules/tickets/modelo.js';
import { codigoTicket } from '../../modules/tickets/modelo.js';

export const colorEstado = (estado) => ({
  'Nuevo': PALETA.acento,
  'Asignado': PALETA.acento,
  'En Proceso': PALETA.advertencia,
  'En Espera': PALETA.advertencia,
  'Resuelto': PALETA.ok,
  'Cerrado': PALETA.suave
}[estado] ?? PALETA.texto);

export const colorPrioridad = (prioridad) => ({
  'Baja': PALETA.ok,
  'Media': '#A16207',
  'Alta': '#C2410C',
  'Critica': PALETA.critico
}[prioridad] ?? PALETA.texto);

const iconoEstado = (estado) => ({
  'Nuevo': 'ticket',
  'Asignado': 'ticket',
  'En Proceso': 'reloj',
  'En Espera': 'reloj',
  'Resuelto': 'check',
  'Cerrado': 'check'
}[estado] ?? 'ticket');

export const rutaDocumento = (...segmentos) => path.resolve(process.cwd(), env.docs.outputDir, ...segmentos);

export const construirActaTicket = (ticket, bitacora = [], opciones = {}) => {
  const accion = opciones.accion ?? 'FICHA';
  const doc = new DocumentoPDF({
    titulo: 'Ticket ' + codigoTicket(ticket),
    subtitulo: ticket.titulo,
    codigo: 'ACTA-' + codigoTicket(ticket) + '-' + accion,
    icono: iconoEstado(ticket.estado)
  });

  doc.titulo1('Ficha del requerimiento', 'ticket');
  doc.camposClaveValor([
    { etiqueta: 'Ticket', valor: codigoTicket(ticket) },
    { etiqueta: 'Estado', valor: ticket.estado },
    { etiqueta: 'Tipo', valor: ticket.tipo },
    { etiqueta: 'Servicio', valor: ticket.servicio },
    { etiqueta: 'Categoria', valor: ticket.categoria },
    { etiqueta: 'Prioridad', valor: ticket.prioridad },
    { etiqueta: 'Ubicacion', valor: ticket.ubicacion },
    { etiqueta: 'Activo relacionado', valor: ticket.equipo_codigo },
    { etiqueta: 'Solicitante', valor: ticket.solicitante_nombre },
    { etiqueta: 'Area solicitante', valor: ticket.solicitante_area },
    { etiqueta: 'Atendido por', valor: ticket.asignado_nombre },
    { etiqueta: 'Resuelto por', valor: ticket.resuelto_por_nombre },
    { etiqueta: 'Creacion', valor: fecha(ticket.fecha_creacion) },
    { etiqueta: 'Asignacion', valor: fecha(ticket.fecha_asignacion) },
    { etiqueta: 'Resolucion', valor: fecha(ticket.fecha_resolucion) },
    { etiqueta: 'Objetivo de atencion', valor: fecha(ticket.fecha_objetivo) },
    { etiqueta: 'Tiempo empleado', valor: duracionLegible(ticket.minutos_empleados) }
  ], 4);

  doc.titulo1('Descripcion reportada', 'documento');
  doc.parrafo(ticket.descripcion);

  if (ticket.observaciones) {
    doc.titulo1('Observaciones', 'documento');
    doc.parrafo(ticket.observaciones);
  }

  if (ticket.solucion_detalle) {
    doc.titulo1('Solucion tecnica', 'check');
    doc.parrafo(ticket.solucion_detalle);
  } else {
    doc.nota('El ticket aun no cuenta con una solucion tecnica registrada.', { icono: 'alerta', color: PALETA.advertencia });
  }

  if (bitacora.length) {
    doc.titulo1('Bitacora', 'flujo');
    doc.tabla([
      { titulo: 'Fecha', ancho: 0.32, render: (f) => fecha(f.fecha) },
      { titulo: 'Accion', campo: 'accion', ancho: 0.32 },
      { titulo: 'Ejecutado por', ancho: 0.36, render: (f) => f.usuario_nombre ?? 'Sistema' }
    ], bitacora, { alturaFila: 15 });
  }

  return doc;
};

export const codigoProyecto = (id) => `PRY-${String(id).padStart(5, '0')}`;

const colorEstadoProyecto = (estado) => {
  if (estado === 'Implementada') return PALETA.ok;
  if (estado === 'Rechazada') return PALETA.critico;
  if (estado === 'En desarrollo' || estado === 'En pruebas') return PALETA.advertencia;
  return PALETA.primario;
};

export const construirFichaProyecto = (proyecto) => {
  const doc = new DocumentoPDF({
    titulo: 'Peticion de Proyecto de Software',
    subtitulo: `${codigoProyecto(proyecto.id)} - ${proyecto.titulo}`,
    codigo: 'PRY-FICHA',
    icono: 'engranaje'
  });

  doc.titulo1('Identificacion de la peticion', 'documento');
  doc.camposClaveValor([
    { etiqueta: 'Codigo', valor: codigoProyecto(proyecto.id) },
    { etiqueta: 'Estado', valor: proyecto.estado },
    { etiqueta: 'Tipo', valor: proyecto.tipo },
    { etiqueta: 'Urgencia', valor: proyecto.urgencia },
    { etiqueta: 'Solicitante', valor: proyecto.solicitante_nombre },
    { etiqueta: 'Area', valor: proyecto.area_nombre },
    { etiqueta: 'Sucursal', valor: proyecto.sucursal_nombre },
    { etiqueta: 'Registrada el', valor: fecha(proyecto.fecha_creacion) }
  ], 2);

  doc.titulo1('Que problema se quiere resolver', 'alerta');
  doc.parrafo(proyecto.problema);

  doc.titulo2('Como se resuelve hoy');
  doc.parrafo(proyecto.situacion_actual);

  doc.titulo1('Que se propone', 'engranaje');
  doc.parrafo(proyecto.propuesta);

  doc.titulo2('Que se gana con esto');
  doc.parrafo(proyecto.beneficio);

  doc.titulo1('Alcance declarado', 'grafico');
  doc.camposClaveValor([
    { etiqueta: 'Personas afectadas', valor: String(proyecto.personas_afectadas) },
    { etiqueta: 'Frecuencia de uso', valor: proyecto.frecuencia },
    { etiqueta: 'Sistemas o herramientas actuales', valor: proyecto.sistemas_actuales || 'No indicados' }
  ], 2);

  doc.titulo1('Evaluacion de Sistemas', 'escudo');
  if (proyecto.evaluado_por_nombre) {
    doc.camposClaveValor([
      { etiqueta: 'Evaluada por', valor: proyecto.evaluado_por_nombre },
      { etiqueta: 'Fecha de evaluacion', valor: fecha(proyecto.fecha_evaluacion) },
      { etiqueta: 'Esfuerzo estimado', valor: proyecto.esfuerzo_estimado ?? 'No indicado' },
      { etiqueta: 'Valor para la empresa', valor: proyecto.valor_estimado ?? 'No indicado' }
    ], 2);
    doc.parrafo(proyecto.evaluacion_ti ?? 'Sin observaciones registradas.');
  } else {
    doc.nota('La peticion todavia no fue evaluada tecnicamente.', { icono: 'reloj' });
  }

  doc.titulo1('Seguimiento', 'flujo');
  doc.tabla([
    { titulo: 'Etapa', campo: 'etapa', ancho: 0.3 },
    { titulo: 'Responsable', campo: 'quien', ancho: 0.34 },
    { titulo: 'Momento', campo: 'cuando', ancho: 0.36 }
  ], [
    { etapa: 'Registro', quien: proyecto.solicitante_nombre, cuando: fecha(proyecto.fecha_creacion) },
    {
      etapa: 'Evaluacion tecnica',
      quien: proyecto.evaluado_por_nombre ?? 'Pendiente',
      cuando: proyecto.fecha_evaluacion ? fecha(proyecto.fecha_evaluacion) : 'Pendiente'
    },
    {
      etapa: 'Aprobacion',
      quien: proyecto.aprobado_por_nombre ?? 'Pendiente',
      cuando: proyecto.fecha_aprobacion ? fecha(proyecto.fecha_aprobacion) : 'Pendiente'
    },
    {
      etapa: 'Desarrollo',
      quien: proyecto.responsable_nombre ?? 'Sin asignar',
      cuando: proyecto.fecha_inicio ? fecha(proyecto.fecha_inicio) : 'Pendiente'
    },
    {
      etapa: 'Entrega',
      quien: proyecto.responsable_nombre ?? 'Sin asignar',
      cuando: proyecto.fecha_entrega ? fecha(proyecto.fecha_entrega) : 'Pendiente'
    }
  ]);

  if (proyecto.estado === 'Rechazada') {
    doc.nota(`No aprobada por ${proyecto.rechazado_por_nombre ?? 'la organizacion'}: ${proyecto.motivo_rechazo}`,
      { icono: 'alerta', color: PALETA.critico });
  }

  return doc;
};

export const construirReporteProyectos = ({ filas }) => {
  const doc = new DocumentoPDF({
    titulo: 'Cartera de Peticiones de Proyecto',
    subtitulo: 'Mejoras e ideas de software propuestas por las areas',
    codigo: 'REP-PROYECTOS',
    icono: 'grafico',
    orientacion: 'landscape'
  });

  const cuenta = (estado) => filas.filter((f) => f.estado === estado).length;

  doc.titulo1('Situacion de la cartera', 'grafico');
  doc.indicadores([
    { etiqueta: 'Peticiones', valor: filas.length, icono: 'documento', color: PALETA.primario },
    { etiqueta: 'En evaluacion', valor: cuenta('En evaluacion'), icono: 'reloj', color: PALETA.advertencia },
    { etiqueta: 'Aprobadas', valor: cuenta('Aprobada'), icono: 'check', color: PALETA.acento },
    { etiqueta: 'En curso', valor: cuenta('En desarrollo') + cuenta('En pruebas'), icono: 'engranaje', color: PALETA.advertencia },
    { etiqueta: 'Implementadas', valor: cuenta('Implementada'), icono: 'check', color: PALETA.ok }
  ]);

  doc.titulo1('Detalle de las peticiones', 'documento');
  doc.tabla([
    { titulo: 'Codigo', ancho: 0.08, render: (f) => codigoProyecto(f.id) },
    { titulo: 'Titulo', campo: 'titulo', ancho: 0.24, truncar: true },
    { titulo: 'Tipo', campo: 'tipo', ancho: 0.12 },
    { titulo: 'Solicitante', campo: 'solicitante_nombre', ancho: 0.16, truncar: true },
    { titulo: 'Area', campo: 'area_nombre', ancho: 0.12, truncar: true },
    { titulo: 'Urgencia', campo: 'urgencia', ancho: 0.08 },
    { titulo: 'Estado', campo: 'estado', ancho: 0.12, color: (f) => colorEstadoProyecto(f.estado) },
    { titulo: 'Registrada', ancho: 0.08, render: (f) => soloFecha(f.fecha_creacion) }
  ], filas.length ? filas : [{
    id: 0, titulo: 'Sin peticiones registradas', tipo: '-', solicitante_nombre: '-',
    area_nombre: '-', urgencia: '-', estado: '-', fecha_creacion: null
  }]);

  return doc;
};

const variacionLegible = (valor) => {
  if (valor === null) return 'sin base de comparacion';
  if (valor > 0) return `+${valor}% respecto al mes anterior`;
  if (valor < 0) return `${valor}% respecto al mes anterior`;
  return 'sin variacion respecto al mes anterior';
};

const COLUMNAS_DESGLOSE = [
  { titulo: 'Detalle', campo: 'etiqueta', ancho: 0.4 },
  { titulo: 'Registrados', campo: 'creados', ancho: 0.12 },
  { titulo: 'Abiertos', campo: 'abiertos', ancho: 0.12 },
  { titulo: 'En proceso', campo: 'en_proceso', ancho: 0.12 },
  { titulo: 'Resueltos', campo: 'resueltos', ancho: 0.12 },
  { titulo: 'Cerrados', campo: 'cerrados', ancho: 0.12 }
];

const SIN_DATOS = [{ etiqueta: 'Sin registros en el periodo', creados: 0, abiertos: 0, en_proceso: 0, resueltos: 0, cerrados: 0 }];

const conDatos = (filas) => (filas.length ? filas : SIN_DATOS);

export const construirReporteMensual = (datos) => {
  const doc = new DocumentoPDF({
    titulo: 'Reporte Mensual de la Mesa de Ayuda',
    subtitulo: `Periodo: ${datos.nombre}`,
    codigo: 'REP-MENSUAL',
    icono: 'grafico',
    orientacion: 'landscape'
  });

  doc.titulo1('Movimiento del periodo', 'grafico');
  doc.indicadores([
    { etiqueta: 'Registrados', valor: datos.totales.creados, icono: 'ticket', color: PALETA.primario },
    { etiqueta: 'Atendidos', valor: datos.totales.atendidos, icono: 'engranaje', color: PALETA.advertencia },
    { etiqueta: 'Resueltos', valor: datos.totales.resueltos, icono: 'check', color: PALETA.ok },
    { etiqueta: 'Cerrados', valor: datos.totales.cerrados, icono: 'check', color: PALETA.ok },
    { etiqueta: 'Pendientes', valor: datos.totales.pendientes, icono: 'alerta', color: PALETA.critico }
  ]);

  doc.titulo2('Criterios aplicados');
  doc.lista([
    'Periodo: ' + datos.nombre,
    'Sucursal: ' + (datos.filtroSucursal ?? 'todas'),
    'Categoria: ' + (datos.filtros.categoria || 'todas'),
    'Prioridad: ' + (datos.filtros.prioridad || 'todas'),
    'Tickets incluidos en el detalle: ' + datos.tickets.length
  ]);

  doc.titulo2('Comparacion con el mes anterior');
  doc.tabla([
    { titulo: 'Concepto', campo: 'concepto', ancho: 0.3 },
    { titulo: datos.nombre, campo: 'actual', ancho: 0.2 },
    { titulo: datos.anterior.nombre, campo: 'previo', ancho: 0.2 },
    { titulo: 'Variacion', campo: 'variacion', ancho: 0.3 }
  ], [
    ['Tickets registrados', 'creados'],
    ['Tickets atendidos', 'atendidos'],
    ['Tickets resueltos', 'resueltos'],
    ['Tickets cerrados', 'cerrados']
  ].map(([concepto, clave]) => ({
    concepto,
    actual: String(datos.totales[clave]),
    previo: String(datos.anterior.totales[clave]),
    variacion: variacionLegible(datos.variacion[clave])
  })));

  doc.titulo1('Distribucion por categoria', 'engranaje');
  doc.tabla(COLUMNAS_DESGLOSE, conDatos(datos.categorias));

  doc.titulo1('Distribucion por sucursal', 'red');
  doc.tabla(COLUMNAS_DESGLOSE, conDatos(datos.sucursales));

  doc.titulo1('Distribucion por area solicitante', 'usuario');
  doc.tabla(COLUMNAS_DESGLOSE, conDatos(datos.areas));

  doc.titulo1('Quien solicito mas tickets', 'usuario');
  doc.tabla(COLUMNAS_DESGLOSE, conDatos(datos.solicitantes));

  doc.titulo1('Atencion por tecnico', 'usuario');
  doc.tabla([
    { titulo: 'Tecnico', campo: 'etiqueta', ancho: 0.4 },
    { titulo: 'Atendidos', campo: 'atendidos', ancho: 0.2 },
    { titulo: 'Resueltos', campo: 'resueltos', ancho: 0.2 },
    { titulo: 'Cerrados', campo: 'cerrados', ancho: 0.2 }
  ], datos.tecnicos.length
    ? datos.tecnicos
    : [{ etiqueta: 'Sin atencion registrada en el periodo', atendidos: 0, resueltos: 0, cerrados: 0 }]);

  doc.titulo1('Detalle de los tickets del periodo', 'documento');
  doc.tabla([
    { titulo: 'Codigo', ancho: 0.08, render: (f) => codigoTicket(f) },
    { titulo: 'Titulo', campo: 'titulo', ancho: 0.24, truncar: true },
    { titulo: 'Categoria', campo: 'categoria', ancho: 0.1 },
    { titulo: 'Prioridad', campo: 'prioridad', ancho: 0.08, color: (f) => colorPrioridad(f.prioridad) },
    { titulo: 'Estado', campo: 'estado', ancho: 0.1, color: (f) => colorEstado(f.estado) },
    { titulo: 'Solicitante', campo: 'solicitante_nombre', ancho: 0.14, truncar: true },
    { titulo: 'Sucursal', campo: 'sucursal_nombre', ancho: 0.12, truncar: true },
    { titulo: 'Registrado', ancho: 0.07, render: (f) => soloFecha(f.fecha_creacion) },
    { titulo: 'Cerrado', ancho: 0.07, render: (f) => (f.fecha_cierre ? soloFecha(f.fecha_cierre) : '-') }
  ], datos.tickets.length
    ? datos.tickets
    : [{ id: 0, titulo: 'Sin tickets registrados en el periodo', categoria: '-', prioridad: '-', estado: '-', solicitante_nombre: '-', sucursal_nombre: '-', fecha_creacion: null, fecha_cierre: null }]);

  doc.nota('Cada cifra se cuenta por la fecha en que ocurrio la accion: un ticket puede haberse '
    + 'registrado en un mes y haberse cerrado en el siguiente.', { icono: 'documento' });

  return doc;
};

export const construirReporteTickets = ({ filas, indicadores, filtros }) => {
  const doc = new DocumentoPDF({
    titulo: 'Reporte de Gestion de Tickets',
    subtitulo: 'Mesa de ayuda - Sistemas',
    codigo: 'REP-TICKETS',
    icono: 'grafico',
    orientacion: 'landscape'
  });

  doc.titulo1('Indicadores del periodo', 'grafico');
  doc.indicadores([
    { etiqueta: 'Total', valor: indicadores.total, icono: 'ticket', color: PALETA.primario },
    { etiqueta: 'Abiertos', valor: indicadores.abiertos, icono: 'ticket', color: PALETA.acento },
    { etiqueta: 'En proceso', valor: indicadores.en_proceso, icono: 'reloj', color: PALETA.advertencia },
    { etiqueta: 'Resueltos', valor: indicadores.resueltos, icono: 'check', color: PALETA.ok },
    { etiqueta: 'Criticos', valor: indicadores.criticos, icono: 'alerta', color: PALETA.critico }
  ]);

  doc.titulo2('Criterios aplicados');
  doc.lista([
    'Periodo: ' + (filtros.desde ? soloFecha(filtros.desde) : 'sin limite inicial') + ' al '
      + (filtros.hasta ? soloFecha(filtros.hasta) : 'sin limite final'),
    'Estado: ' + (filtros.estado ?? 'todos'),
    'Categoria: ' + (filtros.categoria ?? 'todas'),
    'Prioridad: ' + (filtros.prioridad ?? 'todas'),
    'Registros incluidos: ' + filas.length
  ]);

  doc.titulo1('Detalle de tickets', 'documento');
  doc.tabla([
    { titulo: 'ID', ancho: 0.07, render: (f) => codigoTicket(f) },
    { titulo: 'Titulo', campo: 'titulo', ancho: 0.24 },
    { titulo: 'Categoria', campo: 'categoria', ancho: 0.1 },
    { titulo: 'Prioridad', campo: 'prioridad', ancho: 0.09, color: (f) => colorPrioridad(f.prioridad) },
    { titulo: 'Estado', campo: 'estado', ancho: 0.1, color: (f) => colorEstado(f.estado) },
    { titulo: 'Solicitante', campo: 'solicitante_nombre', ancho: 0.15 },
    { titulo: 'Atendido por', campo: 'asignado_nombre', ancho: 0.15 },
    { titulo: 'Creado', ancho: 0.1, render: (f) => soloFecha(f.fecha_creacion) }
  ], filas);

  return doc;
};

export const construirReporteAuditoria = ({ filas, filtros }) => {
  const doc = new DocumentoPDF({
    titulo: 'Bitacora de Auditoria del Sistema',
    subtitulo: 'Registro de acciones y trazabilidad de operaciones',
    codigo: 'REP-AUDITORIA',
    icono: 'escudo',
    orientacion: 'landscape'
  });

  doc.titulo2('Criterios aplicados');
  doc.lista([
    'Periodo: ' + (filtros.desde ? soloFecha(filtros.desde) : 'sin limite inicial') + ' al '
      + (filtros.hasta ? soloFecha(filtros.hasta) : 'sin limite final'),
    'Entidad: ' + (filtros.entidad ?? 'todas'),
    'Registros incluidos: ' + filas.length
      + (filas.length >= (filtros.limite ?? Infinity)
        ? ' (tope alcanzado, acote el periodo para ver el resto)'
        : '')
  ]);

  doc.titulo1('Detalle de acciones registradas', 'documento');
  doc.tabla([
    { titulo: 'Fecha', ancho: 0.22, render: (f) => fecha(f.fecha) },
    { titulo: 'Usuario', ancho: 0.28, render: (f) => f.usuario_nombre ?? 'Sistema' },
    { titulo: 'Entidad', campo: 'entidad', ancho: 0.14 },
    { titulo: 'Registro', ancho: 0.1, render: (f) => f.entidad_id ?? '-' },
    { titulo: 'Accion', campo: 'accion', ancho: 0.26 }
  ], filas, { alturaFila: 15 });

  return doc;
};

export const construirMatrizRoles = ({ roles, permisos }) => {
  const doc = new DocumentoPDF({
    titulo: 'Matriz de Roles y Permisos',
    subtitulo: 'Control de acceso basado en roles (RBAC)',
    codigo: 'REP-RBAC',
    icono: 'escudo'
  });

  doc.parrafo('El presente documento consolida la configuracion vigente del control de acceso. '
    + 'Cada rol agrupa un conjunto de permisos atomicos que el middleware de autorizacion valida en cada endpoint expuesto por la API.');

  doc.titulo1('Catalogo de permisos atomicos', 'engranaje');
  doc.tabla([
    { titulo: 'Modulo', campo: 'modulo', ancho: 0.16 },
    { titulo: 'Codigo', campo: 'codigo', ancho: 0.28 },
    { titulo: 'Descripcion de la accion', campo: 'descripcion', ancho: 0.56 }
  ], permisos);

  doc.titulo1('Asignacion por rol', 'usuario');
  roles.forEach((rol) => {
    const codigos = (rol.permisos ?? []).map((p) => p.codigo);
    doc.titulo2(rol.nombre + '   (' + rol.total_usuarios + ' usuarios asignados)');
    doc.parrafo(rol.descripcion ?? 'Sin descripcion registrada.');
    doc.tabla([
      { titulo: 'Permiso', campo: 'codigo', ancho: 0.4 },
      { titulo: 'Modulo', campo: 'modulo', ancho: 0.25 },
      { titulo: 'Concedido', ancho: 0.35, alineacion: 'center',
        render: (f) => (codigos.includes(f.codigo) ? 'CONCEDIDO' : 'NO CONCEDIDO'),
        color: (f) => (codigos.includes(f.codigo) ? PALETA.ok : PALETA.suave) }
    ], permisos, { alturaFila: 15 });
  });

  return doc;
};

export const construirReporteInventario = ({ filas, resumen }) => {
  const doc = new DocumentoPDF({
    titulo: 'Inventario de Sistemas',
    subtitulo: 'Catalogo de articulos y saldos vigentes',
    codigo: 'REP-INVENTARIO',
    icono: 'baseDatos',
    orientacion: 'landscape'
  });

  doc.titulo1('Situacion del inventario', 'grafico');
  doc.indicadores([
    { etiqueta: 'Articulos', valor: resumen.articulos, icono: 'baseDatos', color: PALETA.primario },
    { etiqueta: 'Unidades', valor: resumen.unidades, icono: 'documento', color: PALETA.acento },
    { etiqueta: 'Bajo minimo', valor: resumen.bajo_minimo, icono: 'alerta', color: PALETA.advertencia },
    { etiqueta: 'Agotados', valor: resumen.agotados, icono: 'alerta', color: PALETA.critico }
  ]);

  doc.titulo1('Detalle de articulos', 'documento');
  doc.tabla([
    { titulo: 'Codigo', campo: 'codigo', ancho: 0.11 },
    { titulo: 'Articulo', campo: 'nombre', ancho: 0.23 },
    { titulo: 'Tipo', campo: 'tipo', ancho: 0.1 },
    { titulo: 'Ubicacion', campo: 'ubicacion', ancho: 0.16 },
    { titulo: 'Situacion', campo: 'estado', ancho: 0.13,
      color: (f) => (f.estado === 'Disponible' ? PALETA.ok
        : f.estado === 'En reparacion' ? PALETA.advertencia : PALETA.suave) },
    { titulo: 'Unidad', campo: 'unidad', ancho: 0.08 },
    { titulo: 'Minimo', campo: 'stock_minimo', ancho: 0.08, alineacion: 'right' },
    { titulo: 'Stock', campo: 'stock_actual', ancho: 0.11, alineacion: 'right',
      color: (f) => (f.bajo_minimo ? PALETA.critico : PALETA.ok) }
  ], filas, { alturaFila: 15 });

  return doc;
};

export const construirKardex = ({ articulo, movimientos }) => {
  const doc = new DocumentoPDF({
    titulo: 'Kardex de ' + articulo.nombre,
    subtitulo: 'Codigo ' + articulo.codigo + ' - Movimientos registrados',
    codigo: 'KARDEX-' + articulo.codigo,
    icono: 'flujo',
    orientacion: 'landscape'
  });

  doc.titulo1('Datos del articulo', 'baseDatos');
  doc.camposClaveValor([
    { etiqueta: 'Codigo', valor: articulo.codigo },
    { etiqueta: 'Tipo', valor: articulo.tipo },
    { etiqueta: 'Unidad', valor: articulo.unidad },
    { etiqueta: 'Ubicacion', valor: articulo.ubicacion },
    { etiqueta: 'Situacion', valor: articulo.estado },
    { etiqueta: 'Stock actual', valor: articulo.stock_actual },
    { etiqueta: 'Stock minimo', valor: articulo.stock_minimo },
    { etiqueta: 'Situacion', valor: articulo.bajo_minimo ? 'Bajo el minimo' : 'Dentro del minimo' },
    { etiqueta: 'Ultimo movimiento', valor: fecha(articulo.ultimo_movimiento) }
  ], 4);

  doc.titulo1('Movimientos', 'flujo');
  doc.tabla([
    { titulo: 'Fecha', ancho: 0.2, render: (f) => fecha(f.fecha) },
    { titulo: 'Tipo', campo: 'tipo', ancho: 0.11,
      color: (f) => (f.tipo === 'Entrada' ? PALETA.ok : f.tipo === 'Salida' ? PALETA.critico : PALETA.advertencia) },
    { titulo: 'Cantidad', campo: 'cantidad', ancho: 0.1, alineacion: 'right' },
    { titulo: 'Anterior', campo: 'stock_anterior', ancho: 0.1, alineacion: 'right' },
    { titulo: 'Resultante', campo: 'stock_resultante', ancho: 0.11, alineacion: 'right' },
    { titulo: 'Motivo', campo: 'motivo', ancho: 0.23 },
    { titulo: 'Registrado por', campo: 'usuario_nombre', ancho: 0.15 }
  ], movimientos, { alturaFila: 15 });

  return doc;
};

export const construirReporteEquipos = ({ filas, resumen }) => {
  const doc = new DocumentoPDF({
    titulo: 'Parque de Equipos',
    subtitulo: 'Inventario de equipos de la empresa y su asignacion',
    codigo: 'REP-EQUIPOS',
    icono: 'engranaje',
    orientacion: 'landscape'
  });

  doc.titulo1('Situacion del parque', 'grafico');
  doc.indicadores([
    { etiqueta: 'Equipos', valor: resumen.total, icono: 'engranaje', color: PALETA.primario },
    { etiqueta: 'Operativos', valor: resumen.operativos, icono: 'check', color: PALETA.ok },
    { etiqueta: 'En reparacion', valor: resumen.en_reparacion, icono: 'alerta', color: PALETA.advertencia },
    { etiqueta: 'Sin asignar', valor: resumen.sin_asignar, icono: 'usuario', color: PALETA.suave }
  ]);

  doc.titulo1('Detalle de equipos', 'documento');
  doc.tabla([
    { titulo: 'Codigo', campo: 'codigo', ancho: 0.09 },
    { titulo: 'Equipo', campo: 'nombre_equipo', ancho: 0.15 },
    { titulo: 'Tipo', campo: 'tipo', ancho: 0.08 },
    { titulo: 'Asignado a', ancho: 0.15, render: (f) => f.usuario_nombre ?? 'Sin asignar' },
    { titulo: 'Area', ancho: 0.13, render: (f) => f.area_nombre ?? '-' },
    { titulo: 'Sistema operativo', campo: 'sistema_operativo', ancho: 0.14 },
    { titulo: 'RAM', ancho: 0.06, alineacion: 'right', render: (f) => (f.ram_gb ? f.ram_gb + ' GB' : '-') },
    { titulo: 'Direccion IP', campo: 'direccion_ip', ancho: 0.1 },
    { titulo: 'Estado', campo: 'estado', ancho: 0.1,
      color: (f) => (f.estado === 'Operativo' ? PALETA.ok : f.estado === 'En reparacion' ? PALETA.advertencia : PALETA.suave) }
  ], filas, { alturaFila: 15 });

  doc.nota('Por seguridad, las contrasenas de acceso remoto no se incluyen en ningun documento exportable. '
    + 'Se consultan unicamente desde el sistema, con permiso propio y registro en la bitacora.', { icono: 'escudo' });

  return doc;
};

export const construirFichaEquipo = ({ equipo }) => {
  const doc = new DocumentoPDF({
    titulo: 'Equipo ' + equipo.codigo,
    subtitulo: equipo.nombre_equipo,
    codigo: 'FICHA-' + equipo.codigo,
    icono: 'engranaje'
  });

  doc.titulo1('Identificacion', 'documento');
  doc.camposClaveValor([
    { etiqueta: 'Codigo', valor: equipo.codigo },
    { etiqueta: 'Nombre del equipo', valor: equipo.nombre_equipo },
    { etiqueta: 'Tipo', valor: equipo.tipo },
    { etiqueta: 'Estado', valor: equipo.estado },
    { etiqueta: 'Marca', valor: equipo.marca },
    { etiqueta: 'Modelo', valor: equipo.modelo },
    { etiqueta: 'Numero de serie', valor: equipo.numero_serie },
    { etiqueta: 'Ubicacion', valor: equipo.ubicacion }
  ], 4);

  doc.titulo1('Caracteristicas tecnicas', 'baseDatos');
  doc.camposClaveValor([
    { etiqueta: 'Sistema operativo', valor: equipo.sistema_operativo },
    { etiqueta: 'Procesador', valor: equipo.procesador },
    { etiqueta: 'Memoria RAM', valor: equipo.ram_gb ? equipo.ram_gb + ' GB' : null },
    { etiqueta: 'Almacenamiento', valor: equipo.almacenamiento }
  ], 4);

  doc.titulo1('Conectividad y acceso remoto', 'red');
  doc.camposClaveValor([
    { etiqueta: 'Direccion IP', valor: equipo.direccion_ip },
    { etiqueta: 'Direccion MAC', valor: equipo.direccion_mac },
    { etiqueta: 'Identificador AnyDesk', valor: equipo.anydesk_id },
    { etiqueta: 'Contrasena remota', valor: equipo.tiene_password ? 'Registrada (no se imprime)' : 'No registrada' }
  ], 4);

  doc.titulo1('Asignacion', 'usuario');
  doc.camposClaveValor([
    { etiqueta: 'Asignado a', valor: equipo.usuario_nombre ?? 'Sin asignar' },
    { etiqueta: 'Area', valor: equipo.area_nombre },
    { etiqueta: 'Fecha de asignacion', valor: soloFecha(equipo.fecha_asignacion) },
    { etiqueta: 'Alta en el sistema', valor: soloFecha(equipo.fecha_creacion) }
  ], 4);

  if (equipo.observaciones) {
    doc.titulo1('Observaciones', 'documento');
    doc.parrafo(equipo.observaciones);
  }

  doc.nota('La contrasena de acceso remoto se guarda cifrada y no se incluye en este documento.', { icono: 'escudo' });

  return doc;
};

const codigoCompra = (id) => 'SC-' + String(id).padStart(5, '0');

const colorEstadoCompra = (estado) => ({
  'Solicitada': PALETA.acento,
  'En revision': PALETA.advertencia,
  'Aprobada por TI': '#A16207',
  'Aprobada por Gerencia': PALETA.ok,
  'Comprada': PALETA.ok,
  'Entregada': PALETA.primario,
  'Rechazada': PALETA.critico
}[estado] ?? PALETA.texto);

export const construirReporteCompras = ({ filas, resumen }) => {
  const doc = new DocumentoPDF({
    titulo: 'Solicitudes de Compra de Equipos',
    subtitulo: 'Estado del circuito de adquisiciones',
    codigo: 'REP-COMPRAS',
    icono: 'documento',
    orientacion: 'landscape'
  });

  doc.titulo1('Situacion del circuito', 'grafico');
  doc.indicadores([
    { etiqueta: 'Total', valor: resumen.total, icono: 'documento', color: PALETA.primario },
    { etiqueta: 'Solicitadas', valor: resumen.solicitadas, icono: 'ticket', color: PALETA.acento },
    { etiqueta: 'En Gerencia', valor: resumen.esperando_gerencia, icono: 'reloj', color: PALETA.advertencia },
    { etiqueta: 'Entregadas', valor: resumen.entregadas, icono: 'check', color: PALETA.ok },
    { etiqueta: 'Rechazadas', valor: resumen.rechazadas, icono: 'alerta', color: PALETA.critico }
  ]);
  doc.parrafo('Monto ejecutado en compras concretadas: ' + Number(resumen.monto_ejecutado ?? 0).toFixed(2));

  doc.titulo1('Detalle de solicitudes', 'documento');
  doc.tabla([
    { titulo: 'Codigo', ancho: 0.08, render: (f) => codigoCompra(f.id) },
    { titulo: 'Solicitud', campo: 'titulo', ancho: 0.22 },
    { titulo: 'Solicitante', campo: 'solicitante_nombre', ancho: 0.15 },
    { titulo: 'Sucursal', campo: 'sucursal_nombre', ancho: 0.13 },
    { titulo: 'Tipo', campo: 'tipo_equipo', ancho: 0.09 },
    { titulo: 'Cant.', campo: 'cantidad', ancho: 0.05, alineacion: 'right' },
    { titulo: 'Estado', campo: 'estado', ancho: 0.16, color: (f) => colorEstadoCompra(f.estado) },
    { titulo: 'Registrada', ancho: 0.12, render: (f) => soloFecha(f.fecha_creacion) }
  ], filas, { alturaFila: 15 });

  return doc;
};

export const construirFichaCompra = ({ solicitud }) => {
  const doc = new DocumentoPDF({
    titulo: 'Solicitud ' + codigoCompra(solicitud.id),
    subtitulo: solicitud.titulo,
    codigo: codigoCompra(solicitud.id),
    icono: 'documento'
  });

  doc.titulo1('Pedido', 'ticket');
  doc.camposClaveValor([
    { etiqueta: 'Codigo', valor: codigoCompra(solicitud.id) },
    { etiqueta: 'Estado', valor: solicitud.estado },
    { etiqueta: 'Tipo de equipo', valor: solicitud.tipo_equipo },
    { etiqueta: 'Cantidad', valor: solicitud.cantidad },
    { etiqueta: 'Solicitante', valor: solicitud.solicitante_nombre },
    { etiqueta: 'Sucursal', valor: solicitud.sucursal_nombre },
    { etiqueta: 'Area', valor: solicitud.area_nombre },
    { etiqueta: 'Prioridad', valor: solicitud.prioridad }
  ], 4);

  doc.titulo1('Justificacion', 'documento');
  doc.parrafo(solicitud.justificacion);

  if (solicitud.especificaciones) {
    doc.titulo2('Especificaciones sugeridas');
    doc.parrafo(solicitud.especificaciones);
  }

  doc.titulo1('Circuito de aprobacion', 'flujo');
  doc.tabla([
    { titulo: 'Instancia', campo: 'instancia', ancho: 0.24 },
    { titulo: 'Responsable', campo: 'responsable', ancho: 0.24 },
    { titulo: 'Cargo', campo: 'cargo', ancho: 0.16 },
    { titulo: 'Fecha', campo: 'fecha', ancho: 0.16, truncar: true },
    { titulo: 'Observacion', campo: 'observacion', ancho: 0.2 }
  ], [
    {
      instancia: 'Registro del pedido',
      responsable: solicitud.solicitante_nombre,
      cargo: 'Solicitante',
      fecha: fecha(solicitud.fecha_creacion),
      observacion: '-'
    },
    {
      instancia: 'Revision tecnica',
      responsable: solicitud.revisado_por_nombre ?? 'Pendiente',
      cargo: solicitud.revisado_por_nombre ? 'Sistemas' : '-',
      fecha: fecha(solicitud.fecha_revision) ?? 'Pendiente',
      observacion: solicitud.observacion_ti ?? '-'
    },
    {
      instancia: 'Aprobacion presupuestaria',
      responsable: solicitud.aprobado_por_nombre ?? 'Pendiente',
      cargo: solicitud.aprobado_por_nombre ? (solicitud.aprobado_por_area ?? 'Gerencia') : '-',
      fecha: fecha(solicitud.fecha_aprobacion) ?? 'Pendiente',
      observacion: solicitud.observacion_gerencia ?? '-'
    },
    {
      instancia: 'Compra ejecutada',
      responsable: solicitud.comprado_por_nombre ?? 'Pendiente',
      cargo: solicitud.comprado_por_nombre ? 'Sistemas' : '-',
      fecha: fecha(solicitud.fecha_compra) ?? 'Pendiente',
      observacion: solicitud.numero_orden ? 'Orden ' + solicitud.numero_orden : '-'
    },
    {
      instancia: 'Entrega al solicitante',
      responsable: solicitud.entregado_por_nombre ?? 'Pendiente',
      cargo: solicitud.entregado_por_nombre ? 'Sistemas' : '-',
      fecha: fecha(solicitud.fecha_entrega) ?? 'Pendiente',
      observacion: solicitud.equipo_codigo ? 'Equipo ' + solicitud.equipo_codigo : '-'
    }
  ]);

  if (solicitud.aprobado_por_nombre) {
    doc.nota('Aprobacion presupuestaria otorgada por ' + solicitud.aprobado_por_nombre
      + ', ' + (solicitud.aprobado_por_area ?? 'Gerencia')
      + ', el ' + (fecha(solicitud.fecha_aprobacion) ?? 'sin fecha') + '. '
      + (solicitud.observacion_gerencia ? 'Observacion: ' + solicitud.observacion_gerencia : 'Sin observaciones.'),
    { icono: 'check', color: PALETA.ok });
  } else if (solicitud.estado !== 'Rechazada') {
    doc.nota('La solicitud aun no cuenta con la aprobacion presupuestaria de Gerencia.',
      { icono: 'alerta', color: PALETA.advertencia });
  }

  doc.titulo1('Valores', 'grafico');
  doc.camposClaveValor([
    { etiqueta: 'Monto estimado', valor: solicitud.monto_estimado },
    { etiqueta: 'Monto final', valor: solicitud.monto_final },
    { etiqueta: 'Equipo sugerido por TI', valor: solicitud.equipo_sugerido },
    { etiqueta: 'Orden de compra', valor: solicitud.numero_orden }
  ], 4);

  if (solicitud.estado === 'Rechazada') {
    doc.nota('Solicitud rechazada por ' + (solicitud.rechazado_por_nombre ?? 'la organizacion')
      + ' el ' + (fecha(solicitud.fecha_rechazo) ?? 'sin fecha') + '. Motivo: ' + (solicitud.motivo_rechazo ?? 'no registrado'),
    { icono: 'alerta', color: PALETA.critico });
  }

  return doc;
};
