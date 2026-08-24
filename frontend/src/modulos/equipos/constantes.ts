import type { EstadoEquipo, TipoEquipo } from '../../lib/tipos';

export const TIPOS: TipoEquipo[] = [
  'Servidor', 'PC', 'Laptop', 'Switch', 'Router', 'Telefonia',
  'Camara', 'Impresora', 'Monitor', 'UPS', 'Otro'
];

export const PREFIJOS: Record<TipoEquipo, string> = {
  Servidor: 'SRV',
  PC: 'PC',
  Laptop: 'LAP',
  Switch: 'SW',
  Router: 'RTR',
  Telefonia: 'TEL',
  Camara: 'CAM',
  Impresora: 'IMP',
  Monitor: 'MON',
  UPS: 'UPS',
  Otro: 'EQ'
};

export const FORMATO_CODIGO = /^[A-Z]{2,4}-[A-Z0-9]{2,10}-\d{3}$/;

export const partesDelCodigo = (codigo: string) => {
  const [prefijo = '', ubicacion = '', correlativo = ''] = codigo.toUpperCase().split('-');
  return { prefijo, ubicacion, correlativo };
};

export const ESTADOS: EstadoEquipo[] = ['Operativo', 'En reparacion', 'En resguardo', 'De baja'];

export const ESTILO_ESTADO: Record<EstadoEquipo, string> = {
  'Operativo': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'En reparacion': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'En resguardo': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'De baja': 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
};

export interface FormularioEquipo {
  id: number | null;
  codigo: string;
  nombre_equipo: string;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  numero_serie: string;
  sistema_operativo: string;
  procesador: string;
  ram_gb: string;
  almacenamiento: string;
  direccion_ip: string;
  direccion_mac: string;
  anydesk_id: string;
  anydesk_password: string;
  usuario_id: string;
  area_id: string;
  sucursal_id: string;
  ubicacion: string;
  estado: EstadoEquipo;
  observaciones: string;
  fecha_asignacion: string;
  activo: boolean;
}

export const EQUIPO_VACIO: FormularioEquipo = {
  id: null,
  codigo: '',
  nombre_equipo: '',
  tipo: 'PC',
  marca: '',
  modelo: '',
  numero_serie: '',
  sistema_operativo: '',
  procesador: '',
  ram_gb: '',
  almacenamiento: '',
  direccion_ip: '',
  direccion_mac: '',
  anydesk_id: '',
  anydesk_password: '',
  usuario_id: '',
  area_id: '',
  sucursal_id: '',
  ubicacion: '',
  estado: 'Operativo',
  observaciones: '',
  fecha_asignacion: '',
  activo: true
};
