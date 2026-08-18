import { HttpError } from '../utils/httpError.js';

/** Valida req[source] contra un esquema zod y reemplaza el valor por el parseado. */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) {
    const detalle = result.error.issues.map((i) => ({ campo: i.path.join('.'), mensaje: i.message }));
    return next(HttpError.badRequest('Datos de entrada invalidos', detalle));
  }
  req[source] = result.data;
  return next();
};
