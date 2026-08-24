import { z } from 'zod';
import { query } from '../../config/db.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarUsuario, notificarEquipoTecnico } from '../../services/notificaciones.service.js';
import { emitir, salaTicket, salaUsuario, SALA_TECNICOS } from '../../realtime/socket.js';
import {
  construirActaTicket, construirReporteTickets, construirReporteMensual, codigoTicket
} from '../../services/pdf/documentos.service.js';
import {
  SELECT_TICKET, obtenerTicket, listarTickets, contarTickets, indicadores, distribuciones,
  bitacoraTicket, archivarActaTicket
} from './tickets.service.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { reporteMensual, mesValido, mesVigente } from './reporteMensual.service.js';
import {
  TIPOS, SERVICIOS, PRIORIDADES, ESTADOS, OBJETIVOS, PRIORIDAD_INICIAL,
  puedePasar, fechaObjetivo, codigoTicket as codigo
} from './modelo.js';

export const crearTicketSchema = z.object({
  titulo: z.string().trim().min(6).max(200),
  descripcion: z.string().trim().min(10).max(4000),
  tipo: z.enum(TIPOS).default('Incidente'),
  servicio: z.enum(SERVICIOS).default('Soporte informatico'),
  categoria: z.string().trim().min(2).max(50),
  ubicacion: z.string().trim().max(120).optional().nullable().or(z.literal('')),
  equipo_id: z.number().int().positive().optional().nullable(),
  observaciones: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  prioridad: z.enum(PRIORIDADES).optional()
});

export const prioridadSchema = z.object({
  prioridad: z.enum(PRIORIDADES),
  motivo: z.string().trim().max(300).optional().nullable().or(z.literal(''))
});

export const esperaSchema = z.object({
  motivo_espera: z.string().trim().min(10, 'Indique por que queda en espera').max(300)
});

const validarCategoria = async (nombre) => {
  const { rows } = await query('SELECT nombre FROM categorias WHERE nombre = $1 AND activo = TRUE', [nombre]);
  if (!rows[0]) throw HttpError.badRequest(`La categoria "${nombre}" no existe o no esta habilitada`);
  return rows[0].nombre;
};

export const resolverSchema = z.object({
  solucion_detalle: z.string().trim().min(10, 'Debe describir la solucion aplicada').max(4000),
  minutos_empleados: z.number().int().min(0).max(100000).optional().nullable(),
  observaciones: z.string().trim().max(1000).optional().nullable().or(z.literal(''))
});

export const asignarSchema = z.object({
  asignado_id: z.number().int().positive()
});

const difundirTicket = (ticket, evento) => {
  const salas = [SALA_TECNICOS, salaTicket(ticket.id), salaUsuario(ticket.solicitante_id)];
  if (ticket.asignado_id) salas.push(salaUsuario(ticket.asignado_id));
  emitir(salas, evento, ticket);
};

export const listar = asyncHandler(async (req, res) => {
  const { limite, pagina, desplazamiento } = paginacion(req.query);
  const filtros = { ...req.query, limite, desplazamiento };
  const [datos, total] = await Promise.all([
    listarTickets(filtros, req.usuario),
    contarTickets(req.query, req.usuario)
  ]);
  res.json(respuestaPaginada(datos, total, limite, pagina));
});

export const detalle = asyncHandler(async (req, res) => {
  const ticket = await obtenerTicket(req.params.id);
  if (!req.usuario.permisos.includes('tickets.ver_todos') && ticket.solicitante_id !== req.usuario.id) {
    throw HttpError.forbidden('Solo puede consultar los tickets que usted ha registrado');
  }
  const bitacora = await bitacoraTicket(ticket.id);
  res.json({ ok: true, datos: { ...ticket, bitacora } });
});

const vacioANulo = (valor) => (valor === '' || valor === undefined ? null : valor);

const validarEquipo = async (equipoId) => {
  if (!equipoId) return null;
  const { rows } = await query('SELECT id FROM equipos WHERE id = $1 AND activo = TRUE', [equipoId]);
  if (!rows[0]) throw HttpError.badRequest('El activo indicado no existe o esta dado de baja');
  return equipoId;
};

const exigirTransicion = (actual, destino) => {
  if (!puedePasar(actual, destino)) {
    throw HttpError.conflict(`Un ticket en "${actual}" no puede pasar a "${destino}"`);
  }
};

export const crear = asyncHandler(async (req, res) => {
  const c = req.body;
  const categoria = await validarCategoria(c.categoria);
  const equipoId = await validarEquipo(c.equipo_id);

  const defineLaPrioridad = req.usuario.permisos.includes('tickets.responder');
  const prioridad = defineLaPrioridad && c.prioridad ? c.prioridad : PRIORIDAD_INICIAL;
  const anio = new Date().getFullYear();

  const { rows } = await query(
    `INSERT INTO tickets
       (anio, numero, titulo, descripcion, tipo, servicio, categoria, ubicacion, equipo_id,
        observaciones, prioridad, estado, solicitante_id, sucursal_id,
        fecha_objetivo, prioridad_por_id, fecha_prioridad)
     SELECT $1,
            COALESCE(MAX(numero), 0) + 1,
            $2, $3, $4, $5, $6, $7, $8, $9, $10, 'Nuevo', $11, $12, $13, $14, CURRENT_TIMESTAMP
       FROM tickets WHERE anio = $1
     RETURNING id`,
    [
      anio, c.titulo, c.descripcion, c.tipo, c.servicio, categoria,
      vacioANulo(c.ubicacion), equipoId, vacioANulo(c.observaciones), prioridad,
      req.usuario.id, req.usuario.sucursal_id ?? null,
      fechaObjetivo(prioridad), defineLaPrioridad ? req.usuario.id : null
    ]
  );

  const ticket = await obtenerTicket(rows[0].id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: ticket.id, accion: 'CREAR',
    detalle: { numero: codigo(ticket), tipo: ticket.tipo, servicio: ticket.servicio, categoria, prioridad },
    ip: req.ip
  });
  await notificarEquipoTecnico({
    ticketId: ticket.id, tipo: 'TICKET_NUEVO',
    titulo: 'Nuevo ticket ' + codigo(ticket),
    mensaje: `${req.usuario.nombre} (${req.usuario.area}) registro: ${ticket.titulo}`,
    excluirUsuarioId: req.usuario.id
  });
  difundirTicket(ticket, 'ticket:creado');
  archivarActaTicket(ticket.id, 'APERTURA');

  res.status(201).json({ ok: true, datos: ticket });
});

export const definirPrioridad = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  if (['Resuelto', 'Cerrado'].includes(actual.estado)) {
    throw HttpError.conflict('Un ticket finalizado ya no cambia de prioridad');
  }

  const { prioridad } = req.body;
  await query(
    `UPDATE tickets
        SET prioridad = $1, prioridad_por_id = $2, fecha_prioridad = CURRENT_TIMESTAMP,
            fecha_objetivo = $3
      WHERE id = $4`,
    [prioridad, req.usuario.id, fechaObjetivo(prioridad, actual.fecha_creacion), id]
  );

  const ticket = await obtenerTicket(id);
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'DEFINIR_PRIORIDAD',
    detalle: { antes: actual.prioridad, ahora: prioridad, objetivo: OBJETIVOS[prioridad].texto,
               motivo: vacioANulo(req.body.motivo) },
    ip: req.ip
  });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_ACTUALIZADO',
    titulo: `Su ticket ${codigo(ticket)} quedo con prioridad ${prioridad}`,
    mensaje: `Objetivo de atencion: ${OBJETIVOS[prioridad].texto}.`
  });
  difundirTicket(ticket, 'ticket:actualizado');

  res.json({ ok: true, datos: ticket });
});

export const tomar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  exigirTransicion(actual.estado, 'Asignado');

  await query(
    `UPDATE tickets SET estado = 'Asignado', asignado_id = $1,
            fecha_asignacion = COALESCE(fecha_asignacion, CURRENT_TIMESTAMP) WHERE id = $2`,
    [req.usuario.id, id]
  );
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'TOMAR_ATENCION', ip: req.ip
  });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_ASIGNADO',
    titulo: 'Su ticket ' + codigo(ticket) + ' tiene responsable',
    mensaje: `${req.usuario.nombre} se hizo cargo de su requerimiento.`
  });
  difundirTicket(ticket, 'ticket:actualizado');
  archivarActaTicket(id, 'ASIGNACION');

  res.json({ ok: true, datos: ticket });
});

export const asignar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { asignado_id } = req.body;
  const actual = await obtenerTicket(id);
  if (['Resuelto', 'Cerrado'].includes(actual.estado)) {
    throw HttpError.conflict('No es posible reasignar un ticket ya finalizado');
  }
  const { rows: destino } = await query(
    'SELECT id, nombre FROM usuarios WHERE id = $1 AND activo = TRUE', [asignado_id]
  );
  if (!destino[0]) throw HttpError.badRequest('El responsable indicado no existe o esta desactivado');

  await query(
    `UPDATE tickets SET asignado_id = $1,
            estado = CASE WHEN estado = 'Nuevo' THEN 'Asignado' ELSE estado END,
            fecha_asignacion = COALESCE(fecha_asignacion, CURRENT_TIMESTAMP) WHERE id = $2`,
    [asignado_id, id]
  );
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'ASIGNAR',
    detalle: { asignado_id, asignado_nombre: destino[0].nombre }, ip: req.ip
  });
  await notificarUsuario({
    usuarioId: asignado_id, ticketId: id, tipo: 'TICKET_ASIGNADO',
    titulo: 'Se le asigno el ticket ' + codigo(ticket),
    mensaje: `${req.usuario.nombre} le asigno el requerimiento: ${ticket.titulo}`
  });
  difundirTicket(ticket, 'ticket:actualizado');
  archivarActaTicket(id, 'ASIGNACION');

  res.json({ ok: true, datos: ticket });
});

export const iniciar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  exigirTransicion(actual.estado, 'En Proceso');

  await query(
    `UPDATE tickets SET estado = 'En Proceso',
            asignado_id = COALESCE(asignado_id, $1),
            fecha_asignacion = COALESCE(fecha_asignacion, CURRENT_TIMESTAMP),
            fecha_inicio = COALESCE(fecha_inicio, CURRENT_TIMESTAMP),
            fecha_espera = NULL, motivo_espera = NULL
      WHERE id = $2`,
    [req.usuario.id, id]
  );
  const ticket = await obtenerTicket(id);

  const reanuda = actual.estado === 'En Espera';
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id,
    accion: reanuda ? 'REANUDAR' : 'INICIAR_TRABAJO', ip: req.ip
  });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_EN_PROCESO',
    titulo: 'Su ticket ' + codigo(ticket) + ' esta en proceso',
    mensaje: reanuda
      ? 'Se reanudo el trabajo sobre su requerimiento.'
      : `${req.usuario.nombre} comenzo a trabajar en su requerimiento.`
  });
  difundirTicket(ticket, 'ticket:actualizado');

  res.json({ ok: true, datos: ticket });
});

export const poner_en_espera = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  exigirTransicion(actual.estado, 'En Espera');

  await query(
    `UPDATE tickets SET estado = 'En Espera', fecha_espera = CURRENT_TIMESTAMP, motivo_espera = $1
      WHERE id = $2`,
    [req.body.motivo_espera, id]
  );
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'PONER_EN_ESPERA',
    detalle: { motivo: req.body.motivo_espera }, ip: req.ip
  });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_ACTUALIZADO',
    titulo: 'Su ticket ' + codigo(ticket) + ' quedo en espera',
    mensaje: req.body.motivo_espera
  });
  difundirTicket(ticket, 'ticket:actualizado');

  res.json({ ok: true, datos: ticket });
});

export const resolver = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  exigirTransicion(actual.estado, 'Resuelto');

  await query(
    `UPDATE tickets SET estado = 'Resuelto',
            solucion_detalle  = $1,
            minutos_empleados = COALESCE($2, minutos_empleados),
            observaciones     = COALESCE($3, observaciones),
            resuelto_por_id   = $4,
            asignado_id       = COALESCE(asignado_id, $4),
            fecha_asignacion  = COALESCE(fecha_asignacion, CURRENT_TIMESTAMP),
            fecha_inicio      = COALESCE(fecha_inicio, CURRENT_TIMESTAMP),
            fecha_resolucion  = CURRENT_TIMESTAMP,
            fecha_espera = NULL, motivo_espera = NULL
      WHERE id = $5`,
    [
      req.body.solucion_detalle,
      req.body.minutos_empleados ?? null,
      vacioANulo(req.body.observaciones),
      req.usuario.id,
      id
    ]
  );
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'RESOLVER',
    detalle: {
      solucion: req.body.solucion_detalle.slice(0, 300),
      minutos: ticket.minutos_empleados
    },
    ip: req.ip
  });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_RESUELTO',
    titulo: 'Su ticket ' + codigo(ticket) + ' fue resuelto',
    mensaje: `${req.usuario.nombre} registro la solucion del requerimiento.`
  });
  difundirTicket(ticket, 'ticket:resuelto');
  archivarActaTicket(id, 'RESOLUCION');

  res.json({ ok: true, datos: ticket });
});

export const cerrar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  const esSolicitante = actual.solicitante_id === req.usuario.id;
  const esMesaDeAyuda = req.usuario.permisos.includes('tickets.resolver');
  if (!esSolicitante && !esMesaDeAyuda) {
    throw HttpError.forbidden('Solo el solicitante o la mesa de ayuda pueden cerrar el ticket');
  }
  exigirTransicion(actual.estado, 'Cerrado');

  await query(`UPDATE tickets SET estado = 'Cerrado', fecha_cierre = CURRENT_TIMESTAMP WHERE id = $1`, [id]);
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'CERRAR', ip: req.ip
  });
  difundirTicket(ticket, 'ticket:actualizado');
  archivarActaTicket(id, 'CIERRE');

  res.json({ ok: true, datos: ticket });
});

export const catalogo = asyncHandler(async (_req, res) => {
  res.json({
    ok: true,
    datos: {
      tipos: TIPOS,
      servicios: SERVICIOS,
      estados: ESTADOS,
      prioridades: PRIORIDADES,
      objetivos: OBJETIVOS
    }
  });
});

export const tablero = asyncHandler(async (req, res) => {
  const resumen = await indicadores(req.query, req.usuario);
  const graficos = req.usuario.permisos.includes('tickets.ver_todos') ? await distribuciones() : null;
  res.json({ ok: true, datos: { resumen, graficos } });
});

const filtrosDelReporte = (consulta) => ({
  sucursal_id: consulta.sucursal_id || null,
  categoria: consulta.categoria || null,
  prioridad: consulta.prioridad || null
});

export const mensual = asyncHandler(async (req, res) => {
  const mes = mesValido(req.query.mes) ? req.query.mes : mesVigente();
  const datos = await reporteMensual(mes, filtrosDelReporte(req.query));
  res.json({ ok: true, datos });
});

export const mensualPdf = asyncHandler(async (req, res) => {
  const mes = mesValido(req.query.mes) ? req.query.mes : mesVigente();
  const datos = await reporteMensual(mes, filtrosDelReporte(req.query));
  const documento = construirReporteMensual(datos);
  const buffer = await documento.aBuffer();

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_MENSUAL_PDF',
    detalle: { mes }, ip: req.ip
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="reporte-mensual-${mes}.pdf"`);
  res.send(buffer);
});

export const actaPdf = asyncHandler(async (req, res) => {
  const ticket = await obtenerTicket(req.params.id);
  if (!req.usuario.permisos.includes('tickets.ver_todos') && ticket.solicitante_id !== req.usuario.id) {
    throw HttpError.forbidden('Solo puede descargar actas de sus propios tickets');
  }
  const bitacora = await bitacoraTicket(ticket.id);
  const documento = construirActaTicket(ticket, bitacora, { accion: 'FICHA' });
  const buffer = await documento.aBuffer();

  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: ticket.id, accion: 'DESCARGAR_ACTA_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="acta-${codigo(ticket)}.pdf"`);
  res.send(buffer);
});

export const reportePdf = asyncHandler(async (req, res) => {
  const filas = await listarTickets({ ...req.query, limite: 2000, desplazamiento: 0 }, req.usuario);
  const resumen = await indicadores(req.query, req.usuario);
  const documento = construirReporteTickets({ filas, indicadores: resumen, filtros: req.query });
  const buffer = await documento.aBuffer();

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_TICKETS_PDF',
    detalle: { filtros: req.query, registros: filas.length }, ip: req.ip
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="reporte-tickets.pdf"');
  res.send(buffer);
});

export { SELECT_TICKET };
