export interface InfoPaginacion {
  total: number;
  limite: number;
  pagina: number;
  paginas: number;
  desde: number;
  hasta: number;
}

export interface RespuestaPaginada<T> {
  ok: boolean;
  datos: T[];
  paginacion: InfoPaginacion;
}

export type TipoArticulo = 'Equipo' | 'Consumible' | 'Repuesto' | 'Licencia' | 'Accesorio';
export type TipoMovimiento = 'Entrada' | 'Salida' | 'Ajuste';

export interface Articulo {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  tipo: TipoArticulo;
  unidad: string;
  stock_actual: number;
  stock_minimo: number;
  ubicacion: string | null;
  activo: boolean;
  fecha_creacion: string;
  bajo_minimo: boolean;
  ultimo_movimiento: string | null;
}

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  cantidad: number;
  stock_anterior: number;
  stock_resultante: number;
  motivo: string | null;
  ticket_id: number | null;
  fecha: string;
  articulo_id: number;
  articulo_codigo: string;
  articulo_nombre: string;
  unidad: string;
  usuario_nombre: string;
}

export interface ResumenInventario {
  articulos: number;
  unidades: number;
  bajo_minimo: number;
  agotados: number;
  entradas_mes: number;
  salidas_mes: number;
}

export type TipoEquipo = 'Escritorio' | 'Laptop' | 'Servidor' | 'Impresora' | 'Monitor' | 'Red' | 'Otro';
export type EstadoEquipo = 'Operativo' | 'En reparacion' | 'En resguardo' | 'De baja';

export interface Equipo {
  id: number;
  codigo: string;
  nombre_equipo: string;
  tipo: TipoEquipo;
  marca: string | null;
  modelo: string | null;
  numero_serie: string | null;
  sistema_operativo: string | null;
  procesador: string | null;
  ram_gb: number | null;
  almacenamiento: string | null;
  direccion_ip: string | null;
  direccion_mac: string | null;
  anydesk_id: string | null;
  /** Indica si hay contrasena guardada; el valor nunca viaja en los listados. */
  tiene_password: boolean;
  usuario_id: number | null;
  usuario_nombre: string | null;
  area_id: number | null;
  area_nombre: string | null;
  ubicacion: string | null;
  estado: EstadoEquipo;
  observaciones: string | null;
  fecha_asignacion: string | null;
  activo: boolean;
  fecha_creacion: string;
}

export interface ResumenEquipos {
  total: number;
  operativos: number;
  en_reparacion: number;
  sin_asignar: number;
  con_acceso_remoto: number;
}

export type EstadoTicket = 'Abierto' | 'En Proceso' | 'Resuelto' | 'Cerrado';
export type PrioridadTicket = 'Baja' | 'Media' | 'Alta' | 'Critica';
/** La categoria proviene del catalogo administrable, no de una lista fija. */
export type CategoriaTicket = string;

export interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
  color: string;
  icono: string;
  activo: boolean;
  fecha_creacion: string;
  total_tickets: number;
}

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

export interface Adjunto {
  id: number;
  nombre: string;
  tipo: string;
  tamano: number;
}

export interface Comentario {
  id: number;
  mensaje: string;
  fecha: string;
  usuario_id: number;
  usuario_nombre: string;
  usuario_rol: string;
  adjuntos: Adjunto[];
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
