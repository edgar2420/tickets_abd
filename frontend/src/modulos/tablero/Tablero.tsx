import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Building, Clock, FileDown, Gauge, Layers, Ticket, Users } from 'lucide-react';
import { api, descargarPdf } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { usarNotificaciones } from '../../context/NotificacionesContext';
import { Alerta, Cargando, EncabezadoPagina, Indicador, Panel, Vacio } from '../../components/Ui';
import { usarReporteMensual } from './usarReporteMensual';
import { ReporteMensual } from './componentes/ReporteMensual';
import type { Distribucion, Indicadores } from '../../lib/tipos';

interface Ranking extends Distribucion {
  detalle?: string;
}

interface RespuestaTablero {
  datos: {
    resumen: Indicadores;
    graficos: {
      porSucursal: Distribucion[];
      porCategoria: Distribucion[];
      porEstado: Distribucion[];
      porArea: Distribucion[];
      porSolicitante: Ranking[];
    } | null;
  };
}

const BarraDistribucion = ({ filas }: { filas: Distribucion[] }) => {
  const maximo = Math.max(1, ...filas.map((f) => f.total));
  return (
    <ul className="space-y-3">
      {filas.map((fila) => (
        <li key={fila.etiqueta}>
          <div className="mb-1 flex items-center justify-between text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">{fila.etiqueta}</span>
            <span className="font-semibold text-institucional-900 dark:text-institucional-200">{fila.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-noche-700">
            <div
              className="h-full rounded-full bg-institucional-700 transition-all duration-500"
              style={{ width: `${(fila.total / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {filas.length === 0 && <li className="text-xs text-slate-500 dark:text-slate-300">Sin datos disponibles</li>}
    </ul>
  );
};

const RankingSolicitantes = ({ filas }: { filas: Ranking[] }) => {
  if (filas.length === 0) return <Vacio icono={Users} texto="Todavia no hay tickets registrados" />;
  const maximo = Math.max(1, ...filas.map((f) => f.total));
  return (
    <ol className="space-y-3">
      {filas.map((fila, indice) => (
        <li key={fila.etiqueta} className="flex items-center gap-3">
          <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
            indice === 0
              ? 'bg-institucional-900 text-white'
              : 'bg-slate-100 text-slate-600 dark:bg-noche-700 dark:text-slate-200'
          }`}>
            {indice + 1}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <p className="truncate text-sm font-medium text-slate-700 dark:text-slate-200">{fila.etiqueta}</p>
              <p className="shrink-0 text-sm font-bold text-institucional-900 dark:text-institucional-200">{fila.total}</p>
            </div>
            {fila.detalle && <p className="truncate text-xs text-slate-400 dark:text-slate-400">{fila.detalle}</p>}
            <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-noche-700">
              <div className="h-full rounded-full bg-institucional-600" style={{ width: `${(fila.total / maximo) * 100}%` }} />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
};

export const Tablero = () => {
  const { puede } = usarAuth();
  const { ultimoEventoTicket } = usarNotificaciones();
  const [datos, setDatos] = useState<RespuestaTablero['datos'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verReporte = puede('reportes.ver', 'tickets.ver_todos');
  const mensual = usarReporteMensual(verReporte);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api<RespuestaTablero>('/tickets/tablero');
      setDatos(respuesta.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar los indicadores');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoTicket]);

  if (error) return <Alerta mensaje={error} />;
  if (!datos) return <Cargando texto="Calculando indicadores" />;

  const { resumen, graficos } = datos;

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Tablero de control"
        descripcion="Estado consolidado de la mesa de ayuda"
        icono={Gauge}
      >
        {puede('reportes.exportar', 'tickets.ver_todos') && (
          <button
            type="button"
            className="boton-acento"
            onClick={() => void descargarPdf('/tickets/reporte/pdf', {}, 'reporte-tickets.pdf')}
          >
            <FileDown className="h-4 w-4" />
            Exportar reporte PDF
          </button>
        )}
      </EncabezadoPagina>

      <div>
        <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          {puede('tickets.ver_todos') ? 'Situacion actual de la mesa de ayuda' : 'Situacion actual de sus tickets'}
        </p>
        <div className="grid gap-4 sm:grid-cols-3">
          <Indicador etiqueta="Abiertos" valor={resumen.abiertos} icono={Layers} tono="info" />
          <Indicador etiqueta="En proceso" valor={resumen.en_proceso} icono={Clock} tono="advertencia" />
          <Indicador etiqueta="Criticos activos" valor={resumen.criticos} icono={AlertTriangle} tono="critico" />
        </div>
      </div>

      {verReporte && (
        <ReporteMensual
          reporte={mensual.reporte}
          mes={mensual.mes}
          setMes={mensual.setMes}
          mesTope={mensual.mesVigente}
          filtros={mensual.filtros}
          setFiltros={mensual.setFiltros}
          limpiar={mensual.limpiar}
          hayFiltros={mensual.hayFiltros}
          sucursales={mensual.sucursales}
          categorias={mensual.categorias}
          error={mensual.error}
        />
      )}

      {graficos && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Panel titulo="Quien solicita mas tickets" icono={Users}>
            <RankingSolicitantes filas={graficos.porSolicitante} />
          </Panel>

          <div className="space-y-4">
            <Panel titulo="Tickets por categoria" icono={Layers}>
              <BarraDistribucion filas={graficos.porCategoria} />
            </Panel>
            <Panel titulo="Tickets por sucursal" icono={Building}>
              <BarraDistribucion filas={graficos.porSucursal} />
            </Panel>
            <Panel titulo="Tickets por area solicitante" icono={Ticket}>
              <BarraDistribucion filas={graficos.porArea} />
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};
