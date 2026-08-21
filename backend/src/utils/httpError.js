export class HttpError extends Error {
  constructor(status, message, detalle = null) {
    super(message);
    this.status = status;
    this.detalle = detalle;
  }
  static badRequest(msg, detalle) { return new HttpError(400, msg, detalle); }
  static unauthorized(msg = 'Credenciales invalidas o sesion expirada') { return new HttpError(401, msg); }
  static forbidden(msg = 'No cuenta con el permiso requerido para esta accion') { return new HttpError(403, msg); }
  static notFound(msg = 'Recurso no encontrado') { return new HttpError(404, msg); }
  static conflict(msg) { return new HttpError(409, msg); }
}

export const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
