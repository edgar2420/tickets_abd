import crypto from 'node:crypto';
import { HttpError } from '../utils/httpError.js';
import { COOKIE_CSRF, CABECERA_CSRF } from '../utils/sesion.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Comparacion en tiempo constante, para no filtrar el token por el tiempo de respuesta. */
const coinciden = (a, b) => {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) return false;
  return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
};

/**
 * Proteccion contra peticiones forjadas desde otro sitio.
 *
 * Solo alcanza a las operaciones de escritura autenticadas por cookie: el
 * navegador enviaria esa cookie tambien desde una pagina ajena, de modo que
 * se exige ademas la cabecera con el valor de la cookie de CSRF, que solo
 * puede leer codigo servido desde el propio origen.
 *
 * Los clientes que se autentican con la cabecera Authorization quedan fuera:
 * ese esquema no es explotable por CSRF, porque el navegador no adjunta la
 * credencial por su cuenta.
 */
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
