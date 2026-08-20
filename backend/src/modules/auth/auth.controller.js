import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../../config/env.js';
import { query } from '../../config/db.js';
import { HttpError, asyncHandler } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';

export const loginSchema = z.object({
  usuario: z.string().min(3, 'El usuario debe tener al menos 3 caracteres'),
  password: z.string().min(6, 'La contrasena debe tener al menos 6 caracteres')
});

export const cambioPasswordSchema = z.object({
  passwordActual: z.string().min(6),
  passwordNueva: z.string().min(8, 'La nueva contrasena debe tener al menos 8 caracteres')
});

export const login = asyncHandler(async (req, res) => {
  const { usuario, password } = req.body;
  const { rows } = await query(
    `SELECT u.id, u.nombre, u.usuario, u.email, u.password_hash, u.activo,
            u.rol_id, r.nombre AS rol, u.area_id, a.nombre AS area,
            u.sucursal_id, s.nombre AS sucursal, s.codigo AS sucursal_codigo
       FROM usuarios u
       JOIN roles r      ON r.id = u.rol_id
       JOIN areas a      ON a.id = u.area_id
       LEFT JOIN sucursales s ON s.id = u.sucursal_id
      WHERE lower(u.usuario) = lower($1)`,
    [usuario]
  );

  const encontrado = rows[0];
  if (!encontrado || !(await bcrypt.compare(password, encontrado.password_hash))) {
    await registrarAuditoria({
      usuarioId: encontrado?.id ?? null, entidad: 'SESION', accion: 'LOGIN_FALLIDO',
      detalle: { usuario }, ip: req.ip
    });
    throw HttpError.unauthorized('Usuario o contrasena incorrectos');
  }
  if (!encontrado.activo) throw HttpError.forbidden('El usuario se encuentra desactivado');

  const token = jwt.sign(
    { sub: encontrado.id, usuario: encontrado.usuario, rol_id: encontrado.rol_id, area_id: encontrado.area_id },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn }
  );

  const { rows: permisos } = await query(
    `SELECT p.codigo FROM rol_permisos rp JOIN permisos p ON p.id = rp.permiso_id WHERE rp.rol_id = $1`,
    [encontrado.rol_id]
  );

  await registrarAuditoria({ usuarioId: encontrado.id, entidad: 'SESION', accion: 'LOGIN', ip: req.ip });

  delete encontrado.password_hash;
  res.json({ ok: true, token, usuario: { ...encontrado, permisos: permisos.map((p) => p.codigo) } });
});

export const perfil = asyncHandler(async (req, res) => {
  res.json({ ok: true, usuario: req.usuario });
});

export const cambiarPassword = asyncHandler(async (req, res) => {
  const { passwordActual, passwordNueva } = req.body;
  const { rows } = await query('SELECT password_hash FROM usuarios WHERE id = $1', [req.usuario.id]);
  if (!(await bcrypt.compare(passwordActual, rows[0].password_hash))) {
    throw HttpError.badRequest('La contrasena actual no es correcta');
  }
  const hash = await bcrypt.hash(passwordNueva, 10);
  await query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, req.usuario.id]);
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'USUARIO', entidadId: req.usuario.id, accion: 'CAMBIO_PASSWORD', ip: req.ip });
  res.json({ ok: true, mensaje: 'Contrasena actualizada correctamente' });
});

export const logout = asyncHandler(async (req, res) => {
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'SESION', accion: 'LOGOUT', ip: req.ip });
  res.json({ ok: true, mensaje: 'Sesion finalizada' });
});
