import { CalendarRange, CheckCircle2, ClipboardCheck, FileDown, Minus, Ticket, TrendingDown, TrendingUp } from 'lucide-react';
import { Alerta, Cargando, Panel } from '../../../components/Ui';
import { descargarPdf } from '../../../lib/api';
import type { FilaMensual, FilaTecnico, ReporteMensual as Reporte } from '../../../lib/tipos';

const Variacion = ({ valor }: { valor: number | null }) => {
  if (valor === null) {
    return <span className="text-xs font-medium text-slate-400 dark:text-slate-500">sin base previa</span>;
  }
  if (valor === 0) {
    return (
      <span className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
        <Minus className="h-3 w-3" /> igual que el mes anterior
      </span>
    );
  }
  const sube = valor > 0;
  return (
    <span className={`flex items-center gap-1 text-xs font-semibold ${sube
      ? 'text-amber-600 dark:text-amber-400'
      : 'text-emerald-600 dark:text-emerald-400'}`}>
      {sube ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {sube ? '+' : ''}{valor}% vs mes anterior
    </span>
  );
};

const Tarjeta = ({ etiqueta, valor, variacion, icono: Icono, tono }: {
  etiqueta: string;
  valor: number;
  variacion?: number | null;
  icono: typeof Ticket;
  tono: string;
}) => (
  <div className="panel-interactivo flex items-start gap-3 p-4">
    <span className={`rounded-xl p-2.5 ${tono}`}><Icono className="h-5 w-5" /></span>
    <div className="min-w-0">
      <p className="truncate text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
        {etiqueta}
      </p>
      <p className="text-2xl font-bold leading-tight text-institucional-900 dark:text-slate-100">{valor}</p>
      {variacion !== undefined && <Variacion valor={variacion} />}
    </div>
  </div>
);

const TablaDesglose = ({ titulo, filas, primera, segunda }: {
  titulo: string;
  filas: (FilaMensual | FilaTecnico)[];
  primera: string;
  segunda: string;
}) => (
  <div>
    <p className="etiqueta">{titulo}</p>
    {filas.length === 0
      ? <p className="py-3 text-sm text-slate-400 dark:text-slate-500">Sin registros en el periodo</p>
      : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-noche-700 dark:text-slate-400">
              <th className="py-1.5 text-left font-semibold">Detalle</th>
              <th className="py-1.5 text-right font-semibold">{primera}</th>
              <th className="py-1.5 text-right font-semibold">{segunda}</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.etiqueta} className="border-b border-slate-100 last:border-0 dark:border-noche-800">
                <td className="py-1.5 text-slate-700 dark:text-slate-200">{fila.etiqueta}</td>
                <td className="py-1.5 text-right font-semibold text-institucional-900 dark:text-institucional-200">
                  {'creados' in fila ? fila.creados : fila.resueltos}
                </td>
                <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">
                  {'creados' in fila ? fila.resueltos : fila.horas_promedio}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
  </div>
);

const Curva = ({ porDia }: { porDia: Reporte['porDia'] }) => {
  const maximo = Math.max(1, ...porDia.map((dia) => Math.max(dia.creados, dia.resueltos)));

  return (
    <div>
      <div className="mb-2 flex items-center gap-4 text-xs">
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="h-2 w-3 rounded-sm bg-institucional-700" /> Registrados
        </span>
        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
          <span className="h-2 w-3 rounded-sm bg-emerald-500" /> Resueltos
        </span>
      </div>
      <div className="flex h-28 items-end gap-0.5">
        {porDia.map((dia) => (
          <div key={dia.etiqueta} className="group flex flex-1 flex-col items-center justify-end gap-0.5">
            <div className="flex w-full items-end justify-center gap-px" style={{ height: '100%' }}>
              <div
                className="w-1/2 rounded-t bg-institucional-700 transition-all"
                style={{ height: `${(dia.creados / maximo) * 100}%` }}
                title={`Dia ${dia.etiqueta}: ${dia.creados} registrados`}
              />
              <div
                className="w-1/2 rounded-t bg-emerald-500 transition-all"
                style={{ height: `${(dia.resueltos / maximo) * 100}%` }}
                title={`Dia ${dia.etiqueta}: ${dia.resueltos} resueltos`}
              />
            </div>
            <span className="text-[9px] text-slate-400 dark:text-slate-500">{dia.etiqueta}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export const ReporteMensual = ({ reporte, mes, setMes, mesTope, error }: {
  reporte: Reporte | null;
  mes: string;
  setMes: (mes: string) => void;
  mesTope: string;
  error: string | null;
}) => (
  <Panel titulo="Reporte mensual de la mesa de ayuda" icono={CalendarRange}>
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
      <div>
        <label className="etiqueta">Periodo</label>
        <input
          type="month"
          className="campo w-48"
          max={mesTope}
          value={mes}
          onChange={(evento) => setMes(evento.target.value)}
        />
      </div>
      <button
        type="button"
        className="boton-secundario"
        onClick={() => void descargarPdf('/tickets/mensual/pdf', { mes }, `reporte-mensual-${mes}.pdf`)}
      >
        <FileDown className="h-4 w-4" />
        Descargar el reporte
      </button>
    </div>

    {error && <Alerta mensaje={error} />}

    {!reporte && !error && <Cargando texto="Consultando el periodo" />}

    {reporte && (
      <div className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <Tarjeta
            etiqueta="Registrados"
            valor={reporte.totales.creados}
            variacion={reporte.variacion.creados}
            icono={Ticket}
            tono="bg-institucional-50 text-institucional-700 dark:bg-institucional-500/15 dark:text-institucional-300"
          />
          <Tarjeta
            etiqueta="Atendidos"
            valor={reporte.totales.atendidos}
            variacion={reporte.variacion.atendidos}
            icono={ClipboardCheck}
            tono="bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300"
          />
          <Tarjeta
            etiqueta="Resueltos"
            valor={reporte.totales.resueltos}
            variacion={reporte.variacion.resueltos}
            icono={CheckCircle2}
            tono="bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
          />
          <Tarjeta
            etiqueta="Cerrados"
            valor={reporte.totales.cerrados}
            variacion={reporte.variacion.cerrados}
            icono={CheckCircle2}
            tono="bg-green-50 text-green-700 dark:bg-green-500/15 dark:text-green-300"
          />
          <Tarjeta
            etiqueta="Pendientes al cierre"
            valor={reporte.totales.pendientes}
            icono={ClipboardCheck}
            tono="bg-rose-50 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
          />
        </div>

        <div className="superficie grid gap-4 p-4 sm:grid-cols-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Demora en tomar el ticket
            </p>
            <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">
              {reporte.tiempos.horas_hasta_atender} horas
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Demora hasta resolver
            </p>
            <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">
              {reporte.tiempos.horas_hasta_resolver} horas
            </p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Criticos del periodo
            </p>
            <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">{reporte.totales.criticos}</p>
          </div>
        </div>

        <Curva porDia={reporte.porDia} />

        <div className="grid gap-6 lg:grid-cols-2">
          <TablaDesglose titulo="Por categoria" filas={reporte.categorias} primera="Registrados" segunda="Resueltos" />
          <TablaDesglose titulo="Por sucursal" filas={reporte.sucursales} primera="Registrados" segunda="Resueltos" />
          <TablaDesglose titulo="Por area solicitante" filas={reporte.areas} primera="Registrados" segunda="Resueltos" />
          <TablaDesglose titulo="Resolucion por tecnico" filas={reporte.tecnicos} primera="Resueltos" segunda="Horas prom." />
        </div>
      </div>
    )}
  </Panel>
);
