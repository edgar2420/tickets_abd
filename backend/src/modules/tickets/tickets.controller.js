import { z } from 'zod';
import { query } from '../../config/db.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarUsuario, notificarEquipoTecnico } from '../../services/notificaciones.service.js';
import { emitir, salaTicket, salaUsuario, SALA_TECNICOS } from '../../realtime/socket.js';
import { construirActaTicket, construirReporteTickets, codigoTicket } from '../../services/pdf/documentos.service.js';
import {
  SELECT_TICKET, obtenerTicket, listarTickets, indicadores, distribuciones,
  bitacoraTicket, archivarActaTicket
} from './tickets.service.js';

const CATEGORIAS = ['Hardware', 'Software', 'Redes', 'Accesos'];
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Critica'];

export const crearTicketSchema = z.object({
  titulo: z.string().min(6).max(200),
  descripcion: z.string().min(10),
  categoria: z.enum(CATEGORIAS),
  prioridad: z.enum(PRIORIDADES).default('Media')
});

export const resolverSchema = z.object({
  solucion_detalle: z.string().min(10, 'Debe describir la solucion aplicada')
});

export const asignarSchema = z.object({
  asignado_id: z.number().int().positive()
});

/** Difunde el cambio de un ticket a las salas involucradas. */
const difundirTicket = (ticket, evento) => {
  const salas = [SALA_TECNICOS, salaTicket(ticket.id), salaUsuario(ticket.solicitante_id)];
  if (ticket.asignado_id) salas.push(salaUsuario(ticket.asignado_id));
  emitir(salas, evento, ticket);
};

export const listar = asyncHandler(async (req, res) => {
  const datos = await listarTickets(req.query, req.usuario);
  res.json({ ok: true, datos });
});

export const detalle = asyncHandler(async (req, res) => {
  const ticket = await obtenerTicket(req.params.id);
  if (!req.usuario.permisos.includes('tickets.ver_todos') && ticket.solicitante_id !== req.usuario.id) {
    throw HttpError.forbidden('Solo puede consultar los tickets que usted ha registrado');
  }
  const bitacora = await bitacoraTicket(ticket.id);
  res.json({ ok: true, datos: { ...ticket, bitacora } });
});

/** ESTADO ABIERTO: el solicitante se toma del JWT, sin confiar en el cliente. */
export const crear = asyncHandler(async (req, res) => {
  const { titulo, descripcion, categoria, prioridad } = req.body;
  const { rows } = await query(
    `INSERT INTO tickets (titulo, descripcion, categoria, prioridad, estado, solicitante_id)
     VALUES ($1, $2, $3, $4, 'Abierto', $5) RETURNING id`,
    [titulo, descripcion, categoria, prioridad, req.usuario.id]
  );
  const ticket = await obtenerTicket(rows[0].id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: ticket.id, accion: 'CREAR',
    detalle: { titulo, categoria, prioridad }, ip: req.ip
  });
  await notificarEquipoTecnico({
    ticketId: ticket.id, tipo: 'TICKET_NUEVO',
    titulo: 'Nuevo ticket ' + codigoTicket(ticket.id),
    mensaje: `${req.usuario.nombre} (${req.usuario.area}) registro: ${titulo}`,
    excluirUsuarioId: req.usuario.id
  });
  difundirTicket(ticket, 'ticket:creado');
  archivarActaTicket(ticket.id, 'APERTURA');

  res.status(201).json({ ok: true, datos: ticket });
});

/** ESTADO EN PROCESO: el tecnico se autoasigna la atencion del ticket. */
export const tomar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  if (actual.estado !== 'Abierto') {
    throw HttpError.conflict(`El ticket no puede tomarse porque su estado es "${actual.estado}"`);
  }
  await query(
    `UPDATE tickets SET estado = 'En Proceso', asignado_id = $1, fecha_asignacion = CURRENT_TIMESTAMP WHERE id = $2`,
    [req.usuario.id, id]
  );
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'TOMAR_ATENCION', ip: req.ip });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_EN_PROCESO',
    titulo: 'Su ticket ' + codigoTicket(id) + ' esta en atencion',
    mensaje: `${req.usuario.nombre} tomo la atencion de su requerimiento.`
  });
  difundirTicket(ticket, 'ticket:actualizado');
  archivarActaTicket(id, 'ATENCION');

  res.json({ ok: true, datos: ticket });
});

/** Asignacion manual a otro tecnico (mesa de ayuda o supervisor). */
export const asignar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { asignado_id } = req.body;
  const actual = await obtenerTicket(id);
  if (['Resuelto', 'Cerrado'].includes(actual.estado)) {
    throw HttpError.conflict('No es posible reasignar un ticket ya finalizado');
  }
  const { rows: destino } = await query('SELECT id, nombre FROM usuarios WHERE id = $1 AND activo = TRUE', [asignado_id]);
  if (!destino[0]) throw HttpError.badRequest('El tecnico destino no existe o esta desactivado');

  await query(
    `UPDATE tickets SET asignado_id = $1, estado = 'En Proceso',
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
    titulo: 'Se le asigno el ticket ' + codigoTicket(id),
    mensaje: `${req.usuario.nombre} le asigno el requerimiento: ${ticket.titulo}`
  });
  difundirTicket(ticket, 'ticket:actualizado');
  archivarActaTicket(id, 'ASIGNACION');

  res.json({ ok: true, datos: ticket });
});

/** ESTADO RESUELTO: se registra la solucion tecnica y su responsable. */
export const resolver = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  if (!['Abierto', 'En Proceso'].includes(actual.estado)) {
    throw HttpError.conflict(`El ticket ya se encuentra en estado "${actual.estado}"`);
  }
  await query(
    `UPDATE tickets SET estado = 'Resuelto',
            solucion_detalle = $1,
            resuelto_por_id  = $2,
            asignado_id      = COALESCE(asignado_id, $2),
            fecha_asignacion = COALESCE(fecha_asignacion, CURRENT_TIMESTAMP),
            fecha_resolucion = CURRENT_TIMESTAMP
      WHERE id = $3`,
    [req.body.solucion_detalle, req.usuario.id, id]
  );
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'RESOLVER',
    detalle: { solucion: req.body.solucion_detalle.slice(0, 300) }, ip: req.ip
  });
  await notificarUsuario({
    usuarioId: ticket.solicitante_id, ticketId: id, tipo: 'TICKET_RESUELTO',
    titulo: 'Su ticket ' + codigoTicket(id) + ' fue resuelto',
    mensaje: `${req.usuario.nombre} registro la solucion tecnica del requerimiento.`
  });
  difundirTicket(ticket, 'ticket:resuelto');
  archivarActaTicket(id, 'RESOLUCION');

  res.json({ ok: true, datos: ticket });
});

/** Cierre conforme por parte del solicitante o de la mesa de ayuda. */
export const cerrar = asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const actual = await obtenerTicket(id);
  const esSolicitante = actual.solicitante_id === req.usuario.id;
  const esMesaDeAyuda = req.usuario.permisos.includes('tickets.resolver');
  if (!esSolicitante && !esMesaDeAyuda) throw HttpError.forbidden('Solo el solicitante o la mesa de ayuda pueden cerrar el ticket');
  if (actual.estado !== 'Resuelto') throw HttpError.conflict('Solo puede cerrarse un ticket previamente resuelto');

  await query(`UPDATE tickets SET estado = 'Cerrado' WHERE id = $1`, [id]);
  const ticket = await obtenerTicket(id);

  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: id, accion: 'CERRAR', ip: req.ip });
  difundirTicket(ticket, 'ticket:actualizado');
  archivarActaTicket(id, 'CIERRE');

  res.json({ ok: true, datos: ticket });
});

export const tablero = asyncHandler(async (req, res) => {
  const resumen = await indicadores(req.query, req.usuario);
  const graficos = req.usuario.permisos.includes('tickets.ver_todos') ? await distribuciones() : null;
  res.json({ ok: true, datos: { resumen, graficos } });
});

/** Descarga del acta PDF individual del ticket. */
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
  res.setHeader('Content-Disposition', `inline; filename="acta-${codigoTicket(ticket.id)}.pdf"`);
  res.send(buffer);
});

/** Reporte consolidado en PDF con los filtros vigentes del listado. */
export const reportePdf = asyncHandler(async (req, res) => {
  const filas = await listarTickets({ ...req.query, limite: 2000 }, req.usuario);
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
