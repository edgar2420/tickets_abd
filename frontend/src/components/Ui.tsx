import type { ReactNode } from 'react';
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

/** Iconos disponibles para las categorias administrables del catalogo. */
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

/** Encabezado uniforme de cada seccion, con titulo, descripcion y acciones. */
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
        <h1 className="text-xl font-bold tracking-tight text-institucional-900">{titulo}</h1>
        {descripcion && <p className="mt-0.5 text-sm text-slate-500">{descripcion}</p>}
      </div>
    </div>
    {children && <div className="flex flex-wrap gap-2">{children}</div>}
  </header>
);

export const Panel = ({ titulo, icono: Icono, acciones, children, clase = '' }:
  { titulo?: string; icono?: LucideIcon; acciones?: ReactNode; children: ReactNode; clase?: string }) => (
  <section className={`panel animar-entrada ${clase}`}>
    {titulo && (
      <header className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-3.5">
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

export const Indicador = ({ etiqueta, valor, icono: Icono, color = 'text-institucional-700', fondo = 'bg-institucional-50', pie }:
  { etiqueta: string; valor: number | string; icono: LucideIcon; color?: string; fondo?: string; pie?: string }) => (
  <div className="panel-interactivo animar-entrada flex items-center gap-4 p-4">
    <span className={`rounded-xl p-3 ${fondo} ${color}`}>
      <Icono className="h-6 w-6" />
    </span>
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500">{etiqueta}</p>
      <p className="text-2xl font-bold leading-tight text-institucional-900">{valor}</p>
      {pie && <p className="truncate text-xs text-slate-400">{pie}</p>}
    </div>
  </div>
);

export const Cargando = ({ texto = 'Cargando informacion' }: { texto?: string }) => (
  <div className="flex items-center justify-center gap-2 py-12 text-sm text-slate-500">
    <Loader2 className="h-4 w-4 animate-spin text-institucional-700" />
    {texto}
  </div>
);

export const Vacio = ({ texto, icono: Icono = Info, accion }:
  { texto: string; icono?: LucideIcon; accion?: ReactNode }) => (
  <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
    <span className="rounded-full bg-slate-100 p-4 text-slate-400">
      <Icono className="h-7 w-7" />
    </span>
    <p className="max-w-sm text-sm text-slate-500">{texto}</p>
    {accion}
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
      <div className={`animar-entrada w-full ${ancho} overflow-hidden rounded-xl bg-white shadow-2xl`}>
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 bg-slate-50 px-5 py-4">
          <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-institucional-900">
            {Icono && <Icono className="h-4 w-4 text-institucional-700" />}
            {titulo}
          </h3>
          <button
            type="button"
            onClick={alCerrar}
            className="rounded-md p-1.5 text-slate-400 transition hover:bg-slate-200 hover:text-slate-700"
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

/** Grupo de opciones en forma de fichas, alternativa visual al selector nativo. */
export const Fichas = <T extends string>({ opciones, valor, alElegir, render }: {
  opciones: T[];
  valor: T;
  alElegir: (opcion: T) => void;
  render?: (opcion: T, activo: boolean) => ReactNode;
}) => (
  <div className="flex flex-wrap gap-2">
    {opciones.map((opcion) => {
      const activo = opcion === valor;
      return (
        <button
          key={opcion}
          type="button"
          onClick={() => alElegir(opcion)}
          className={activo ? 'ficha-activa' : 'ficha-inactiva'}
        >
          {render ? render(opcion, activo) : opcion}
        </button>
      );
    })}
  </div>
);
