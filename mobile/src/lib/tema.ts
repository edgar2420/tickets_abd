export const tema = {
  primario: '#0F2A47',
  acento: '#1D6FB8',
  fondo: '#F1F5F9',
  panel: '#FFFFFF',
  borde: '#E2E8F0',
  texto: '#1E293B',
  suave: '#64748B',
  ok: '#15803D',
  advertencia: '#B45309',
  critico: '#BE123C'
};

export const colorEstado: Record<string, string> = {
  'Abierto': '#0369A1',
  'En Proceso': '#B45309',
  'Resuelto': '#15803D',
  'Cerrado': '#475569'
};

export const colorPrioridad: Record<string, string> = {
  'Baja': '#15803D',
  'Media': '#A16207',
  'Alta': '#C2410C',
  'Critica': '#B91C1C'
};

export const codigoTicket = (id: number) => `TI-${String(id).padStart(5, '0')}`;

export const fechaHora = (valor?: string | null) =>
  valor ? new Date(valor).toLocaleString('es-BO') : 'No registrado';
