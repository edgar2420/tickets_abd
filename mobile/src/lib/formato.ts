export const codigoTicket = (ticket: { anio?: number | null; numero?: number | null; id?: number }) => {
  const anio = ticket.anio ?? new Date().getFullYear();
  const numero = ticket.numero ?? ticket.id ?? 0;
  return `SYS-${anio}-${String(numero).padStart(5, '0')}`;
};

export const codigoCompra = (id: number) => `COM-${String(id).padStart(5, '0')}`;

export const codigoProyecto = (id: number) => `DEV-${String(id).padStart(3, '0')}`;

export const fechaHora = (valor?: string | null) =>
  (valor ? new Date(valor).toLocaleString('es-BO') : 'No registrado');

export const fechaCorta = (valor?: string | null) =>
  (valor ? new Date(valor).toLocaleDateString('es-BO') : 'No registrado');

export const montoBs = (valor: string | number | null | undefined) => {
  if (valor === null || valor === undefined || valor === '') return 'Sin monto';
  const numero = Number(valor);
  if (Number.isNaN(numero)) return 'Sin monto';
  return `Bs ${numero.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const duracionEmpleada = (minutos: number | null | undefined) => {
  if (minutos === null || minutos === undefined) return 'No registrado';
  const total = Math.max(0, Number(minutos));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
};
