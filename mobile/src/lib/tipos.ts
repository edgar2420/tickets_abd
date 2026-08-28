export type EstadoTicket =
  | 'Nuevo' | 'Asignado' | 'En Proceso' | 'En Espera' | 'Resuelto' | 'Cerrado';

export type PrioridadTicket = 'Baja' | 'Media' | 'Alta' | 'Critica';

export type ServicioTicket =
  | 'Soporte informatico' | 'Redes' | 'Telefonia' | 'CCTV' | 'Servidores'
  | 'IBS' | 'Desarrollo' | 'Mantenimiento';

export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  area: string;
  sucursal?: string | null;
  permisos: string[];
}

export interface Ticket {
  id: number;
  anio: number;
  numero: number;
  titulo: string;
  descripcion: string;
  servicio: ServicioTicket;
  categoria: string;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  ubicacion: string | null;
  observaciones: string | null;
  minutos_empleados: number | null;
  solucion_detalle: string | null;
  motivo_espera: string | null;
  fecha_creacion: string;
  fecha_asignacion: string | null;
  fecha_inicio: string | null;
  fecha_espera: string | null;
  fecha_resolucion: string | null;
  fecha_cierre: string | null;
  fecha_objetivo: string | null;
  vencido: boolean;
  solicitante_id: number;
  solicitante_nombre: string;
  solicitante_area: string;
  sucursal_nombre: string | null;
  asignado_id: number | null;
  asignado_nombre: string | null;
  resuelto_por_nombre: string | null;
  prioridad_por_nombre: string | null;
  equipo_id: number | null;
  equipo_codigo: string | null;
  equipo_nombre: string | null;
}

export interface Indicadores {
  total: number;
  nuevos: number;
  asignados: number;
  en_proceso: number;
  en_espera: number;
  resueltos: number;
  cerrados: number;
  abiertos: number;
  criticos: number;
  altos: number;
  vencidos: number;
  mantenimientos: number;
  pendientes_ibs: number;
}

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
}

export interface Equipo {
  id: number;
  codigo: string;
  nombre_equipo: string;
  tipo: string;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  ubicacion: string | null;
  estado: string;
  usuario_nombre?: string | null;
  area_nombre?: string | null;
  sucursal_nombre?: string | null;
}

export type SituacionMantenimiento = 'Vencido' | 'Por vencer' | 'Al dia' | 'Sin registro';

export interface EquipoDelPlan {
  id: number;
  codigo: string;
  nombre_equipo: string;
  tipo: string;
  ubicacion: string | null;
  estado: string;
  frecuencia_mantenimiento: string | null;
  ultimo_mantenimiento: string | null;
  proximo_mantenimiento: string | null;
  situacion: SituacionMantenimiento;
  responsable_nombre: string | null;
  sucursal_nombre: string | null;
  realizados: number;
}

export interface ResumenMantenimiento {
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
  realizado_por_nombre: string | null;
  ticket_anio: number | null;
  ticket_numero: number | null;
}

export interface SolicitudCompra {
  id: number;
  titulo: string;
  justificacion: string;
  tipo_equipo: string;
  cantidad: number;
  especificaciones: string | null;
  prioridad: PrioridadTicket;
  estado: string;
  monto_estimado: string | number | null;
  monto_final: string | number | null;
  equipo_sugerido: string | null;
  observacion_ti: string | null;
  observacion_gerencia: string | null;
  motivo_rechazo: string | null;
  fecha_creacion: string;
  solicitante_nombre: string;
  area_nombre: string | null;
  sucursal_nombre: string | null;
  revisado_por_nombre: string | null;
  aprobado_por_nombre: string | null;
}

export interface SolicitudProyecto {
  id: number;
  titulo: string;
  tipo: string;
  problema: string;
  situacion_actual: string;
  propuesta: string;
  beneficio: string;
  personas_afectadas: number;
  frecuencia: string;
  urgencia: PrioridadTicket;
  sistemas_actuales: string | null;
  estado: string;
  evaluacion_ti: string | null;
  esfuerzo_estimado: string | null;
  valor_estimado: string | null;
  motivo_rechazo: string | null;
  fecha_creacion: string;
  solicitante_nombre: string;
  area_nombre: string | null;
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

export interface InfoPaginacion {
  pagina: number;
  limite: number;
  total: number;
  paginas: number;
}
