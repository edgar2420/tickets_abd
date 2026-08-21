import { HttpError } from '../utils/httpError.js';

export const requierePermiso = (...codigos) => (req, _res, next) => {
  if (!req.usuario) return next(HttpError.unauthorized());
  const posee = codigos.some((codigo) => req.usuario.permisos.includes(codigo));
  if (!posee) {
    return next(HttpError.forbidden(`Acceso denegado. Permiso requerido: ${codigos.join(' o ')}`));
  }
  return next();
};

