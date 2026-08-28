import type { EstadoTicket, PrioridadTicket, ServicioTicket } from './tipos';

export const SERVICIOS: ServicioTicket[] = [
  'Soporte informatico', 'Redes', 'Telefonia', 'CCTV', 'Servidores', 'IBS', 'Desarrollo'
];

export const ESTADOS: EstadoTicket[] = [
  'Nuevo', 'Asignado', 'En Proceso', 'En Espera', 'Resuelto', 'Cerrado'
];

export const PRIORIDADES: PrioridadTicket[] = ['Critica', 'Alta', 'Media', 'Baja'];

export const OBJETIVOS: Record<PrioridadTicket, { horas: number; texto: string }> = {
  Critica: { horas: 2, texto: 'Inmediata' },
  Alta: { horas: 8, texto: 'Prioritaria' },
  Media: { horas: 24, texto: 'Dentro de la jornada' },
  Baja: { horas: 72, texto: 'Programada' }
};

export const AYUDA_SERVICIO: Record<ServicioTicket, string> = {
  'Soporte informatico': 'PC, laptops, impresoras y perifericos',
  Redes: 'Internet, LAN, Wi-Fi, switches y cableado',
  Telefonia: 'Telefonos, extensiones y central',
  CCTV: 'Camaras, NVR, DVR y grabacion',
  Servidores: 'IBS, Oracle, Windows Server y respaldos',
  IBS: 'Incidentes, consultas y modulos del sistema',
  Desarrollo: 'Automatizaciones, reportes e integraciones',
  Mantenimiento: 'Preventivo, generado desde el plan'
};

export const FRECUENCIAS_MANTENIMIENTO = ['Mensual', 'Trimestral', 'Semestral', 'Anual'];

export const SITUACIONES_MANTENIMIENTO = ['Vencido', 'Por vencer', 'Al dia', 'Sin registro'];

export const TIPOS_EQUIPO_COMPRA = ['Escritorio', 'Laptop', 'Impresora', 'Monitor', 'Servidor', 'Red', 'Otro'];

export const TIPOS_PROYECTO = ['Mejora', 'Software nuevo', 'Automatizacion', 'Integracion', 'Reporte'];

export const FRECUENCIAS_PROYECTO = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];

export const ESTADOS_COMPRA = [
  'Solicitada', 'En revision', 'Aprobada por TI', 'Aprobada por Gerencia',
  'Comprada', 'Entregada', 'Rechazada'
];

export const ESTADOS_PROYECTO = [
  'Recibida', 'En evaluacion', 'Aprobada', 'En desarrollo', 'En pruebas', 'Implementada', 'Rechazada'
];
