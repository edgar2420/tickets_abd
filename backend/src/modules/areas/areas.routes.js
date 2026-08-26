import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { enCache, invalidar } from '../../services/cache.memoria.js';
import { cachearEnCliente } from '../../middleware/cache.js';

const areaSchema = z.object({
  nombre: z.string().min(3).max(100),
  codigo: z.string().trim().toUpperCase().regex(/^[A-Z0-9]{2,10}$/, 'De dos a diez letras o numeros, sin espacios'),
  activo: z.boolean().optional()
});

const codigoLibre = async (codigo, excluirId = null) => {
  const { rows } = await query(
    'SELECT id FROM areas WHERE codigo = $1 AND ($2::int IS NULL OR id <> $2)',
    [codigo, excluirId]
  );
  if (rows.length) throw HttpError.badRequest(`El codigo ${codigo} ya lo usa otra area`);
};

export const areasRouter = Router();
areasRouter.use(autenticar);

areasRouter.get('/', cachearEnCliente(120), asyncHandler(async (req, res) => {
  const soloActivas = req.query.activas === 'true';
  const rows = await enCache(`areas:${soloActivas}`, 120_000, async () => (await query(
    `SELECT a.id, a.nombre, a.codigo, a.activo, a.fecha_creacion,
            (SELECT COUNT(*) FROM usuarios u WHERE u.area_id = a.id) AS total_usuarios
       FROM areas a
      WHERE ($1 = FALSE OR a.activo = TRUE)
      ORDER BY a.nombre`,
    [soloActivas]
  )).rows);
  res.json({ ok: true, datos: rows });
}));

areasRouter.post('/', requierePermiso('admin.areas'), validate(areaSchema), asyncHandler(async (req, res) => {
  await codigoLibre(req.body.codigo);
  const { rows } = await query(
    'INSERT INTO areas (nombre, codigo) VALUES ($1, $2) RETURNING *',
    [req.body.nombre, req.body.codigo]
  );
  invalidar('areas');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'AREA', entidadId: rows[0].id, accion: 'CREAR', detalle: rows[0], ip: req.ip });
  res.status(201).json({ ok: true, datos: rows[0] });
}));

areasRouter.put('/:id', requierePermiso('admin.areas'), validate(areaSchema), asyncHandler(async (req, res) => {
  await codigoLibre(req.body.codigo, Number(req.params.id));
  const { rows } = await query(
    `UPDATE areas SET nombre = $1, codigo = $2, activo = COALESCE($3::boolean, activo)
      WHERE id = $4 RETURNING *`,
    [req.body.nombre, req.body.codigo, req.body.activo ?? null, req.params.id]
  );
  if (!rows[0]) throw HttpError.notFound('El area indicada no existe');
  invalidar('areas');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'AREA', entidadId: rows[0].id, accion: 'ACTUALIZAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, datos: rows[0] });
}));

areasRouter.delete('/:id', requierePermiso('admin.areas'), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE areas SET activo = FALSE WHERE id = $1 RETURNING *', [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('El area indicada no existe');
  invalidar('areas');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'AREA', entidadId: rows[0].id, accion: 'DESACTIVAR', ip: req.ip });
  res.json({ ok: true, datos: rows[0] });
}));
