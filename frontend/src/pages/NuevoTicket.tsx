import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { ClipboardList, Loader2, Save } from 'lucide-react';
import { api } from '../lib/api';
import { Alerta, Panel } from '../components/Ui';
import type { CategoriaTicket, PrioridadTicket, Ticket } from '../lib/tipos';

const CATEGORIAS: CategoriaTicket[] = ['Hardware', 'Software', 'Redes', 'Accesos'];
const PRIORIDADES: PrioridadTicket[] = ['Baja', 'Media', 'Alta', 'Critica'];

export const NuevoTicket = () => {
  const navegar = useNavigate();
  const [formulario, setFormulario] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'Software' as CategoriaTicket,
    prioridad: 'Media' as PrioridadTicket
  });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

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

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-xl font-bold text-institucional-900">Registrar nuevo ticket</h1>
        <p className="text-sm text-slate-500">
          El solicitante se registra automaticamente a partir de la sesion autenticada.
        </p>
      </header>

      <Panel titulo="Datos del requerimiento" icono={ClipboardList}>
        <form onSubmit={enviar} className="space-y-4">
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
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="etiqueta" htmlFor="categoria">Categoria</label>
              <select
                id="categoria"
                className="campo"
                value={formulario.categoria}
                onChange={(e) => setFormulario((f) => ({ ...f, categoria: e.target.value as CategoriaTicket }))}
              >
                {CATEGORIAS.map((categoria) => <option key={categoria} value={categoria}>{categoria}</option>)}
              </select>
            </div>
            <div>
              <label className="etiqueta" htmlFor="prioridad">Prioridad</label>
              <select
                id="prioridad"
                className="campo"
                value={formulario.prioridad}
                onChange={(e) => setFormulario((f) => ({ ...f, prioridad: e.target.value as PrioridadTicket }))}
              >
                {PRIORIDADES.map((prioridad) => <option key={prioridad} value={prioridad}>{prioridad}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="etiqueta" htmlFor="descripcion">Descripcion detallada</label>
            <textarea
              id="descripcion"
              className="campo min-h-40"
              minLength={10}
              required
              placeholder="Describa el equipo afectado, el mensaje de error y los pasos realizados"
              value={formulario.descripcion}
              onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          {error && <Alerta mensaje={error} />}

          <div className="flex justify-end gap-2">
            <button type="button" className="boton-secundario" onClick={() => navegar('/tickets')}>
              Cancelar
            </button>
            <button type="submit" className="boton-primario" disabled={enviando}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Registrar ticket
            </button>
          </div>
        </form>
      </Panel>
    </div>
  );
};
