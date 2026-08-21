import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { query } from '../config/db.js';
import { HttpError } from '../utils/httpError.js';
import { permisosDeRol } from '../services/permisos.cache.js';
import { tokenDeLaPeticion, tokenDeCookies } from '../utils/sesion.js';

/** Verifica el JWT y carga req.usuario con su rol, area y permisos vigentes. */
export const autenticar = async (req, _res, next) => {
  try {
    const { token } = tokenDeLaPeticion(req);
    if (!token) throw HttpError.unauthorized('Sesion no iniciada');

    const payload = jwt.verify(token, env.jwt.secret);
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.usuario, u.email, u.activo,
              u.rol_id, r.nombre AS rol, u.area_id, a.nombre AS area,
              u.sucursal_id, s.nombre AS sucursal, s.codigo AS sucursal_codigo
         FROM usuarios u
         JOIN roles r      ON r.id = u.rol_id
         JOIN areas a      ON a.id = u.area_id
         LEFT JOIN sucursales s ON s.id = u.sucursal_id
        WHERE u.id = $1`,
      [payload.sub]
    );
    const usuario = rows[0];
    if (!usuario) throw HttpError.unauthorized('El usuario del token ya no existe');
    if (!usuario.activo) throw HttpError.forbidden('El usuario se encuentra desactivado');

    usuario.permisos = [...(await permisosDeRol(usuario.rol_id))];
    req.usuario = usuario;
    return next();
  } catch (error) {
    if (error instanceof HttpError) return next(error);
    if (error?.name === 'TokenExpiredError') return next(HttpError.unauthorized('La sesion ha expirado'));
    return next(HttpError.unauthorized('Token de autenticacion invalido'));
  }
};

/** Autenticacion de sockets: valida el JWT recibido en el handshake. */
export const autenticarSocket = async (socket, next) => {
  try {
    // El navegador viaja con la cookie de sesion; el movil manda el token en el handshake
    const token = tokenDeCookies(socket.handshake.headers?.cookie)
      ?? socket.handshake.auth?.token
      ?? socket.handshake.query?.token;
    if (!token) return next(new Error('Sesion no iniciada'));
    const payload = jwt.verify(token, env.jwt.secret);
    const { rows } = await query(
      `SELECT u.id, u.nombre, u.usuario, u.rol_id, u.area_id, r.nombre AS rol
         FROM usuarios u JOIN roles r ON r.id = u.rol_id
        WHERE u.id = $1 AND u.activo = TRUE`,
      [payload.sub]
    );
    if (!rows[0]) return next(new Error('Usuario invalido o desactivado'));
    socket.data.usuario = { ...rows[0], permisos: [...(await permisosDeRol(rows[0].rol_id))] };
    return next();
  } catch {
    return next(new Error('Autenticacion de socket fallida'));
  }
};
