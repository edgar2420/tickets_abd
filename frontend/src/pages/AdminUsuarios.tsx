import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, CheckCircle2, PencilLine, PlusCircle, Users } from 'lucide-react';
import { api } from '../lib/api';
import { Alerta, Cargando, EncabezadoPagina, Etiqueta, Modal, Vacio } from '../components/Ui';
import { usarConfirmacion } from '../components/Confirmacion';
import { CampoPassword } from '../components/CampoPassword';
import { fechaCorta } from '../lib/formato';
import type { Area, Rol, Usuario } from '../lib/tipos';

interface Formulario {
  id: number | null;
  nombre: string;
  usuario: string;
  email: string;
  password: string;
  area_id: string;
  rol_id: string;
  activo: boolean;
}

const FORMULARIO_VACIO: Formulario = {
  id: null, nombre: '', usuario: '', email: '', password: '', area_id: '', rol_id: '', activo: true
};

export const AdminUsuarios = () => {
  const [usuarios, setUsuarios] = useState<Usuario[] | null>(null);
  const [areas, setAreas] = useState<Area[]>([]);
  const [roles, setRoles] = useState<Rol[]>([]);
  const [formulario, setFormulario] = useState<Formulario>(FORMULARIO_VACIO);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { confirmar, dialogo } = usarConfirmacion();

  const cargar = useCallback(async () => {
    try {
      const [respUsuarios, respAreas, respRoles] = await Promise.all([
        api<{ datos: Usuario[] }>('/usuarios'),
        api<{ datos: Area[] }>('/areas', { parametros: { activas: true } }),
        api<{ datos: Rol[] }>('/roles')
      ]);
      setUsuarios(respUsuarios.datos);
      setAreas(respAreas.datos);
      setRoles(respRoles.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar la informacion');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirNuevo = () => {
    setFormulario(FORMULARIO_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (usuario: Usuario) => {
    setFormulario({
      id: usuario.id,
      nombre: usuario.nombre,
      usuario: usuario.usuario,
      email: usuario.email ?? '',
      password: '',
      area_id: String(usuario.area_id),
      rol_id: String(usuario.rol_id),
      activo: usuario.activo
    });
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    const cuerpo: Record<string, unknown> = {
      nombre: formulario.nombre,
      usuario: formulario.usuario,
      email: formulario.email || null,
      area_id: Number(formulario.area_id),
      rol_id: Number(formulario.rol_id)
    };
    if (formulario.password) cuerpo.password = formulario.password;
    if (formulario.id) cuerpo.activo = formulario.activo;

    try {
      await api(formulario.id ? `/usuarios/${formulario.id}` : '/usuarios', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo
      });
      setModalAbierto(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = (usuario: Usuario) => confirmar({
    titulo: 'Desactivar usuario',
    mensaje: (
      <>
        <strong>{usuario.nombre}</strong> no podra volver a iniciar sesion. Su historial de
        tickets se conserva intacto y la cuenta puede reactivarse mas adelante.
      </>
    ),
    textoConfirmar: 'Desactivar',
    icono: Ban,
    alConfirmar: async () => {
      await api(`/usuarios/${usuario.id}`, { metodo: 'DELETE' });
      await cargar();
    }
  });

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Gestion de usuarios"
        descripcion="Alta, edicion y habilitacion de cuentas por area y rol"
        icono={Users}
      >
        <button type="button" className="boton-primario" onClick={abrirNuevo}>
          <PlusCircle className="h-4 w-4" />
          Nuevo usuario
        </button>
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}

      <section className="panel overflow-hidden">
        {!usuarios && <Cargando />}
        {usuarios && usuarios.length === 0 && <Vacio icono={Users} texto="No existen usuarios registrados" />}
        {usuarios && usuarios.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Usuario</th>
                  <th>Area</th>
                  <th>Rol</th>
                  <th>Estado</th>
                  <th>Alta</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {usuarios.map((usuario) => (
                  <tr key={usuario.id}>
                    <td className="font-medium text-slate-800">{usuario.nombre}</td>
                    <td className="font-mono text-xs text-slate-600">{usuario.usuario}</td>
                    <td className="text-slate-600">{usuario.area}</td>
                    <td className="text-slate-600">{usuario.rol}</td>
                    <td>
                      <Etiqueta
                        texto={usuario.activo ? 'Activo' : 'Inactivo'}
                        clase={usuario.activo
                          ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          : 'bg-slate-200 text-slate-600 border-slate-300'}
                      />
                    </td>
                    <td className="text-xs text-slate-500">{fechaCorta(usuario.fecha_creacion)}</td>
                    <td>
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => abrirEdicion(usuario)}
                          className="boton-icono"
                          title="Editar"
                        >
                          <PencilLine className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => desactivar(usuario)}
                          disabled={!usuario.activo}
                          className="boton-icono-peligro"
                          title="Desactivar"
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
        titulo={formulario.id ? 'Editar usuario' : 'Registrar usuario'}
        icono={Users}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
      >
        <form onSubmit={guardar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="etiqueta">Nombre completo</label>
              <input className="campo" required minLength={4} value={formulario.nombre}
                onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Usuario de acceso</label>
              <input className="campo" required minLength={3} value={formulario.usuario}
                onChange={(e) => setFormulario((f) => ({ ...f, usuario: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Correo electronico</label>
              <input type="email" className="campo" value={formulario.email}
                onChange={(e) => setFormulario((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Area</label>
              <select className="campo" required value={formulario.area_id}
                onChange={(e) => setFormulario((f) => ({ ...f, area_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {areas.map((area) => <option key={area.id} value={area.id}>{area.nombre}</option>)}
              </select>
            </div>
            <div>
              <label className="etiqueta">Rol</label>
              <select className="campo" required value={formulario.rol_id}
                onChange={(e) => setFormulario((f) => ({ ...f, rol_id: e.target.value }))}>
                <option value="">Seleccione</option>
                {roles.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <CampoPassword
                id="password-usuario"
                etiqueta={formulario.id ? 'Nueva contrasena (opcional)' : 'Contrasena inicial'}
                valor={formulario.password}
                alCambiar={(password) => setFormulario((f) => ({ ...f, password }))}
                requerido={!formulario.id}
                minimo={formulario.id ? undefined : 8}
                autoComplete="new-password"
                marcador={formulario.id ? 'Dejar en blanco para conservar la actual' : 'Minimo 8 caracteres'}
              />
            </div>
            {formulario.id && (
              <label className="flex items-center gap-2 text-sm text-slate-700 sm:col-span-2">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300"
                  checked={formulario.activo}
                  onChange={(e) => setFormulario((f) => ({ ...f, activo: e.target.checked }))}
                />
                Usuario activo
              </label>
            )}
          </div>

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
