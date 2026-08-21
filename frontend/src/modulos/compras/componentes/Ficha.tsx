import { BadgeCheck, FileDown } from 'lucide-react';
import { Alerta, Dato, Etiqueta } from '../../../components/Ui';
import { descargarPdf } from '../../../lib/api';
import { fechaHora, montoBs } from '../../../lib/formato';
import { ESTILO_ESTADO, codigoCompra } from '../constantes';
import { Recorrido } from './Recorrido';
import type { SolicitudCompra } from '../../../lib/tipos';

const bitacora = (ficha: SolicitudCompra) => [
  {
    paso: 'Registro del pedido',
    quien: ficha.solicitante_nombre,
    cargo: 'Solicitante',
    cuando: ficha.fecha_creacion,
    nota: null as string | null
  },
  {
    paso: 'Revision tecnica',
    quien: ficha.revisado_por_nombre,
    cargo: 'Tecnologias de la Informacion',
    cuando: ficha.fecha_revision,
    nota: ficha.observacion_ti
  },
  {
    paso: 'Aprobacion presupuestaria',
    quien: ficha.aprobado_por_nombre,
    cargo: ficha.aprobado_por_area ?? 'Gerencia',
    cuando: ficha.fecha_aprobacion,
    nota: ficha.observacion_gerencia
  },
  {
    paso: 'Compra ejecutada',
    quien: ficha.comprado_por_nombre,
    cargo: 'Tecnologias de la Informacion',
    cuando: ficha.fecha_compra,
    nota: [ficha.numero_orden ? `Orden ${ficha.numero_orden}` : null, montoBs(ficha.monto_final)]
      .filter(Boolean).join(' - ') || null
  },
  {
    paso: 'Entrega',
    quien: ficha.entregado_por_nombre,
    cargo: 'Tecnologias de la Informacion',
    cuando: ficha.fecha_entrega,
    nota: ficha.equipo_codigo ? `Equipo ${ficha.equipo_codigo}` : null
  }
];

const Bloque = ({ etiqueta, texto }: { etiqueta: string; texto: string }) => (
  <div>
    <p className="etiqueta">{etiqueta}</p>
    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{texto}</p>
  </div>
);

export const Ficha = ({ ficha, alCerrar }: { ficha: SolicitudCompra; alCerrar: () => void }) => (
  <div className="space-y-5">
    <div className="superficie flex flex-wrap items-start justify-between gap-3 p-4">
      <div>
        <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">{ficha.titulo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {ficha.solicitante_nombre} - {ficha.area_nombre ?? 'sin area'} - {ficha.sucursal_nombre ?? 'sin sucursal'}
        </p>
      </div>
      <Etiqueta texto={ficha.estado} clase={ESTILO_ESTADO[ficha.estado]} />
    </div>

    <Recorrido estado={ficha.estado} />

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Bloque etiqueta="Justificacion" texto={ficha.justificacion} />
        {ficha.especificaciones && (
          <Bloque etiqueta="Especificaciones que pidio el solicitante" texto={ficha.especificaciones} />
        )}
        {ficha.equipo_sugerido && <Bloque etiqueta="Equipo sugerido por TI" texto={ficha.equipo_sugerido} />}

        <div className="grid grid-cols-3 gap-3">
          <Dato etiqueta="Cantidad" valor={ficha.cantidad} />
          <Dato etiqueta="Referencial" valor={montoBs(ficha.monto_estimado)} />
          <Dato etiqueta="Monto final" valor={montoBs(ficha.monto_final)} />
        </div>
      </div>

      <div>
        <p className="etiqueta">Circuito de aprobacion</p>
        <ol className="space-y-3 border-l-2 border-slate-200 pl-4 dark:border-noche-700">
          {bitacora(ficha).map(({ paso, quien, cargo, cuando, nota }) => (
            <li key={paso}>
              <p className={`text-sm font-semibold ${quien
                ? 'text-institucional-900 dark:text-slate-100'
                : 'text-slate-400 dark:text-slate-500'}`}>
                {paso}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {quien ? `${quien} - ${cargo} - ${fechaHora(cuando)}` : 'Pendiente'}
              </p>
              {nota && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{nota}</p>}
            </li>
          ))}
        </ol>
      </div>
    </div>

    {ficha.aprobado_por_nombre && (
      <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800
                    dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
        <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
        <span>
          Aprobacion presupuestaria otorgada por <strong>{ficha.aprobado_por_nombre}</strong>,{' '}
          {ficha.aprobado_por_area ?? 'Gerencia'}, el {fechaHora(ficha.fecha_aprobacion)}.
        </span>
      </p>
    )}

    {ficha.estado === 'Rechazada' && (
      <Alerta mensaje={`Rechazada por ${ficha.rechazado_por_nombre ?? 'la organizacion'}: ${ficha.motivo_rechazo ?? 'sin motivo registrado'}`} />
    )}

    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
      <button
        type="button"
        className="boton-secundario"
        onClick={() => void descargarPdf(`/compras/${ficha.id}/pdf`, {}, `${codigoCompra(ficha.id)}.pdf`)}
      >
        <FileDown className="h-4 w-4" />
        Ficha en PDF
      </button>
      <button type="button" className="boton-primario" onClick={alCerrar}>Cerrar</button>
    </div>
  </div>
);
