import path from 'node:path';
import { DocumentoPDF, PALETA } from './documento.js';
import { env } from '../../config/env.js';

const fecha = (valor) => (valor ? new Date(valor).toLocaleString('es-BO') : null);

/** Convierte una cantidad de horas decimales en un texto legible. */
export const duracionLegible = (horas) => {
  if (horas === null || horas === undefined) return null;
  const minutosTotales = Math.max(0, Math.round(Number(horas) * 60));
  const dias = Math.floor(minutosTotales / 1440);
  const restoHoras = Math.floor((minutosTotales % 1440) / 60);
  const minutos = minutosTotales % 60;
  if (dias > 0) return `${dias} d ${restoHoras} h ${minutos} min`;
  if (restoHoras > 0) return `${restoHoras} h ${minutos} min`;
  return `${minutos} min`;
};
const soloFecha = (valor) => (valor ? new Date(valor).toLocaleDateString('es-BO') : '-');

export const codigoTicket = (id) => 'TI-' + String(id).padStart(5, '0');

export const colorEstado = (estado) => ({
  'Abierto': PALETA.acento,
  'En Proceso': PALETA.advertencia,
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
  'Abierto': 'ticket',
  'En Proceso': 'reloj',
  'Resuelto': 'check',
  'Cerrado': 'check'
}[estado] ?? 'ticket');

/** Ruta destino de los documentos generados automaticamente. */
export const rutaDocumento = (...segmentos) => path.resolve(process.cwd(), env.docs.outputDir, ...segmentos);

/**
 * Acta PDF de un ticket con su trazabilidad completa.
 * Se emite bajo demanda y tambien de forma automatica en cada cambio de estado.
 */
export const construirActaTicket = (ticket, bitacora = [], opciones = {}) => {
  const accion = opciones.accion ?? 'FICHA';
  const doc = new DocumentoPDF({
    titulo: 'Ticket ' + codigoTicket(ticket.id),
    subtitulo: ticket.titulo,
    codigo: 'ACTA-' + codigoTicket(ticket.id) + '-' + accion,
    icono: iconoEstado(ticket.estado)
  });

  // Ficha resumida: clasificacion, responsables y tiempos en un solo bloque
  doc.titulo1('Ficha del requerimiento', 'ticket');
  doc.camposClaveValor([
    { etiqueta: 'Ticket', valor: codigoTicket(ticket.id) },
    { etiqueta: 'Estado', valor: ticket.estado },
    { etiqueta: 'Categoria', valor: ticket.categoria },
    { etiqueta: 'Prioridad', valor: ticket.prioridad },
    { etiqueta: 'Solicitante', valor: ticket.solicitante_nombre },
    { etiqueta: 'Area solicitante', valor: ticket.solicitante_area },
    { etiqueta: 'Atendido por', valor: ticket.asignado_nombre },
    { etiqueta: 'Resuelto por', valor: ticket.resuelto_por_nombre },
    { etiqueta: 'Creacion', valor: fecha(ticket.fecha_creacion) },
    { etiqueta: 'Asignacion', valor: fecha(ticket.fecha_asignacion) },
    { etiqueta: 'Resolucion', valor: fecha(ticket.fecha_resolucion) },
    { etiqueta: 'Tiempo de atencion', valor: duracionLegible(ticket.horas_atencion) }
  ], 4);

  doc.titulo1('Descripcion reportada', 'documento');
  doc.parrafo(ticket.descripcion);

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

/** Reporte consolidado de tickets con indicadores de gestion. */
export const construirReporteTickets = ({ filas, indicadores, filtros }) => {
  const doc = new DocumentoPDF({
    titulo: 'Reporte de Gestion de Tickets',
    subtitulo: 'Mesa de ayuda - Tecnologias de la Informacion',
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
    { titulo: 'ID', ancho: 0.07, render: (f) => codigoTicket(f.id) },
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

/** Bitacora de auditoria del sistema. */
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

/** Documento de la matriz de roles y permisos vigente. */
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
