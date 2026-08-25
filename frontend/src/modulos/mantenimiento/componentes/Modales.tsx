import { useEffect, useState } from 'react';
import { CalendarClock, ClipboardCheck, History } from 'lucide-react';
import { Modal, Vacio } from '../../../components/Ui';
import { codigoTicket, fechaCorta } from '../../../lib/formato';
import type { Equipo } from '../../../lib/tipos';
import {
  FRECUENCIAS, type EquipoDelPlan, type Frecuencia, type RegistroMantenimiento
} from '../constantes';

const hoy = () => new Date().toISOString().slice(0, 10);

export const ModalPlan = ({ equipo, equipos, guardando, alCerrar, alGuardar }: {
  equipo: EquipoDelPlan | Equipo | null;
  equipos: Equipo[];
  guardando: boolean;
  alCerrar: () => void;
  alGuardar: (id: number, cuerpo: unknown) => void;
}) => {
  const existente = equipo && 'frecuencia_mantenimiento' in equipo
    ? (equipo as EquipoDelPlan)
    : null;
  const [elegido, setElegido] = useState('');
  const [frecuencia, setFrecuencia] = useState<Frecuencia | ''>('Trimestral');
  const [ultimo, setUltimo] = useState('');

  useEffect(() => {
    if (!equipo) return;
    setElegido(String(equipo.id));
    setFrecuencia(existente?.frecuencia_mantenimiento ?? 'Trimestral');
    setUltimo(existente?.ultimo_mantenimiento?.slice(0, 10) ?? '');
  }, [equipo, existente]);

  const id = Number(elegido);
  const nuevo = equipo !== null && !existente;

  return (
    <Modal
      titulo={existente ? `Plan de ${existente.codigo}` : 'Incorporar un equipo al plan'}
      icono={CalendarClock}
      abierto={equipo !== null}
      alCerrar={alCerrar}
      ancho="max-w-2xl"
      acciones={
        <>
          <button type="button" className="boton-secundario" onClick={alCerrar}>Cancelar</button>
          <button
            type="button"
            className="boton-primario"
            disabled={guardando || !id}
            onClick={() => alGuardar(id, {
              frecuencia_mantenimiento: frecuencia || null,
              ultimo_mantenimiento: ultimo || null
            })}
          >
            Guardar plan
          </button>
        </>
      }
    >
      <div className="space-y-4">
        {nuevo && (
          <div>
            <label className="etiqueta" htmlFor="equipo-plan">Equipo</label>
            <select id="equipo-plan" className="campo" value={elegido} onChange={(e) => setElegido(e.target.value)}>
              <option value="">Seleccione un equipo</option>
              {equipos.map((item) => (
                <option key={item.id} value={item.id}>{item.codigo} - {item.nombre_equipo}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="etiqueta" htmlFor="frecuencia">Frecuencia</label>
          <select
            id="frecuencia"
            className="campo"
            value={frecuencia}
            onChange={(e) => setFrecuencia(e.target.value as Frecuencia | '')}
          >
            {FRECUENCIAS.map((opcion) => <option key={opcion} value={opcion}>{opcion}</option>)}
            <option value="">Retirar del plan</option>
          </select>
        </div>

        <div>
          <label className="etiqueta" htmlFor="ultimo">Ultimo mantenimiento</label>
          <input
            id="ultimo"
            className="campo"
            type="date"
            max={hoy()}
            value={ultimo}
            onChange={(e) => setUltimo(e.target.value)}
          />
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
            A partir de esta fecha se calcula cuando toca el proximo.
          </p>
        </div>
      </div>
    </Modal>
  );
};

export const ModalRegistro = ({ equipo, guardando, alCerrar, alGuardar }: {
  equipo: EquipoDelPlan | null;
  guardando: boolean;
  alCerrar: () => void;
  alGuardar: (id: number, cuerpo: unknown) => void;
}) => {
  const [fecha, setFecha] = useState(hoy());
  const [observaciones, setObservaciones] = useState('');

  useEffect(() => {
    if (!equipo) return;
    setFecha(hoy());
    setObservaciones('');
  }, [equipo]);

  return (
    <Modal
      titulo={equipo ? `Registrar el mantenimiento de ${equipo.codigo}` : 'Registrar mantenimiento'}
      icono={ClipboardCheck}
      abierto={equipo !== null}
      alCerrar={alCerrar}
      ancho="max-w-2xl"
      acciones={
        <>
          <button type="button" className="boton-secundario" onClick={alCerrar}>Cancelar</button>
          <button
            type="button"
            className="boton-primario"
            disabled={guardando || !equipo}
            onClick={() => equipo && alGuardar(equipo.id, {
              fecha,
              observaciones: observaciones.trim() || null
            })}
          >
            Registrar
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="etiqueta" htmlFor="fecha-mantenimiento">Fecha</label>
          <input
            id="fecha-mantenimiento"
            className="campo"
            type="date"
            max={hoy()}
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label className="etiqueta" htmlFor="obs-mantenimiento">Observaciones</label>
          <textarea
            id="obs-mantenimiento"
            className="campo h-28 resize-none"
            maxLength={1000}
            value={observaciones}
            onChange={(e) => setObservaciones(e.target.value)}
            placeholder="Limpieza interna, cambio de pasta termica, revision de ventiladores"
          />
        </div>
      </div>
    </Modal>
  );
};

export const ModalHistorial = ({ equipo, historial, alCerrar }: {
  equipo: EquipoDelPlan | null;
  historial: RegistroMantenimiento[];
  alCerrar: () => void;
}) => (
  <Modal
    titulo={equipo ? `Historial de ${equipo.codigo}` : 'Historial'}
    icono={History}
    abierto={equipo !== null}
    alCerrar={alCerrar}
    ancho="max-w-3xl"
    acciones={<button type="button" className="boton-primario" onClick={alCerrar}>Cerrar</button>}
  >
    {historial.length === 0 ? (
      <Vacio icono={History} texto="Todavia no se registro ningun mantenimiento para este equipo" />
    ) : (
      <ol className="space-y-3">
        {historial.map((registro) => (
          <li key={registro.id} className="border-l-2 border-institucional-200 pl-4 dark:border-noche-700">
            <p className="text-sm font-semibold text-institucional-900 dark:text-slate-100">
              {fechaCorta(registro.fecha)}
              {registro.ticket_numero !== null && (
                <span className="ml-2 font-mono text-xs text-institucional-700 dark:text-institucional-300">
                  {codigoTicket({ anio: registro.ticket_anio ?? undefined, numero: registro.ticket_numero })}
                </span>
              )}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-300">
              {registro.realizado_por_nombre ?? 'Sin responsable registrado'}
            </p>
            {registro.observaciones && (
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-200">{registro.observaciones}</p>
            )}
          </li>
        ))}
      </ol>
    )}
  </Modal>
);
