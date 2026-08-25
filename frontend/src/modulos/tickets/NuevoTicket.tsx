import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Loader2, Save } from 'lucide-react';
import { api } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { Alerta, Cargando, EncabezadoPagina, IconoCategoria } from '../../components/Ui';
import { estiloPrioridad } from '../../lib/formato';
import type { Categoria, Equipo, PrioridadTicket, ServicioTicket, Ticket } from '../../lib/tipos';
import { AYUDA_SERVICIO, OBJETIVOS, PRIORIDADES, SERVICIOS } from './constantes';

export const NuevoTicket = () => {
  const navegar = useNavigate();
  const { puede } = usarAuth();
  const defineLaPrioridad = puede('tickets.priorizar');

  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [formulario, setFormulario] = useState({
    titulo: '',
    descripcion: '',
    servicio: 'Soporte informatico' as ServicioTicket,
    categoria: '',
    ubicacion: '',
    equipo_id: '',
    observaciones: '',
    prioridad: 'Media' as PrioridadTicket
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void api<{ datos: Categoria[] }>('/categorias', { parametros: { activas: true } })
      .then(({ datos }) => {
        setCategorias(datos);
        setFormulario((f) => ({ ...f, categoria: f.categoria || datos[0]?.nombre || '' }));
      })
      .catch(() => setError('No fue posible cargar el catalogo de categorias'));

    void api<{ datos: Equipo[] }>('/equipos/mios')
      .then(({ datos }) => setEquipos(datos))
      .catch(() => setEquipos([]));
  }, []);

  const equipo = useMemo(
    () => equipos.find((e) => String(e.id) === formulario.equipo_id) ?? null,
    [equipos, formulario.equipo_id]
  );

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const cuerpo: Record<string, unknown> = {
        titulo: formulario.titulo,
        descripcion: formulario.descripcion,
        servicio: formulario.servicio,
        categoria: formulario.categoria,
        ubicacion: formulario.ubicacion.trim() || null,
        observaciones: formulario.observaciones.trim() || null,
        equipo_id: formulario.equipo_id ? Number(formulario.equipo_id) : null
      };
      if (defineLaPrioridad) cuerpo.prioridad = formulario.prioridad;

      const { datos } = await api<{ datos: Ticket }>('/tickets', { metodo: 'POST', cuerpo });
      navegar(`/tickets/${datos.id}`, { replace: true });
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar el ticket');
    } finally {
      setEnviando(false);
    }
  };

  const listo = formulario.titulo.trim().length >= 6
    && formulario.descripcion.trim().length >= 10
    && formulario.categoria.length > 0;

  const resumen: [string, string][] = [
    ['Servicio', formulario.servicio],
    ['Categoria', formulario.categoria || 'Sin elegir'],
    ['Activo', equipo ? equipo.codigo : 'Ninguno'],
    ['Estado inicial', 'Nuevo']
  ];

  return (
    <div className="mx-auto max-w-7xl space-y-4">
      <EncabezadoPagina
        titulo="Registrar nuevo ticket"
        descripcion="El solicitante se registra automaticamente a partir de la sesion autenticada"
        icono={ClipboardList}
      />

      <form onSubmit={enviar} className="panel animar-entrada">
        <div className="grid gap-6 p-5 lg:grid-cols-5">

          <div className="space-y-4 lg:col-span-3">
            <div>
              <label className="etiqueta" htmlFor="titulo">Titulo</label>
              <input
                id="titulo"
                className="campo"
                minLength={6}
                maxLength={200}
                required
                autoFocus
                placeholder="Resumen breve del problema o requerimiento"
                value={formulario.titulo}
                onChange={(e) => setFormulario((f) => ({ ...f, titulo: e.target.value }))}
              />
            </div>

            <div>
              <div className="flex items-baseline justify-between">
                <label className="etiqueta" htmlFor="descripcion">Detalle</label>
                <span className="text-xs text-slate-400 dark:text-slate-400">
                  {formulario.descripcion.length} caracteres
                </span>
              </div>
              <textarea
                id="descripcion"
                className="campo h-40 resize-none"
                minLength={10}
                required
                placeholder="Describa el equipo afectado, el mensaje de error y los pasos ya realizados"
                value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="etiqueta" htmlFor="ubicacion">Ubicacion</label>
                <input
                  id="ubicacion"
                  className="campo"
                  maxLength={120}
                  placeholder="Piso, oficina o area donde ocurre"
                  value={formulario.ubicacion}
                  onChange={(e) => setFormulario((f) => ({ ...f, ubicacion: e.target.value }))}
                />
              </div>
              <div>
                <label className="etiqueta" htmlFor="equipo">Activo relacionado</label>
                <select
                  id="equipo"
                  className="campo"
                  value={formulario.equipo_id}
                  onChange={(e) => setFormulario((f) => ({ ...f, equipo_id: e.target.value }))}
                >
                  <option value="">Ninguno</option>
                  {equipos.map((item) => (
                    <option key={item.id} value={item.id}>{item.codigo} - {item.nombre_equipo}</option>
                  ))}
                </select>
                {equipos.length === 0 && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300">
                    No tiene equipos asignados a su nombre.
                  </p>
                )}
                {equipo && (
                  <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-300">
                    {[equipo.tipo, equipo.marca, equipo.modelo].filter(Boolean).join(' ')}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className="etiqueta" htmlFor="observaciones">Observaciones</label>
              <textarea
                id="observaciones"
                className="campo h-20 resize-none"
                maxLength={1000}
                placeholder="Dato adicional que ayude a la atencion (opcional)"
                value={formulario.observaciones}
                onChange={(e) => setFormulario((f) => ({ ...f, observaciones: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <div>
              <label className="etiqueta" htmlFor="servicio">Servicio</label>
              <select
                id="servicio"
                className="campo"
                value={formulario.servicio}
                onChange={(e) => setFormulario((f) => ({ ...f, servicio: e.target.value as ServicioTicket }))}
              >
                {SERVICIOS.map((servicio) => <option key={servicio} value={servicio}>{servicio}</option>)}
              </select>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                {AYUDA_SERVICIO[formulario.servicio]}
              </p>
            </div>

            <div>
              <span className="etiqueta">Categoria</span>
              {!categorias && <Cargando texto="Cargando catalogo" />}
              {categorias && categorias.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-300">
                  No hay categorias habilitadas. Solicite al administrador que registre al menos una.
                </p>
              )}
              <div className="flex flex-wrap gap-2">
                {(categorias ?? []).map((categoria) => {
                  const activa = formulario.categoria === categoria.nombre;
                  return (
                    <button
                      key={categoria.id}
                      type="button"
                      onClick={() => setFormulario((f) => ({ ...f, categoria: categoria.nombre }))}
                      className={`${activa ? 'ficha-activa' : 'ficha-inactiva'} px-3 py-1.5 text-xs`}
                      title={categoria.descripcion ?? categoria.nombre}
                    >
                      <IconoCategoria
                        icono={categoria.icono}
                        color={categoria.color}
                        clase={`h-3.5 w-3.5 ${activa ? 'text-white' : ''}`}
                      />
                      {categoria.nombre}
                    </button>
                  );
                })}
              </div>
              {formulario.categoria && (
                <p className="mt-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs leading-relaxed text-slate-600 dark:bg-noche-800 dark:border-noche-700 dark:text-slate-200">
                  {categorias?.find((c) => c.nombre === formulario.categoria)?.descripcion
                    ?? 'Sin descripcion registrada para esta categoria.'}
                </p>
              )}
            </div>

            {defineLaPrioridad ? (
              <div>
                <span className="etiqueta">Prioridad</span>
                <div className="flex flex-wrap gap-2">
                  {PRIORIDADES.map((prioridad) => {
                    const activa = formulario.prioridad === prioridad;
                    return (
                      <button
                        key={prioridad}
                        type="button"
                        onClick={() => setFormulario((f) => ({ ...f, prioridad }))}
                        className={`rounded-full border-2 px-3 py-1 text-xs font-semibold transition ${
                          activa
                            ? 'border-institucional-900 ring-2 ring-institucional-900/15'
                            : 'border-transparent opacity-70 hover:opacity-100'
                        } ${estiloPrioridad[prioridad]}`}
                      >
                        {prioridad}
                      </button>
                    );
                  })}
                </div>
                <p className="mt-2 text-xs leading-relaxed text-slate-500 dark:text-slate-300">
                  Atencion {OBJETIVOS[formulario.prioridad].texto.toLowerCase()}. {OBJETIVOS[formulario.prioridad].criterio}.
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs leading-relaxed text-slate-600 dark:bg-noche-800 dark:border-noche-700 dark:text-slate-200">
                La prioridad y el objetivo de atencion los determina la administracion de Sistemas al revisar el ticket.
              </div>
            )}

            <dl className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs dark:bg-noche-800 dark:border-noche-700">
              {resumen.map(([etiqueta, valor]) => (
                <div key={etiqueta} className="flex justify-between gap-3 py-1">
                  <dt className="font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">{etiqueta}</dt>
                  <dd className="text-right font-semibold text-institucional-900 dark:text-slate-100">{valor}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {error && <div className="px-5 pb-3"><Alerta mensaje={error} /></div>}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5 dark:bg-noche-800 dark:border-noche-700">
          <p className="text-xs text-slate-500 dark:text-slate-300">
            {listo ? 'Listo para registrar.' : 'Complete el titulo, el detalle y la categoria.'}
          </p>
          <div className="flex gap-2">
            <button type="button" className="boton-secundario" onClick={() => navegar('/tickets')}>
              Cancelar
            </button>
            <button type="submit" className="boton-primario" disabled={enviando || !listo}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Registrar ticket
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
};
