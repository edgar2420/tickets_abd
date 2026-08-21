import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

export const verificarOrigen = (req, _res, next) => {
  if (METODOS_SEGUROS.has(req.method)) return next();
  if (!req.cookies?.tickets_sesion) return next();

  const declarado = req.get('origin') ?? req.get('referer');
  if (!declarado) {
    return next(HttpError.forbidden('La peticion no declara su origen.'));
  }

  let origen;
  try {
    origen = new URL(declarado).origin;
  } catch {
    return next(HttpError.forbidden('El origen declarado no es una direccion valida.'));
  }

  if (!env.cors.origins.includes(origen)) {
    return next(HttpError.forbidden('El origen de la peticion no esta autorizado.'));
  }
  return next();
};
