import { env } from '../config/env.js';

/**
 * Reconduce a HTTPS cualquier peticion que llegue en claro.
 *
 * Detras de un balanceador o de un proxy inverso la conexion con el
 * servidor es interna y siempre parece HTTP; la cabecera X-Forwarded-Proto
 * es la que indica como llego realmente el visitante. Por eso la aplicacion
 * confia en el primer proxy ("trust proxy") y consulta req.secure.
 *
 * Se activa con FORZAR_HTTPS=true. En una red interna sin certificado debe
 * quedar apagado, o el sitio resultaria inalcanzable.
 */
export const forzarHttps = (req, res, next) => {
  if (!env.httpsObligatorio || req.secure) return next();

  if (req.method === 'GET' || req.method === 'HEAD') {
    return res.redirect(308, `https://${req.headers.host}${req.originalUrl}`);
  }

  return res.status(403).json({
    ok: false,
    mensaje: 'Este servicio solo admite conexiones cifradas. Utilice HTTPS.'
  });
};
