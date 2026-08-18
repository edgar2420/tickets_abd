import { Router } from 'express';
import { autenticar } from '../../middleware/auth.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { listarNotificaciones, marcarLeida, marcarTodasLeidas } from '../../services/notificaciones.service.js';

export const notificacionesRouter = Router();
notificacionesRouter.use(autenticar);

notificacionesRouter.get('/', asyncHandler(async (req, res) => {
  const datos = await listarNotificaciones(req.usuario.id, req.query.no_leidas === 'true');
  res.json({ ok: true, datos });
}));

notificacionesRouter.put('/:id/leida', asyncHandler(async (req, res) => {
  const actualizada = await marcarLeida(req.usuario.id, Number(req.params.id));
  if (!actualizada) throw HttpError.notFound('La notificacion no existe o no le pertenece');
  res.json({ ok: true, mensaje: 'Notificacion marcada como leida' });
}));

notificacionesRouter.put('/leidas', asyncHandler(async (req, res) => {
  const total = await marcarTodasLeidas(req.usuario.id);
  res.json({ ok: true, mensaje: `${total} notificaciones marcadas como leidas` });
}));
