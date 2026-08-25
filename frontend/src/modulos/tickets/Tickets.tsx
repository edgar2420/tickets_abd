import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertTriangle, FileDown, Filter, PlusCircle, RefreshCcw, Search, Ticket as IconoTicket } from 'lucide-react';
import { api, descargarPdf } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { usarNotificaciones } from '../../context/NotificacionesContext';
import { Alerta, Cargando, EncabezadoPagina, Etiqueta, Panel, Vacio, filaAccionable } from '../../components/Ui';
import { Paginacion } from '../../components/Paginacion';
import { codigoTicket, estiloEstado, estiloPrioridad, fechaHora } from '../../lib/formato';
import type { Categoria, InfoPaginacion, RespuestaPaginada, Sucursal, Ticket } from '../../lib/tipos';
import { ESTADOS, PRIORIDADES, SERVICIOS } from './constantes';

const FILTROS_VACIOS = {
  estado: '', categoria: '', prioridad: '', sucursal_id: '',
  servicio: '', vencidos: '', busqueda: ''
};

export const Tickets = () => {
  const { puede } = usarAuth();
  const { ultimoEventoTicket } = usarNotificaciones();
  const navegar = useNavigate();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);

  const cambiar = (campo: keyof typeof FILTROS_VACIOS, valor: string) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  };

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api<RespuestaPaginada<Ticket>>('/tickets', {
        parametros: { ...filtros, limite, pagina }
      });
      setTickets(respuesta.datos);
      setInfo(respuesta.paginacion);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar los tickets');
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoTicket]);

  useEffect(() => {
    void api<{ datos: Categoria[] }>('/categorias')
      .then(({ datos }) => setCategorias(datos))
      .catch(() => setCategorias([]));
    void api<{ datos: Sucursal[] }>('/sucursales')
      .then(({ datos }) => setSucursales(datos))
      .catch(() => setSucursales([]));
  }, []);

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        icono={IconoTicket}
        titulo={puede('tickets.ver_todos') ? 'Todos los tickets' : 'Mis tickets'}
        descripcion={puede('tickets.ver_todos')
          ? 'Listado completo de requerimientos registrados en la mesa de ayuda'
          : 'Requerimientos registrados por su usuario'}
      >
        <button type="button" className="boton-secundario" onClick={() => void cargar()}>
          <RefreshCcw className="h-4 w-4" />
          Actualizar
        </button>
        {puede('reportes.exportar', 'tickets.ver_todos') && (
          <button
            type="button"
            className="boton-secundario"
            onClick={() => void descargarPdf('/tickets/reporte/pdf', filtros, 'reporte-tickets.pdf')}
          >
            <FileDown className="h-4 w-4" />
            Reporte PDF
          </button>
        )}
        {puede('tickets.crear') && (
          <Link to="/tickets/nuevo" className="boton-primario">
            <PlusCircle className="h-4 w-4" />
            Nuevo ticket
          </Link>
        )}
      </EncabezadoPagina>

      <Panel
        titulo="Filtros de busqueda"
        icono={Filter}
        acciones={
          <button type="button" className="boton-secundario" onClick={() => { setFiltros(FILTROS_VACIOS); setPagina(1); }}>
            Limpiar
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="etiqueta">Estado</label>
            <select className="campo" value={filtros.estado} onChange={(e) => cambiar('estado', e.target.value)}>
              <option value="">Todos</option>
              {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Servicio</label>
            <select className="campo" value={filtros.servicio} onChange={(e) => cambiar('servicio', e.target.value)}>
              <option value="">Todos</option>
              {SERVICIOS.map((servicio) => <option key={servicio} value={servicio}>{servicio}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Categoria</label>
            <select className="campo" value={filtros.categoria} onChange={(e) => cambiar('categoria', e.target.value)}>
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta">Prioridad</label>
            <select className="campo" value={filtros.prioridad} onChange={(e) => cambiar('prioridad', e.target.value)}>
              <option value="">Todas</option>
              {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Sucursal</label>
            <select className="campo" value={filtros.sucursal_id} onChange={(e) => cambiar('sucursal_id', e.target.value)}>
              <option value="">Todas</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Objetivo de atencion</label>
            <select className="campo" value={filtros.vencidos} onChange={(e) => cambiar('vencidos', e.target.value)}>
              <option value="">Todos</option>
              <option value="true">Solo vencidos</option>
            </select>
          </div>
          <div>
            <label className="etiqueta">Busqueda</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-400" />
              <input
                className="campo pl-9"
                placeholder="Titulo o descripcion"
                value={filtros.busqueda}
                onChange={(e) => cambiar('busqueda', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Panel>

      {error && <Alerta mensaje={error} />}

      <section className="panel overflow-hidden">
        {!tickets && <Cargando texto="Consultando tickets" />}
        {tickets && tickets.length === 0 && (
          <Vacio icono={IconoTicket} texto="No se encontraron tickets con los criterios aplicados" />
        )}
        {tickets && tickets.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Ticket</th>
                  <th>Titulo</th>
                  <th>Servicio</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Solicitante</th>
                  <th>Ubicacion</th>
                  <th>Atendido por</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr
                    key={ticket.id}
                    {...filaAccionable(() => navegar(`/tickets/${ticket.id}`), 'Abrir el ticket')}
                  >
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                      <span className="inline-flex items-center gap-1.5">
                        <IconoTicket className="h-3.5 w-3.5" />
                        {codigoTicket(ticket)}
                      </span>
                    </td>
                    <td className="max-w-xs">
                      <span className="font-medium text-slate-800 dark:text-slate-100">{ticket.titulo}</span>
                      {ticket.vencido && (
                        <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-rose-300 bg-rose-100 px-2 py-0.5 text-[10px] font-semibold text-rose-800 dark:border-rose-500/30 dark:bg-rose-500/15 dark:text-rose-300">
                          <AlertTriangle className="h-3 w-3" />
                          Vencido
                        </span>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{ticket.servicio}</td>
                    <td><Etiqueta texto={ticket.prioridad} clase={estiloPrioridad[ticket.prioridad]} /></td>
                    <td><Etiqueta texto={ticket.estado} clase={estiloEstado[ticket.estado]} /></td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{ticket.solicitante_nombre}</td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">
                      {ticket.ubicacion ?? ticket.sucursal_nombre ?? '-'}
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{ticket.asignado_nombre ?? 'Sin asignar'}</td>
                    <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">{fechaHora(ticket.fecha_creacion)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && (
          <Paginacion
            info={info}
            alCambiarPagina={setPagina}
            alCambiarLimite={(nuevo) => { setLimite(nuevo); setPagina(1); }}
          />
        )}
      </section>
    </div>
  );
};
