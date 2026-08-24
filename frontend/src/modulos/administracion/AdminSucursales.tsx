import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Ban, Building, CheckCircle2, MapPin, Monitor, PencilLine, PlusCircle, RotateCcw, Ticket, Users } from 'lucide-react';
import { api } from '../../lib/api';
import {
  Acciones, Alerta, BotonAccion, Cargando, EncabezadoPagina, Etiqueta, Modal, Vacio
} from '../../components/Ui';
import { usarConfirmacion } from '../../components/Confirmacion';
import type { Sucursal, TipoSucursal } from '../../lib/tipos';

const TIPOS: TipoSucursal[] = ['Fabrica', 'Casa Central', 'Sucursal', 'Planta', 'Oficina', 'Deposito'];

const ESTILO_TIPO: Record<TipoSucursal, string> = {
  'Fabrica': 'bg-institucional-100 text-institucional-800 border-institucional-300 dark:bg-institucional-500/15 dark:text-institucional-200 dark:border-institucional-500/30',
  'Casa Central': 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'Sucursal': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'Planta': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'Oficina': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Deposito': 'bg-slate-100 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'
};

interface Formulario {
  id: number | null;
  codigo: string;
  nombre: string;
  ciudad: string;
  tipo: TipoSucursal;
  direccion: string;
  activo: boolean;
}

const VACIO: Formulario = {
  id: null, codigo: '', nombre: '', ciudad: '', tipo: 'Sucursal', direccion: '', activo: true
};

export const AdminSucursales = () => {
  const [sucursales, setSucursales] = useState<Sucursal[] | null>(null);
  const [formulario, setFormulario] = useState<Formulario>(VACIO);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const { confirmar, dialogo } = usarConfirmacion();

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Sucursal[] }>('/sucursales');
      setSucursales(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar las sucursales');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const abrirNueva = () => {
    setFormulario(VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (sucursal: Sucursal) => {
    setFormulario({
      id: sucursal.id,
      codigo: sucursal.codigo,
      nombre: sucursal.nombre,
      ciudad: sucursal.ciudad ?? '',
      tipo: sucursal.tipo,
      direccion: sucursal.direccion ?? '',
      activo: sucursal.activo
    });
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/sucursales/${formulario.id}` : '/sucursales', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: {
          codigo: formulario.codigo.trim(),
          nombre: formulario.nombre.trim(),
          ciudad: formulario.ciudad || null,
          tipo: formulario.tipo,
          direccion: formulario.direccion || null,
          activo: formulario.activo
        }
      });
      setModalAbierto(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar la sucursal');
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = (sucursal: Sucursal) => confirmar({
    titulo: 'Desactivar sucursal',
    mensaje: (
      <>
        <strong>{sucursal.nombre}</strong> dejara de ofrecerse al registrar usuarios y equipos.
        Los {sucursal.total_usuarios} usuarios y {sucursal.total_equipos} equipos ya ubicados
        conservan su sucursal.
      </>
    ),
    textoConfirmar: 'Desactivar',
    icono: Ban,
    alConfirmar: async () => {
      await api(`/sucursales/${sucursal.id}`, { metodo: 'DELETE' });
      await cargar();
    }
  });

  const activar = async (sucursal: Sucursal) => {
    await api(`/sucursales/${sucursal.id}/activar`, { metodo: 'PUT' });
    await cargar();
  };

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Sucursales"
        descripcion="Mapa de la empresa: casa central, plantas, sucursales y oficinas"
        icono={Building}
      >
        <button type="button" className="boton-primario" onClick={abrirNueva}>
          <PlusCircle className="h-4 w-4" />
          Nueva sucursal
        </button>
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}
      {!sucursales && <Cargando />}
      {sucursales && sucursales.length === 0 && (
        <section className="panel"><Vacio icono={Building} texto="No existen sucursales registradas" /></section>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {(sucursales ?? []).map((sucursal) => (
          <article key={sucursal.id} className="panel-interactivo animar-entrada p-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-mono text-xs font-bold text-institucional-700 dark:text-institucional-300">
                  {sucursal.codigo}
                </p>
                <h3 className="truncate font-bold text-institucional-900 dark:text-slate-100">{sucursal.nombre}</h3>
                {sucursal.ciudad && (
                  <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <MapPin className="h-3 w-3" />
                    {sucursal.ciudad}
                  </p>
                )}
              </div>
              <Etiqueta texto={sucursal.tipo} clase={ESTILO_TIPO[sucursal.tipo]} />
            </div>

            {sucursal.direccion && (
              <p className="mt-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300">{sucursal.direccion}</p>
            )}

            <dl className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center dark:border-noche-700">
              {[
                { icono: Users, valor: sucursal.total_usuarios, texto: 'Usuarios' },
                { icono: Monitor, valor: sucursal.total_equipos, texto: 'Equipos' },
                { icono: Ticket, valor: sucursal.total_tickets, texto: 'Tickets' }
              ].map(({ icono: Icono, valor, texto }) => (
                <div key={texto}>
                  <dt className="flex items-center justify-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-400">
                    <Icono className="h-3 w-3" />
                    {texto}
                  </dt>
                  <dd className="text-lg font-bold text-institucional-900 dark:text-slate-100">{valor}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 dark:border-noche-700">
              <Etiqueta
                texto={sucursal.activo ? 'Activa' : 'Inactiva'}
                clase={sucursal.activo
                  ? 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30'
                  : 'bg-slate-100 text-slate-600 border-slate-300 dark:bg-noche-700 dark:text-slate-200 dark:border-noche-600'}
              />
              <Acciones>
                <BotonAccion icono={PencilLine} rotulo="Editar sucursal" alPulsar={() => abrirEdicion(sucursal)} />
                {sucursal.activo
                  ? <BotonAccion icono={Ban} rotulo="Desactivar" tono="peligro" alPulsar={() => desactivar(sucursal)} />
                  : <BotonAccion icono={RotateCcw} rotulo="Reactivar" alPulsar={() => void activar(sucursal)} />}
              </Acciones>
            </div>
          </article>
        ))}
      </div>

      <Modal
        titulo={formulario.id ? 'Editar sucursal' : 'Registrar sucursal'}
        icono={Building}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        ancho="max-w-3xl"
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" form="form-sucursal" className="boton-primario" disabled={guardando}>
              <CheckCircle2 className="h-4 w-4" />
              Guardar
            </button>
          </>
        }
      >
        <form id="form-sucursal" onSubmit={guardar} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="etiqueta">Codigo</label>
              <input className="campo font-mono uppercase" required minLength={2} maxLength={10}
                placeholder="LP"
                value={formulario.codigo}
                onChange={(e) => setFormulario((f) => ({ ...f, codigo: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="etiqueta">Nombre</label>
              <input className="campo" required minLength={3} maxLength={100}
                placeholder="Sucursal La Paz"
                value={formulario.nombre}
                onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Ciudad</label>
              <input className="campo" maxLength={80}
                value={formulario.ciudad}
                onChange={(e) => setFormulario((f) => ({ ...f, ciudad: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="etiqueta">Tipo</label>
              <select className="campo" value={formulario.tipo}
                onChange={(e) => setFormulario((f) => ({ ...f, tipo: e.target.value as TipoSucursal }))}>
                {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>
            <div className="sm:col-span-3">
              <label className="etiqueta">Direccion</label>
              <input className="campo" maxLength={200}
                value={formulario.direccion}
                onChange={(e) => setFormulario((f) => ({ ...f, direccion: e.target.value }))} />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <input type="checkbox" className="h-4 w-4 rounded border-slate-300" checked={formulario.activo}
              onChange={(e) => setFormulario((f) => ({ ...f, activo: e.target.checked }))} />
            Sucursal activa
          </label>

        </form>
      </Modal>

      {dialogo}
    </div>
  );
};
