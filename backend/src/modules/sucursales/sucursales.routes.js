import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';

const TIPOS = ['Fabrica', 'Casa Central', 'Sucursal', 'Planta', 'Oficina', 'Deposito'];

const sucursalSchema = z.object({
  codigo: z.string().min(2).max(10).regex(/^[A-Za-z0-9]+$/, 'Solo letras y numeros'),
  nombre: z.string().min(3).max(100),
  ciudad: z.string().max(80).optional().nullable(),
  tipo: z.enum(TIPOS).default('Sucursal'),
  direccion: z.string().max(200).optional().nullable(),
  activo: z.boolean().optional()
});

const SELECT_SUCURSAL = `
  SELECT s.id, s.codigo, s.nombre, s.ciudad, s.tipo, s.direccion, s.activo, s.fecha_creacion,
         (SELECT COUNT(*) FROM usuarios u WHERE u.sucursal_id = s.id)::int AS total_usuarios,
         (SELECT COUNT(*) FROM equipos e  WHERE e.sucursal_id = s.id AND e.activo)::int AS total_equipos,
         (SELECT COUNT(*) FROM tickets t  WHERE t.sucursal_id = s.id)::int AS total_tickets
    FROM sucursales s`;

export const sucursalesRouter = Router();
sucursalesRouter.use(autenticar);

/** Catalogo disponible para cualquier usuario autenticado: alimenta los selectores. */
sucursalesRouter.get('/', asyncHandler(async (req, res) => {
  const soloActivas = req.query.activas === 'true';
  const { rows } = await query(
    `${SELECT_SUCURSAL} WHERE ($1 = FALSE OR s.activo = TRUE) ORDER BY s.tipo, s.nombre`,
    [soloActivas]
  );
  res.json({ ok: true, datos: rows });
}));

sucursalesRouter.post('/', requierePermiso('admin.sucursales'), validate(sucursalSchema),
  asyncHandler(async (req, res) => {
    const { codigo, nombre, ciudad, tipo, direccion } = req.body;
    const { rows } = await query(
      'INSERT INTO sucursales (codigo, nombre, ciudad, tipo, direccion) VALUES ($1,$2,$3,$4,$5) RETURNING id',
      [codigo.toUpperCase(), nombre, ciudad ?? null, tipo, direccion ?? null]
    );
    const { rows: creada } = await query(`${SELECT_SUCURSAL} WHERE s.id = $1`, [rows[0].id]);
    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'SUCURSAL', entidadId: rows[0].id,
      accion: 'CREAR', detalle: creada[0], ip: req.ip
    });
    res.status(201).json({ ok: true, datos: creada[0] });
  }));

sucursalesRouter.put('/:id', requierePermiso('admin.sucursales'), validate(sucursalSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { codigo, nombre, ciudad, tipo, direccion, activo } = req.body;
    const { rowCount } = await query(
      `UPDATE sucursales SET codigo = $1, nombre = $2, ciudad = $3, tipo = $4, direccion = $5,
              activo = COALESCE($6::boolean, activo)
        WHERE id = $7`,
      [codigo.toUpperCase(), nombre, ciudad ?? null, tipo, direccion ?? null, activo ?? null, id]
    );
    if (!rowCount) throw HttpError.notFound('La sucursal indicada no existe');
    const { rows } = await query(`${SELECT_SUCURSAL} WHERE s.id = $1`, [id]);
    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'SUCURSAL', entidadId: id,
      accion: 'ACTUALIZAR', detalle: rows[0], ip: req.ip
    });
    res.json({ ok: true, datos: rows[0] });
  }));

/** Baja logica: los usuarios y equipos ya ubicados conservan su sucursal. */
sucursalesRouter.delete('/:id', requierePermiso('admin.sucursales'), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE sucursales SET activo = FALSE WHERE id = $1 RETURNING id, nombre', [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('La sucursal indicada no existe');
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'SUCURSAL', entidadId: rows[0].id, accion: 'DESACTIVAR', ip: req.ip
  });
  res.json({ ok: true, mensaje: 'Sucursal desactivada' });
}));

sucursalesRouter.put('/:id/activar', requierePermiso('admin.sucursales'), asyncHandler(async (req, res) => {
  const { rows } = await query('UPDATE sucursales SET activo = TRUE WHERE id = $1 RETURNING id', [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('La sucursal indicada no existe');
  const { rows: sucursal } = await query(`${SELECT_SUCURSAL} WHERE s.id = $1`, [rows[0].id]);
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'SUCURSAL', entidadId: rows[0].id, accion: 'ACTIVAR', ip: req.ip
  });
  res.json({ ok: true, datos: sucursal[0] });
}));
