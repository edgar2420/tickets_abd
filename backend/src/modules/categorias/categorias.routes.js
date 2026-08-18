import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';

const COLORES = ['celeste', 'violeta', 'esmeralda', 'ambar', 'rosa', 'pizarra'];
const ICONOS = ['monitor', 'codigo', 'red', 'llave', 'etiqueta', 'herramienta', 'servidor', 'telefono'];

const categoriaSchema = z.object({
  nombre: z.string().min(3).max(50),
  descripcion: z.string().max(255).optional().nullable(),
  color: z.enum(COLORES).default('pizarra'),
  icono: z.enum(ICONOS).default('etiqueta'),
  activo: z.boolean().optional()
});

export const categoriasRouter = Router();
categoriasRouter.use(autenticar);

/** Catalogo disponible para cualquier usuario autenticado: alimenta los formularios. */
categoriasRouter.get('/', asyncHandler(async (req, res) => {
  const soloActivas = req.query.activas === 'true';
  const { rows } = await query(
    `SELECT c.id, c.nombre, c.descripcion, c.color, c.icono, c.activo, c.fecha_creacion,
            (SELECT COUNT(*) FROM tickets t WHERE t.categoria = c.nombre)::int AS total_tickets
       FROM categorias c
      WHERE ($1 = FALSE OR c.activo = TRUE)
      ORDER BY c.nombre`,
    [soloActivas]
  );
  res.json({ ok: true, datos: rows });
}));

categoriasRouter.get('/opciones', asyncHandler(async (_req, res) => {
  res.json({ ok: true, datos: { colores: COLORES, iconos: ICONOS } });
}));

categoriasRouter.post('/', requierePermiso('admin.categorias'), validate(categoriaSchema), asyncHandler(async (req, res) => {
  const { nombre, descripcion, color, icono } = req.body;
  const { rows } = await query(
    `INSERT INTO categorias (nombre, descripcion, color, icono) VALUES ($1,$2,$3,$4) RETURNING *`,
    [nombre, descripcion ?? null, color, icono]
  );
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'CATEGORIA', entidadId: rows[0].id, accion: 'CREAR', detalle: rows[0], ip: req.ip });
  res.status(201).json({ ok: true, datos: rows[0] });
}));

/** Al renombrar se propaga el cambio a los tickets ya registrados. */
categoriasRouter.put('/:id', requierePermiso('admin.categorias'), validate(categoriaSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, descripcion, color, icono, activo } = req.body;
  const { rows: previa } = await query('SELECT nombre FROM categorias WHERE id = $1', [id]);
  if (!previa[0]) throw HttpError.notFound('La categoria indicada no existe');

  const { rows } = await query(
    `UPDATE categorias SET nombre = $1, descripcion = $2, color = $3, icono = $4,
            activo = COALESCE($5::boolean, activo)
      WHERE id = $6 RETURNING *`,
    [nombre, descripcion ?? null, color, icono, activo ?? null, id]
  );
  if (previa[0].nombre !== nombre) {
    await query('UPDATE tickets SET categoria = $1 WHERE categoria = $2', [nombre, previa[0].nombre]);
  }
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'CATEGORIA', entidadId: id, accion: 'ACTUALIZAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, datos: rows[0] });
}));

/** Baja logica: se conserva el historial de tickets ya clasificados. */
categoriasRouter.delete('/:id', requierePermiso('admin.categorias'), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE categorias SET activo = FALSE WHERE id = $1 RETURNING id, nombre', [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('La categoria indicada no existe');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'CATEGORIA', entidadId: rows[0].id, accion: 'DESACTIVAR', ip: req.ip });
  res.json({ ok: true, mensaje: 'Categoria desactivada' });
}));

/** Reactivacion desde el panel. */
categoriasRouter.put('/:id/activar', requierePermiso('admin.categorias'), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE categorias SET activo = TRUE WHERE id = $1 RETURNING *', [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('La categoria indicada no existe');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'CATEGORIA', entidadId: rows[0].id, accion: 'ACTIVAR', ip: req.ip });
  res.json({ ok: true, datos: rows[0] });
}));
