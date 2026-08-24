import type { EstadoProyecto, Escala, Frecuencia, PrioridadTicket, TipoProyecto } from '../../lib/tipos';

export const TIPOS: TipoProyecto[] = ['Mejora', 'Software nuevo', 'Automatizacion', 'Integracion', 'Reporte'];

export const FRECUENCIAS: Frecuencia[] = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];

export const URGENCIAS: PrioridadTicket[] = ['Baja', 'Media', 'Alta', 'Critica'];

export const ESCALAS: Escala[] = ['Bajo', 'Medio', 'Alto'];

export const ESTADOS: EstadoProyecto[] = [
  'Recibida', 'En evaluacion', 'Aprobada', 'En desarrollo', 'En pruebas', 'Implementada', 'Rechazada'
];

export const ESTILO_ESTADO: Record<EstadoProyecto, string> = {
  'Recibida': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'En evaluacion': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'Aprobada': 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'En desarrollo': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'En pruebas': 'bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:border-orange-500/30',
  'Implementada': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Rechazada': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
};

export const PASOS = ['Registro', 'Evaluacion de TI', 'Aprobacion', 'Desarrollo', 'Entrega'] as const;

const ALCANCE: Record<EstadoProyecto, number> = {
  'Rechazada': -1,
  'Recibida': 0,
  'En evaluacion': 1,
  'Aprobada': 2,
  'En desarrollo': 3,
  'En pruebas': 3,
  'Implementada': 4
};

const RESPONSABLES: Record<EstadoProyecto, string> = {
  'Recibida': 'Esperando la evaluacion tecnica de TI',
  'En evaluacion': 'Evaluada por TI, esperando aprobacion',
  'Aprobada': 'Aprobada, esperando el inicio del desarrollo',
  'En desarrollo': 'En construccion',
  'En pruebas': 'En pruebas antes de la entrega',
  'Implementada': 'Entregada y en uso',
  'Rechazada': 'No fue aprobada'
};

export const pasoAlcanzado = (estado: EstadoProyecto) => ALCANCE[estado];

export const enSituacion = (estado: EstadoProyecto) => RESPONSABLES[estado];

export const codigoProyecto = (id: number) => `PRY-${String(id).padStart(5, '0')}`;

export const PETICION_VACIA = {
  titulo: '',
  tipo: 'Mejora' as TipoProyecto,
  problema: '',
  situacion_actual: '',
  propuesta: '',
  beneficio: '',
  personas_afectadas: '1',
  frecuencia: 'Semanal' as Frecuencia,
  urgencia: 'Media' as PrioridadTicket,
  sistemas_actuales: ''
};

export const GUIA = [
  {
    campo: 'problema',
    titulo: 'Que problema quiere resolver',
    ayuda: 'Describa la dificultad concreta, no la solucion. Por ejemplo: "cada cierre de mes tardamos dos dias en juntar los datos de las seis sucursales".',
    minimo: 30
  },
  {
    campo: 'situacion_actual',
    titulo: 'Como lo resuelven hoy',
    ayuda: 'Cuente el procedimiento actual: planillas, correos, papel, otro sistema. Sirve para entender que se reemplaza.',
    minimo: 20
  },
  {
    campo: 'propuesta',
    titulo: 'Como se lo imagina funcionando',
    ayuda: 'Describa lo que le gustaria poder hacer. No hace falta lenguaje tecnico: "quiero entrar y ver un tablero con el consolidado del mes".',
    minimo: 30
  },
  {
    campo: 'beneficio',
    titulo: 'Que se gana con esto',
    ayuda: 'Tiempo ahorrado, errores evitados, informacion disponible antes. Es lo que se pesa al priorizar.',
    minimo: 20
  }
] as const;

export type TipoAccionProyecto = 'evaluar' | 'aprobar' | 'avance' | 'rechazar';

export const TITULOS_ACCION: Record<TipoAccionProyecto, string> = {
  evaluar: 'Evaluacion tecnica de la peticion',
  aprobar: 'Aprobar e incorporar a la cartera',
  avance: 'Registrar el avance del desarrollo',
  rechazar: 'No aprobar la peticion'
};
