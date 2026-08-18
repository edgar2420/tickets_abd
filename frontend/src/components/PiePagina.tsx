import { ShieldCheck } from 'lucide-react';

/** Pie institucional presente en toda la aplicacion web. */
export const PiePagina = () => (
  <footer className="border-t border-slate-200 bg-white px-6 py-4">
    <div className="flex flex-col items-center justify-between gap-2 text-xs text-slate-500 sm:flex-row">
      <p className="flex items-center gap-2">
        <ShieldCheck className="h-4 w-4 text-institucional-700" />
        <span className="font-semibold text-institucional-900">Ing. Edgar Rojas Apaza</span>
        <span className="text-slate-400">|</span>
        <span>Desarrollo de Modulo de Tickets</span>
      </p>
      <p>Sistema de Gestion de Tickets TI - Version 1.0.0 - Documento STD-2026-TI</p>
    </div>
  </footer>
);
