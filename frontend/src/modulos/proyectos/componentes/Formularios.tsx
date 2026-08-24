import type { FormEvent } from 'react';
import { Info, Lightbulb } from 'lucide-react';
import { Dato } from '../../../components/Ui';
import {
  ESCALAS, ESTADOS, FRECUENCIAS, GUIA, PETICION_VACIA, TIPOS, URGENCIAS, codigoProyecto
} from '../constantes';
import type { AccionProyecto } from '../usarProyectos';
import type { Frecuencia, PrioridadTicket, TipoProyecto, Usuario } from '../../../lib/tipos';

type Peticion = typeof PETICION_VACIA;
type Datos = Record<string, string>;

export const FormularioPeticion = ({ nueva, setNueva, alEnviar }: {
  nueva: Peticion;
  setNueva: (actualizar: (previa: Peticion) => Peticion) => void;
  alEnviar: (evento: FormEvent) => void;
}) => (
  <form id="form-proyecto" onSubmit={alEnviar} className="space-y-5">
    <p className="flex items-start gap-2 rounded-lg border border-institucional-200 bg-institucional-50 p-3 text-xs
                  text-institucional-900 dark:border-institucional-500/30 dark:bg-institucional-500/10 dark:text-institucional-200">
      <Lightbulb className="mt-0.5 h-4 w-4 shrink-0" />
      <span>
        Cuente el problema con sus palabras. No hace falta que sepa de programacion: lo que se necesita es
        entender que le cuesta trabajo hoy y como le gustaria que fuera. Con eso Tecnologias de la
        Informacion evalua si conviene construirlo y cuanto esfuerzo lleva.
      </span>
    </p>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="lg:col-span-2">
        <label className="etiqueta">Como llamaria a esta idea</label>
        <input
          className="campo"
          required
          minLength={10}
          maxLength={200}
          placeholder="Consolidar el cierre mensual de las seis sucursales"
          value={nueva.titulo}
          onChange={(e) => setNueva((previa) => ({ ...previa, titulo: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Que tipo de pedido es</label>
        <select
          className="campo"
          value={nueva.tipo}
          onChange={(e) => setNueva((previa) => ({ ...previa, tipo: e.target.value as TipoProyecto }))}
        >
          {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
      </div>
    </div>

    <div className="grid gap-x-6 gap-y-4 lg:grid-cols-2">
      {GUIA.map(({ campo, titulo, ayuda, minimo }) => {
        const escrito = nueva[campo].trim().length;
        return (
          <div key={campo}>
            <label className="etiqueta">{titulo}</label>
            <p className="mb-1.5 text-xs leading-snug text-slate-500 dark:text-slate-400">{ayuda}</p>
            <textarea
              className="campo min-h-28"
              required
              minLength={minimo}
              maxLength={2000}
              value={nueva[campo]}
              onChange={(e) => setNueva((previa) => ({ ...previa, [campo]: e.target.value }))}
            />
            <p className={`mt-1 text-right text-xs ${escrito >= minimo
              ? 'text-emerald-600 dark:text-emerald-400'
              : 'text-slate-400 dark:text-slate-500'}`}>
              {escrito} de {minimo} caracteres minimos
            </p>
          </div>
        );
      })}
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <div>
        <label className="etiqueta">A cuantas personas afecta</label>
        <input
          type="number"
          min={1}
          max={9999}
          className="campo"
          value={nueva.personas_afectadas}
          onChange={(e) => setNueva((previa) => ({ ...previa, personas_afectadas: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Cada cuanto ocurre</label>
        <select
          className="campo"
          value={nueva.frecuencia}
          onChange={(e) => setNueva((previa) => ({ ...previa, frecuencia: e.target.value as Frecuencia }))}
        >
          {FRECUENCIAS.map((frecuencia) => <option key={frecuencia} value={frecuencia}>{frecuencia}</option>)}
        </select>
      </div>
      <div>
        <label className="etiqueta">Que tan urgente es</label>
        <select
          className="campo"
          value={nueva.urgencia}
          onChange={(e) => setNueva((previa) => ({ ...previa, urgencia: e.target.value as PrioridadTicket }))}
        >
          {URGENCIAS.map((urgencia) => <option key={urgencia} value={urgencia}>{urgencia}</option>)}
        </select>
      </div>
      <div>
        <label className="etiqueta">Que usa hoy para esto</label>
        <input
          className="campo"
          maxLength={300}
          placeholder="Planillas de Excel por correo"
          value={nueva.sistemas_actuales}
          onChange={(e) => setNueva((previa) => ({ ...previa, sistemas_actuales: e.target.value }))}
        />
      </div>
    </div>

  </form>
);

export const FormularioAccion = ({ accion, datos, setDatos, responsables, alEnviar }: {
  accion: AccionProyecto;
  datos: Datos;
  setDatos: (actualizar: (previos: Datos) => Datos) => void;
  responsables: Usuario[];
  alEnviar: (evento: FormEvent) => void;
}) => {
  const cambiar = (clave: string, valor: string) => setDatos((previos) => ({ ...previos, [clave]: valor }));

  return (
    <form id="form-accion-proyecto" onSubmit={alEnviar} className="space-y-4">
      <div className="superficie p-4">
        <p className="font-semibold text-institucional-900 dark:text-slate-100">{accion.proyecto.titulo}</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
          {codigoProyecto(accion.proyecto.id)} - {accion.proyecto.solicitante_nombre} - {accion.proyecto.area_nombre}
        </p>
      </div>

      {accion.tipo === 'evaluar' && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="superficie space-y-3 p-4">
            <p className="text-xs font-bold uppercase tracking-wide text-institucional-700 dark:text-institucional-300">
              Lo que plantea el area
            </p>
            <Dato etiqueta="Problema" valor={accion.proyecto.problema} />
            <Dato etiqueta="Como lo resuelven hoy" valor={accion.proyecto.situacion_actual} />
            <Dato etiqueta="Que proponen" valor={accion.proyecto.propuesta} />
            <Dato etiqueta="Alcance" valor={`${accion.proyecto.personas_afectadas} persona(s), uso ${accion.proyecto.frecuencia.toLowerCase()}`} />
          </div>

          <div className="space-y-3">
            <div>
              <label className="etiqueta">Evaluacion tecnica</label>
              <textarea
                className="campo min-h-32"
                required
                minLength={20}
                maxLength={1000}
                placeholder="Viabilidad, que haria falta, riesgos, si conviene resolverlo con lo que ya existe"
                value={datos.evaluacion_ti ?? ''}
                onChange={(e) => cambiar('evaluacion_ti', e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="etiqueta">Esfuerzo estimado</label>
                <select className="campo" value={datos.esfuerzo_estimado ?? 'Medio'}
                  onChange={(e) => cambiar('esfuerzo_estimado', e.target.value)}>
                  {ESCALAS.map((escala) => <option key={escala} value={escala}>{escala}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta">Valor para la empresa</label>
                <select className="campo" value={datos.valor_estimado ?? 'Medio'}
                  onChange={(e) => cambiar('valor_estimado', e.target.value)}>
                  {ESCALAS.map((escala) => <option key={escala} value={escala}>{escala}</option>)}
                </select>
              </div>
            </div>
            <p className="flex items-start gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Esfuerzo alto con valor bajo es la combinacion que conviene postergar; valor alto con
              esfuerzo bajo es la que conviene hacer primero.
            </p>
          </div>
        </div>
      )}

      {accion.tipo === 'aprobar' && (
        <>
          <div className="superficie grid gap-3 p-4 sm:grid-cols-2">
            <Dato etiqueta="Esfuerzo estimado" valor={accion.proyecto.esfuerzo_estimado} />
            <Dato etiqueta="Valor para la empresa" valor={accion.proyecto.valor_estimado} />
            <div className="sm:col-span-2">
              <Dato etiqueta="Evaluacion de TI" valor={accion.proyecto.evaluacion_ti} />
            </div>
          </div>
          <div>
            <label className="etiqueta">Responsable del desarrollo</label>
            <select className="campo" value={datos.responsable_id ?? ''}
              onChange={(e) => cambiar('responsable_id', e.target.value)}>
              <option value="">Definir mas adelante</option>
              {responsables.map((usuario) => (
                <option key={usuario.id} value={usuario.id}>{usuario.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta">Observacion de la aprobacion</label>
            <textarea
              className="campo min-h-24"
              maxLength={500}
              placeholder="Prioridad dentro de la cartera, plazo esperado o condiciones"
              value={datos.observacion_aprobacion ?? ''}
              onChange={(e) => cambiar('observacion_aprobacion', e.target.value)}
            />
          </div>
        </>
      )}

      {accion.tipo === 'avance' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="etiqueta">Etapa</label>
              <select className="campo" value={datos.estado ?? 'En desarrollo'}
                onChange={(e) => cambiar('estado', e.target.value)}>
                {ESTADOS.filter((estado) => ['En desarrollo', 'En pruebas', 'Implementada'].includes(estado))
                  .map((estado) => <option key={estado} value={estado}>{estado}</option>)}
              </select>
            </div>
            <div>
              <label className="etiqueta">Responsable</label>
              <select className="campo" value={datos.responsable_id ?? ''}
                onChange={(e) => cambiar('responsable_id', e.target.value)}>
                <option value="">Sin asignar</option>
                {responsables.map((usuario) => (
                  <option key={usuario.id} value={usuario.id}>{usuario.nombre}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="etiqueta">Avance: {datos.avance ?? 0}%</label>
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              className="w-full accent-institucional-700"
              value={datos.avance ?? '0'}
              onChange={(e) => cambiar('avance', e.target.value)}
            />
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
              Al marcar la etapa como implementada el avance queda en 100 por ciento.
            </p>
          </div>
        </>
      )}

      {accion.tipo === 'rechazar' && (
        <div>
          <label className="etiqueta">Motivo</label>
          <textarea
            className="campo min-h-24"
            required
            minLength={10}
            maxLength={500}
            placeholder="Explique por que no se aprueba. El solicitante lo va a leer."
            value={datos.motivo_rechazo ?? ''}
            onChange={(e) => cambiar('motivo_rechazo', e.target.value)}
          />
        </div>
      )}

    </form>
  );
};
