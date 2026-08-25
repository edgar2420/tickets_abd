import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export const PaginaEstado = ({ codigo, icono: Icono, titulo, mensaje, detalle, tono = 'neutro', children }: {
  codigo?: string;
  icono: LucideIcon;
  titulo: string;
  mensaje: string;
  detalle?: string | null;
  tono?: 'neutro' | 'critico';
  children?: ReactNode;
}) => (
  <div className="flex min-h-[60vh] items-center justify-center px-4 py-10">
    <div className="panel animar-entrada w-full max-w-xl p-10 text-center">
      <span
        className={`mx-auto flex h-16 w-16 items-center justify-center rounded-2xl ${tono === 'critico'
          ? 'bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300'
          : 'bg-institucional-50 text-institucional-700 dark:bg-institucional-500/15 dark:text-institucional-300'}`}
      >
        <Icono className="h-8 w-8" />
      </span>

      {codigo && (
        <p className="mt-5 text-5xl font-bold tracking-tight text-institucional-900 dark:text-slate-100">
          {codigo}
        </p>
      )}

      <h1 className="mt-3 text-lg font-bold text-institucional-900 dark:text-slate-100">{titulo}</h1>
      <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-600 dark:text-slate-200">
        {mensaje}
      </p>

      {detalle && (
        <p className="mx-auto mt-4 max-w-md break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500 dark:border-noche-700 dark:bg-noche-800 dark:text-slate-300">
          {detalle}
        </p>
      )}

      {children && <div className="mt-6 flex flex-wrap justify-center gap-2">{children}</div>}
    </div>
  </div>
);
