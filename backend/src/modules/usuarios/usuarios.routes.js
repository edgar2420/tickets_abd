import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';

const crearUsuarioSchema = z.object({
  nombre: z.string().min(4).max(150),
  usuario: z.string().min(3).max(80).regex(/^[a-zA-Z0-9._-]+$/, 'Solo letras, numeros, punto, guion y guion bajo'),
  email: z.string().email().max(150).optional().nullable(),
  password: z.string().min(8, 'La contrasena debe tener al menos 8 caracteres'),
  area_id: z.number().int().positive(),
  rol_id: z.number().int().positive()
});

const editarUsuarioSchema = crearUsuarioSchema.partial({ password: true }).extend({
  activo: z.boolean().optional()
});

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.usuario, u.email, u.activo, u.fecha_creacion,
         u.area_id, a.nombre AS area, u.rol_id, r.nombre AS rol
    FROM usuarios u
    JOIN areas a ON a.id = u.area_id
    JOIN roles r ON r.id = u.rol_id`;

export const usuariosRouter = Router();
usuariosRouter.use(autenticar);

usuariosRouter.get('/', requierePermiso('admin.usuarios'), asyncHandler(async (req, res) => {
  const { busqueda = null, area_id = null, rol_id = null, activo = null } = req.query;
  const { rows } = await query(
    `${SELECT_USUARIO}
      WHERE ($1::text IS NULL OR u.nombre ILIKE '%' || $1 || '%' OR u.usuario ILIKE '%' || $1 || '%')
        AND ($2::int  IS NULL OR u.area_id = $2)
        AND ($3::int  IS NULL OR u.rol_id = $3)
        AND ($4::bool IS NULL OR u.activo = $4)
      ORDER BY u.nombre`,
    [busqueda, area_id, rol_id, activo === null ? null : activo === 'true']
  );
  res.json({ ok: true, datos: rows });
}));

/** Tecnicos disponibles para asignacion manual de tickets. */
usuariosRouter.get('/tecnicos', requierePermiso('tickets.ver_todos'), asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT DISTINCT u.id, u.nombre, r.nombre AS rol
       FROM usuarios u
       JOIN roles r          ON r.id = u.rol_id
       JOIN rol_permisos rp  ON rp.rol_id = u.rol_id
       JOIN permisos p       ON p.id = rp.permiso_id
      WHERE p.codigo = 'tickets.responder' AND u.activo = TRUE
      ORDER BY u.nombre`
  );
  res.json({ ok: true, datos: rows });
}));

usuariosRouter.post('/', requierePermiso('admin.usuarios'), validate(crearUsuarioSchema), asyncHandler(async (req, res) => {
  const { nombre, usuario, email, password, area_id, rol_id } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, rol_id)
     VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
    [nombre, usuario, email ?? null, hash, area_id, rol_id]
  );
  const { rows: creado } = await query(`${SELECT_USUARIO} WHERE u.id = $1`, [rows[0].id]);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: rows[0].id, accion: 'CREAR', detalle: creado[0], ip: req.ip });
  res.status(201).json({ ok: true, datos: creado[0] });
}));

usuariosRouter.put('/:id', requierePermiso('admin.usuarios'), validate(editarUsuarioSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, usuario, email, area_id, rol_id, activo, password } = req.body;
  const hash = password ? await bcrypt.hash(password, 10) : null;
  const { rowCount } = await query(
    `UPDATE usuarios SET
        nombre        = COALESCE($1::varchar, nombre),
        usuario       = COALESCE($2::varchar, usuario),
        email         = COALESCE($3::varchar, email),
        area_id       = COALESCE($4::int, area_id),
        rol_id        = COALESCE($5::int, rol_id),
        activo        = COALESCE($6::boolean, activo),
        password_hash = COALESCE($7::varchar, password_hash)
      WHERE id = $8`,
    [nombre ?? null, usuario ?? null, email ?? null, area_id ?? null, rol_id ?? null, activo ?? null, hash, id]
  );
  if (!rowCount) throw HttpError.notFound('El usuario indicado no existe');
  const { rows } = await query(`${SELECT_USUARIO} WHERE u.id = $1`, [id]);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: id, accion: 'ACTUALIZAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, datos: rows[0] });
}));

/** Baja logica del usuario: nunca se elimina para preservar la trazabilidad de tickets. */
usuariosRouter.delete('/:id', requierePermiso('admin.usuarios'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.usuario.id) throw HttpError.badRequest('No puede desactivar su propio usuario');
  const { rows } = await query('UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id, nombre', [id]);
  if (!rows[0]) throw HttpError.notFound('El usuario indicado no existe');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: id, accion: 'DESACTIVAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, mensaje: 'Usuario desactivado' });
}));
