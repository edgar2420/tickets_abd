import { useCallback, useEffect, useState } from 'react';
import { FileDown, Filter, Info, RefreshCw, ScrollText } from 'lucide-react';
import { api, descargarPdf } from '../../lib/api';
import { usarNotificaciones } from '../../context/NotificacionesContext';
import { Alerta, Cargando, EncabezadoPagina, Etiqueta, Panel, Vacio } from '../../components/Ui';
import { Paginacion } from '../../components/Paginacion';
import { fechaHora, tiempoRelativo } from '../../lib/formato';
import type { InfoPaginacion, RegistroAuditoria, RespuestaPaginada } from '../../lib/tipos';

const ENTIDADES = [
  'SESION', 'TICKET', 'COMPRA', 'PROYECTO', 'EQUIPO', 'INVENTARIO',
  'USUARIO', 'ROL', 'AREA', 'SUCURSAL', 'CATEGORIA', 'REPORTE'
];

const ESTILO_ENTIDAD: Record<string, string> = {
  SESION: 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600',
  TICKET: 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  COMPRA: 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  PROYECTO: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  EQUIPO: 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  INVENTARIO: 'bg-teal-100 text-teal-800 border-teal-300 dark:bg-teal-500/15 dark:text-teal-300 dark:border-teal-500/30',
  USUARIO: 'bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30',
  REPORTE: 'bg-institucional-100 text-institucional-800 border-institucional-300 dark:bg-institucional-500/15 dark:text-institucional-200 dark:border-institucional-500/30'
};

const estiloDe = (entidad: string) =>
  ESTILO_ENTIDAD[entidad]
  ?? 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600';

const DELICADAS = ['LOGIN_FALLIDO', 'REVELAR_CREDENCIAL', 'REINICIAR_PASSWORD', 'CAMBIO_PASSWORD', 'DESACTIVAR'];

const legible = (detalle: unknown) => {
  if (detalle === null || detalle === undefined) return null;
  if (typeof detalle === 'string') return detalle;
  if (typeof detalle !== 'object') return String(detalle);
  const entradas = Object.entries(detalle as Record<string, unknown>)
    .filter(([, valor]) => valor !== null && valor !== undefined && valor !== '')
    .map(([clave, valor]) => `${clave.replace(/_/g, ' ')}: ${typeof valor === 'object' ? JSON.stringify(valor) : valor}`);
  return entradas.length ? entradas.join(' - ') : null;
};

export const Auditoria = () => {
  const { ultimoEventoTicket, ultimoEventoCompra, ultimoEventoProyecto } = usarNotificaciones();
  const [registros, setRegistros] = useState<RegistroAuditoria[] | null>(null);
  const [filtros, setFiltros] = useState({ entidad: '', desde: '', hasta: '' });
  const [error, setError] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [consultado, setConsultado] = useState<Date | null>(null);
  const [consultando, setConsultando] = useState(false);

  const cargar = useCallback(async () => {
    setConsultando(true);
    try {
      const respuesta = await api<RespuestaPaginada<RegistroAuditoria>>('/auditoria', {
        parametros: { ...filtros, limite, pagina }
      });
      setRegistros(respuesta.datos);
      setInfo(respuesta.paginacion);
      setConsultado(new Date());
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar la bitacora');
    } finally {
      setConsultando(false);
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoTicket, ultimoEventoCompra, ultimoEventoProyecto]);

  const cambiarFiltro = (cambio: Partial<typeof filtros>) => {
    setFiltros((previos) => ({ ...previos, ...cambio }));
    setPagina(1);
  };

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Bitacora de auditoria"
        descripcion="Quien hizo que, cuando y desde donde"
        icono={ScrollText}
      >
        <button type="button" className="boton-secundario" onClick={() => void cargar()} disabled={consultando}>
          <RefreshCw className={`h-4 w-4 ${consultando ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
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
            <select className="campo" value={filtros.entidad} onChange={(e) => cambiarFiltro({ entidad: e.target.value })}>
              <option value="">Todas</option>
              {ENTIDADES.map((entidad) => <option key={entidad} value={entidad}>{entidad}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Desde</label>
            <input type="date" className="campo" value={filtros.desde} onChange={(e) => cambiarFiltro({ desde: e.target.value })} />
          </div>
          <div>
            <label className="etiqueta">Hasta</label>
            <input type="date" className="campo" value={filtros.hasta} onChange={(e) => cambiarFiltro({ hasta: e.target.value })} />
          </div>
        </div>
        {consultado && (
          <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
            Consultado {tiempoRelativo(consultado.toISOString())}
            {info ? ` - ${info.total} registro(s) con estos criterios` : ''}
          </p>
        )}
      </Panel>

      {error && <Alerta mensaje={error} />}

      <section className="panel overflow-hidden">
        {!registros && <Cargando texto="Consultando bitacora" />}

        {registros && registros.length === 0 && (
          <div className="px-6 py-10">
            <Vacio icono={ScrollText} texto="No hay registros con los criterios aplicados" />
            <p className="mx-auto mt-4 flex max-w-2xl items-start gap-2 rounded-lg border border-slate-200 bg-slate-50
                          p-3 text-xs text-slate-600 dark:border-noche-700 dark:bg-noche-800 dark:text-slate-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-institucional-700 dark:text-institucional-300" />
              <span>
                La bitacora anota unicamente las acciones que modifican algo: inicios y cierres de
                sesion, altas, cambios, aprobaciones, descargas de documentos y consultas de
                credenciales. Navegar por las pantallas no deja registro, por eso puede verse vacia
                en un sistema recien puesto en marcha.
              </span>
            </p>
          </div>
        )}

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
                  <th>Detalle</th>
                  <th>Origen</th>
                </tr>
              </thead>
              <tbody>
                {registros.map((registro) => {
                  const detalle = legible(registro.detalle);
                  const delicada = DELICADAS.includes(registro.accion);

                  return (
                    <tr key={registro.id}>
                      <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
                        {fechaHora(registro.fecha)}
                      </td>
                      <td className="whitespace-nowrap">
                        <p className="text-slate-700 dark:text-slate-200">{registro.usuario_nombre ?? 'Sistema'}</p>
                        {registro.usuario_login && (
                          <p className="font-mono text-xs text-slate-400 dark:text-slate-500">{registro.usuario_login}</p>
                        )}
                      </td>
                      <td><Etiqueta texto={registro.entidad} clase={estiloDe(registro.entidad)} /></td>
                      <td className="font-mono text-xs text-slate-600 dark:text-slate-200">
                        {registro.entidad_id ?? '-'}
                      </td>
                      <td className={`whitespace-nowrap font-medium ${delicada
                        ? 'text-rose-600 dark:text-rose-400'
                        : 'text-slate-700 dark:text-slate-200'}`}>
                        {registro.accion}
                      </td>
                      <td className="max-w-md truncate text-xs text-slate-500 dark:text-slate-400" title={detalle ?? ''}>
                        {detalle ?? '-'}
                      </td>
                      <td className="whitespace-nowrap font-mono text-xs text-slate-400 dark:text-slate-500">
                        {registro.ip ?? '-'}
                      </td>
                    </tr>
                  );
                })}
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
