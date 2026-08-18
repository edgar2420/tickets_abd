import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Gauge, Loader2, Save, Tags } from 'lucide-react';
import { api } from '../lib/api';
import { Alerta, Cargando, EncabezadoPagina, IconoCategoria, Panel } from '../components/Ui';
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
    <div className="mx-auto max-w-3xl space-y-5">
      <EncabezadoPagina
        titulo="Registrar nuevo ticket"
        descripcion="El solicitante se registra automaticamente a partir de la sesion autenticada"
        icono={ClipboardList}
      />

      <form onSubmit={enviar} className="space-y-5">
        <Panel titulo="Descripcion del requerimiento" icono={ClipboardList}>
          <div className="space-y-4">
            <div>
              <label className="etiqueta" htmlFor="titulo">Titulo</label>
              <input
                id="titulo"
                className="campo"
                minLength={6}
                maxLength={200}
                required
                placeholder="Resumen breve del problema o requerimiento"
                value={formulario.titulo}
                onChange={(e) => setFormulario((f) => ({ ...f, titulo: e.target.value }))}
              />
              <p className="mt-1 text-xs text-slate-400">{formulario.titulo.length} de 200 caracteres</p>
            </div>

            <div>
              <label className="etiqueta" htmlFor="descripcion">Detalle</label>
              <textarea
                id="descripcion"
                className="campo min-h-44"
                minLength={10}
                required
                placeholder="Describa el equipo afectado, el mensaje de error y los pasos ya realizados"
                value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
              />
            </div>
          </div>
        </Panel>

        <Panel titulo="Categoria" icono={Tags}>
          {!categorias && <Cargando texto="Cargando catalogo" />}
          {categorias && categorias.length === 0 && (
            <p className="text-sm text-slate-500">
              No hay categorias habilitadas. Solicite al administrador que registre al menos una.
            </p>
          )}
          <div className="flex flex-wrap gap-2.5">
            {(categorias ?? []).map((categoria) => {
              const activa = formulario.categoria === categoria.nombre;
              return (
                <button
                  key={categoria.id}
                  type="button"
                  onClick={() => setFormulario((f) => ({ ...f, categoria: categoria.nombre }))}
                  className={activa ? 'ficha-activa' : 'ficha-inactiva'}
                  title={categoria.descripcion ?? categoria.nombre}
                >
                  <IconoCategoria
                    icono={categoria.icono}
                    color={categoria.color}
                    clase={`h-4 w-4 ${activa ? 'text-white' : ''}`}
                  />
                  {categoria.nombre}
                </button>
              );
            })}
          </div>
          {formulario.categoria && (
            <p className="mt-3 text-xs text-slate-500">
              {categorias?.find((c) => c.nombre === formulario.categoria)?.descripcion}
            </p>
          )}
        </Panel>

        <Panel titulo="Prioridad" icono={Gauge}>
          <div className="grid gap-2.5 sm:grid-cols-2">
            {PRIORIDADES.map((prioridad) => {
              const activa = formulario.prioridad === prioridad;
              return (
                <button
                  key={prioridad}
                  type="button"
                  onClick={() => setFormulario((f) => ({ ...f, prioridad }))}
                  className={`flex items-start gap-3 rounded-lg border-2 p-3.5 text-left transition ${
                    activa
                      ? 'border-institucional-700 bg-institucional-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${estiloPrioridad[prioridad]}`}>
                    {prioridad}
                  </span>
                  <span className="flex-1 text-xs leading-relaxed text-slate-600">{AYUDA_PRIORIDAD[prioridad]}</span>
                </button>
              );
            })}
          </div>
        </Panel>

        {error && <Alerta mensaje={error} />}

        <div className="flex justify-end gap-2">
          <button type="button" className="boton-secundario" onClick={() => navegar('/tickets')}>
            Cancelar
          </button>
          <button type="submit" className="boton-primario" disabled={enviando || !listo}>
            {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Registrar ticket
          </button>
        </div>
      </form>
    </div>
  );
};
