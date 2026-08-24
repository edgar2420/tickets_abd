import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, PauseCircle, SignalHigh, Users } from 'lucide-react';
import { api } from '../../../lib/api';
import { Modal } from '../../../components/Ui';
import { estiloPrioridad } from '../../../lib/formato';
import type { PrioridadTicket } from '../../../lib/tipos';
import { OBJETIVOS, PRIORIDADES } from '../constantes';

interface Tecnico {
  id: number;
  nombre: string;
  rol: string;
}

interface Comun {
  abierto: boolean;
  alCerrar: () => void;
  procesando: boolean;
  ejecutar: (ruta: string, cuerpo?: unknown) => void;
  ticketId: number;
}

export const ModalResolver = ({ abierto, alCerrar, procesando, ejecutar, ticketId }: Comun) => {
  const [solucion, setSolucion] = useState('');
  const [minutos, setMinutos] = useState('');
  const [observaciones, setObservaciones] = useState('');

  return (
    <Modal
      titulo="Registrar solucion tecnica"
      icono={CheckCircle2}
      abierto={abierto}
      alCerrar={alCerrar}
      ancho="max-w-4xl"
      acciones={
        <>
          <button type="button" className="boton-secundario" onClick={alCerrar}>Cancelar</button>
          <button
            type="button"
            className="boton-primario"
            disabled={procesando || solucion.trim().length < 10}
            onClick={() => ejecutar(`/tickets/${ticketId}/resolver`, {
              solucion_detalle: solucion.trim(),
              minutos_empleados: minutos === '' ? null : Number(minutos),
              observaciones: observaciones.trim() || null
            })}
          >
            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            Guardar solucion
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="solucion">Detalle de la solucion aplicada</label>
          <textarea
            id="solucion"
            className="campo min-h-36"
            value={solucion}
            onChange={(e) => setSolucion(e.target.value)}
            placeholder="Describa el diagnostico, las acciones ejecutadas y el resultado obtenido"
          />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="etiqueta" htmlFor="minutos">Tiempo empleado (minutos)</label>
            <input
              id="minutos"
              className="campo"
              type="number"
              min={0}
              max={100000}
              value={minutos}
              onChange={(e) => setMinutos(e.target.value)}
              placeholder="Ejemplo: 90"
            />
          </div>
          <div>
            <label className="etiqueta" htmlFor="obs">Observaciones</label>
            <input
              id="obs"
              className="campo"
              maxLength={1000}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Recomendacion o pendiente (opcional)"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
};

export const ModalAsignar = ({ abierto, alCerrar, procesando, ejecutar, ticketId }: Comun) => {
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [elegido, setElegido] = useState('');

  useEffect(() => {
    if (!abierto || tecnicos.length > 0) return;
    void api<{ datos: Tecnico[] }>('/usuarios/tecnicos')
      .then(({ datos }) => setTecnicos(datos))
      .catch(() => setTecnicos([]));
  }, [abierto, tecnicos.length]);

  return (
    <Modal
      titulo="Asignar ticket a un tecnico"
      icono={Users}
      abierto={abierto}
      alCerrar={alCerrar}
      ancho="max-w-2xl"
      acciones={
        <>
          <button type="button" className="boton-secundario" onClick={alCerrar}>Cancelar</button>
          <button
            type="button"
            className="boton-primario"
            disabled={procesando || !elegido}
            onClick={() => ejecutar(`/tickets/${ticketId}/asignar`, { asignado_id: Number(elegido) })}
          >
            <Users className="h-4 w-4" />
            Asignar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="tecnico">Tecnico responsable</label>
          <select id="tecnico" className="campo" value={elegido} onChange={(e) => setElegido(e.target.value)}>
            <option value="">Seleccione un tecnico</option>
            {tecnicos.map((tecnico) => (
              <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre} ({tecnico.rol})</option>
            ))}
          </select>
        </div>
      </div>
    </Modal>
  );
};

export const ModalPrioridad = ({ abierto, alCerrar, procesando, ejecutar, ticketId, actual }:
  Comun & { actual: PrioridadTicket }) => {
  const [prioridad, setPrioridad] = useState<PrioridadTicket>(actual);
  const [motivo, setMotivo] = useState('');

  return (
    <Modal
      titulo="Definir la prioridad"
      icono={SignalHigh}
      abierto={abierto}
      alCerrar={alCerrar}
      ancho="max-w-3xl"
      acciones={
        <>
          <button type="button" className="boton-secundario" onClick={alCerrar}>Cancelar</button>
          <button
            type="button"
            className="boton-primario"
            disabled={procesando}
            onClick={() => ejecutar(`/tickets/${ticketId}/prioridad`, { prioridad, motivo: motivo.trim() || null })}
          >
            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <SignalHigh className="h-4 w-4" />}
            Guardar prioridad
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-200">
          La prioridad la determina Sistemas y fija el objetivo de atencion del ticket.
        </p>
        <div className="space-y-2">
          {PRIORIDADES.map((opcion) => (
            <button
              key={opcion}
              type="button"
              onClick={() => setPrioridad(opcion)}
              className={`flex w-full items-start gap-3 rounded-lg border-2 px-3 py-2.5 text-left transition ${
                prioridad === opcion
                  ? 'border-institucional-900 ring-2 ring-institucional-900/15'
                  : 'border-slate-200 hover:border-slate-300 dark:border-noche-700'
              }`}
            >
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${estiloPrioridad[opcion]}`}>
                {opcion}
              </span>
              <span className="text-xs leading-snug text-slate-600 dark:text-slate-200">
                Atencion {OBJETIVOS[opcion].texto.toLowerCase()} ({OBJETIVOS[opcion].horas} h). {OBJETIVOS[opcion].criterio}.
              </span>
            </button>
          ))}
        </div>
        <div>
          <label className="etiqueta" htmlFor="motivo-prioridad">Motivo</label>
          <input
            id="motivo-prioridad"
            className="campo"
            maxLength={300}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Por que se asigna esta prioridad (opcional)"
          />
        </div>
      </div>
    </Modal>
  );
};

export const ModalEspera = ({ abierto, alCerrar, procesando, ejecutar, ticketId }: Comun) => {
  const [motivo, setMotivo] = useState('');

  return (
    <Modal
      titulo="Poner el ticket en espera"
      icono={PauseCircle}
      abierto={abierto}
      alCerrar={alCerrar}
      ancho="max-w-3xl"
      acciones={
        <>
          <button type="button" className="boton-secundario" onClick={alCerrar}>Cancelar</button>
          <button
            type="button"
            className="boton-primario"
            disabled={procesando || motivo.trim().length < 10}
            onClick={() => ejecutar(`/tickets/${ticketId}/espera`, { motivo_espera: motivo.trim() })}
          >
            {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <PauseCircle className="h-4 w-4" />}
            Poner en espera
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="motivo-espera">Motivo de la espera</label>
          <textarea
            id="motivo-espera"
            className="campo min-h-28"
            maxLength={300}
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="Se espera un repuesto, la respuesta del usuario o la intervencion de un tercero"
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Minimo 10 caracteres.</p>
        </div>
      </div>
    </Modal>
  );
};
