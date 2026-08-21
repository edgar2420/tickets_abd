import path from 'node:path';
import { DocumentoPDF, PALETA } from './documento.js';
import { env } from '../../config/env.js';

const fecha = (valor) => (valor ? new Date(valor).toLocaleString('es-BO') : null);

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

export const rutaDocumento = (...segmentos) => path.resolve(process.cwd(), env.docs.outputDir, ...segmentos);

export const construirActaTicket = (ticket, bitacora = [], opciones = {}) => {
  const accion = opciones.accion ?? 'FICHA';
  const doc = new DocumentoPDF({
    titulo: 'Ticket ' + codigoTicket(ticket.id),
    subtitulo: ticket.titulo,
    codigo: 'ACTA-' + codigoTicket(ticket.id) + '-' + accion,
    icono: iconoEstado(ticket.estado)
  });

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

const variacionLegible = (valor) => {
  if (valor === null) return 'sin base de comparacion';
  if (valor > 0) return `+${valor}% respecto al mes anterior`;
  if (valor < 0) return `${valor}% respecto al mes anterior`;
  return 'sin variacion respecto al mes anterior';
};

export const construirReporteMensual = (datos) => {
  const doc = new DocumentoPDF({
    titulo: 'Reporte Mensual de la Mesa de Ayuda',
    subtitulo: `Periodo: ${datos.nombre}`,
    codigo: 'REP-MENSUAL',
    icono: 'grafico'
  });

  doc.titulo1('Resumen del mes', 'grafico');
  doc.indicadores([
    { etiqueta: 'Registrados', valor: datos.totales.creados, icono: 'ticket', color: PALETA.primario },
    { etiqueta: 'Atendidos', valor: datos.totales.atendidos, icono: 'reloj', color: PALETA.advertencia },
    { etiqueta: 'Resueltos', valor: datos.totales.resueltos, icono: 'check', color: PALETA.ok },
    { etiqueta: 'Cerrados', valor: datos.totales.cerrados, icono: 'check', color: PALETA.ok },
    { etiqueta: 'Pendientes', valor: datos.totales.pendientes, icono: 'alerta', color: PALETA.critico }
  ]);

  doc.titulo2('Comparacion con el mes anterior');
  doc.tabla([
    { titulo: 'Concepto', campo: 'concepto', ancho: 0.34 },
    { titulo: datos.nombre, campo: 'actual', ancho: 0.22 },
    { titulo: datos.anterior.nombre, campo: 'previo', ancho: 0.22 },
    { titulo: 'Variacion', campo: 'variacion', ancho: 0.22 }
  ], [
    {
      concepto: 'Tickets registrados',
      actual: String(datos.totales.creados),
      previo: String(datos.anterior.totales.creados),
      variacion: variacionLegible(datos.variacion.creados)
    },
    {
      concepto: 'Tickets atendidos',
      actual: String(datos.totales.atendidos),
      previo: String(datos.anterior.totales.atendidos),
      variacion: variacionLegible(datos.variacion.atendidos)
    },
    {
      concepto: 'Tickets resueltos',
      actual: String(datos.totales.resueltos),
      previo: String(datos.anterior.totales.resueltos),
      variacion: variacionLegible(datos.variacion.resueltos)
    },
    {
      concepto: 'Tickets cerrados',
      actual: String(datos.totales.cerrados),
      previo: String(datos.anterior.totales.cerrados),
      variacion: variacionLegible(datos.variacion.cerrados)
    }
  ]);

  doc.titulo2('Tiempos de atencion');
  doc.camposClaveValor([
    { etiqueta: 'Demora promedio en tomar el ticket', valor: `${datos.tiempos.horas_hasta_atender} horas` },
    { etiqueta: 'Demora promedio hasta la resolucion', valor: `${datos.tiempos.horas_hasta_resolver} horas` },
    { etiqueta: 'Tickets criticos del mes', valor: String(datos.totales.criticos) },
    { etiqueta: 'Pendientes al cierre del periodo', valor: String(datos.totales.pendientes) }
  ], 2);

  doc.saltoPagina();
  doc.titulo1('Distribucion por categoria', 'engranaje');
  doc.tabla([
    { titulo: 'Categoria', campo: 'etiqueta', ancho: 0.5 },
    { titulo: 'Registrados', campo: 'creados', ancho: 0.25 },
    { titulo: 'Resueltos', campo: 'resueltos', ancho: 0.25 }
  ], datos.categorias.length ? datos.categorias : [{ etiqueta: 'Sin registros', creados: 0, resueltos: 0 }]);

  doc.titulo1('Distribucion por sucursal', 'red');
  doc.tabla([
    { titulo: 'Sucursal', campo: 'etiqueta', ancho: 0.5 },
    { titulo: 'Registrados', campo: 'creados', ancho: 0.25 },
    { titulo: 'Resueltos', campo: 'resueltos', ancho: 0.25 }
  ], datos.sucursales.length ? datos.sucursales : [{ etiqueta: 'Sin registros', creados: 0, resueltos: 0 }]);

  doc.titulo1('Distribucion por area solicitante', 'usuario');
  doc.tabla([
    { titulo: 'Area', campo: 'etiqueta', ancho: 0.5 },
    { titulo: 'Registrados', campo: 'creados', ancho: 0.25 },
    { titulo: 'Resueltos', campo: 'resueltos', ancho: 0.25 }
  ], datos.areas.length ? datos.areas : [{ etiqueta: 'Sin registros', creados: 0, resueltos: 0 }]);

  doc.titulo1('Resolucion por tecnico', 'usuario');
  doc.tabla([
    { titulo: 'Tecnico', campo: 'etiqueta', ancho: 0.5 },
    { titulo: 'Resueltos', campo: 'resueltos', ancho: 0.25 },
    { titulo: 'Horas promedio', campo: 'horas_promedio', ancho: 0.25 }
  ], datos.tecnicos.length ? datos.tecnicos : [{ etiqueta: 'Sin resoluciones en el periodo', resueltos: 0, horas_promedio: 0 }]);

  doc.nota('Los tickets atendidos son aquellos que pasaron a atencion durante el mes; los resueltos y '
    + 'cerrados se cuentan por la fecha en que ocurrio cada accion, de modo que un ticket puede haberse '
    + 'registrado en un mes y cerrado en el siguiente.', { icono: 'documento' });

  return doc;
};

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
      cargo: solicitud.revisado_por_nombre ? 'Tecnologias de la Informacion' : '-',
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
      cargo: solicitud.comprado_por_nombre ? 'Tecnologias de la Informacion' : '-',
      fecha: fecha(solicitud.fecha_compra) ?? 'Pendiente',
      observacion: solicitud.numero_orden ? 'Orden ' + solicitud.numero_orden : '-'
    },
    {
      instancia: 'Entrega al solicitante',
      responsable: solicitud.entregado_por_nombre ?? 'Pendiente',
      cargo: solicitud.entregado_por_nombre ? 'Tecnologias de la Informacion' : '-',
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
