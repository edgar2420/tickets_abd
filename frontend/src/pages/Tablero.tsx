import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock, FileDown, Layers, Ticket, Timer } from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { usarNotificaciones } from '../context/NotificacionesContext';
import { Alerta, Cargando, Indicador, Panel } from '../components/Ui';
import type { Distribucion, Indicadores } from '../lib/tipos';

interface RespuestaTablero {
  datos: {
    resumen: Indicadores;
    graficos: {
      porCategoria: Distribucion[];
      porEstado: Distribucion[];
      porArea: Distribucion[];
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
            <span className="font-medium text-slate-700">{fila.etiqueta}</span>
            <span className="font-semibold text-institucional-900">{fila.total}</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
            <div
              className="h-full rounded-full bg-institucional-700"
              style={{ width: `${(fila.total / maximo) * 100}%` }}
            />
          </div>
        </li>
      ))}
      {filas.length === 0 && <li className="text-xs text-slate-500">Sin datos disponibles</li>}
    </ul>
  );
};

export const Tablero = () => {
  const { puede } = usarAuth();
  const { ultimoEventoTicket } = usarNotificaciones();
  const [datos, setDatos] = useState<RespuestaTablero['datos'] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api<RespuestaTablero>('/tickets/tablero');
      setDatos(respuesta.datos);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar los indicadores');
    }
  }, []);

  // Recarga automatica ante cualquier evento de tiempo real sobre tickets.
  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoTicket]);

  if (error) return <Alerta mensaje={error} />;
  if (!datos) return <Cargando texto="Calculando indicadores" />;

  const { resumen, graficos } = datos;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-institucional-900">Tablero de control</h1>
          <p className="text-sm text-slate-500">Estado consolidado de la mesa de ayuda</p>
        </div>
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
      </header>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <Indicador etiqueta="Total tickets" valor={resumen.total} icono={Ticket} />
        <Indicador etiqueta="Abiertos" valor={resumen.abiertos} icono={Layers} color="text-sky-700" />
        <Indicador etiqueta="En proceso" valor={resumen.en_proceso} icono={Clock} color="text-amber-600" />
        <Indicador etiqueta="Resueltos" valor={resumen.resueltos} icono={CheckCircle2} color="text-emerald-700" />
        <Indicador etiqueta="Criticos activos" valor={resumen.criticos} icono={AlertTriangle} color="text-rose-700" />
      </div>

      <Panel titulo="Tiempo promedio de resolucion" icono={Timer}>
        <p className="text-3xl font-bold text-institucional-900">
          {Number(resumen.horas_promedio_resolucion ?? 0).toFixed(2)}
          <span className="ml-2 text-sm font-medium text-slate-500">horas por ticket resuelto</span>
        </p>
      </Panel>

      {graficos && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Panel titulo="Por categoria" icono={Layers}>
            <BarraDistribucion filas={graficos.porCategoria} />
          </Panel>
          <Panel titulo="Por estado" icono={Clock}>
            <BarraDistribucion filas={graficos.porEstado} />
          </Panel>
          <Panel titulo="Por area solicitante" icono={Ticket}>
            <BarraDistribucion filas={graficos.porArea} />
          </Panel>
        </div>
      )}
    </div>
  );
};
