import type { EstadoTicket, PrioridadTicket, ServicioTicket, TipoTicket } from '../../lib/tipos';

export const TIPOS: TipoTicket[] = ['Incidente', 'Requerimiento', 'Mantenimiento', 'Desarrollo'];

export const SERVICIOS: ServicioTicket[] = [
  'Soporte informatico', 'Redes', 'Telefonia', 'CCTV', 'Servidores',
  'IBS', 'Desarrollo', 'Mantenimiento', 'Proyectos', 'Gestion tecnologica'
];

export const ESTADOS: EstadoTicket[] = [
  'Nuevo', 'Asignado', 'En Proceso', 'En Espera', 'Resuelto', 'Cerrado'
];

export const PRIORIDADES: PrioridadTicket[] = ['Critica', 'Alta', 'Media', 'Baja'];

export const AYUDA_TIPO: Record<TipoTicket, string> = {
  Incidente: 'Algo dejo de funcionar: una PC, una camara, un telefono, un servicio.',
  Requerimiento: 'Hace falta algo nuevo: instalar un equipo, crear un usuario, mover una maquina.',
  Mantenimiento: 'Limpieza, revision preventiva o inspeccion programada.',
  Desarrollo: 'Un modulo, una automatizacion o un reporte nuevo.'
};

export const AYUDA_SERVICIO: Record<ServicioTicket, string> = {
  'Soporte informatico': 'PC, laptops, impresoras, software y perifericos',
  Redes: 'Internet, LAN, Wi-Fi, switches, cableado y puntos de red',
  Telefonia: 'Telefonos, extensiones, central y puntos telefonicos',
  CCTV: 'Camaras, NVR, DVR, grabacion y cableado',
  Servidores: 'IBS, Oracle, Windows Server, hardware y respaldos',
  IBS: 'Incidentes, consultas, reportes y modulos del sistema',
  Desarrollo: 'Sistemas, automatizaciones, reportes e integraciones',
  Mantenimiento: 'Preventivo y correctivo',
  Proyectos: 'Implementaciones tecnologicas e infraestructura',
  'Gestion tecnologica': 'Inventario, seguridad, proveedores e indicadores'
};

export const OBJETIVOS: Record<PrioridadTicket, { horas: number; texto: string; criterio: string }> = {
  Critica: {
    horas: 2,
    texto: 'Inmediata',
    criterio: 'Operacion detenida, IBS caido, red general caida, problema critico de produccion'
  },
  Alta: {
    horas: 8,
    texto: 'Prioritaria',
    criterio: 'Afecta significativamente a un area, usuario critico o servicio importante'
  },
  Media: {
    horas: 24,
    texto: 'Dentro de la jornada',
    criterio: 'Problema operativo normal'
  },
  Baja: {
    horas: 72,
    texto: 'Programada',
    criterio: 'Mejora o requerimiento no urgente'
  }
};

export const ESTILO_TIPO: Record<TipoTicket, string> = {
  Incidente: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  Requerimiento: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  Mantenimiento: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
  Desarrollo: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30'
};

export const TICKET_VACIO = {
  titulo: '',
  descripcion: '',
  tipo: 'Incidente' as TipoTicket,
  servicio: 'Soporte informatico' as ServicioTicket,
  categoria: '',
  ubicacion: '',
  equipo_id: '',
  observaciones: ''
};

export const ACCIONES_POR_ESTADO: Record<EstadoTicket, string[]> = {
  Nuevo: ['tomar', 'asignar', 'prioridad'],
  Asignado: ['iniciar', 'asignar', 'prioridad', 'espera'],
  'En Proceso': ['espera', 'resolver', 'asignar', 'prioridad'],
  'En Espera': ['iniciar', 'prioridad'],
  Resuelto: ['cerrar', 'iniciar'],
  Cerrado: []
};
