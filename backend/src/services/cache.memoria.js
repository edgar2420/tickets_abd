const almacen = new Map();

export const enCache = async (clave, vigenciaMs, obtener) => {
  const guardado = almacen.get(clave);
  if (guardado && guardado.expira > Date.now()) return guardado.valor;

  const valor = await obtener();
  almacen.set(clave, { valor, expira: Date.now() + vigenciaMs });
  return valor;
};

export const invalidar = (prefijo) => {
  for (const clave of almacen.keys()) {
    if (clave === prefijo || clave.startsWith(`${prefijo}:`)) almacen.delete(clave);
  }
};

