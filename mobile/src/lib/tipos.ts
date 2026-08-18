export type EstadoTicket = 'Abierto' | 'En Proceso' | 'Resuelto' | 'Cerrado';
export type PrioridadTicket = 'Baja' | 'Media' | 'Alta' | 'Critica';
/** La categoria proviene del catalogo administrable. */
export type CategoriaTicket = string;

export interface Usuario {
  id: number;
  nombre: string;
  usuario: string;
  rol: string;
  area: string;
  permisos: string[];
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
  asignado_nombre: string | null;
  resuelto_por_nombre: string | null;
  horas_atencion: number | null;
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
