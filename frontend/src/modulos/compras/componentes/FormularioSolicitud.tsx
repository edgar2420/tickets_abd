import type { FormEvent } from 'react';
import { PRIORIDADES, SOLICITUD_VACIA, TIPOS_EQUIPO } from '../constantes';
import type { PrioridadTicket, Usuario } from '../../../lib/tipos';

type Solicitud = typeof SOLICITUD_VACIA;

export const FormularioSolicitud = ({ nueva, setNueva, usuario, guardando, alEnviar, alCancelar }: {
  nueva: Solicitud;
  setNueva: (actualizar: (previa: Solicitud) => Solicitud) => void;
  usuario: Usuario | null;
  guardando: boolean;
  alEnviar: (evento: FormEvent) => void;
  alCancelar: () => void;
}) => (
  <form onSubmit={alEnviar} className="space-y-4">
    <div>
      <label className="etiqueta">Que necesita</label>
      <input
        className="campo"
        required
        minLength={6}
        maxLength={200}
        placeholder="Computadora de escritorio para Contabilidad"
        value={nueva.titulo}
        onChange={(e) => setNueva((previa) => ({ ...previa, titulo: e.target.value }))}
      />
    </div>

    <div>
      <label className="etiqueta">Justificacion</label>
      <textarea
        className="campo min-h-28"
        required
        minLength={15}
        placeholder="Explique por que se necesita: que problema resuelve o que tarea permite realizar"
        value={nueva.justificacion}
        onChange={(e) => setNueva((previa) => ({ ...previa, justificacion: e.target.value }))}
      />
    </div>

    <div className="grid gap-4 sm:grid-cols-3">
      <div>
        <label className="etiqueta">Tipo de equipo</label>
        <select
          className="campo"
          value={nueva.tipo_equipo}
          onChange={(e) => setNueva((previa) => ({ ...previa, tipo_equipo: e.target.value }))}
        >
          {TIPOS_EQUIPO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
        </select>
      </div>
      <div>
        <label className="etiqueta">Cantidad</label>
        <input
          type="number"
          min={1}
          max={999}
          className="campo"
          value={nueva.cantidad}
          onChange={(e) => setNueva((previa) => ({ ...previa, cantidad: e.target.value }))}
        />
      </div>
      <div>
        <label className="etiqueta">Prioridad</label>
        <select
          className="campo"
          value={nueva.prioridad}
          onChange={(e) => setNueva((previa) => ({ ...previa, prioridad: e.target.value as PrioridadTicket }))}
        >
          {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
        </select>
      </div>
    </div>

    <div>
      <label className="etiqueta">Especificaciones sugeridas</label>
      <input
        className="campo"
        maxLength={500}
        placeholder="Intel Core i5, 16 GB de RAM, disco solido de 512 GB"
        value={nueva.especificaciones}
        onChange={(e) => setNueva((previa) => ({ ...previa, especificaciones: e.target.value }))}
      />
    </div>

    <p className="superficie p-3 text-xs text-slate-600 dark:text-slate-200">
      La solicitud se registra a nombre de {usuario?.nombre}, area {usuario?.area},
      sucursal {usuario?.sucursal ?? 'sin asignar'}. Pasara primero por la revision tecnica de TI
      y luego por la aprobacion de Gerencia.
    </p>

    <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
      <button type="button" className="boton-secundario" onClick={alCancelar}>Cancelar</button>
      <button type="submit" className="boton-primario" disabled={guardando}>Enviar solicitud</button>
    </div>
  </form>
);
