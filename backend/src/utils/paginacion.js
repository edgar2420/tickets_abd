const LIMITE_POR_DEFECTO = 25;
const LIMITE_MAXIMO = 200;

/**
 * Normaliza los parametros de paginacion de una consulta.
 * Acota el limite para que un cliente no pueda pedir la tabla completa y
 * saturar la memoria del servidor o del navegador.
 */
export const paginacion = (consulta = {}) => {
  const solicitado = Number.parseInt(consulta.limite, 10);
  const limite = Number.isFinite(solicitado) && solicitado > 0
    ? Math.min(solicitado, LIMITE_MAXIMO)
    : LIMITE_POR_DEFECTO;

  const paginaSolicitada = Number.parseInt(consulta.pagina, 10);
  const pagina = Number.isFinite(paginaSolicitada) && paginaSolicitada > 0 ? paginaSolicitada : 1;

  return { limite, pagina, desplazamiento: (pagina - 1) * limite };
};

/** Envoltura uniforme de las respuestas paginadas. */
export const respuestaPaginada = (datos, total, limite, pagina) => ({
  ok: true,
  datos,
  paginacion: {
    total,
    limite,
    pagina,
    paginas: Math.max(1, Math.ceil(total / limite)),
    desde: total === 0 ? 0 : (pagina - 1) * limite + 1,
    hasta: Math.min(pagina * limite, total)
  }
});

