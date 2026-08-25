import {
  AlertTriangle, CheckCircle2, ClipboardCheck, Clock, Inbox, Layers,
  PauseCircle, PlayCircle, Server, SignalHigh, UserCheck, Wrench
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Indicador } from '../../../components/Ui';
import type { Indicadores } from '../../../lib/tipos';

type Tono = 'neutro' | 'info' | 'advertencia' | 'exito' | 'critico';

const GRUPOS: { titulo: string; columnas: string; filas: [keyof Indicadores, string, LucideIcon, Tono][] }[] = [
  {
    titulo: 'Tickets por estado',
    columnas: 'sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
    filas: [
      ['nuevos', 'Nuevos', Inbox, 'info'],
      ['asignados', 'Asignados', UserCheck, 'info'],
      ['en_proceso', 'En proceso', PlayCircle, 'advertencia'],
      ['en_espera', 'En espera', PauseCircle, 'advertencia'],
      ['resueltos', 'Resueltos', CheckCircle2, 'exito'],
      ['cerrados', 'Cerrados', ClipboardCheck, 'neutro']
    ]
  },
  {
    titulo: 'Atencion y riesgo',
    columnas: 'sm:grid-cols-2 lg:grid-cols-4',
    filas: [
      ['abiertos', 'Abiertos', Layers, 'info'],
      ['criticos', 'Criticos abiertos', AlertTriangle, 'critico'],
      ['altos', 'Prioridad alta', SignalHigh, 'advertencia'],
      ['vencidos', 'Fuera de objetivo', Clock, 'critico']
    ]
  },
  {
    titulo: 'Carga del area',
    columnas: 'sm:grid-cols-2 lg:grid-cols-3',
    filas: [
      ['mantenimientos', 'Mantenimientos', Wrench, 'neutro'],
      ['pendientes_ibs', 'Pendientes IBS', Server, 'neutro'],
      ['total', 'Total historico', Layers, 'neutro']
    ]
  }
];

export const IndicadoresSistemas = ({ resumen }: { resumen: Indicadores }) => (
  <div className="space-y-5">
    {GRUPOS.map((grupo) => (
      <div key={grupo.titulo}>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {grupo.titulo}
        </p>
        <div className={`grid gap-4 ${grupo.columnas}`}>
          {grupo.filas.map(([clave, etiqueta, icono, tono]) => (
            <Indicador key={clave} etiqueta={etiqueta} valor={resumen[clave] ?? 0} icono={icono} tono={tono} />
          ))}
        </div>
      </div>
    ))}
  </div>
);
