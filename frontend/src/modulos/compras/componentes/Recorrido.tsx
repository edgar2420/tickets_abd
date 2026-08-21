import { Check } from 'lucide-react';
import { PASOS, enManosDe, pasoAlcanzado } from '../recorrido';
import type { EstadoCompra } from '../../../lib/tipos';

const marcador = (cumplido: boolean, enCurso: boolean, rechazada: boolean) => {
  if (cumplido) return 'border-emerald-500 bg-emerald-500 text-white';
  if (enCurso) return 'border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (rechazada) return 'border-red-300 bg-red-50 text-red-400 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400';
  return 'border-slate-300 bg-white text-slate-400 dark:border-noche-600 dark:bg-noche-800 dark:text-slate-500';
};

const rotulo = (cumplido: boolean, enCurso: boolean) => {
  if (cumplido) return 'text-emerald-700 dark:text-emerald-400';
  if (enCurso) return 'text-amber-700 dark:text-amber-300';
  return 'text-slate-400 dark:text-slate-500';
};

const resumen = (estado: EstadoCompra) => {
  if (estado === 'Rechazada') return 'border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-400';
  if (estado === 'Entregada') return 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400';
  return 'border-slate-200 text-amber-700 dark:border-noche-700 dark:text-amber-300';
};

export const Recorrido = ({ estado }: { estado: EstadoCompra }) => {
  const alcanzado = pasoAlcanzado(estado);
  const rechazada = estado === 'Rechazada';

  return (
    <div className="superficie p-4">
      <div className="flex items-center justify-between gap-1">
        {PASOS.map((paso, indice) => {
          const cumplido = indice <= alcanzado;
          const enCurso = indice === alcanzado + 1 && !rechazada;

          return (
            <div key={paso} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${indice === 0 ? 'bg-transparent'
                  : cumplido ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-noche-700'}`} />
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold
                  ${marcador(cumplido, enCurso, rechazada)}`}>
                  {cumplido ? <Check className="h-4 w-4" /> : indice + 1}
                </span>
                <span className={`h-0.5 flex-1 ${indice === PASOS.length - 1 ? 'bg-transparent'
                  : indice < alcanzado ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-noche-700'}`} />
              </div>
              <span className={`text-xs font-semibold leading-tight ${rotulo(cumplido, enCurso)}`}>{paso}</span>
            </div>
          );
        })}
      </div>
      <p className={`mt-3 border-t pt-3 text-center text-sm font-semibold ${resumen(estado)}`}>
        {enManosDe(estado)}
      </p>
    </div>
  );
};
