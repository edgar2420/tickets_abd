import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { passwordSchema, revisarPassword, textoLimpio, usuarioSchema } from '../../utils/password.js';

const crearUsuarioSchema = z.object({
  nombre: textoLimpio(4, 150),
  usuario: usuarioSchema,
  email: z.string().trim().email().max(150).optional().nullable().or(z.literal('')),
  password: passwordSchema,
  area_id: z.number().int().positive(),
  sucursal_id: z.number().int().positive(),
  rol_id: z.number().int().positive()
});

const reinicioPasswordSchema = z.object({
  password: passwordSchema
});

const editarUsuarioSchema = crearUsuarioSchema.partial({ password: true }).extend({
  activo: z.boolean().optional()
});

const SELECT_USUARIO = `
  SELECT u.id, u.nombre, u.usuario, u.email, u.activo, u.fecha_creacion,
         u.area_id, a.nombre AS area, u.rol_id, r.nombre AS rol,
         u.sucursal_id, s.nombre AS sucursal, s.codigo AS sucursal_codigo
    FROM usuarios u
    JOIN areas a ON a.id = u.area_id
    JOIN roles r ON r.id = u.rol_id
    LEFT JOIN sucursales s ON s.id = u.sucursal_id`;

export const usuariosRouter = Router();
usuariosRouter.use(autenticar);

usuariosRouter.get('/', requierePermiso('admin.usuarios'), asyncHandler(async (req, res) => {
  const { limite, pagina, desplazamiento } = paginacion(req.query);
  const { busqueda = null, area_id = null, rol_id = null, activo = null, sucursal_id = null } = req.query;
  const condiciones = `
      WHERE ($1::text IS NULL OR u.nombre ILIKE '%' || $1 || '%' OR u.usuario ILIKE '%' || $1 || '%')
        AND ($2::int  IS NULL OR u.area_id = $2)
        AND ($3::int  IS NULL OR u.rol_id = $3)
        AND ($4::bool IS NULL OR u.activo = $4)
        AND ($5::int  IS NULL OR u.sucursal_id = $5)`;
  const parametros = [busqueda, area_id, rol_id, activo === null ? null : activo === 'true', sucursal_id];

  const { rows: total } = await query(`SELECT COUNT(*)::int AS total FROM usuarios u ${condiciones}`, parametros);
  const { rows } = await query(
    `${SELECT_USUARIO} ${condiciones} ORDER BY u.nombre LIMIT $6 OFFSET $7`,
    [...parametros, limite, desplazamiento]
  );
  res.json(respuestaPaginada(rows, total[0].total, limite, pagina));
}));

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
  const { nombre, usuario, email, password, area_id, sucursal_id, rol_id } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, sucursal_id, rol_id)
     VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING id`,
    [nombre, usuario, email ?? null, hash, area_id, sucursal_id, rol_id]
  );
  const { rows: creado } = await query(`${SELECT_USUARIO} WHERE u.id = $1`, [rows[0].id]);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: rows[0].id, accion: 'CREAR', detalle: creado[0], ip: req.ip });
  res.status(201).json({ ok: true, datos: creado[0] });
}));

usuariosRouter.put('/:id', requierePermiso('admin.usuarios'), validate(editarUsuarioSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const { nombre, usuario, email, area_id, sucursal_id, rol_id, activo, password } = req.body;
  const hash = password ? await bcrypt.hash(password, 10) : null;
  const { rowCount } = await query(
    `UPDATE usuarios SET
        nombre        = COALESCE($1::varchar, nombre),
        usuario       = COALESCE($2::varchar, usuario),
        email         = COALESCE($3::varchar, email),
        area_id       = COALESCE($4::int, area_id),
        sucursal_id   = COALESCE($5::int, sucursal_id),
        rol_id        = COALESCE($6::int, rol_id),
        activo        = COALESCE($7::boolean, activo),
        password_hash = COALESCE($8::varchar, password_hash)
      WHERE id = $9`,
    [nombre ?? null, usuario ?? null, email ?? null, area_id ?? null, sucursal_id ?? null,
      rol_id ?? null, activo ?? null, hash, id]
  );
  if (!rowCount) throw HttpError.notFound('El usuario indicado no existe');
  const { rows } = await query(`${SELECT_USUARIO} WHERE u.id = $1`, [id]);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: id, accion: 'ACTUALIZAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, datos: rows[0] });
}));

usuariosRouter.delete('/:id', requierePermiso('admin.usuarios'), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  if (id === req.usuario.id) throw HttpError.badRequest('No puede desactivar su propio usuario');
  const { rows } = await query('UPDATE usuarios SET activo = FALSE WHERE id = $1 RETURNING id, nombre', [id]);
  if (!rows[0]) throw HttpError.notFound('El usuario indicado no existe');
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: id, accion: 'DESACTIVAR', detalle: rows[0], ip: req.ip });
  res.json({ ok: true, mensaje: 'Usuario desactivado' });
}));

usuariosRouter.put('/:id/password', requierePermiso('admin.usuarios'),
  validate(reinicioPasswordSchema), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { rows: destino } = await query('SELECT usuario, nombre FROM usuarios WHERE id = $1', [id]);
    if (!destino[0]) throw HttpError.notFound('El usuario indicado no existe');

    const fallas = revisarPassword(req.body.password, destino[0].usuario);
    if (fallas.length) throw HttpError.badRequest(fallas.join('. '));

    const hash = await bcrypt.hash(req.body.password, 10);
    await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, id]);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: id,
      accion: 'REINICIAR_PASSWORD', detalle: { usuario: destino[0].usuario }, ip: req.ip
    });
    res.json({ ok: true, mensaje: `Contrasena restablecida para ${destino[0].nombre}` });
  }));
