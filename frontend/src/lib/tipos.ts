export type EstadoTicket = 'Abierto' | 'En Proceso' | 'Resuelto' | 'Cerrado';
export type PrioridadTicket = 'Baja' | 'Media' | 'Alta' | 'Critica';
export type CategoriaTicket = 'Hardware' | 'Software' | 'Redes' | 'Accesos';

export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  email: string | null;
  activo: boolean;
  rol_id: number;
  rol: string;
  area_id: number;
  area: string;
  permisos: string[];
  fecha_creacion?: string;
}

export interface Area {
  id: number;
  nombre: string;
  activo: boolean;
  fecha_creacion: string;
  total_usuarios?: number;
}

export interface Permiso {
  id: number;
  codigo: string;
  descripcion: string;
  modulo: string;
}

export interface Rol {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  permisos: Pick<Permiso, 'id' | 'codigo' | 'modulo'>[];
  total_usuarios: number;
}

export interface Ticket {
  id: number;
  titulo: string;
  descripcion: string;
  categoria: CategoriaTicket;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  solucion_detalle: string | null;
  fecha_creacion: string;
  fecha_asignacion: string | null;
  fecha_resolucion: string | null;
  solicitante_id: number;
  solicitante_nombre: string;
  solicitante_area: string;
  asignado_id: number | null;
  asignado_nombre: string | null;
  resuelto_por_id: number | null;
  resuelto_por_nombre: string | null;
  horas_atencion: number | null;
  bitacora?: RegistroBitacora[];
}

export interface RegistroBitacora {
  accion: string;
  detalle: unknown;
  ip: string | null;
  fecha: string;
  usuario_nombre: string | null;
}

export interface Notificacion {
  id: number;
  ticket_id: number | null;
  tipo: string;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha: string;
}

export interface Indicadores {
  total: number;
  abiertos: number;
  en_proceso: number;
  resueltos: number;
  cerrados: number;
  criticos: number;
  horas_promedio_resolucion: string | number;
}

export interface Distribucion {
  etiqueta: string;
  total: number;
}

export interface RegistroAuditoria {
  id: number;
  entidad: string;
  entidad_id: number | null;
  accion: string;
  detalle: unknown;
  ip: string | null;
  fecha: string;
  usuario_nombre: string | null;
  usuario_login: string | null;
}
