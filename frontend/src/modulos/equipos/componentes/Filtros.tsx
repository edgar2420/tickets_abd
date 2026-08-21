import { Filter, Search } from 'lucide-react';
import { Panel } from '../../../components/Ui';
import { ESTADOS, TIPOS } from '../constantes';
import type { FiltrosEquipo } from '../usarEquipos';
import type { Sucursal } from '../../../lib/tipos';

export const Filtros = ({ filtros, sucursales, alCambiar }: {
  filtros: FiltrosEquipo;
  sucursales: Sucursal[];
  alCambiar: (cambio: Partial<FiltrosEquipo>) => void;
}) => (
  <Panel titulo="Filtros" icono={Filter}>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="etiqueta">Busqueda</label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-400" />
          <input
            className="campo pl-9"
            placeholder="Codigo, equipo, IP o responsable"
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
        <label className="etiqueta">Sucursal</label>
        <select className="campo" value={filtros.sucursal_id} onChange={(e) => alCambiar({ sucursal_id: e.target.value })}>
          <option value="">Todas</option>
          {sucursales.map((sucursal) => <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>)}
        </select>
      </div>
      <div>
        <label className="etiqueta">Estado</label>
        <select className="campo" value={filtros.estado} onChange={(e) => alCambiar({ estado: e.target.value })}>
          <option value="">Todos</option>
          {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
        </select>
      </div>
    </div>
  </Panel>
);
