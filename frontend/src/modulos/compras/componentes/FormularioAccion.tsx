import type { FormEvent } from 'react';
import { Dato } from '../../../components/Ui';
import { montoBs } from '../../../lib/formato';
import { codigoCompra } from '../constantes';
import type { AccionEnCurso } from '../usarCompras';
import type { Equipo } from '../../../lib/tipos';

type Datos = Record<string, string>;
type Actualizar = (actualizar: (previos: Datos) => Datos) => void;

const Campo = ({ clave, etiqueta, datos, setDatos, ...opciones }: {
  clave: string;
  etiqueta: string;
  datos: Datos;
  setDatos: Actualizar;
} & Record<string, unknown>) => (
  <div>
    <label className="etiqueta">{etiqueta}</label>
    <input
      className="campo"
      value={datos[clave] ?? ''}
      onChange={(e) => setDatos((previos) => ({ ...previos, [clave]: e.target.value }))}
      {...opciones}
    />
  </div>
);

const Area = ({ clave, etiqueta, datos, setDatos, ...opciones }: {
  clave: string;
  etiqueta: string;
  datos: Datos;
  setDatos: Actualizar;
} & Record<string, unknown>) => (
  <div>
    <label className="etiqueta">{etiqueta}</label>
    <textarea
      className="campo min-h-24"
      value={datos[clave] ?? ''}
      onChange={(e) => setDatos((previos) => ({ ...previos, [clave]: e.target.value }))}
      {...opciones}
    />
  </div>
);

const PanelPedido = ({ accion }: { accion: AccionEnCurso }) => (
  <div className="superficie space-y-3 p-4">
    <p className="text-xs font-bold uppercase tracking-wide text-institucional-700 dark:text-institucional-300">
      Lo que pide el solicitante
    </p>
    <Dato etiqueta="Tipo y cantidad" valor={`${accion.solicitud.tipo_equipo} - ${accion.solicitud.cantidad} unidad(es)`} />
    <Dato etiqueta="Especificaciones que sugirio" valor={accion.solicitud.especificaciones} />
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">Justificacion</p>
      <p className="mt-0.5 text-sm leading-relaxed text-slate-700 dark:text-slate-200">
        {accion.solicitud.justificacion}
      </p>
    </div>
  </div>
);

export const FormularioAccion = ({ accion, datos, setDatos, equipos, guardando, alEnviar, alCancelar }: {
  accion: AccionEnCurso;
  datos: Datos;
  setDatos: Actualizar;
  equipos: Equipo[];
  guardando: boolean;
  alEnviar: (evento: FormEvent) => void;
  alCancelar: () => void;
}) => {
  const campo = { datos, setDatos };
  const esRevision = accion.tipo === 'revisar' || accion.tipo === 'aprobar-ti';

  return (
    <form onSubmit={alEnviar} className="space-y-4">
      <div className="superficie p-4">
        <p className="font-semibold text-institucional-900 dark:text-slate-100">{accion.solicitud.titulo}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {codigoCompra(accion.solicitud.id)} - {accion.solicitud.solicitante_nombre} - {accion.solicitud.cantidad} unidad(es)
        </p>
      </div>

      {esRevision && (
        <div className="grid gap-4 lg:grid-cols-2">
          <PanelPedido accion={accion} />
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-wide text-institucional-700 dark:text-institucional-300">
              Lo que recomienda Tecnologias de la Informacion
            </p>
            <Area
              clave="equipo_sugerido"
              etiqueta="Equipo sugerido"
              maxLength={200}
              placeholder="Computadora de escritorio, procesador de gama media, 16 GB de memoria y disco solido de 512 GB"
              {...campo}
            />
            <Campo
              clave="monto_estimado"
              etiqueta="Monto referencial (Bs)"
              type="number"
              min={0}
              step="0.01"
              placeholder="4500.00"
              {...campo}
            />
            <Area
              clave="observacion_ti"
              etiqueta="Observacion tecnica"
              maxLength={500}
              placeholder="Viabilidad tecnica, alternativas evaluadas o condiciones"
              {...campo}
            />
          </div>
        </div>
      )}

      {accion.tipo === 'aprobar-gerencia' && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            <PanelPedido accion={accion} />
            <div className="superficie space-y-3 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-institucional-700 dark:text-institucional-300">
                Lo que recomienda TI
              </p>
              <Dato etiqueta="Equipo sugerido" valor={accion.solicitud.equipo_sugerido} />
              <Dato etiqueta="Monto referencial" valor={montoBs(accion.solicitud.monto_estimado)} />
              <Dato etiqueta="Observacion tecnica" valor={accion.solicitud.observacion_ti} />
            </div>
          </div>
          <Area
            clave="observacion_gerencia"
            etiqueta="Observacion de Gerencia"
            maxLength={500}
            placeholder="Partida presupuestaria, condiciones o plazo"
            {...campo}
          />
        </>
      )}

      {accion.tipo === 'rechazar' && (
        <Area
          clave="motivo_rechazo"
          etiqueta="Motivo del rechazo"
          required
          minLength={10}
          maxLength={500}
          placeholder="Explique por que no se aprueba la solicitud"
          {...campo}
        />
      )}

      {accion.tipo === 'comprar' && (
        <>
          <Campo clave="numero_orden" etiqueta="Numero de orden de compra" maxLength={60} placeholder="OC-2026-0145" {...campo} />
          <Campo clave="monto_final" etiqueta="Monto final (Bs)" type="number" min={0} step="0.01" {...campo} />
        </>
      )}

      {accion.tipo === 'entregar' && (
        <div>
          <label className="etiqueta">Equipo del parque (opcional)</label>
          <select
            className="campo"
            value={datos.equipo_id ?? ''}
            onChange={(e) => setDatos((previos) => ({ ...previos, equipo_id: e.target.value }))}
          >
            <option value="">Sin vincular</option>
            {equipos.map((equipo) => (
              <option key={equipo.id} value={equipo.id}>{equipo.codigo} - {equipo.nombre_equipo}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
            Si el equipo ya fue dado de alta en el parque, vinculelo para dejar la trazabilidad completa.
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
        <button type="button" className="boton-secundario" onClick={alCancelar}>Cancelar</button>
        <button
          type="submit"
          className={accion.tipo === 'rechazar' ? 'boton-peligro' : 'boton-primario'}
          disabled={guardando}
        >
          Confirmar
        </button>
      </div>
    </form>
  );
};
