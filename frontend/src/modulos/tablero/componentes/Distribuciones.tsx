import { Users } from 'lucide-react';
import { Vacio } from '../../../components/Ui';
import type { Distribucion } from '../../../lib/tipos';

export interface Ranking extends Distribucion {
  detalle?: string;
}

export const BarraDistribucion = ({ filas }: { filas: Distribucion[] }) => {
  const maximo = Math.max(1, ...filas.map((f) => f.total));
  return (
    <ul className="space-y-3">
      {filas.map((fila) => (
        <li key={fila.etiqueta}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">{fila.etiqueta}</span>
            <span className="font-semibold text-institucional-900 dark:text-institucional-200">{fila.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-noche-700">
            <div
              className="h-full rounded-full bg-institucional-700 transition-all duration-500"
              style={{ width: `${(fila.total / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {filas.length === 0 && <li className="text-xs text-slate-500 dark:text-slate-300">Sin datos disponibles</li>}
    </ul>
  );
};

export const RankingSolicitantes = ({ filas }: { filas: Ranking[] }) => {
  if (filas.length === 0) return <Vacio icono={Users} texto="Todavia no hay tickets registrados" />;
  const maximo = Math.max(1, ...filas.map((f) => f.total));
  return (
    <ol className="space-y-3">
      {filas.map((fila, indice) => (
        <li key={fila.etiqueta} className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            indice === 0
              ? 'bg-institucional-900 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-noche-700 dark:text-slate-200'
          }`}>
            {indice + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{fila.etiqueta}</p>
              <p className="shrink-0 text-sm font-bold text-institucional-900 dark:text-institucional-200">{fila.total}</p>
            </div>
            {fila.detalle && <p className="truncate text-xs text-slate-400 dark:text-slate-400">{fila.detalle}</p>}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-noche-700">
              <div className="h-full rounded-full bg-institucional-600" style={{ width: `${(fila.total / maximo) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};
