export const SERVICIOS = [
  'Soporte informatico', 'Redes', 'Telefonia', 'CCTV', 'Servidores',
  'IBS', 'Desarrollo', 'Mantenimiento', 'Proyectos', 'Gestion tecnologica'
];

export const ESTADOS = ['Nuevo', 'Asignado', 'En Proceso', 'En Espera', 'Resuelto', 'Cerrado'];

export const ESTADOS_ABIERTOS = ['Nuevo', 'Asignado', 'En Proceso', 'En Espera'];

export const PRIORIDADES = ['Critica', 'Alta', 'Media', 'Baja'];

export const OBJETIVOS = {
  Critica: { horas: 2, texto: 'Inmediata', criterio: 'Operacion detenida, IBS caido, red general caida' },
  Alta: { horas: 8, texto: 'Prioritaria', criterio: 'Afecta a un area, usuario critico o servicio importante' },
  Media: { horas: 24, texto: 'Dentro de la jornada', criterio: 'Problema operativo normal' },
  Baja: { horas: 72, texto: 'Programada', criterio: 'Mejora o requerimiento no urgente' }
};

export const PRIORIDAD_INICIAL = 'Media';

export const TRANSICIONES = {
  Nuevo: ['Asignado', 'En Proceso'],
  Asignado: ['En Proceso', 'En Espera'],
  'En Proceso': ['En Espera', 'Resuelto'],
  'En Espera': ['En Proceso'],
  Resuelto: ['Cerrado', 'En Proceso'],
  Cerrado: []
};

export const puedePasar = (desde, hasta) => (TRANSICIONES[desde] ?? []).includes(hasta);

export const codigoTicket = (ticket) => {
  if (typeof ticket === 'number') return `SYS-${new Date().getFullYear()}-${String(ticket).padStart(5, '0')}`;
  const anio = ticket?.anio ?? new Date(ticket?.fecha_creacion ?? Date.now()).getFullYear();
  const numero = ticket?.numero ?? ticket?.id ?? 0;
  return `SYS-${anio}-${String(numero).padStart(5, '0')}`;
};

export const fechaObjetivo = (prioridad, desde = new Date()) => {
  const objetivo = OBJETIVOS[prioridad] ?? OBJETIVOS[PRIORIDAD_INICIAL];
  return new Date(new Date(desde).getTime() + objetivo.horas * 3600 * 1000);
};

export const estaVencido = (ticket) => {
  if (!ticket?.fecha_objetivo) return false;
  if (!ESTADOS_ABIERTOS.includes(ticket.estado)) return false;
  return new Date(ticket.fecha_objetivo) < new Date();
};

export const duracionLegible = (minutos) => {
  if (minutos === null || minutos === undefined) return null;
  const total = Math.max(0, Number(minutos));
  const horas = Math.floor(total / 60);
  const resto = total % 60;
  if (horas === 0) return `${resto} min`;
  if (resto === 0) return `${horas} h`;
  return `${horas} h ${resto} min`;
};
