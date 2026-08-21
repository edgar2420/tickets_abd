import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { invalidarCachePermisos } from '../../services/permisos.cache.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';

const rolSchema = z.object({
  nombre: z.string().min(3).max(50),
  descripcion: z.string().max(500).optional().nullable(),
  activo: z.boolean().optional(),
  permisos: z.array(z.number().int().positive()).default([])
});

export const rolesRouter = Router();
rolesRouter.use(autenticar);

const consultaRoles = `
  SELECT r.id, r.nombre, r.descripcion, r.activo,
         COALESCE(json_agg(json_build_object('id', p.id, 'codigo', p.codigo, 'modulo', p.modulo))
                  FILTER (WHERE p.id IS NOT NULL), '[]') AS permisos,
         (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) AS total_usuarios
    FROM roles r
    LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
    LEFT JOIN permisos p      ON p.id = rp.permiso_id`;

rolesRouter.get('/', requierePermiso('admin.roles', 'admin.usuarios'), asyncHandler(async (_req, res) => {
  const { rows } = await query(`${consultaRoles} GROUP BY r.id ORDER BY r.nombre`);
  res.json({ ok: true, datos: rows });
}));

rolesRouter.get('/:id', requierePermiso('admin.roles'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${consultaRoles} WHERE r.id = $1 GROUP BY r.id`, [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('El rol indicado no existe');
  res.json({ ok: true, datos: rows[0] });
}));

rolesRouter.post('/', requierePermiso('admin.roles'), validate(rolSchema), asyncHandler(async (req, res) => {
  const { nombre, descripcion, permisos } = req.body;
  const rol = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'INSERT INTO roles (nombre, descripcion) VALUES ($1, $2) RETURNING *',
      [nombre, descripcion ?? null]
    );
    const creado = rows[0];
    for (const permisoId of permisos) {
      await client.query('INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2)', [creado.id, permisoId]);
    }
    return creado;
  });
  invalidarCachePermisos(rol.id);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'ROL', entidadId: rol.id, accion: 'CREAR', detalle: { ...rol, permisos }, ip: req.ip });
  res.status(201).json({ ok: true, datos: rol });
}));

rolesRouter.put('/:id', requierePermiso('admin.roles'), validate(rolSchema), asyncHandler(async (req, res) => {
  const rolId = Number(req.params.id);
  const { nombre, descripcion, activo, permisos } = req.body;
  const rol = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'UPDATE roles SET nombre = $1, descripcion = $2, activo = COALESCE($3::boolean, activo) WHERE id = $4 RETURNING *',
      [nombre, descripcion ?? null, activo ?? null, rolId]
    );
    if (!rows[0]) throw HttpError.notFound('El rol indicado no existe');
    await client.query('DELETE FROM rol_permisos WHERE rol_id = $1', [rolId]);
    for (const permisoId of permisos) {
      await client.query('INSERT INTO rol_permisos (rol_id, permiso_id) VALUES ($1, $2)', [rolId, permisoId]);
    }
    return rows[0];
  });
  invalidarCachePermisos(rolId);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'ROL', entidadId: rolId, accion: 'ACTUALIZAR_PERMISOS', detalle: { ...rol, permisos }, ip: req.ip });
  res.json({ ok: true, datos: rol });
}));

rolesRouter.delete('/:id', requierePermiso('admin.roles'), asyncHandler(async (req, res) => {
  const rolId = Number(req.params.id);
  const { rows: uso } = await query('SELECT COUNT(*)::int AS total FROM usuarios WHERE rol_id = $1', [rolId]);
  if (uso[0].total > 0) throw HttpError.conflict('No se puede eliminar: existen usuarios asignados a este rol. Desactivelo en su lugar.');
  const { rows } = await query('DELETE FROM roles WHERE id = $1 RETURNING *', [rolId]);
  if (!rows[0]) throw HttpError.notFound('El rol indicado no existe');
  invalidarCachePermisos(rolId);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'ROL', entidadId: rolId, accion: 'ELIMINAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, mensaje: 'Rol eliminado' });
}));
