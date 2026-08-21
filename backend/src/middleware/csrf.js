import crypto from 'node:crypto';
import { HttpError } from '../utils/httpError.js';
import { COOKIE_CSRF, CABECERA_CSRF } from '../utils/sesion.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

const coinciden = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

export const verificarCsrf = (req, _res, next) => {
  if (METODOS_SEGUROS.has(req.method)) return next();
  if (!req.cookies?.[COOKIE_CSRF]) return next();

  const esperado = req.cookies[COOKIE_CSRF];
  const recibido = req.get(CABECERA_CSRF);

  if (!recibido || !coinciden(esperado, recibido)) {
    return next(HttpError.forbidden('Verificacion de origen fallida. Vuelva a iniciar sesion.'));
  }
  return next();
};
