import { useCallback, useEffect, useState } from 'react';
import { FileDown, Filter, ScrollText } from 'lucide-react';
import { api, descargarPdf } from '../../lib/api';
import { Alerta, Cargando, EncabezadoPagina, Panel, Vacio } from '../../components/Ui';
import { Paginacion } from '../../components/Paginacion';
import { fechaHora } from '../../lib/formato';
import type { InfoPaginacion, RegistroAuditoria, RespuestaPaginada } from '../../lib/tipos';

const ENTIDADES = ['TICKET', 'USUARIO', 'ROL', 'AREA', 'SESION', 'REPORTE'];

export const Auditoria = () => {
  const [registros, setRegistros] = useState<RegistroAuditoria[] | null>(null);
  const [filtros, setFiltros] = useState({ entidad: '', desde: '', hasta: '' });
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api<RespuestaPaginada<RegistroAuditoria>>('/auditoria', {
        parametros: { ...filtros, limite, pagina }
      });
      setRegistros(respuesta.datos);
      setInfo(respuesta.paginacion);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar la bitacora');
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Bitacora de auditoria"
        descripcion="Trazabilidad de todas las operaciones ejecutadas en el sistema"
        icono={ScrollText}
      >
        <button
          type="button"
          className="boton-acento"
          onClick={() => void descargarPdf('/auditoria/pdf', filtros, 'bitacora-auditoria.pdf')}
        >
          <FileDown className="h-4 w-4" />
          Exportar PDF
        </button>
      </EncabezadoPagina>

      <Panel titulo="Filtros" icono={Filter}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Entidad</label>
            <select className="campo" value={filtros.entidad} onChange={(e) => { setFiltros((f) => ({ ...f, entidad: e.target.value })); setPagina(1); }}>
              <option value="">Todas</option>
              {ENTIDADES.map((entidad) => <option key={entidad} value={entidad}>{entidad}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Desde</label>
            <input type="date" className="campo" value={filtros.desde} onChange={(e) => { setFiltros((f) => ({ ...f, desde: e.target.value })); setPagina(1); }} />
          </div>
          <div>
            <label className="etiqueta">Hasta</label>
            <input type="date" className="campo" value={filtros.hasta} onChange={(e) => { setFiltros((f) => ({ ...f, hasta: e.target.value })); setPagina(1); }} />
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
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => (
                  <tr key={registro.id}>
                    <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">{fechaHora(registro.fecha)}</td>
                    <td className="whitespace-nowrap text-slate-700 dark:text-slate-200">{registro.usuario_nombre ?? 'Sistema'}</td>
                    <td>
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                        <ScrollText className="h-3.5 w-3.5" />
                        {registro.entidad}
                      </span>
                    </td>
                    <td className="font-mono text-xs text-slate-600 dark:text-slate-200">{registro.entidad_id ?? '-'}</td>
                    <td className="text-slate-700 dark:text-slate-200">{registro.accion}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && (
          <Paginacion
            info={info}
            alCambiarPagina={setPagina}
            alCambiarLimite={(nuevo) => { setLimite(nuevo); setPagina(1); }}
          />
        )}
      </section>
    </div>
  );
};
