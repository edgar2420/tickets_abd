import type { EstadoTicket, PrioridadTicket } from './tipos';

export const codigoTicket = (id: number) => `TI-${String(id).padStart(5, '0')}`;

export const fechaHora = (valor: string | null | undefined) =>
  valor ? new Date(valor).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }) : 'No registrado';

export const fechaCorta = (valor: string | null | undefined) =>
  valor ? new Date(valor).toLocaleDateString('es-BO') : '-';

export const tiempoRelativo = (valor: string) => {
  const minutos = Math.round((Date.now() - new Date(valor).getTime()) / 60000);
  if (minutos < 1) return 'hace instantes';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} d`;
};

export const estiloEstado: Record<EstadoTicket, string> = {
  'Abierto': 'bg-sky-100 text-sky-800 border-sky-200',
  'En Proceso': 'bg-amber-100 text-amber-800 border-amber-200',
  'Resuelto': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'Cerrado': 'bg-slate-200 text-slate-700 border-slate-300'
};

export const estiloPrioridad: Record<PrioridadTicket, string> = {
  'Baja': 'bg-slate-100 text-slate-600 border-slate-200',
  'Media': 'bg-blue-100 text-blue-800 border-blue-200',
  'Alta': 'bg-orange-100 text-orange-800 border-orange-200',
  'Critica': 'bg-rose-100 text-rose-800 border-rose-200'
};
