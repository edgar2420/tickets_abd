import { ShieldCheck } from 'lucide-react';

export const PiePagina = () => (
  <footer className="shrink-0 border-t border-slate-200 bg-white px-6 py-3 dark:bg-noche-850 dark:border-noche-700">
    <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row dark:text-slate-300">
      <p className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-institucional-700 dark:text-institucional-300" />
        <span className="font-semibold text-institucional-900 dark:text-slate-100">Ing. Edgar Rojas Apaza</span>
        <span className="text-slate-400 dark:text-slate-400">|</span>
        <span>Desarrollo de Modulo de Tickets</span>
      </p>
      <p>Sistema de Gestion de Tickets TI - Version 2.4.1</p>
    </div>
  </footer>
);
