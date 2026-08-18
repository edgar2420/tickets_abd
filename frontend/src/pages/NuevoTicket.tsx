import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Loader2, Save } from 'lucide-react';
import { api } from '../lib/api';
import { Alerta, Cargando, EncabezadoPagina, IconoCategoria } from '../components/Ui';
import { estiloPrioridad } from '../lib/formato';
import type { Categoria, PrioridadTicket, Ticket } from '../lib/tipos';

const PRIORIDADES: PrioridadTicket[] = ['Baja', 'Media', 'Alta', 'Critica'];

const AYUDA_PRIORIDAD: Record<PrioridadTicket, string> = {
  'Baja': 'Puede resolverse dentro de la jornada sin afectar el trabajo.',
  'Media': 'Afecta parcialmente la operacion, requiere atencion regular.',
  'Alta': 'Impide continuar con una tarea importante del area.',
  'Critica': 'Detiene la operacion o compromete a varios usuarios.'
};

export const NuevoTicket = () => {
  const navegar = useNavigate();
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [formulario, setFormulario] = useState({
    titulo: '',
    descripcion: '',
    categoria: '',
    prioridad: 'Media' as PrioridadTicket
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // El catalogo de categorias se administra desde el panel, no esta fijo en el codigo
  useEffect(() => {
    void api<{ datos: Categoria[] }>('/categorias', { parametros: { activas: true } })
      .then(({ datos }) => {
        setCategorias(datos);
        setFormulario((f) => ({ ...f, categoria: f.categoria || datos[0]?.nombre || '' }));
      })
      .catch(() => setError('No fue posible cargar el catalogo de categorias'));
  }, []);

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      const { datos } = await api<{ datos: Ticket }>('/tickets', { metodo: 'POST', cuerpo: formulario });
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

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <EncabezadoPagina
        titulo="Registrar nuevo ticket"
        descripcion="El solicitante se registra automaticamente a partir de la sesion autenticada"
        icono={ClipboardList}
      />

      {/* Dos columnas para que el formulario completo entre en una sola pantalla */}
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
                <span className="text-xs text-slate-400">{formulario.descripcion.length} caracteres</span>
              </div>
              <textarea
                id="descripcion"
                className="campo h-52 resize-none"
                minLength={10}
                required
                placeholder="Describa el equipo afectado, el mensaje de error y los pasos ya realizados"
                value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-5 lg:col-span-2">
            <div>
              <span className="etiqueta">Categoria</span>
              {!categorias && <Cargando texto="Cargando catalogo" />}
              {categorias && categorias.length === 0 && (
                <p className="text-sm text-slate-500">
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
            </div>

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
              <p className="mt-2 text-xs leading-relaxed text-slate-500">
                {AYUDA_PRIORIDAD[formulario.prioridad]}
              </p>
            </div>

            {/* Resumen de lo que quedara registrado */}
            <dl className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs">
              <div className="flex justify-between gap-3 py-1">
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Categoria</dt>
                <dd className="font-semibold text-institucional-900">{formulario.categoria || 'Sin elegir'}</dd>
              </div>
              <div className="flex justify-between gap-3 py-1">
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Prioridad</dt>
                <dd className="font-semibold text-institucional-900">{formulario.prioridad}</dd>
              </div>
              <div className="flex justify-between gap-3 py-1">
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Estado inicial</dt>
                <dd className="font-semibold text-institucional-900">Abierto</dd>
              </div>
            </dl>
          </div>
        </div>

        {error && <div className="px-5 pb-3"><Alerta mensaje={error} /></div>}

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 px-5 py-3.5">
          <p className="text-xs text-slate-500">
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
