const almacen = new Map();

/**
 * Cache en memoria para los catalogos que se consultan en casi toda
 * navegacion y cambian pocas veces: areas, sucursales, categorias y
 * permisos. Evita repetir la consulta en cada pantalla.
 *
 * Cada escritura sobre un catalogo invalida su clave, de modo que un
 * cambio administrativo se refleja de inmediato y no queda a la espera
 * de que venza un plazo.
 */
export const enCache = async (clave, vigenciaMs, obtener) => {
  const guardado = almacen.get(clave);
  if (guardado && guardado.expira > Date.now()) return guardado.valor;

  const valor = await obtener();
  almacen.set(clave, { valor, expira: Date.now() + vigenciaMs });
  return valor;
};

/** Descarta una clave, o todas las que empiecen con el prefijo indicado. */
export const invalidar = (prefijo) => {
  for (const clave of almacen.keys()) {
    if (clave === prefijo || clave.startsWith(`${prefijo}:`)) almacen.delete(clave);
  }
};

