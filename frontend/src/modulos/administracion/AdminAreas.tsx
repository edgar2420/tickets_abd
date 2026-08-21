import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, Building2, CheckCircle2, PencilLine, PlusCircle } from 'lucide-react';
import { api } from '../../lib/api';
import {
  Acciones, Alerta, BotonAccion, Cargando, EncabezadoPagina, Etiqueta, Modal, Vacio
} from '../../components/Ui';
import { usarConfirmacion } from '../../components/Confirmacion';
import { fechaCorta } from '../../lib/formato';
import type { Area } from '../../lib/tipos';

export const AdminAreas = () => {
  const [areas, setAreas] = useState<Area[] | null>(null);
  const [formulario, setFormulario] = useState<{ id: number | null; nombre: string; activo: boolean }>({
    id: null, nombre: '', activo: true
  });
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { confirmar, dialogo } = usarConfirmacion();

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

  const desactivar = (area: Area) => confirmar({
    titulo: 'Desactivar area',
    mensaje: (
      <>
        El area <strong>{area.nombre}</strong> dejara de ofrecerse al registrar usuarios.
        Los {area.total_usuarios ?? 0} usuarios asignados conservan su area actual.
      </>
    ),
    textoConfirmar: 'Desactivar',
    icono: Ban,
    alConfirmar: async () => {
      await api(`/areas/${area.id}`, { metodo: 'DELETE' });
      await cargar();
    }
  });

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Areas de la empresa"
        descripcion="Catalogo organizacional utilizado en la asignacion de usuarios"
        icono={Building2}
      >
        <button
          type="button"
          className="boton-primario"
          onClick={() => { setFormulario({ id: null, nombre: '', activo: true }); setModalAbierto(true); }}
        >
          <PlusCircle className="h-4 w-4" />
          Nueva area
        </button>
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}

      <section className="panel overflow-hidden">
        {!areas && <Cargando />}
        {areas && areas.length === 0 && <Vacio icono={Building2} texto="No existen areas registradas" />}
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
                    <td className="font-medium text-slate-800 dark:text-slate-100">{area.nombre}</td>
                    <td className="text-slate-600 dark:text-slate-200">{area.total_usuarios ?? 0}</td>
                    <td>
                      <Etiqueta
                        texto={area.activo ? 'Activa' : 'Inactiva'}
                        clase={area.activo
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'}
                      />
                    </td>
                    <td className="text-xs text-slate-500 dark:text-slate-300">{fechaCorta(area.fecha_creacion)}</td>
                    <td>
                      <Acciones>
                        <BotonAccion
                          icono={PencilLine}
                          rotulo="Editar area"
                          alPulsar={() => { setFormulario({ id: area.id, nombre: area.nombre, activo: area.activo }); setModalAbierto(true); }}
                        />
                        <BotonAccion
                          icono={Ban}
                          rotulo="Desactivar area"
                          tono="peligro"
                          deshabilitado={!area.activo}
                          alPulsar={() => desactivar(area)}
                        />
                      </Acciones>
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
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-noche-700" checked={formulario.activo}
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

      {dialogo}
    </div>
  );
};
