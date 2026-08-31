import { HttpError } from '../utils/httpError.js';
import { tokenDeLaPeticion } from '../utils/sesion.js';

const RUTAS_ABIERTAS = new Set([
  'POST /auth/login',
  'POST /auth/registro',
  'GET /auth/catalogo-registro'
]);

export const accesoCerrado = (req, _res, next) => {
  if (req.method === 'OPTIONS') return next();

  const ruta = `${req.method} ${req.path.replace(/\/+$/, '') || '/'}`;
  if (RUTAS_ABIERTAS.has(ruta)) return next();

  const { token } = tokenDeLaPeticion(req);
  if (!token) return next(HttpError.unauthorized('Sesion no iniciada'));

  return next();
};
