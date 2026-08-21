import { Filter, Search } from 'lucide-react';
import { Panel } from '../../../components/Ui';
import { ESTADOS, TIPOS } from '../constantes';
import type { FiltrosArticulo, FiltrosMovimiento } from '../usarInventario';
import type { Articulo } from '../../../lib/tipos';

export const FiltrosArticulos = ({ filtros, alCambiar }: {
  filtros: FiltrosArticulo;
  alCambiar: (cambio: Partial<FiltrosArticulo>) => void;
}) => (
  <Panel titulo="Filtros" icono={Filter}>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="etiqueta">Busqueda</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-400" />
          <input
            className="campo pl-9"
            placeholder="Codigo o nombre"
            value={filtros.busqueda}
            onChange={(e) => alCambiar({ busqueda: e.target.value })}
          />
        </div>
      </div>
      <div>
        <label className="etiqueta">Tipo</label>
        <select className="campo" value={filtros.tipo} onChange={(e) => alCambiar({ tipo: e.target.value })}>
          <option value="">Todos</option>
          {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
      </div>
      <div>
        <label className="etiqueta">Situacion</label>
        <select className="campo" value={filtros.estado} onChange={(e) => alCambiar({ estado: e.target.value })}>
          <option value="">Todas</option>
          {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </select>
      </div>
      <label className="flex items-end gap-2 pb-2.5 text-sm text-slate-700 dark:text-slate-200">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-slate-300 dark:border-noche-700"
          checked={filtros.solo_criticos}
          onChange={(e) => alCambiar({ solo_criticos: e.target.checked })}
        />
        Solo articulos bajo el minimo
      </label>
    </div>
  </Panel>
);

export const FiltrosKardex = ({ filtros, articulos, alCambiar }: {
  filtros: FiltrosMovimiento;
  articulos: Articulo[] | null;
  alCambiar: (cambio: Partial<FiltrosMovimiento>) => void;
}) => (
  <Panel titulo="Filtros del kardex" icono={Filter}>
    <div className="grid gap-3 sm:grid-cols-2">
      <div>
        <label className="etiqueta">Tipo de movimiento</label>
        <select className="campo" value={filtros.tipo} onChange={(e) => alCambiar({ tipo: e.target.value })}>
          <option value="">Todos</option>
          <option value="Entrada">Entrada</option>
          <option value="Salida">Salida</option>
          <option value="Ajuste">Ajuste</option>
        </select>
      </div>
      <div>
        <label className="etiqueta">Articulo</label>
        <select className="campo" value={filtros.articulo_id} onChange={(e) => alCambiar({ articulo_id: e.target.value })}>
          <option value="">Todos</option>
          {(articulos ?? []).map((articulo) => (
            <option key={articulo.id} value={articulo.id}>{articulo.codigo} - {articulo.nombre}</option>
          ))}
        </select>
      </div>
    </div>
  </Panel>
);
