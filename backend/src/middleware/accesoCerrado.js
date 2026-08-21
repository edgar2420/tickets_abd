import { HttpError } from '../utils/httpError.js';
import { tokenDeLaPeticion } from '../utils/sesion.js';

/**
 * Rutas que pueden atenderse sin sesion. Es una lista corta y explicita:
 * todo lo que no figure aqui exige credencial.
 */
const RUTAS_ABIERTAS = new Set(['POST /auth/login']);

/**
 * Cierra la API por omision.
 *
 * Cada router aplica ya su propio guardia, pero eso depende de que quien
 * agregue un modulo nuevo se acuerde de ponerlo. Esta barrera invierte el
 * criterio: una ruta que nadie declaro abierta queda protegida aunque su
 * autor haya olvidado el guardia. La verificacion fina de permisos sigue
 * corriendo despues, en cada endpoint.
 */
export const accesoCerrado = (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();

  const ruta = `${req.method} ${req.path.replace(/\/+$/, '') || '/'}`;
  if (RUTAS_ABIERTAS.has(ruta)) return next();

  const { token } = tokenDeLaPeticion(req);
  if (!token) return next(HttpError.unauthorized('Sesion no iniciada'));

  return next();
};
