import type { EstadoArticulo, TipoArticulo, TipoMovimiento } from '../../lib/tipos';

export const TIPOS: TipoArticulo[] = ['Equipo', 'Consumible', 'Repuesto', 'Licencia', 'Accesorio'];

export const ESTADOS: EstadoArticulo[] = ['Disponible', 'En reparacion', 'En resguardo', 'De baja'];

export const ESTILO_ESTADO: Record<EstadoArticulo, string> = {
  'Disponible': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'En reparacion': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'En resguardo': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'De baja': 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
};

export const ESTILO_MOVIMIENTO: Record<TipoMovimiento, string> = {
  'Entrada': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'Salida': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30',
  'Ajuste': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30'
};

export interface FormularioArticulo {
  id: number | null;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoArticulo;
  unidad: string;
  stock_minimo: string;
  ubicacion: string;
  estado: EstadoArticulo;
  activo: boolean;
}

export const ARTICULO_VACIO: FormularioArticulo = {
  id: null,
  codigo: '',
  nombre: '',
  descripcion: '',
  tipo: 'Equipo',
  unidad: 'Unidad',
  stock_minimo: '0',
  ubicacion: '',
  estado: 'Disponible',
  activo: true
};

export type Vista = 'articulos' | 'movimientos';
