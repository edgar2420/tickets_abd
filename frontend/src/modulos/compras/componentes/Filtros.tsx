import { Filter } from 'lucide-react';
import { Panel } from '../../../components/Ui';
import { ESTADOS } from '../constantes';
import type { Filtros as FiltrosCompra } from '../usarCompras';
import type { Sucursal } from '../../../lib/tipos';

export const Filtros = ({ filtros, sucursales, alCambiar }: {
  filtros: FiltrosCompra;
  sucursales: Sucursal[];
  alCambiar: (cambio: Partial<FiltrosCompra>) => void;
}) => (
  <Panel titulo="Filtros" icono={Filter}>
    <div className="grid gap-3 sm:grid-cols-3">
      <div>
        <label className="etiqueta">Estado</label>
        <select className="campo" value={filtros.estado} onChange={(e) => alCambiar({ estado: e.target.value })}>
          <option value="">Todos</option>
          {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
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
        <label className="etiqueta">Busqueda</label>
        <input
          className="campo"
          placeholder="Titulo o justificacion"
          value={filtros.busqueda}
          onChange={(e) => alCambiar({ busqueda: e.target.value })}
        />
      </div>
    </div>
  </Panel>
);
