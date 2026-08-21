import { env } from '../config/env.js';
import { HttpError } from '../utils/httpError.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * Segunda barrera contra peticiones forjadas y contra automatismos simples.
 *
 * Un navegador siempre declara de donde parte la peticion, en Origin o en
 * Referer, y no permite falsear ese dato desde la pagina. Se exige que ese
 * origen figure en la lista autorizada antes de aceptar cualquier escritura
 * hecha con cookie.
 *
 * Las peticiones sin cookie de sesion quedan fuera: son las de la aplicacion
 * movil y las de herramientas de linea de comandos, que se autentican con la
 * cabecera Authorization y no arrastran credenciales por su cuenta.
 */
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
