import type { EstadoCompra } from '../../lib/tipos';

export const PASOS = ['Registro', 'Revision de TI', 'Aprobacion de Gerencia', 'Compra', 'Entrega'] as const;

const ALCANCE: Record<EstadoCompra, number> = {
  'Rechazada': -1,
  'Solicitada': 0,
  'En revision': 0,
  'Aprobada por TI': 1,
  'Aprobada por Gerencia': 2,
  'Comprada': 3,
  'Entregada': 4
};

const RESPONSABLES: Record<EstadoCompra, string> = {
  'Solicitada': 'Esperando la revision tecnica de TI',
  'En revision': 'TI la esta revisando',
  'Aprobada por TI': 'Esperando la aprobacion de Gerencia',
  'Aprobada por Gerencia': 'Esperando que TI ejecute la compra',
  'Comprada': 'Esperando la entrega al solicitante',
  'Entregada': 'Circuito concluido',
  'Rechazada': 'Circuito interrumpido'
};

export const pasoAlcanzado = (estado: EstadoCompra) => ALCANCE[estado];

export const enManosDe = (estado: EstadoCompra) => RESPONSABLES[estado];
