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
export type EstadoArticulo = 'Disponible' | 'En reparacion' | 'En resguardo' | 'De baja';

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
  estado: EstadoArticulo;
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

export type TipoSucursal = 'Fabrica' | 'Casa Central' | 'Sucursal' | 'Planta' | 'Oficina' | 'Deposito';

export interface Sucursal {
  id: number;
  codigo: string;
  nombre: string;
  ciudad: string | null;
  tipo: TipoSucursal;
  direccion: string | null;
  activo: boolean;
  fecha_creacion: string;
  total_usuarios: number;
  total_equipos: number;
  total_tickets: number;
}

export type EstadoCompra =
  | 'Solicitada' | 'En revision' | 'Aprobada por TI'
  | 'Aprobada por Gerencia' | 'Comprada' | 'Entregada' | 'Rechazada';

export interface SolicitudCompra {
  id: number;
  titulo: string;
  justificacion: string;
  tipo_equipo: string;
  cantidad: number;
  especificaciones: string | null;
  prioridad: PrioridadTicket;
  estado: EstadoCompra;
  fecha_creacion: string;
  solicitante_id: number;
  solicitante_nombre: string;
  sucursal_id: number | null;
  sucursal_nombre: string | null;
  area_id: number | null;
  area_nombre: string | null;
  revisado_por_nombre: string | null;
  fecha_revision: string | null;
  observacion_ti: string | null;
  monto_estimado: string | null;
  equipo_sugerido: string | null;
  aprobado_por_nombre: string | null;
  aprobado_por_rol: string | null;
  aprobado_por_area: string | null;
  revisado_por_rol: string | null;
  fecha_aprobacion: string | null;
  observacion_gerencia: string | null;
  rechazado_por_nombre: string | null;
  fecha_rechazo: string | null;
  motivo_rechazo: string | null;
  comprado_por_nombre: string | null;
  fecha_compra: string | null;
  numero_orden: string | null;
  monto_final: string | null;
  entregado_por_nombre: string | null;
  fecha_entrega: string | null;
  equipo_id: number | null;
  equipo_codigo: string | null;
}

export interface ResumenCompras {
  total: number;
  solicitadas: number;
  en_revision: number;
  esperando_gerencia: number;
  aprobadas: number;
  compradas: number;
  entregadas: number;
  rechazadas: number;
  monto_ejecutado: number;
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
  tiene_password: boolean;
  usuario_id: number | null;
  usuario_nombre: string | null;
  area_id: number | null;
  area_nombre: string | null;
  sucursal_id: number | null;
  sucursal_nombre: string | null;
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
  sucursal_id: number | null;
  sucursal: string | null;
  sucursal_codigo?: string | null;
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
  sucursal_id: number | null;
  sucursal_nombre: string | null;
  sucursal_codigo: string | null;
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

export interface FilaMensual {
  etiqueta: string;
  creados: number;
  abiertos: number;
  en_proceso: number;
  resueltos: number;
  cerrados: number;
}

export interface FilaTecnico {
  etiqueta: string;
  atendidos: number;
  resueltos: number;
  cerrados: number;
}

export interface TicketDelPeriodo {
  id: number;
  titulo: string;
  categoria: string;
  prioridad: PrioridadTicket;
  estado: EstadoTicket;
  solicitante_nombre: string;
  sucursal_nombre: string;
  atendido_por: string | null;
  fecha_creacion: string;
  fecha_resolucion: string | null;
  fecha_cierre: string | null;
}

export interface TotalesMensuales {
  creados: number;
  atendidos: number;
  resueltos: number;
  cerrados: number;
  pendientes: number;
  criticos: number;
}

export interface ReporteMensual {
  mes: string;
  nombre: string;
  filtros: { sucursal_id: string; categoria: string; prioridad: string };
  filtroSucursal: string | null;
  totales: TotalesMensuales;
  anterior: { mes: string; nombre: string; totales: TotalesMensuales };
  variacion: {
    creados: number | null;
    atendidos: number | null;
    resueltos: number | null;
    cerrados: number | null;
  };
  categorias: FilaMensual[];
  sucursales: FilaMensual[];
  areas: FilaMensual[];
  solicitantes: FilaMensual[];
  tecnicos: FilaTecnico[];
  porDia: { etiqueta: string; creados: number; resueltos: number }[];
  tickets: TicketDelPeriodo[];
}

export type TipoProyecto = 'Mejora' | 'Software nuevo' | 'Automatizacion' | 'Integracion' | 'Reporte';
export type EstadoProyecto =
  | 'Recibida' | 'En evaluacion' | 'Aprobada' | 'En desarrollo' | 'En pruebas' | 'Implementada' | 'Rechazada';
export type Escala = 'Bajo' | 'Medio' | 'Alto';
export type Frecuencia = 'Diaria' | 'Semanal' | 'Mensual' | 'Ocasional';

export interface SolicitudProyecto {
  id: number;
  titulo: string;
  tipo: TipoProyecto;
  problema: string;
  situacion_actual: string;
  propuesta: string;
  beneficio: string;
  personas_afectadas: number;
  frecuencia: Frecuencia;
  urgencia: PrioridadTicket;
  sistemas_actuales: string | null;
  estado: EstadoProyecto;
  fecha_creacion: string;
  solicitante_id: number;
  solicitante_nombre: string;
  sucursal_id: number | null;
  sucursal_nombre: string;
  area_id: number | null;
  area_nombre: string;
  evaluado_por_id: number | null;
  evaluado_por_nombre: string | null;
  fecha_evaluacion: string | null;
  evaluacion_ti: string | null;
  esfuerzo_estimado: Escala | null;
  valor_estimado: Escala | null;
  aprobado_por_id: number | null;
  aprobado_por_nombre: string | null;
  fecha_aprobacion: string | null;
  observacion_aprobacion: string | null;
  responsable_id: number | null;
  responsable_nombre: string | null;
  fecha_inicio: string | null;
  fecha_entrega: string | null;
  avance: number;
  rechazado_por_id: number | null;
  rechazado_por_nombre: string | null;
  fecha_rechazo: string | null;
  motivo_rechazo: string | null;
}

export interface ResumenProyectos {
  total: number;
  recibidas: number;
  en_evaluacion: number;
  aprobadas: number;
  en_curso: number;
  implementadas: number;
  rechazadas: number;
}
