import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { passwordSchema, usuarioSchema, textoLimpio } from '../../utils/password.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarUsuario } from '../../services/notificaciones.service.js';
import { env } from '../../config/env.js';

// El rol con el que nace toda cuenta que se registra sola. Nunca hereda
// permisos de atencion: eso lo decide quien la aprueba.
const ROL_INICIAL = 'cliente';

export const registroSchema = z.object({
  nombre: textoLimpio(6, 120, 'El nombre completo'),
  usuario: usuarioSchema,
  email: z.string().trim().email('Escriba un correo valido').max(120).optional().nullable()
    .or(z.literal('')),
  password: passwordSchema,
  area_id: z.number().int().positive(),
  sucursal_id: z.number().int().positive()
});

export const catalogoRegistro = asyncHandler(async (_req, res) => {
  const areas = await query('SELECT id, nombre FROM areas WHERE activo = TRUE ORDER BY nombre');
  const sucursales = await query('SELECT id, nombre, codigo FROM sucursales ORDER BY nombre');
  res.json({ ok: true, datos: { areas: areas.rows, sucursales: sucursales.rows } });
});

export const registrar = asyncHandler(async (req, res) => {
  const { nombre, usuario, email, password, area_id, sucursal_id } = req.body;

  const repetido = await query('SELECT id FROM usuarios WHERE lower(usuario) = lower($1)', [usuario]);
  if (repetido.rows.length) {
    throw HttpError.badRequest('Ese nombre de usuario ya esta tomado. Elija otro.');
  }

  const area = await query('SELECT id FROM areas WHERE id = $1 AND activo = TRUE', [area_id]);
  if (!area.rows.length) throw HttpError.badRequest('El area indicada no existe');

  const sucursal = await query('SELECT id FROM sucursales WHERE id = $1', [sucursal_id]);
  if (!sucursal.rows.length) throw HttpError.badRequest('La sucursal indicada no existe');

  const rol = await query('SELECT id FROM roles WHERE nombre = $1', [ROL_INICIAL]);
  if (!rol.rows.length) throw HttpError.badRequest('No hay un rol inicial configurado');

  const esperaAprobacion = env.registroConAprobacion;
  const hash = await bcrypt.hash(password, 10);
  const { rows } = await query(
    `INSERT INTO usuarios
       (nombre, usuario, email, password_hash, area_id, sucursal_id, rol_id,
        activo, aprobado, registrado_solo)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, TRUE)
     RETURNING id, nombre, usuario`,
    [nombre, usuario, email || null, hash, area_id, sucursal_id, rol.rows[0].id, !esperaAprobacion]
  );
  const cuenta = rows[0];

  await registrarAuditoria({
    usuarioId: cuenta.id, entidad: 'USUARIO', entidadId: cuenta.id, accion: 'REGISTRO_SOLICITADO',
    detalle: { usuario: cuenta.usuario, area_id, sucursal_id }, ip: req.ip
  });

  const { rows: aprobadores } = await query(
    `SELECT DISTINCT u.id
       FROM usuarios u
       JOIN rol_permisos rp ON rp.rol_id = u.rol_id
       JOIN permisos p      ON p.id = rp.permiso_id
      WHERE p.codigo = 'admin.aprobar_cuentas' AND u.activo = TRUE`
  );
  // Aunque el acceso sea inmediato se avisa igual: la administracion se entera
  // de cada alta sin tener que revisar el listado.
  for (const aprobador of aprobadores) {
    await notificarUsuario({
      usuarioId: aprobador.id,
      tipo: esperaAprobacion ? 'CUENTA_PENDIENTE' : 'CUENTA_NUEVA',
      titulo: esperaAprobacion ? 'Una cuenta espera aprobacion' : 'Se registro una cuenta nueva',
      mensaje: esperaAprobacion
        ? `${cuenta.nombre} se registro y espera que le habiliten el acceso.`
        : `${cuenta.nombre} creo su cuenta y ya puede entrar. Revise su rol si corresponde.`
    });
  }

  res.status(201).json({
    ok: true,
    mensaje: esperaAprobacion
      ? 'Su cuenta quedo registrada y espera la aprobacion de Sistemas.'
      : 'Su cuenta quedo creada. Ya puede entrar con el usuario y la contrasena que eligio.',
    datos: { usuario: cuenta.usuario, acceso_inmediato: !esperaAprobacion }
  });
});
