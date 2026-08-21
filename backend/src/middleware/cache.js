/**
 * Marca la respuesta como cacheable por el propio navegador.
 *
 * Se usa "private" porque los datos pertenecen a la sesion y no deben
 * quedar en una cache compartida, y "must-revalidate" para que el
 * navegador confirme con el servidor apenas vence el plazo. Junto con la
 * etiqueta de entidad que agrega Express, una consulta repetida se
 * resuelve con un 304 sin volver a transferir el cuerpo.
 */
export const cachearEnCliente = (segundos = 60) => (_req, res, next) => {
  res.set('Cache-Control', `private, max-age=${segundos}, must-revalidate`);
  next();
};

/** Impide que una respuesta sensible quede guardada en el navegador. */
export const sinCache = (_req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
