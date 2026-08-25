export const FRECUENCIAS = ['Mensual', 'Trimestral', 'Semestral', 'Anual'] as const;

export type Frecuencia = (typeof FRECUENCIAS)[number];

export const SITUACIONES = ['Vencido', 'Por vencer', 'Al dia', 'Sin registro'] as const;

export type Situacion = (typeof SITUACIONES)[number];

export const ESTILO_SITUACION: Record<Situacion, string> = {
  'Vencido': 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  'Por vencer': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'Al dia': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Sin registro': 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
};

export const MESES_POR_FRECUENCIA: Record<Frecuencia, number> = {
  Mensual: 1,
  Trimestral: 3,
  Semestral: 6,
  Anual: 12
};

export interface EquipoDelPlan {
  id: number;
  codigo: string;
  nombre_equipo: string;
  tipo: string;
  ubicacion: string | null;
  estado: string;
  frecuencia_mantenimiento: Frecuencia | null;
  ultimo_mantenimiento: string | null;
  proximo_mantenimiento: string | null;
  situacion: Situacion;
  responsable_nombre: string | null;
  sucursal_nombre: string | null;
  realizados: number;
}

export interface ResumenPlan {
  con_plan: number;
  vencidos: number;
  por_vencer: number;
  al_dia: number;
  sin_registro: number;
  sin_plan: number;
}

export interface RegistroMantenimiento {
  id: number;
  fecha: string;
  observaciones: string | null;
  ticket_id: number | null;
  ticket_anio: number | null;
  ticket_numero: number | null;
  realizado_por_nombre: string | null;
}

export const FILTROS_VACIOS = { situacion: '', frecuencia: '', busqueda: '' };
