import { env } from '../config/env.js';

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
