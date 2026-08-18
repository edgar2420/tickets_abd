import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, Building2, CheckCircle2, PencilLine, PlusCircle } from 'lucide-react';
import { api } from '../lib/api';
import { Alerta, Cargando, Etiqueta, Modal, Vacio } from '../components/Ui';
import { fechaCorta } from '../lib/formato';
import type { Area } from '../lib/tipos';

export const AdminAreas = () => {
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [formulario, setFormulario] = useState<{ id: number | null; nombre: string; activo: boolean }>({
    id: null, nombre: '', activo: true
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Area[] }>('/areas');
      setAreas(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar las areas');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/areas/${formulario.id}` : '/areas', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: { nombre: formulario.nombre, activo: formulario.activo }
      });
      setModalAbierto(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar el area');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (area: Area) => {
    if (!window.confirm(`Desactivar el area ${area.nombre}?`)) return;
    try {
      await api(`/areas/${area.id}`, { metodo: 'DELETE' });
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible desactivar el area');
    }
  };

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-institucional-900">Areas de la empresa</h1>
          <p className="text-sm text-slate-500">Catalogo organizacional utilizado en la asignacion de usuarios</p>
        </div>
        <button
          type="button"
          className="boton-primario"
          onClick={() => { setFormulario({ id: null, nombre: '', activo: true }); setModalAbierto(true); }}
        >
          <PlusCircle className="h-4 w-4" />
          Nueva area
        </button>
      </header>

      {error && <Alerta mensaje={error} />}

      <section className="panel overflow-hidden">
        {!areas && <Cargando />}
        {areas && areas.length === 0 && <Vacio texto="No existen areas registradas" />}
        {areas && areas.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Area</th>
                  <th>Usuarios</th>
                  <th>Estado</th>
                  <th>Creacion</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {areas.map((area) => (
                  <tr key={area.id}>
                    <td className="font-medium text-slate-800">{area.nombre}</td>
                    <td className="text-slate-600">{area.total_usuarios ?? 0}</td>
                    <td>
                      <Etiqueta
                        texto={area.activo ? 'Activa' : 'Inactiva'}
                        clase={area.activo
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'}
                      />
                    </td>
                    <td className="text-xs text-slate-500">{fechaCorta(area.fecha_creacion)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="rounded-md border border-slate-300 p-1.5 text-slate-600 transition hover:bg-slate-50"
                          title="Editar"
                          onClick={() => { setFormulario({ id: area.id, nombre: area.nombre, activo: area.activo }); setModalAbierto(true); }}
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          className="rounded-md border border-rose-200 p-1.5 text-rose-700 transition hover:bg-rose-50 disabled:opacity-40"
                          title="Desactivar"
                          disabled={!area.activo}
                          onClick={() => void desactivar(area)}
                        >
                          <Ban className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <Modal
        titulo={formulario.id ? 'Editar area' : 'Registrar area'}
        icono={Building2}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        ancho="max-w-lg"
      >
        <form onSubmit={guardar} className="space-y-4">
          <div>
            <label className="etiqueta">Nombre del area</label>
            <input className="campo" required minLength={3} value={formulario.nombre}
              onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={formulario.activo}
              onChange={(e) => setFormulario((f) => ({ ...f, activo: e.target.checked }))} />
            Area activa
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="boton-primario" disabled={guardando}>
              <CheckCircle2 className="h-4 w-4" />
              Guardar
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
