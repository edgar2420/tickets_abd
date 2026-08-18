import type { ReactNode } from 'react';
import { AlertTriangle, Info, Loader2, type LucideIcon } from 'lucide-react';

export const Etiqueta = ({ texto, clase }: { texto: string; clase: string }) => (
  <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${clase}`}>
    {texto}
  </span>
);

export const Panel = ({ titulo, icono: Icono, acciones, children }:
  { titulo?: string; icono?: LucideIcon; acciones?: ReactNode; children: ReactNode }) => (
  <section className="panel">
    {titulo && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-institucional-900">
          {Icono && <Icono className="h-4 w-4 text-institucional-700" />}
          {titulo}
        </h2>
        {acciones}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

export const Indicador = ({ etiqueta, valor, icono: Icono, color = 'text-institucional-700' }:
  { etiqueta: string; valor: number | string; icono: LucideIcon; color?: string }) => (
  <div className="panel flex items-center gap-4 p-4">
    <span className={`rounded-md bg-slate-50 p-2.5 ${color}`}>
      <Icono className="h-6 w-6" />
    </span>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</p>
      <p className="text-2xl font-bold text-institucional-900">{valor}</p>
    </div>
  </div>
);

export const Cargando = ({ texto = 'Cargando informacion' }: { texto?: string }) => (
  <div className="flex items-center justify-center gap-2 py-10 text-sm text-slate-500">
    <Loader2 className="h-4 w-4 animate-spin" />
    {texto}
  </div>
);

export const Vacio = ({ texto }: { texto: string }) => (
  <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-slate-500">
    <Info className="h-6 w-6 text-slate-400" />
    {texto}
  </div>
);

export const Alerta = ({ mensaje }: { mensaje: string }) => (
  <div className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-800">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <span>{mensaje}</span>
  </div>
);

export const Modal = ({ titulo, icono: Icono, abierto, alCerrar, children, ancho = 'max-w-2xl' }:
  { titulo: string; icono?: LucideIcon; abierto: boolean; alCerrar: () => void; children: ReactNode; ancho?: string }) => {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8">
      <div className={`w-full ${ancho} rounded-lg bg-white shadow-xl`}>
        <header className="flex items-center justify-between border-b border-slate-200 px-5 py-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-institucional-900">
            {Icono && <Icono className="h-4 w-4 text-institucional-700" />}
            {titulo}
          </h3>
          <button type="button" onClick={alCerrar} className="text-slate-400 transition hover:text-slate-700" aria-label="Cerrar">
            <span className="text-lg leading-none">&times;</span>
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};
