import { HttpError } from '../utils/httpError.js';

/**
 * Guard RBAC. Uso: router.post('/', autenticar, requierePermiso('tickets.crear'), handler)
 * Acepta uno o varios codigos; con varios basta con poseer al menos uno (OR logico).
 */
export const requierePermiso = (...codigos) => (req, _res, next) => {
  if (!req.usuario) return next(HttpError.unauthorized());
  const posee = codigos.some((codigo) => req.usuario.permisos.includes(codigo));
  if (!posee) {
    return next(HttpError.forbidden(`Acceso denegado. Permiso requerido: ${codigos.join(' o ')}`));
  }
  return next();
};

/** Verificacion utilitaria dentro de un servicio o controlador. */
export const tienePermiso = (usuario, codigo) => Boolean(usuario?.permisos?.includes(codigo));
