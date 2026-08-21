import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle2, ClipboardCheck, Clock, FileDown, History, Loader2,
  PlayCircle, UserCheck, Users
} from 'lucide-react';
import { api, descargarPdf } from '../../lib/api';
import { obtenerSocket } from '../../lib/socket';
import { usarAuth } from '../../context/AuthContext';
import { Alerta, Cargando, Etiqueta, Modal, Panel } from '../../components/Ui';
import { Conversacion } from '../../components/Conversacion';
import { codigoTicket, duracionLegible, estiloEstado, estiloPrioridad, fechaHora } from '../../lib/formato';
import type { Ticket } from '../../lib/tipos';

interface Tecnico {
  id: number;
  nombre: string;
  rol: string;
}

const Dato = ({ etiqueta, valor }: { etiqueta: string; valor: string | null | undefined }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">{etiqueta}</p>
    <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">{valor ?? 'No registrado'}</p>
  </div>
);

export const DetalleTicket = () => {
  const { id } = useParams<{ id: string }>();
  const navegar = useNavigate();
  const { usuario, puede } = usarAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [modalResolver, setModalResolver] = useState(false);
  const [modalAsignar, setModalAsignar] = useState(false);
  const [solucion, setSolucion] = useState('');
  const [tecnicos, setTecnicos] = useState<Tecnico[]>([]);
  const [tecnicoElegido, setTecnicoElegido] = useState('');

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Ticket }>(`/tickets/${id}`);
      setTicket(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar el ticket');
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket || !id) return;
    socket.emit('ticket:suscribir', Number(id));
    const alCambiar = (actualizado: Ticket) => {
      if (actualizado.id === Number(id)) void cargar();
    };
    socket.on('ticket:actualizado', alCambiar);
    socket.on('ticket:resuelto', alCambiar);
    return () => {
      socket.emit('ticket:desuscribir', Number(id));
      socket.off('ticket:actualizado', alCambiar);
      socket.off('ticket:resuelto', alCambiar);
    };
  }, [id, cargar]);

  useEffect(() => {
    if (!modalAsignar || tecnicos.length > 0) return;
    void api<{ datos: Tecnico[] }>('/usuarios/tecnicos')
      .then(({ datos }) => setTecnicos(datos))
      .catch(() => setTecnicos([]));
  }, [modalAsignar, tecnicos.length]);

  const ejecutar = async (ruta: string, cuerpo?: unknown) => {
    setProcesando(true);
    setError(null);
    try {
      const { datos } = await api<{ datos: Ticket }>(ruta, { metodo: 'PUT', cuerpo });
      setTicket(datos);
      setModalResolver(false);
      setModalAsignar(false);
      setSolucion('');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la operacion');
    } finally {
      setProcesando(false);
    }
  };

  if (!ticket && !error) return <Cargando texto="Consultando el ticket" />;
  if (error && !ticket) return <Alerta mensaje={error} />;
  if (!ticket) return null;

  const esSolicitante = ticket.solicitante_id === usuario?.id;
  const puedeTomar = puede('tickets.responder') && ticket.estado === 'Abierto';
  const puedeResolver = puede('tickets.resolver') && ['Abierto', 'En Proceso'].includes(ticket.estado);
  const puedeAsignar = puede('tickets.responder') && !['Resuelto', 'Cerrado'].includes(ticket.estado);
  const puedeCerrar = ticket.estado === 'Resuelto' && (esSolicitante || puede('tickets.resolver'));

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <button
            type="button"
            onClick={() => navegar('/tickets')}
            className="group mb-2.5 inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white py-1.5 pl-2 pr-3.5 text-xs font-semibold text-slate-600 shadow-sm transition hover:-translate-x-0.5 hover:border-institucional-300 hover:bg-institucional-50 hover:text-institucional-800 dark:bg-noche-850 dark:border-noche-700 dark:text-slate-200"
          >
            <span className="rounded-md bg-slate-100 p-1 transition group-hover:bg-institucional-100 dark:bg-noche-800">
              <ArrowLeft className="h-3.5 w-3.5" />
            </span>
            Volver al listado
          </button>
          <h1 className="text-xl font-bold text-institucional-900 dark:text-slate-100">
            <span className="font-mono text-base text-institucional-700 dark:text-institucional-300">{codigoTicket(ticket.id)}</span>
            {'  '}
            {ticket.titulo}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Etiqueta texto={ticket.estado} clase={estiloEstado[ticket.estado]} />
            <Etiqueta texto={`Prioridad ${ticket.prioridad}`} clase={estiloPrioridad[ticket.prioridad]} />
            <Etiqueta texto={ticket.categoria} clase="bg-slate-100 text-slate-700 border-slate-200 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600" />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => void descargarPdf(`/tickets/${ticket.id}/pdf`, {}, `acta-${codigoTicket(ticket.id)}.pdf`)}
          >
            <FileDown className="h-4 w-4" />
            Acta PDF
          </button>
          {puedeAsignar && (
            <button type="button" className="boton-secundario" onClick={() => setModalAsignar(true)}>
              <Users className="h-4 w-4" />
              Asignar
            </button>
          )}
          {puedeTomar && (
            <button type="button" className="boton-acento" disabled={procesando} onClick={() => void ejecutar(`/tickets/${ticket.id}/tomar`)}>
              <PlayCircle className="h-4 w-4" />
              Atender ticket
            </button>
          )}
          {puedeResolver && (
            <button type="button" className="boton-primario" onClick={() => setModalResolver(true)}>
              <CheckCircle2 className="h-4 w-4" />
              Registrar solucion
            </button>
          )}
          {puedeCerrar && (
            <button type="button" className="boton-primario" disabled={procesando} onClick={() => void ejecutar(`/tickets/${ticket.id}/cerrar`)}>
              <ClipboardCheck className="h-4 w-4" />
              Cerrar ticket
            </button>
          )}
        </div>
      </header>

      {error && <Alerta mensaje={error} />}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel titulo="Descripcion reportada" icono={ClipboardCheck}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{ticket.descripcion}</p>
          </Panel>

          <Panel titulo="Solucion tecnica" icono={CheckCircle2}>
            {ticket.solucion_detalle ? (
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{ticket.solucion_detalle}</p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">Aun no se ha registrado una solucion para este requerimiento.</p>
            )}
          </Panel>

          <Conversacion ticketId={ticket.id} />

          <Panel titulo="Bitacora de acciones" icono={History}>
            <ol className="space-y-3">
              {(ticket.bitacora ?? []).map((registro, indice) => (
                <li key={indice} className="flex gap-3 border-l-2 border-institucional-200 pl-4">
                  <div>
                    <p className="text-sm font-semibold text-institucional-900 dark:text-slate-100">{registro.accion}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-300">
                      {registro.usuario_nombre ?? 'Sistema'} - {fechaHora(registro.fecha)}
                    </p>
                  </div>
                </li>
              ))}
              {(ticket.bitacora ?? []).length === 0 && (
                <li className="text-sm text-slate-500 dark:text-slate-300">Sin registros en la bitacora.</li>
              )}
            </ol>
          </Panel>
        </div>

        <div className="space-y-5">
          <Panel titulo="Trazabilidad" icono={UserCheck}>
            <div className="space-y-3">
              <Dato etiqueta="Solicitante" valor={ticket.solicitante_nombre} />
              <Dato etiqueta="Area solicitante" valor={ticket.solicitante_area} />
              <Dato etiqueta="Sucursal" valor={ticket.sucursal_nombre} />
              <Dato etiqueta="Atendido por" valor={ticket.asignado_nombre} />
              <Dato etiqueta="Resuelto por" valor={ticket.resuelto_por_nombre} />
            </div>
          </Panel>

          <Panel titulo="Linea de tiempo" icono={Clock}>
            <div className="space-y-3">
              <Dato etiqueta="Creacion" valor={fechaHora(ticket.fecha_creacion)} />
              <Dato etiqueta="Asignacion" valor={ticket.fecha_asignacion ? fechaHora(ticket.fecha_asignacion) : null} />
              <Dato etiqueta="Resolucion" valor={ticket.fecha_resolucion ? fechaHora(ticket.fecha_resolucion) : null} />
              <Dato etiqueta="Tiempo transcurrido" valor={duracionLegible(ticket.horas_atencion)} />
            </div>
          </Panel>
        </div>
      </div>

      <Modal titulo="Registrar solucion tecnica" icono={CheckCircle2} abierto={modalResolver} alCerrar={() => setModalResolver(false)}>
        <div className="space-y-4">
          <div>
            <label className="etiqueta" htmlFor="solucion">Detalle de la solucion aplicada</label>
            <textarea
              id="solucion"
              className="campo min-h-40"
              value={solucion}
              onChange={(e) => setSolucion(e.target.value)}
              placeholder="Describa el diagnostico, las acciones ejecutadas y el resultado obtenido"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="boton-secundario" onClick={() => setModalResolver(false)}>Cancelar</button>
            <button
              type="button"
              className="boton-primario"
              disabled={procesando || solucion.trim().length < 10}
              onClick={() => void ejecutar(`/tickets/${ticket.id}/resolver`, { solucion_detalle: solucion.trim() })}
            >
              {procesando ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Guardar solucion
            </button>
          </div>
        </div>
      </Modal>

      <Modal titulo="Asignar ticket a un tecnico" icono={Users} abierto={modalAsignar} alCerrar={() => setModalAsignar(false)} ancho="max-w-lg">
        <div className="space-y-4">
          <div>
            <label className="etiqueta" htmlFor="tecnico">Tecnico responsable</label>
            <select id="tecnico" className="campo" value={tecnicoElegido} onChange={(e) => setTecnicoElegido(e.target.value)}>
              <option value="">Seleccione un tecnico</option>
              {tecnicos.map((tecnico) => (
                <option key={tecnico.id} value={tecnico.id}>{tecnico.nombre} ({tecnico.rol})</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-2">
            <button type="button" className="boton-secundario" onClick={() => setModalAsignar(false)}>Cancelar</button>
            <button
              type="button"
              className="boton-primario"
              disabled={procesando || !tecnicoElegido}
              onClick={() => void ejecutar(`/tickets/${ticket.id}/asignar`, { asignado_id: Number(tecnicoElegido) })}
            >
              <Users className="h-4 w-4" />
              Asignar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
