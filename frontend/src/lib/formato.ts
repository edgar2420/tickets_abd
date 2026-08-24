import type { EstadoTicket, PrioridadTicket } from './tipos';

export const codigoTicket = (ticket: { anio?: number; numero?: number; id?: number }) => {
  const anio = ticket.anio ?? new Date().getFullYear();
  const numero = ticket.numero ?? ticket.id ?? 0;
  return `SYS-${anio}-${String(numero).padStart(5, '0')}`;
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

export const montoBs = (valor: string | number | null | undefined) => {
  if (valor === null || valor === undefined || valor === '') return null;
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return `Bs ${numero.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

export const fechaHora = (valor: string | null | undefined) =>
  valor ? new Date(valor).toLocaleString('es-BO', { dateStyle: 'short', timeStyle: 'short' }) : 'No registrado';

export const fechaCorta = (valor: string | null | undefined) =>
  valor ? new Date(valor).toLocaleDateString('es-BO') : '-';

export const duracionLegible = (horas: number | null | undefined) => {
  if (horas === null || horas === undefined) return 'No registrado';
  const minutosTotales = Math.max(0, Math.round(Number(horas) * 60));
  const dias = Math.floor(minutosTotales / 1440);
  const restoHoras = Math.floor((minutosTotales % 1440) / 60);
  const minutos = minutosTotales % 60;
  if (dias > 0) return `${dias} d ${restoHoras} h ${minutos} min`;
  if (restoHoras > 0) return `${restoHoras} h ${minutos} min`;
  return `${minutos} min`;
};

export const pesoLegible = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const tiempoRelativo = (valor: string) => {
  const minutos = Math.round((Date.now() - new Date(valor).getTime()) / 60000);
  if (minutos < 1) return 'hace instantes';
  if (minutos < 60) return `hace ${minutos} min`;
  const horas = Math.round(minutos / 60);
  if (horas < 24) return `hace ${horas} h`;
  return `hace ${Math.round(horas / 24)} d`;
};

export const estiloEstado: Record<EstadoTicket, string> = {
  'Nuevo': 'bg-sky-100 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'Asignado': 'bg-violet-100 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'En Proceso': 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'En Espera': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
  'Resuelto': 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Cerrado': 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
};

export const estiloPrioridad: Record<PrioridadTicket, string> = {
  'Baja': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'Media': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'Alta': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
  'Critica': 'bg-red-100 text-red-800 border-red-300 animate-pulse dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/40'
};

export const estiloCategoria: Record<string, string> = {
  celeste: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  violeta: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  esmeralda: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  ambar: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  rosa: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  pizarra: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
};

export const fondoCategoria: Record<string, string> = {
  celeste: 'bg-sky-500',
  violeta: 'bg-violet-500',
  esmeralda: 'bg-emerald-500',
  ambar: 'bg-amber-500',
  rosa: 'bg-rose-500',
  pizarra: 'bg-slate-500'
};

export const textoCategoria: Record<string, string> = {
  celeste: 'text-sky-600 dark:text-sky-400',
  violeta: 'text-violet-600 dark:text-violet-400',
  esmeralda: 'text-emerald-600 dark:text-emerald-400',
  ambar: 'text-amber-600 dark:text-amber-400',
  rosa: 'text-rose-600 dark:text-rose-400',
  pizarra: 'text-slate-600 dark:text-slate-300'
};
