import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, CheckCircle2, PencilLine, PlusCircle, RotateCcw, Tags } from 'lucide-react';
import { api } from '../lib/api';
import {
  Acciones, Alerta, BotonAccion, Cargando, EncabezadoPagina, IconoCategoria, Modal, Panel,
  Vacio, nombresIconos
} from '../components/Ui';
import { usarConfirmacion } from '../components/Confirmacion';
import { estiloCategoria, fondoCategoria, fechaCorta } from '../lib/formato';
import type { Categoria } from '../lib/tipos';

const COLORES = ['celeste', 'violeta', 'esmeralda', 'ambar', 'rosa', 'pizarra'];

interface Formulario {
  id: number | null;
  nombre: string;
  descripcion: string;
  color: string;
  icono: string;
  activo: boolean;
}

const FORMULARIO_VACIO: Formulario = {
  id: null, nombre: '', descripcion: '', color: 'celeste', icono: 'etiqueta', activo: true
};

export const AdminCategorias = () => {
  const [categorias, setCategorias] = useState<Categoria[] | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { confirmar, dialogo } = usarConfirmacion();

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Categoria[] }>('/categorias');
      setCategorias(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar las categorias');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirNueva = () => {
    setFormulario(FORMULARIO_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (categoria: Categoria) => {
    setFormulario({
      id: categoria.id,
      nombre: categoria.nombre,
      descripcion: categoria.descripcion ?? '',
      color: categoria.color,
      icono: categoria.icono,
      activo: categoria.activo
    });
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/categorias/${formulario.id}` : '/categorias', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: {
          nombre: formulario.nombre,
          descripcion: formulario.descripcion || null,
          color: formulario.color,
          icono: formulario.icono,
          activo: formulario.activo
        }
      });
      setModalAbierto(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar la categoria');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = (categoria: Categoria) => confirmar({
    titulo: 'Desactivar categoria',
    mensaje: (
      <>
        La categoria <strong>{categoria.nombre}</strong> dejara de ofrecerse al registrar tickets.
        Los {categoria.total_tickets} tickets ya clasificados conservan su categoria.
      </>
    ),
    textoConfirmar: 'Desactivar',
    icono: Ban,
    alConfirmar: async () => {
      await api(`/categorias/${categoria.id}`, { metodo: 'DELETE' });
      await cargar();
    }
  });

  const activar = async (categoria: Categoria) => {
    await api(`/categorias/${categoria.id}/activar`, { metodo: 'PUT' });
    await cargar();
  };

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Categorias de tickets"
        descripcion="Catalogo de clasificacion que se ofrece al registrar un requerimiento"
        icono={Tags}
      >
        <button type="button" className="boton-primario" onClick={abrirNueva}>
          <PlusCircle className="h-4 w-4" />
          Nueva categoria
        </button>
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}
      {!categorias && <Cargando />}
      {categorias && categorias.length === 0 && (
        <Panel><Vacio texto="No existen categorias registradas" icono={Tags} /></Panel>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(categorias ?? []).map((categoria) => (
          <article key={categoria.id} className="panel-interactivo animar-entrada overflow-hidden">
            <div className={`h-1.5 ${fondoCategoria[categoria.color] ?? fondoCategoria.pizarra}`} />
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className={`rounded-xl border p-2.5 ${estiloCategoria[categoria.color] ?? estiloCategoria.pizarra}`}>
                    <IconoCategoria icono={categoria.icono} color={categoria.color} clase="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-institucional-900 dark:text-slate-100">{categoria.nombre}</h3>
                    <p className="text-xs text-slate-400 dark:text-slate-400">Alta: {fechaCorta(categoria.fecha_creacion)}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                  categoria.activo
                    ? 'bg-green-100 text-green-800 border-green-300'
                    : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
                }`}>
                  {categoria.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>

              <p className="mt-3 min-h-10 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
                {categoria.descripcion ?? 'Sin descripcion registrada.'}
              </p>

              <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-noche-700">
                <p className="text-xs font-medium text-slate-500 dark:text-slate-300">
                  {categoria.total_tickets} ticket{categoria.total_tickets === 1 ? '' : 's'} clasificados
                </p>
                <Acciones>
                  <BotonAccion icono={PencilLine} rotulo="Editar categoria" alPulsar={() => abrirEdicion(categoria)} />
                  {categoria.activo
                    ? <BotonAccion icono={Ban} rotulo="Desactivar" tono="peligro" alPulsar={() => desactivar(categoria)} />
                    : <BotonAccion icono={RotateCcw} rotulo="Reactivar" alPulsar={() => void activar(categoria)} />}
                </Acciones>
              </div>
            </div>
          </article>
        ))}
      </div>

      <Modal
        titulo={formulario.id ? 'Editar categoria' : 'Registrar categoria'}
        icono={Tags}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        ancho="max-w-xl"
      >
        <form onSubmit={guardar} className="space-y-5">
          <div>
            <label className="etiqueta" htmlFor="nombre-categoria">Nombre</label>
            <input
              id="nombre-categoria"
              className="campo"
              required
              minLength={3}
              maxLength={50}
              placeholder="Por ejemplo: Telefonia"
              value={formulario.nombre}
              onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))}
            />
          </div>

          <div>
            <label className="etiqueta" htmlFor="descripcion-categoria">Descripcion</label>
            <input
              id="descripcion-categoria"
              className="campo"
              maxLength={255}
              placeholder="Que tipo de requerimientos agrupa"
              value={formulario.descripcion}
              onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))}
            />
          </div>

          <div>
            <span className="etiqueta">Color distintivo</span>
            <div className="flex flex-wrap gap-2">
              {COLORES.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => setFormulario((f) => ({ ...f, color }))}
                  title={color}
                  aria-label={`Color ${color}`}
                  className={`h-9 w-9 rounded-lg transition ${fondoCategoria[color]} ${
                    formulario.color === color
                      ? 'ring-2 ring-institucional-900 ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <span className="etiqueta">Icono</span>
            <div className="flex flex-wrap gap-2">
              {nombresIconos.map((icono) => (
                <button
                  key={icono}
                  type="button"
                  onClick={() => setFormulario((f) => ({ ...f, icono }))}
                  title={icono}
                  aria-label={`Icono ${icono}`}
                  className={`rounded-lg border-2 p-2.5 transition ${
                    formulario.icono === icono
                      ? 'border-institucional-700 bg-institucional-50'
                      : 'border-slate-200 bg-white hover:border-slate-300 dark:border-noche-700 dark:bg-noche-800 dark:hover:border-noche-600'
                  }`}
                >
                  <IconoCategoria icono={icono} color={formulario.color} clase="h-5 w-5" />
                </button>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:bg-noche-800 dark:border-noche-700">
            <p className="etiqueta">Vista previa</p>
            <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border ${
              estiloCategoria[formulario.color] ?? estiloCategoria.pizarra
            }`}>
              <IconoCategoria icono={formulario.icono} color={formulario.color} clase="h-4 w-4" />
              {formulario.nombre || 'Nombre de la categoria'}
            </span>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-slate-300 dark:border-noche-700"
              checked={formulario.activo}
              onChange={(e) => setFormulario((f) => ({ ...f, activo: e.target.checked }))}
            />
            Categoria disponible al registrar tickets
          </label>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
            <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="boton-primario" disabled={guardando}>
              <CheckCircle2 className="h-4 w-4" />
              Guardar categoria
            </button>
          </div>
        </form>
      </Modal>

      {dialogo}
    </div>
  );
};
