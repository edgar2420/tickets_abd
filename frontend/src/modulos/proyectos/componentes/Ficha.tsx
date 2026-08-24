import { Check, FileDown } from 'lucide-react';
import { Alerta, Dato, Etiqueta } from '../../../components/Ui';
import { descargarPdf } from '../../../lib/api';
import { fechaHora } from '../../../lib/formato';
import { ESTILO_ESTADO, PASOS, codigoProyecto, enSituacion, pasoAlcanzado } from '../constantes';
import type { EstadoProyecto, SolicitudProyecto } from '../../../lib/tipos';

const marcador = (cumplido: boolean, enCurso: boolean, rechazada: boolean) => {
  if (cumplido) return 'border-emerald-500 bg-emerald-500 text-white';
  if (enCurso) return 'border-amber-500 bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300';
  if (rechazada) return 'border-red-300 bg-red-50 text-red-400 dark:border-red-500/40 dark:bg-red-500/10 dark:text-red-400';
  return 'border-slate-300 bg-white text-slate-400 dark:border-noche-600 dark:bg-noche-800 dark:text-slate-500';
};

const resumen = (estado: EstadoProyecto) => {
  if (estado === 'Rechazada') return 'border-red-200 text-red-700 dark:border-red-500/30 dark:text-red-400';
  if (estado === 'Implementada') return 'border-emerald-200 text-emerald-700 dark:border-emerald-500/30 dark:text-emerald-400';
  return 'border-slate-200 text-amber-700 dark:border-noche-700 dark:text-amber-300';
};

const Recorrido = ({ proyecto }: { proyecto: SolicitudProyecto }) => {
  const alcanzado = pasoAlcanzado(proyecto.estado);
  const rechazada = proyecto.estado === 'Rechazada';

  return (
    <div className="superficie p-4">
      <div className="flex items-center justify-between gap-1">
        {PASOS.map((paso, indice) => {
          const cumplido = indice <= alcanzado;
          const enCurso = indice === alcanzado + 1 && !rechazada;

          return (
            <div key={paso} className="flex flex-1 flex-col items-center gap-1.5 text-center">
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${indice === 0 ? 'bg-transparent'
                  : cumplido ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-noche-700'}`} />
                <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-xs font-bold
                  ${marcador(cumplido, enCurso, rechazada)}`}>
                  {cumplido ? <Check className="h-4 w-4" /> : indice + 1}
                </span>
                <span className={`h-0.5 flex-1 ${indice === PASOS.length - 1 ? 'bg-transparent'
                  : indice < alcanzado ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-noche-700'}`} />
              </div>
              <span className={`text-xs font-semibold leading-tight ${cumplido
                ? 'text-emerald-700 dark:text-emerald-400'
                : enCurso ? 'text-amber-700 dark:text-amber-300' : 'text-slate-400 dark:text-slate-500'}`}>
                {paso}
              </span>
            </div>
          );
        })}
      </div>
      <p className={`mt-3 border-t pt-3 text-center text-sm font-semibold ${resumen(proyecto.estado)}`}>
        {enSituacion(proyecto.estado)}
        {['En desarrollo', 'En pruebas'].includes(proyecto.estado) && ` - ${proyecto.avance}% de avance`}
      </p>
    </div>
  );
};

const Bloque = ({ etiqueta, texto }: { etiqueta: string; texto: string }) => (
  <div>
    <p className="etiqueta">{etiqueta}</p>
    <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{texto}</p>
  </div>
);

export const Ficha = ({ ficha, alCerrar }: { ficha: SolicitudProyecto; alCerrar: () => void }) => (
  <div className="space-y-5">
    <div className="superficie flex flex-wrap items-start justify-between gap-3 p-4">
      <div>
        <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">{ficha.titulo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {ficha.solicitante_nombre} - {ficha.area_nombre} - {ficha.sucursal_nombre} - {ficha.tipo}
        </p>
      </div>
      <Etiqueta texto={ficha.estado} clase={ESTILO_ESTADO[ficha.estado]} />
    </div>

    <Recorrido proyecto={ficha} />

    <div className="grid gap-6 lg:grid-cols-2">
      <div className="space-y-4">
        <Bloque etiqueta="Que problema quiere resolver" texto={ficha.problema} />
        <Bloque etiqueta="Como lo resuelven hoy" texto={ficha.situacion_actual} />
        <Bloque etiqueta="Como se lo imagina funcionando" texto={ficha.propuesta} />
        <Bloque etiqueta="Que se gana con esto" texto={ficha.beneficio} />
      </div>

      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Dato etiqueta="Personas afectadas" valor={ficha.personas_afectadas} />
          <Dato etiqueta="Frecuencia" valor={ficha.frecuencia} />
          <Dato etiqueta="Urgencia declarada" valor={ficha.urgencia} />
          <Dato etiqueta="Registrada el" valor={fechaHora(ficha.fecha_creacion)} />
        </div>
        <Dato etiqueta="Sistemas que usa hoy" valor={ficha.sistemas_actuales} />

        <div className="superficie space-y-3 p-4">
          <p className="text-xs font-bold uppercase tracking-wide text-institucional-700 dark:text-institucional-300">
            Evaluacion de Sistemas
          </p>
          {ficha.evaluado_por_nombre ? (
            <>
              <div className="grid grid-cols-2 gap-3">
                <Dato etiqueta="Esfuerzo" valor={ficha.esfuerzo_estimado} />
                <Dato etiqueta="Valor" valor={ficha.valor_estimado} />
              </div>
              <Dato etiqueta="Observacion" valor={ficha.evaluacion_ti} />
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ficha.evaluado_por_nombre} - {fechaHora(ficha.fecha_evaluacion)}
              </p>
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">Todavia no fue evaluada.</p>
          )}
        </div>

        {ficha.aprobado_por_nombre && (
          <div className="superficie space-y-2 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-institucional-700 dark:text-institucional-300">
              Aprobacion
            </p>
            <Dato etiqueta="Responsable del desarrollo" valor={ficha.responsable_nombre} />
            <Dato etiqueta="Observacion" valor={ficha.observacion_aprobacion} />
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {ficha.aprobado_por_nombre} - {fechaHora(ficha.fecha_aprobacion)}
            </p>
          </div>
        )}
      </div>
    </div>

    {ficha.estado === 'Rechazada' && (
      <Alerta mensaje={`No aprobada por ${ficha.rechazado_por_nombre ?? 'la organizacion'}: ${ficha.motivo_rechazo ?? 'sin motivo registrado'}`} />
    )}

    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
      <button
        type="button"
        className="boton-secundario"
        onClick={() => void descargarPdf(`/proyectos/${ficha.id}/pdf`, {}, `${codigoProyecto(ficha.id)}.pdf`)}
      >
        <FileDown className="h-4 w-4" />
        Descargar la peticion
      </button>
      <button type="button" className="boton-primario" onClick={alCerrar}>Cerrar</button>
    </div>
  </div>
);
