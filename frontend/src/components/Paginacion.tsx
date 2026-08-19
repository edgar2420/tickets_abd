import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { InfoPaginacion } from '../lib/tipos';

const OPCIONES_LIMITE = [10, 25, 50, 100];

/**
 * Control de paginacion de las tablas.
 * El servidor acota el limite maximo, de modo que ninguna consulta puede
 * traer la tabla completa y saturar la vista.
 */
export const Paginacion = ({ info, alCambiarPagina, alCambiarLimite }: {
  info: InfoPaginacion;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite: (limite: number) => void;
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-xs dark:border-noche-700">
    <p className="text-slate-500 dark:text-slate-300">
      {info.total === 0
        ? 'Sin registros'
        : `Mostrando ${info.desde} a ${info.hasta} de ${info.total} registros`}
    </p>

    <div className="flex items-center gap-3">
      <label className="flex items-center gap-2 text-slate-500 dark:text-slate-300">
        Por pagina
        <select
          className="campo w-20 px-2 py-1 text-xs"
          value={info.limite}
          onChange={(e) => alCambiarLimite(Number(e.target.value))}
        >
          {OPCIONES_LIMITE.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
        </select>
      </label>

      <div className="flex items-center gap-1">
        <button
          type="button"
          className="boton-icono p-1.5"
          disabled={info.pagina <= 1}
          onClick={() => alCambiarPagina(info.pagina - 1)}
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="px-2 font-semibold text-slate-600 dark:text-slate-200">
          {info.pagina} / {info.paginas}
        </span>
        <button
          type="button"
          className="boton-icono p-1.5"
          disabled={info.pagina >= info.paginas}
          onClick={() => alCambiarPagina(info.pagina + 1)}
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  </div>
);
