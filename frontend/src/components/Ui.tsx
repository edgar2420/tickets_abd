import type { KeyboardEvent, ReactNode } from 'react';
import {
  AlertTriangle, Code2, Info, KeyRound, Loader2, Monitor, Network, Phone,
  Server, Tag, Wrench, type LucideIcon
} from 'lucide-react';
import { textoCategoria } from '../lib/formato';

export const Etiqueta = ({ texto, clase }: { texto: string; clase: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${clase}`}>
    {texto}
  </span>
);

const ICONOS_CATEGORIA: Record<string, LucideIcon> = {
  monitor: Monitor,
  codigo: Code2,
  red: Network,
  llave: KeyRound,
  etiqueta: Tag,
  herramienta: Wrench,
  servidor: Server,
  telefono: Phone
};

export const IconoCategoria = ({ icono, color = 'pizarra', clase = 'h-4 w-4' }:
  { icono: string; color?: string; clase?: string }) => {
  const Icono = ICONOS_CATEGORIA[icono] ?? Tag;
  return <Icono className={`${clase} ${textoCategoria[color] ?? textoCategoria.pizarra}`} />;
};

export const nombresIconos = Object.keys(ICONOS_CATEGORIA);

export const EncabezadoPagina = ({ titulo, descripcion, icono: Icono, children }:
  { titulo: string; descripcion?: string; icono?: LucideIcon; children?: ReactNode }) => (
  <header className="flex flex-wrap items-start justify-between gap-4">
    <div className="flex items-start gap-3">
      {Icono && (
        <span className="rounded-xl bg-institucional-900 p-2.5 text-white shadow-sm">
          <Icono className="h-5 w-5" />
        </span>
      )}
      <div>
        <h1 className="text-xl font-bold tracking-tight text-institucional-900 dark:text-slate-100">{titulo}</h1>
        {descripcion && <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-300">{descripcion}</p>}
      </div>
    </div>
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </header>
);

export const Panel = ({ titulo, icono: Icono, acciones, children, clase = '' }:
  { titulo?: string; icono?: LucideIcon; acciones?: ReactNode; children: ReactNode; clase?: string }) => (
  <section className={`panel animar-entrada ${clase}`}>
    {titulo && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5 dark:border-noche-700">
        <h2 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-institucional-900 dark:text-slate-100">
          {Icono && <Icono className="h-4 w-4 text-institucional-700 dark:text-institucional-300" />}
          {titulo}
        </h2>
        {acciones}
      </header>
    )}
    <div className="p-5">{children}</div>
  </section>
);

type Tono = 'neutro' | 'info' | 'advertencia' | 'exito' | 'critico';

const TONOS: Record<Tono, { fondo: string; icono: string }> = {
  neutro: { fondo: 'bg-institucional-50 dark:bg-institucional-500/15', icono: 'text-institucional-700 dark:text-institucional-300' },
  info: { fondo: 'bg-sky-50 dark:bg-sky-500/15', icono: 'text-sky-700 dark:text-sky-300' },
  advertencia: { fondo: 'bg-amber-50 dark:bg-amber-500/15', icono: 'text-amber-600 dark:text-amber-300' },
  exito: { fondo: 'bg-emerald-50 dark:bg-emerald-500/15', icono: 'text-emerald-700 dark:text-emerald-300' },
  critico: { fondo: 'bg-rose-50 dark:bg-rose-500/15', icono: 'text-rose-700 dark:text-rose-300' }
};

export const Indicador = ({ etiqueta, valor, icono: Icono, tono = 'neutro', pie }:
  { etiqueta: string; valor: number | string; icono: LucideIcon; tono?: Tono; pie?: string }) => (
  <div className="panel-interactivo animar-entrada flex items-center gap-4 p-4">
    <span className={`rounded-xl p-3 ${TONOS[tono].fondo} ${TONOS[tono].icono}`}>
      <Icono className="h-6 w-6" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{etiqueta}</p>
      <p className="text-2xl font-bold leading-tight text-institucional-900 dark:text-slate-100">{valor}</p>
      {pie && <p className="truncate text-xs text-slate-400 dark:text-slate-400">{pie}</p>}
    </div>
  </div>
);

export const Cargando = ({ texto = 'Cargando informacion' }: { texto?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500 dark:text-slate-300">
    <Loader2 className="h-4 w-4 animate-spin text-institucional-700 dark:text-institucional-300" />
    {texto}
  </div>
);

export const Vacio = ({ texto, icono: Icono = Info, accion }:
  { texto: string; icono?: LucideIcon; accion?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
    <span className="rounded-full bg-slate-100 p-4 text-slate-400 dark:bg-noche-800 dark:text-slate-400">
      <Icono className="h-7 w-7" />
    </span>
    <p className="max-w-sm text-sm text-slate-500 dark:text-slate-300">{texto}</p>
    {accion}
  </div>
);

export const Dato = ({ etiqueta, valor }: { etiqueta: string; valor?: string | number | null }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{etiqueta}</p>
    <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">
      {valor === null || valor === undefined || valor === '' ? 'Pendiente' : valor}
    </p>
  </div>
);

export const Alerta = ({ mensaje }: { mensaje: string }) => (
  <div className="animar-entrada flex items-start gap-2.5 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
    <span>{mensaje}</span>
  </div>
);

export const Modal = ({ titulo, icono: Icono, abierto, alCerrar, children, ancho = 'max-w-2xl' }:
  { titulo: string; icono?: LucideIcon; abierto: boolean; alCerrar: () => void; children: ReactNode; ancho?: string }) => {
  if (!abierto) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm sm:p-8">
      <div className={`animar-entrada w-full ${ancho} overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-noche-850`}>
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4 dark:bg-noche-800 dark:border-noche-700">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-institucional-900 dark:text-slate-100">
            {Icono && <Icono className="h-4 w-4 text-institucional-700 dark:text-institucional-300" />}
            {titulo}
          </h3>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400"
            aria-label="Cerrar"
          >
            <span className="text-lg leading-none">&times;</span>
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const BotonAccion = ({ icono: Icono, rotulo, alPulsar, tono = 'neutro', deshabilitado = false }: {
  icono: LucideIcon;
  rotulo: string;
  alPulsar: () => void;
  tono?: 'neutro' | 'peligro' | 'exito';
  deshabilitado?: boolean;
}) => {
  const estilos = {
    neutro: 'boton-icono',
    peligro: 'boton-icono-peligro',
    exito: 'boton-icono border-emerald-200 text-emerald-700 hover:border-emerald-300 hover:bg-emerald-50 '
      + 'dark:border-emerald-800 dark:text-emerald-400 dark:hover:border-emerald-600 dark:hover:bg-emerald-950'
  };

  return (
    <div className="group/accion relative">
      <button
        type="button"
        onClick={alPulsar}
        disabled={deshabilitado}
        aria-label={rotulo}
        className={estilos[tono]}
      >
        <Icono className="h-4 w-4" />
      </button>
      <span
        role="tooltip"
        className="pointer-events-none absolute -top-8 left-1/2 z-30 -translate-x-1/2 whitespace-nowrap rounded-md
                   bg-institucional-900 px-2 py-1 text-[11px] font-medium text-white opacity-0 shadow-lg
                   transition-opacity duration-150 group-hover/accion:opacity-100
                   dark:bg-noche-700 dark:text-slate-100"
      >
        {rotulo}
      </span>
    </div>
  );
};

export const Acciones = ({ children }: { children: ReactNode }) => (
  <div
    className="flex items-center justify-end gap-1.5"
    onClick={(e) => e.stopPropagation()}
    onKeyDown={(e) => e.stopPropagation()}
    role="presentation"
  >
    {children}
  </div>
);

export const filaAccionable = (alAbrir: () => void, rotulo = 'Abrir detalle') => ({
  onClick: alAbrir,
  onKeyDown: (evento: KeyboardEvent<HTMLTableRowElement>) => {
    if (evento.key === 'Enter' || evento.key === ' ') {
      evento.preventDefault();
      alAbrir();
    }
  },
  role: 'button' as const,
  tabIndex: 0,
  title: rotulo,
  className: 'cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-inset '
    + 'focus-visible:ring-institucional-600 dark:focus-visible:ring-institucional-400'
});
