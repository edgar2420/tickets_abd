import { useState } from 'react';
import {
  CalendarRange, CheckCircle2, ClipboardCheck, FileDown, ListFilter, Minus, RotateCcw,
  Ticket, TrendingDown, TrendingUp
} from 'lucide-react';
import { Alerta, Cargando, Etiqueta, Panel } from '../../../components/Ui';
import { descargarPdf } from '../../../lib/api';
import { codigoTicket, estiloEstado, estiloPrioridad, fechaCorta } from '../../../lib/formato';
import { PRIORIDADES } from '../constantes';
import { SelectorPeriodo } from './SelectorPeriodo';
import type { FiltrosReporte } from '../usarReporteMensual';
import type {
  Categoria, FilaMensual, FilaTecnico, ReporteMensual as Reporte, Sucursal
} from '../../../lib/tipos';

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

const Desglose = ({ titulo, filas }: { titulo: string; filas: FilaMensual[] }) => (
  <div>
    <p className="etiqueta">{titulo}</p>
    {filas.length === 0
      ? <p className="py-3 text-sm text-slate-400 dark:text-slate-500">Sin registros en el periodo</p>
      : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-noche-700 dark:text-slate-400">
                <th className="py-1.5 text-left font-semibold">Detalle</th>
                <th className="py-1.5 text-right font-semibold">Registrados</th>
                <th className="py-1.5 text-right font-semibold">Abiertos</th>
                <th className="py-1.5 text-right font-semibold">En proceso</th>
                <th className="py-1.5 text-right font-semibold">Resueltos</th>
                <th className="py-1.5 text-right font-semibold">Cerrados</th>
              </tr>
            </thead>
            <tbody>
              {filas.map((fila) => (
                <tr key={fila.etiqueta} className="border-b border-slate-100 last:border-0 dark:border-noche-800">
                  <td className="py-1.5 text-slate-700 dark:text-slate-200">{fila.etiqueta}</td>
                  <td className="py-1.5 text-right font-semibold text-institucional-900 dark:text-institucional-200">
                    {fila.creados}
                  </td>
                  <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">{fila.abiertos}</td>
                  <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">{fila.en_proceso}</td>
                  <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">{fila.resueltos}</td>
                  <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">{fila.cerrados}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
  </div>
);

const PorTecnico = ({ filas }: { filas: FilaTecnico[] }) => (
  <div>
    <p className="etiqueta">Atencion por tecnico</p>
    {filas.length === 0
      ? <p className="py-3 text-sm text-slate-400 dark:text-slate-500">Sin atencion registrada en el periodo</p>
      : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500 dark:border-noche-700 dark:text-slate-400">
              <th className="py-1.5 text-left font-semibold">Tecnico</th>
              <th className="py-1.5 text-right font-semibold">Atendidos</th>
              <th className="py-1.5 text-right font-semibold">Resueltos</th>
              <th className="py-1.5 text-right font-semibold">Cerrados</th>
            </tr>
          </thead>
          <tbody>
            {filas.map((fila) => (
              <tr key={fila.etiqueta} className="border-b border-slate-100 last:border-0 dark:border-noche-800">
                <td className="py-1.5 text-slate-700 dark:text-slate-200">{fila.etiqueta}</td>
                <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">{fila.atendidos}</td>
                <td className="py-1.5 text-right font-semibold text-institucional-900 dark:text-institucional-200">
                  {fila.resueltos}
                </td>
                <td className="py-1.5 text-right text-slate-600 dark:text-slate-300">{fila.cerrados}</td>
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
      <div className="flex h-24 items-end gap-0.5">
        {porDia.map((dia) => (
          <div key={dia.etiqueta} className="flex flex-1 flex-col items-center justify-end gap-0.5">
            <div className="flex h-full w-full items-end justify-center gap-px">
              <div
                className="w-1/2 rounded-t bg-institucional-700"
                style={{ height: `${(dia.creados / maximo) * 100}%` }}
                title={`Dia ${dia.etiqueta}: ${dia.creados} registrados`}
              />
              <div
                className="w-1/2 rounded-t bg-emerald-500"
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

const Detalle = ({ tickets }: { tickets: Reporte['tickets'] }) => {
  const [expandido, setExpandido] = useState(false);
  const visibles = expandido ? tickets : tickets.slice(0, 10);

  if (tickets.length === 0) {
    return (
      <div>
        <p className="etiqueta">Detalle de los tickets del periodo</p>
        <p className="py-3 text-sm text-slate-400 dark:text-slate-500">Sin tickets registrados en el periodo</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="etiqueta">Detalle de los tickets del periodo</p>
        <span className="text-xs text-slate-500 dark:text-slate-400">{tickets.length} en total</span>
      </div>
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th>Codigo</th>
              <th>Titulo</th>
              <th>Categoria</th>
              <th>Prioridad</th>
              <th>Estado</th>
              <th>Solicitante</th>
              <th>Sucursal</th>
              <th>Atendido por</th>
              <th>Registrado</th>
              <th>Cerrado</th>
            </tr>
          </thead>
          <tbody>
            {visibles.map((ticket) => (
              <tr key={ticket.id}>
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                  {codigoTicket(ticket)}
                </td>
                <td className="max-w-xs truncate text-slate-700 dark:text-slate-200">{ticket.titulo}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{ticket.categoria}</td>
                <td><Etiqueta texto={ticket.prioridad} clase={estiloPrioridad[ticket.prioridad]} /></td>
                <td><Etiqueta texto={ticket.estado} clase={estiloEstado[ticket.estado]} /></td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{ticket.solicitante_nombre}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{ticket.sucursal_nombre}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{ticket.atendido_por ?? '-'}</td>
                <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {fechaCorta(ticket.fecha_creacion)}
                </td>
                <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {ticket.fecha_cierre ? fechaCorta(ticket.fecha_cierre) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {tickets.length > 10 && (
        <button
          type="button"
          className="mt-2 text-sm font-semibold text-institucional-700 hover:underline dark:text-institucional-300"
          onClick={() => setExpandido((previo) => !previo)}
        >
          {expandido ? 'Mostrar solo los primeros diez' : `Ver los ${tickets.length} tickets`}
        </button>
      )}
    </div>
  );
};

export const ReporteMensual = ({
  reporte, mes, setMes, mesTope, filtros, setFiltros, limpiar, hayFiltros, sucursales, categorias, error
}: {
  reporte: Reporte | null;
  mes: string;
  setMes: (mes: string) => void;
  mesTope: string;
  filtros: FiltrosReporte;
  setFiltros: (cambio: Partial<FiltrosReporte>) => void;
  limpiar: () => void;
  hayFiltros: boolean;
  sucursales: Sucursal[];
  categorias: Categoria[];
  error: string | null;
}) => (
  <Panel titulo="Reporte mensual de la mesa de ayuda" icono={CalendarRange}>
    <p className="-mt-1 mb-4 text-xs text-slate-500 dark:text-slate-400">
      Movimiento de toda la organizacion en el periodo elegido. No depende de los tickets propios.
    </p>

    <div className="superficie mb-5 p-4">
      <p className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
        <ListFilter className="h-3.5 w-3.5" /> Filtros del reporte
      </p>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SelectorPeriodo mes={mes} setMes={setMes} tope={mesTope} />
        <div>
          <label className="etiqueta">Sucursal</label>
          <select
            className="campo"
            value={filtros.sucursal_id}
            onChange={(evento) => setFiltros({ sucursal_id: evento.target.value })}
          >
            <option value="">Todas</option>
            {sucursales.map((sucursal) => <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta">Categoria</label>
          <select
            className="campo"
            value={filtros.categoria}
            onChange={(evento) => setFiltros({ categoria: evento.target.value })}
          >
            <option value="">Todas</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="etiqueta">Prioridad</label>
          <select
            className="campo"
            value={filtros.prioridad}
            onChange={(evento) => setFiltros({ prioridad: evento.target.value })}
          >
            <option value="">Todas</option>
            {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
          </select>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap justify-end gap-2">
        {hayFiltros && (
          <button type="button" className="boton-secundario" onClick={limpiar}>
            <RotateCcw className="h-4 w-4" />
            Quitar filtros
          </button>
        )}
        <button
          type="button"
          className="boton-primario"
          onClick={() => void descargarPdf('/tickets/mensual/pdf', { mes, ...filtros }, `reporte-mensual-${mes}.pdf`)}
        >
          <FileDown className="h-4 w-4" />
          Descargar reporte mensual
        </button>
      </div>
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

        <Curva porDia={reporte.porDia} />

        <div className="grid gap-6 lg:grid-cols-2">
          <Desglose titulo="Por categoria" filas={reporte.categorias} />
          <Desglose titulo="Por sucursal" filas={reporte.sucursales} />
          <Desglose titulo="Por area solicitante" filas={reporte.areas} />
          <Desglose titulo="Quien solicito mas tickets" filas={reporte.solicitantes} />
        </div>

        <PorTecnico filas={reporte.tecnicos} />

        <Detalle tickets={reporte.tickets} />
      </div>
    )}
  </Panel>
);
