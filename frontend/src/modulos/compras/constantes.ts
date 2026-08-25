import type { EstadoCompra, PrioridadTicket } from '../../lib/tipos';

export const TIPOS_EQUIPO = ['Escritorio', 'Laptop', 'Servidor', 'Impresora', 'Monitor', 'Red', 'Otro'];

export const PRIORIDADES: PrioridadTicket[] = ['Baja', 'Media', 'Alta', 'Critica'];

export const ESTADOS: EstadoCompra[] = [
  'Solicitada', 'En revision', 'Aprobada por TI', 'Aprobada por Gerencia', 'Comprada', 'Entregada', 'Rechazada'
];

export const ESTILO_ESTADO: Record<EstadoCompra, string> = {
  'Solicitada': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'En revision': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'Aprobada por TI': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'Aprobada por Gerencia': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Comprada': 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'Entregada': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'Rechazada': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
};

export const codigoCompra = (id: number) => `SC-${String(id).padStart(5, '0')}`;

export const SOLICITUD_VACIA = {
  titulo: '',
  justificacion: '',
  tipo_equipo: 'Escritorio',
  cantidad: '1',
  especificaciones: ''
};

export type TipoAccion = 'revisar' | 'aprobar-ti' | 'aprobar-gerencia' | 'rechazar' | 'comprar' | 'entregar';

export const TITULOS_ACCION: Record<TipoAccion, string> = {
  revisar: 'Revision tecnica: sugerir el equipo',
  'aprobar-ti': 'Aprobar tecnicamente y elevar a Gerencia',
  'aprobar-gerencia': 'Aprobacion de Gerencia',
  rechazar: 'Rechazar la solicitud',
  comprar: 'Registrar la compra ejecutada',
  entregar: 'Registrar la entrega'
};

export const ACCIONES_AMPLIAS: TipoAccion[] = ['revisar', 'aprobar-ti', 'aprobar-gerencia'];

export const cuerpoDeAccion = (tipo: TipoAccion, datos: Record<string, string>): unknown => {
  const revision = {
    observacion_ti: datos.observacion_ti || null,
    monto_estimado: datos.monto_estimado ? Number(datos.monto_estimado) : null,
    equipo_sugerido: datos.equipo_sugerido || null,
    ...(datos.prioridad ? { prioridad: datos.prioridad } : {})
  };

  const cuerpos: Record<TipoAccion, unknown> = {
    revisar: revision,
    'aprobar-ti': revision,
    'aprobar-gerencia': { observacion_gerencia: datos.observacion_gerencia || null },
    rechazar: { motivo_rechazo: datos.motivo_rechazo ?? '' },
    comprar: {
      numero_orden: datos.numero_orden || null,
      monto_final: datos.monto_final ? Number(datos.monto_final) : null
    },
    entregar: { equipo_id: datos.equipo_id ? Number(datos.equipo_id) : null }
  };

  return cuerpos[tipo];
};
