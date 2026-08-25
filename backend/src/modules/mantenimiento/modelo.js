export const FRECUENCIAS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];

export const MESES_POR_FRECUENCIA = {
  Mensual: 1,
  Trimestral: 3,
  Semestral: 6,
  Anual: 12
};

export const SITUACIONES = ['Vencido', 'Por vencer', 'Al dia', 'Sin registro'];

export const proximaFecha = (frecuencia, ultimo) => {
  const meses = MESES_POR_FRECUENCIA[frecuencia];
  if (!meses || !ultimo) return null;
  const fecha = new Date(ultimo);
  fecha.setMonth(fecha.getMonth() + meses);
  return fecha;
};
