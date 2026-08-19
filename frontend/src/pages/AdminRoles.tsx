import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { CheckCircle2, FileDown, PencilLine, PlusCircle, ShieldCheck, Trash2 } from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { Acciones, Alerta, BotonAccion, Cargando, EncabezadoPagina, Etiqueta, Modal, Panel, Vacio } from '../components/Ui';
import { usarConfirmacion } from '../components/Confirmacion';
import type { Permiso, Rol } from '../lib/tipos';

interface Formulario {
  id: number | null;
  nombre: string;
  descripcion: string;
  activo: boolean;
  permisos: number[];
}

const FORMULARIO_VACIO: Formulario = { id: null, nombre: '', descripcion: '', activo: true, permisos: [] };

const NOMBRE_MODULO: Record<string, string> = {
  ADMIN: 'Modulo Mantenimiento / Administracion',
  TICKETS: 'Modulo Muestreo de Tickets',
  REPORTES: 'Modulo Reportes e Indicadores'
};

export const AdminRoles = () => {
  const [roles, setRoles] = useState<Rol[] | null>(null);
  const [permisos, setPermisos] = useState<Permiso[]>([]);
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { confirmar, dialogo } = usarConfirmacion();

  const cargar = useCallback(async () => {
    try {
      const [respRoles, respPermisos] = await Promise.all([
        api<{ datos: Rol[] }>('/roles'),
        api<{ datos: Permiso[] }>('/permisos')
      ]);
      setRoles(respRoles.datos);
      setPermisos(respPermisos.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar roles y permisos');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Matriz de permisos agrupada por modulo, tal como exige la especificacion.
  const porModulo = useMemo(() => {
    return permisos.reduce<Record<string, Permiso[]>>((acumulado, permiso) => {
      acumulado[permiso.modulo] = acumulado[permiso.modulo] ?? [];
      acumulado[permiso.modulo].push(permiso);
      return acumulado;
    }, {});
  }, [permisos]);

  const alternarPermiso = (id: number) => {
    setFormulario((f) => ({
      ...f,
      permisos: f.permisos.includes(id) ? f.permisos.filter((p) => p !== id) : [...f.permisos, id]
    }));
  };

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (rol: Rol) => {
    setFormulario({
      id: rol.id,
      nombre: rol.nombre,
      descripcion: rol.descripcion ?? '',
      activo: rol.activo,
      permisos: rol.permisos.map((p) => p.id)
    });
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/roles/${formulario.id}` : '/roles', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: {
          nombre: formulario.nombre,
          descripcion: formulario.descripcion || null,
          activo: formulario.activo,
          permisos: formulario.permisos
        }
      });
      setModalAbierto(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar el rol');
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = (rol: Rol) => confirmar({
    titulo: 'Eliminar rol',
    mensaje: (
      <>
        Se eliminara el rol <strong>{rol.nombre}</strong> junto con su matriz de permisos.
        La operacion se rechaza si todavia tiene usuarios asignados.
      </>
    ),
    textoConfirmar: 'Eliminar',
    icono: Trash2,
    alConfirmar: async () => {
      try {
        await api(`/roles/${rol.id}`, { metodo: 'DELETE' });
        await cargar();
      } catch (fallo) {
        setError(fallo instanceof Error ? fallo.message : 'No fue posible eliminar el rol');
      }
    }
  });

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Roles y matriz de permisos"
        descripcion="Construccion dinamica de roles sobre los permisos atomicos del sistema"
        icono={ShieldCheck}
      >
          <button
            type="button"
            className="boton-secundario"
            onClick={() => void descargarPdf('/auditoria/matriz-rbac/pdf', {}, 'matriz-roles-permisos.pdf')}
          >
            <FileDown className="h-4 w-4" />
            Matriz PDF
          </button>
          <button type="button" className="boton-primario" onClick={abrirNuevo}>
            <PlusCircle className="h-4 w-4" />
            Nuevo rol
          </button>
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}

      {!roles && <Cargando />}
      {roles && roles.length === 0 && <Vacio icono={ShieldCheck} texto="No existen roles configurados" />}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {(roles ?? []).map((rol) => (
          <Panel
            key={rol.id}
            titulo={rol.nombre}
            icono={ShieldCheck}
            acciones={
              <Acciones>
                <BotonAccion icono={PencilLine} rotulo="Editar rol" alPulsar={() => abrirEdicion(rol)} />
                <BotonAccion icono={Trash2} rotulo="Eliminar rol" tono="peligro" alPulsar={() => eliminar(rol)} />
              </Acciones>
            }
          >
            <p className="text-sm text-slate-600 dark:text-slate-300">{rol.descripcion ?? 'Sin descripcion registrada'}</p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              {rol.total_usuarios} usuarios asignados - {rol.permisos.length} permisos concedidos
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {rol.permisos.map((permiso) => (
                <Etiqueta key={permiso.id} texto={permiso.codigo} clase="bg-institucional-50 text-institucional-800 border-institucional-200" />
              ))}
            </div>
          </Panel>
        ))}
      </div>

      <Modal
        titulo={formulario.id ? 'Editar rol' : 'Crear rol'}
        icono={ShieldCheck}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        ancho="max-w-3xl"
      >
        <form onSubmit={guardar} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="etiqueta">Nombre del rol</label>
              <input className="campo" required minLength={3} value={formulario.nombre}
                onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Descripcion</label>
              <input className="campo" value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
          </div>

          <div>
            <p className="etiqueta">Permisos del sistema</p>
            <div className="space-y-4">
              {Object.entries(porModulo).map(([modulo, lista]) => (
                <fieldset key={modulo} className="rounded-md border border-slate-200 p-4 dark:border-noche-700">
                  <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
                    {NOMBRE_MODULO[modulo] ?? modulo}
                  </legend>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {lista.map((permiso) => (
                      <label key={permiso.id} className="flex items-start gap-2 rounded-md p-1.5 text-sm transition hover:bg-slate-50">
                        <input
                          type="checkbox"
                          className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-noche-700"
                          checked={formulario.permisos.includes(permiso.id)}
                          onChange={() => alternarPermiso(permiso.id)}
                        />
                        <span>
                          <span className="font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">{permiso.codigo}</span>
                          <span className="block text-xs text-slate-500 dark:text-slate-400">{permiso.descripcion}</span>
                        </span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300 dark:border-noche-700" checked={formulario.activo}
              onChange={(e) => setFormulario((f) => ({ ...f, activo: e.target.checked }))} />
            Rol activo
          </label>

          <div className="flex justify-end gap-2">
            <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="boton-primario" disabled={guardando}>
              <CheckCircle2 className="h-4 w-4" />
              Guardar rol
            </button>
          </div>
        </form>
      </Modal>

      {dialogo}
    </div>
  );
};
