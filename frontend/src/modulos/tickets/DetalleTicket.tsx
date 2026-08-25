import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle, ArrowLeft, CheckCircle2, ClipboardCheck, Clock, FileDown, History,
  Monitor, PauseCircle, PlayCircle, SignalHigh, UserCheck, Users
} from 'lucide-react';
import { api, descargarPdf } from '../../lib/api';
import { obtenerSocket } from '../../lib/socket';
import { usarAuth } from '../../context/AuthContext';
import { Alerta, Cargando, Etiqueta, Panel } from '../../components/Ui';
import { Conversacion } from '../../components/Conversacion';
import { codigoTicket, duracionEmpleada, estiloEstado, estiloPrioridad, fechaHora } from '../../lib/formato';
import type { Ticket } from '../../lib/tipos';
import { ESTILO_TIPO, OBJETIVOS } from './constantes';
import { ModalAsignar, ModalEspera, ModalPrioridad, ModalResolver } from './componentes/ModalesTicket';

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
  const [modal, setModal] = useState<'' | 'resolver' | 'asignar' | 'prioridad' | 'espera'>('');

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

  const ejecutar = async (ruta: string, cuerpo?: unknown) => {
    setProcesando(true);
    setError(null);
    try {
      const { datos } = await api<{ datos: Ticket }>(ruta, { metodo: 'PUT', cuerpo });
      setTicket(datos);
      setModal('');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la operacion');
    } finally {
      setProcesando(false);
    }
  };

  if (!ticket && !error) return <Cargando texto="Consultando el ticket" />;
  if (error && !ticket) return <Alerta mensaje={error} />;
  if (!ticket) return null;

  const codigo = codigoTicket(ticket);
  const esSolicitante = ticket.solicitante_id === usuario?.id;
  const atiende = puede('tickets.responder');
  const cerrado = ticket.estado === 'Cerrado';

  const puedeTomar = atiende && ticket.estado === 'Nuevo';
  const puedeIniciar = atiende && ['Asignado', 'En Espera', 'Resuelto'].includes(ticket.estado);
  const puedeEsperar = atiende && ['Asignado', 'En Proceso'].includes(ticket.estado);
  const puedeResolver = puede('tickets.resolver') && ticket.estado === 'En Proceso';
  const puedeAsignar = atiende && !['Resuelto', 'Cerrado'].includes(ticket.estado);
  const puedePrioridad = puede('tickets.priorizar') && !cerrado;
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
            <span className="font-mono text-base text-institucional-700 dark:text-institucional-300">{codigo}</span>
            {'  '}
            {ticket.titulo}
          </h1>
          <div className="mt-2 flex flex-wrap gap-2">
            <Etiqueta texto={ticket.estado} clase={estiloEstado[ticket.estado]} />
            <Etiqueta texto={ticket.tipo} clase={ESTILO_TIPO[ticket.tipo]} />
            <Etiqueta texto={`Prioridad ${ticket.prioridad}`} clase={estiloPrioridad[ticket.prioridad]} />
            <Etiqueta texto={ticket.servicio} clase="bg-slate-100 text-slate-700 border-slate-200 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600" />
            <Etiqueta texto={ticket.categoria} clase="bg-slate-100 text-slate-700 border-slate-200 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600" />
            {ticket.vencido && (
              <Etiqueta texto="Objetivo vencido" clase="bg-rose-100 text-rose-800 border-rose-300 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30" />
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="boton-secundario"
            onClick={() => void descargarPdf(`/tickets/${ticket.id}/pdf`, {}, `acta-${codigo}.pdf`)}
          >
            <FileDown className="h-4 w-4" />
            Acta PDF
          </button>
          {puedePrioridad && (
            <button type="button" className="boton-secundario" onClick={() => setModal('prioridad')}>
              <SignalHigh className="h-4 w-4" />
              Prioridad
            </button>
          )}
          {puedeAsignar && (
            <button type="button" className="boton-secundario" onClick={() => setModal('asignar')}>
              <Users className="h-4 w-4" />
              Asignar
            </button>
          )}
          {puedeEsperar && (
            <button type="button" className="boton-secundario" onClick={() => setModal('espera')}>
              <PauseCircle className="h-4 w-4" />
              En espera
            </button>
          )}
          {puedeTomar && (
            <button type="button" className="boton-acento" disabled={procesando} onClick={() => void ejecutar(`/tickets/${ticket.id}/tomar`)}>
              <UserCheck className="h-4 w-4" />
              Tomar ticket
            </button>
          )}
          {puedeIniciar && (
            <button type="button" className="boton-acento" disabled={procesando} onClick={() => void ejecutar(`/tickets/${ticket.id}/iniciar`)}>
              <PlayCircle className="h-4 w-4" />
              {ticket.estado === 'En Espera' ? 'Reanudar' : 'Iniciar atencion'}
            </button>
          )}
          {puedeResolver && (
            <button type="button" className="boton-primario" onClick={() => setModal('resolver')}>
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

      {ticket.estado === 'En Espera' && ticket.motivo_espera && (
        <div className="flex items-start gap-2 rounded-lg border border-orange-300 bg-orange-50 px-4 py-3 text-sm text-orange-900 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-200">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>En espera desde {ticket.fecha_espera ? fechaHora(ticket.fecha_espera) : 'hace un momento'}: {ticket.motivo_espera}</span>
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Panel titulo="Descripcion reportada" icono={ClipboardCheck}>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-slate-700 dark:text-slate-200">{ticket.descripcion}</p>
            {ticket.observaciones && (
              <p className="mt-3 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-relaxed text-slate-600 dark:border-noche-700 dark:bg-noche-800 dark:text-slate-200">
                {ticket.observaciones}
              </p>
            )}
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
              <Dato etiqueta="Ubicacion" valor={ticket.ubicacion} />
              <Dato etiqueta="Atendido por" valor={ticket.asignado_nombre} />
              <Dato etiqueta="Resuelto por" valor={ticket.resuelto_por_nombre} />
            </div>
          </Panel>

          <Panel titulo="Activo relacionado" icono={Monitor}>
            {ticket.equipo_id ? (
              <div className="space-y-3">
                <Dato etiqueta="Codigo" valor={ticket.equipo_codigo} />
                <Dato etiqueta="Equipo" valor={ticket.equipo_nombre} />
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-300">El ticket no esta ligado a un activo del parque.</p>
            )}
          </Panel>

          <Panel titulo="Atencion" icono={Clock}>
            <div className="space-y-3">
              <Dato
                etiqueta="Objetivo de atencion"
                valor={`${OBJETIVOS[ticket.prioridad].texto} (${OBJETIVOS[ticket.prioridad].horas} h)`}
              />
              <Dato etiqueta="Vence" valor={ticket.fecha_objetivo ? fechaHora(ticket.fecha_objetivo) : null} />
              <Dato etiqueta="Prioridad definida por" valor={ticket.prioridad_por_nombre} />
              <Dato etiqueta="Tiempo empleado" valor={duracionEmpleada(ticket.minutos_empleados)} />
            </div>
          </Panel>

          <Panel titulo="Linea de tiempo" icono={Clock}>
            <div className="space-y-3">
              <Dato etiqueta="Creacion" valor={fechaHora(ticket.fecha_creacion)} />
              <Dato etiqueta="Asignacion" valor={ticket.fecha_asignacion ? fechaHora(ticket.fecha_asignacion) : null} />
              <Dato etiqueta="Inicio de atencion" valor={ticket.fecha_inicio ? fechaHora(ticket.fecha_inicio) : null} />
              <Dato etiqueta="Resolucion" valor={ticket.fecha_resolucion ? fechaHora(ticket.fecha_resolucion) : null} />
              <Dato etiqueta="Cierre" valor={ticket.fecha_cierre ? fechaHora(ticket.fecha_cierre) : null} />
            </div>
          </Panel>
        </div>
      </div>

      <ModalResolver
        abierto={modal === 'resolver'} alCerrar={() => setModal('')}
        procesando={procesando} ejecutar={ejecutar} ticketId={ticket.id}
      />
      <ModalAsignar
        abierto={modal === 'asignar'} alCerrar={() => setModal('')}
        procesando={procesando} ejecutar={ejecutar} ticketId={ticket.id}
      />
      <ModalPrioridad
        abierto={modal === 'prioridad'} alCerrar={() => setModal('')}
        procesando={procesando} ejecutar={ejecutar} ticketId={ticket.id} actual={ticket.prioridad}
      />
      <ModalEspera
        abierto={modal === 'espera'} alCerrar={() => setModal('')}
        procesando={procesando} ejecutar={ejecutar} ticketId={ticket.id}
      />
    </div>
  );
};
