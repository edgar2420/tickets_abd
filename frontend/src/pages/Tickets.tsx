import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileDown, Filter, PlusCircle, RefreshCcw, Search, Ticket as IconoTicket } from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { usarNotificaciones } from '../context/NotificacionesContext';
import { Alerta, Cargando, EncabezadoPagina, Etiqueta, Panel, Vacio } from '../components/Ui';
import { Paginacion } from '../components/Paginacion';
import { codigoTicket, estiloEstado, estiloPrioridad, fechaHora } from '../lib/formato';
import type { Categoria, InfoPaginacion, RespuestaPaginada, Ticket } from '../lib/tipos';

const ESTADOS = ['Abierto', 'En Proceso', 'Resuelto', 'Cerrado'];
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Critica'];

export const Tickets = () => {
  const { puede } = usarAuth();
  const { ultimoEventoTicket } = usarNotificaciones();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filtros, setFiltros] = useState({ estado: '', categoria: '', prioridad: '', busqueda: '' });

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

  // El filtro se alimenta del catalogo administrable de categorias
  useEffect(() => {
    void api<{ datos: Categoria[] }>('/categorias')
      .then(({ datos }) => setCategorias(datos))
      .catch(() => setCategorias([]));
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

      <Panel titulo="Filtros de busqueda" icono={Filter}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="etiqueta">Estado</label>
            <select className="campo" value={filtros.estado} onChange={(e) => { setFiltros((f) => ({ ...f, estado: e.target.value })); setPagina(1); }}>
              <option value="">Todos</option>
              {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Categoria</label>
            <select className="campo" value={filtros.categoria} onChange={(e) => { setFiltros((f) => ({ ...f, categoria: e.target.value })); setPagina(1); }}>
              <option value="">Todas</option>
              {categorias.map((categoria) => (
                <option key={categoria.id} value={categoria.nombre}>{categoria.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta">Prioridad</label>
            <select className="campo" value={filtros.prioridad} onChange={(e) => { setFiltros((f) => ({ ...f, prioridad: e.target.value })); setPagina(1); }}>
              <option value="">Todas</option>
              {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
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
                onChange={(e) => { setFiltros((f) => ({ ...f, busqueda: e.target.value })); setPagina(1); }}
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
                  <th>Categoria</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th>Solicitante</th>
                  <th>Atendido por</th>
                  <th>Registrado</th>
                </tr>
              </thead>
              <tbody>
                {tickets.map((ticket) => (
                  <tr key={ticket.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                      <Link to={`/tickets/${ticket.id}`} className="inline-flex items-center gap-1.5 hover:underline">
                        <IconoTicket className="h-3.5 w-3.5" />
                        {codigoTicket(ticket.id)}
                      </Link>
                    </td>
                    <td className="max-w-xs">
                      <Link to={`/tickets/${ticket.id}`} className="font-medium text-slate-800 hover:text-institucional-700 dark:text-slate-100">
                        {ticket.titulo}
                      </Link>
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{ticket.categoria}</td>
                    <td><Etiqueta texto={ticket.prioridad} clase={estiloPrioridad[ticket.prioridad]} /></td>
                    <td><Etiqueta texto={ticket.estado} clase={estiloEstado[ticket.estado]} /></td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{ticket.solicitante_nombre}</td>
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
