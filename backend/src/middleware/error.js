import { HttpError } from '../utils/httpError.js';

export const notFoundHandler = (req, res) => {
  res.status(404).json({ ok: false, mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
};

export const errorHandler = (err, req, res, _next) => {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ ok: false, mensaje: err.message, detalle: err.detalle });
  }
  if (err?.code === '23505') {
    return res.status(409).json({ ok: false, mensaje: 'El registro ya existe (valor duplicado)', detalle: err.detail });
  }
  if (err?.code === '23503') {
    return res.status(409).json({ ok: false, mensaje: 'Referencia invalida hacia otro registro', detalle: err.detail });
  }
  console.error('[error]', err);
  return res.status(500).json({ ok: false, mensaje: 'Error interno del servidor' });
};
