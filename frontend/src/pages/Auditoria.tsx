import { useCallback, useEffect, useState } from 'react';
import { FileDown, Filter, ScrollText } from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { Alerta, Cargando, Panel, Vacio } from '../components/Ui';
import { fechaHora } from '../lib/formato';
import type { RegistroAuditoria } from '../lib/tipos';

const ENTIDADES = ['TICKET', 'USUARIO', 'ROL', 'AREA', 'SESION', 'REPORTE'];

export const Auditoria = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[] | null>(null);
  const [filtros, setFiltros] = useState({ entidad: '', desde: '', hasta: '' });
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: RegistroAuditoria[] }>('/auditoria', { parametros: filtros });
      setRegistros(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar la bitacora');
    }
  }, [filtros]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-institucional-900">Bitacora de auditoria</h1>
          <p className="text-sm text-slate-500">Trazabilidad de todas las operaciones ejecutadas en el sistema</p>
        </div>
        <button
          type="button"
          className="boton-acento"
          onClick={() => void descargarPdf('/auditoria/pdf', filtros, 'bitacora-auditoria.pdf')}
        >
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </button>
      </header>

      <Panel titulo="Filtros" icono={Filter}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Entidad</label>
            <select className="campo" value={filtros.entidad} onChange={(e) => setFiltros((f) => ({ ...f, entidad: e.target.value }))}>
              <option value="">Todas</option>
              {ENTIDADES.map((entidad) => <option key={entidad} value={entidad}>{entidad}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Desde</label>
            <input type="date" className="campo" value={filtros.desde} onChange={(e) => setFiltros((f) => ({ ...f, desde: e.target.value }))} />
          </div>
          <div>
            <label className="etiqueta">Hasta</label>
            <input type="date" className="campo" value={filtros.hasta} onChange={(e) => setFiltros((f) => ({ ...f, hasta: e.target.value }))} />
          </div>
        </div>
      </Panel>

      {error && <Alerta mensaje={error} />}

      <section className="panel overflow-hidden">
        {!registros && <Cargando texto="Consultando bitacora" />}
        {registros && registros.length === 0 && <Vacio texto="No se encontraron registros para los criterios aplicados" />}
        {registros && registros.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Usuario</th>
                  <th>Entidad</th>
                  <th>Registro</th>
                  <th>Accion</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500">{fechaHora(registro.fecha)}</td>
                    <td className="whitespace-nowrap text-slate-700">{registro.usuario_nombre ?? 'Sistema'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-institucional-800">
                        <ScrollText className="h-3.5 w-3.5" />
                        {registro.entidad}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-600">{registro.entidad_id ?? '-'}</td>
                    <td className="text-slate-700">{registro.accion}</td>
                    <td className="font-mono text-xs text-slate-500">{registro.ip ?? '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};
