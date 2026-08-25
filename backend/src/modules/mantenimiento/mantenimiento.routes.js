import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarEquipoTecnico } from '../../services/notificaciones.service.js';
import { emitir, SALA_TECNICOS } from '../../realtime/socket.js';
import {
  codigoTicket, fechaObjetivo, PRIORIDAD_INICIAL, SERVICIO_MANTENIMIENTO
} from '../tickets/modelo.js';
import { obtenerTicket } from '../tickets/tickets.service.js';
import { FRECUENCIAS } from './modelo.js';
import * as servicio from './mantenimiento.service.js';

export const mantenimientoRouter = Router();
mantenimientoRouter.use(autenticar);

const planSchema = z.object({
  frecuencia_mantenimiento: z.enum(FRECUENCIAS).nullable(),
  ultimo_mantenimiento: z.string().date().optional().nullable()
});

const registroSchema = z.object({
  fecha: z.string().date().optional(),
  observaciones: z.string().trim().max(1000).optional().nullable(),
  ticket_id: z.number().int().positive().optional().nullable()
});

const buscarEquipo = async (id) => {
  const { rows } = await query('SELECT id, codigo, nombre_equipo, ubicacion, sucursal_id FROM equipos WHERE id = $1', [id]);
  if (rows.length === 0) throw HttpError.badRequest('El equipo indicado no existe.');
  return rows[0];
};

mantenimientoRouter.get('/', requierePermiso('mantenimiento.ver'),
  asyncHandler(async (req, res) => {
    const datos = await servicio.listarPlan(req.query);
    res.json({ ok: true, datos });
  }));

mantenimientoRouter.get('/resumen', requierePermiso('mantenimiento.ver'),
  asyncHandler(async (_req, res) => {
    res.json({ ok: true, datos: await servicio.resumenPlan() });
  }));

mantenimientoRouter.get('/:id/historial', requierePermiso('mantenimiento.ver'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const equipo = await servicio.obtenerEquipoDelPlan(id);
    const historial = await servicio.historialDeEquipo(id);
    res.json({ ok: true, datos: { equipo, historial } });
  }));

mantenimientoRouter.put('/:id/plan', requierePermiso('mantenimiento.gestionar'), validate(planSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const equipo = await buscarEquipo(id);
    const { frecuencia_mantenimiento, ultimo_mantenimiento } = req.body;

    await query(
      `UPDATE equipos
          SET frecuencia_mantenimiento = $1,
              ultimo_mantenimiento = COALESCE($2::date, ultimo_mantenimiento)
        WHERE id = $3`,
      [frecuencia_mantenimiento, ultimo_mantenimiento ?? null, id]
    );

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'MANTENIMIENTO', entidadId: id, accion: 'DEFINIR_PLAN',
      detalle: { equipo: equipo.codigo, frecuencia: frecuencia_mantenimiento }, ip: req.ip
    });

    res.json({ ok: true, datos: await servicio.obtenerEquipoDelPlan(id) });
  }));

mantenimientoRouter.post('/:id/registrar', requierePermiso('mantenimiento.gestionar'), validate(registroSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const equipo = await buscarEquipo(id);
    const { fecha, observaciones, ticket_id } = req.body;

    const { rows } = await query(
      `INSERT INTO mantenimientos (equipo_id, fecha, realizado_por_id, ticket_id, observaciones)
       VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5)
       RETURNING id, fecha`,
      [id, fecha ?? null, req.usuario.id, ticket_id ?? null, observaciones ?? null]
    );

    await query(
      `UPDATE equipos SET ultimo_mantenimiento = GREATEST(COALESCE(ultimo_mantenimiento, $1::date), $1::date)
        WHERE id = $2`,
      [rows[0].fecha, id]
    );

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'MANTENIMIENTO', entidadId: id, accion: 'REGISTRAR',
      detalle: { equipo: equipo.codigo, fecha: rows[0].fecha }, ip: req.ip
    });

    res.status(201).json({ ok: true, datos: await servicio.obtenerEquipoDelPlan(id) });
  }));

mantenimientoRouter.post('/:id/ticket', requierePermiso('mantenimiento.gestionar'),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const equipo = await buscarEquipo(id);
    const anio = new Date().getFullYear();

    const { rows } = await query(
      `INSERT INTO tickets
         (anio, numero, titulo, descripcion, servicio, categoria, ubicacion, equipo_id,
          prioridad, estado, solicitante_id, sucursal_id, fecha_objetivo)
       SELECT $1, COALESCE(MAX(numero), 0) + 1, $2, $3, $11, $4, $5, $6,
              $7, 'Nuevo', $8, $9, $10
         FROM tickets WHERE anio = $1
       RETURNING id`,
      [
        anio,
        `Mantenimiento preventivo de ${equipo.codigo}`,
        `Mantenimiento preventivo programado para ${equipo.nombre_equipo} (${equipo.codigo}).`,
        'PC', equipo.ubicacion ?? null, id,
        PRIORIDAD_INICIAL, req.usuario.id, equipo.sucursal_id ?? null,
        fechaObjetivo(PRIORIDAD_INICIAL), SERVICIO_MANTENIMIENTO
      ]
    );

    const ticket = await obtenerTicket(rows[0].id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'MANTENIMIENTO', entidadId: id, accion: 'GENERAR_TICKET',
      detalle: { equipo: equipo.codigo, ticket: codigoTicket(ticket) }, ip: req.ip
    });
    await notificarEquipoTecnico({
      ticketId: ticket.id, tipo: 'TICKET_NUEVO',
      titulo: 'Mantenimiento preventivo ' + codigoTicket(ticket),
      mensaje: `Toca el mantenimiento de ${equipo.codigo}.`,
      excluirUsuarioId: req.usuario.id
    });
    emitir([SALA_TECNICOS], 'ticket:actualizado', ticket);

    res.status(201).json({ ok: true, datos: ticket });
  }));
