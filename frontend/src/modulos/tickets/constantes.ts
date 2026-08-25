import type { EstadoTicket, PrioridadTicket, ServicioTicket } from '../../lib/tipos';

export const SERVICIOS: ServicioTicket[] = [
  'Soporte informatico', 'Redes', 'Telefonia', 'CCTV', 'Servidores',
  'IBS', 'Desarrollo', 'Mantenimiento', 'Proyectos', 'Gestion tecnologica'
];

export const ESTADOS: EstadoTicket[] = [
  'Nuevo', 'Asignado', 'En Proceso', 'En Espera', 'Resuelto', 'Cerrado'
];

export const PRIORIDADES: PrioridadTicket[] = ['Critica', 'Alta', 'Media', 'Baja'];

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

export const ACCIONES_POR_ESTADO: Record<EstadoTicket, string[]> = {
  Nuevo: ['tomar', 'asignar', 'prioridad'],
  Asignado: ['iniciar', 'asignar', 'prioridad', 'espera'],
  'En Proceso': ['espera', 'resolver', 'asignar', 'prioridad'],
  'En Espera': ['iniciar', 'prioridad'],
  Resuelto: ['cerrar', 'iniciar'],
  Cerrado: []
};
