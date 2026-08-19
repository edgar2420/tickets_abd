import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  Ban, Cpu, Eye, FileDown, Filter, HardDrive, KeyRound, Laptop, MemoryStick, Monitor,
  Network, PencilLine, PlusCircle, RotateCcw, Search, ShieldAlert, Users, Wrench
} from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import {
  Acciones, Alerta, BotonAccion, Cargando, EncabezadoPagina, Etiqueta, Indicador, Modal, Panel, Vacio
} from '../components/Ui';
import { Paginacion } from '../components/Paginacion';
import { usarConfirmacion } from '../components/Confirmacion';
import type {
  Area, Equipo, EstadoEquipo, InfoPaginacion, RespuestaPaginada, ResumenEquipos, TipoEquipo, Usuario
} from '../lib/tipos';

const TIPOS: TipoEquipo[] = ['Escritorio', 'Laptop', 'Servidor', 'Impresora', 'Monitor', 'Red', 'Otro'];
const ESTADOS: EstadoEquipo[] = ['Operativo', 'En reparacion', 'En resguardo', 'De baja'];

const ESTILO_ESTADO: Record<EstadoEquipo, string> = {
  'Operativo': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'En reparacion': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'En resguardo': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'De baja': 'bg-slate-200 text-slate-700 border-slate-300 dark:bg-noche-700 dark:text-slate-300 dark:border-noche-600'
};

interface FormularioEquipo {
  id: number | null;
  codigo: string;
  nombre_equipo: string;
  tipo: TipoEquipo;
  marca: string;
  modelo: string;
  numero_serie: string;
  sistema_operativo: string;
  procesador: string;
  ram_gb: string;
  almacenamiento: string;
  direccion_ip: string;
  direccion_mac: string;
  anydesk_id: string;
  anydesk_password: string;
  usuario_id: string;
  area_id: string;
  ubicacion: string;
  estado: EstadoEquipo;
  observaciones: string;
  fecha_asignacion: string;
  activo: boolean;
}

const EQUIPO_VACIO: FormularioEquipo = {
  id: null, codigo: '', nombre_equipo: '', tipo: 'Escritorio', marca: '', modelo: '', numero_serie: '',
  sistema_operativo: '', procesador: '', ram_gb: '', almacenamiento: '', direccion_ip: '', direccion_mac: '',
  anydesk_id: '', anydesk_password: '', usuario_id: '', area_id: '', ubicacion: '',
  estado: 'Operativo', observaciones: '', fecha_asignacion: '', activo: true
};

export const Equipos = () => {
  const { puede } = usarAuth();
  const { confirmar, dialogo } = usarConfirmacion();

  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenEquipos | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({ busqueda: '', tipo: '', estado: '' });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);

  const [formulario, setFormulario] = useState<FormularioEquipo>(EQUIPO_VACIO);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [credencial, setCredencial] = useState<{ equipo: Equipo; anydesk_id: string; password: string } | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, resumenEquipos] = await Promise.all([
        api<RespuestaPaginada<Equipo>>('/equipos', { parametros: { ...filtros, limite, pagina } }),
        api<{ datos: ResumenEquipos }>('/equipos/resumen')
      ]);
      setEquipos(lista.datos);
      setInfo(lista.paginacion);
      setResumen(resumenEquipos.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar los equipos');
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  // Catalogos para la asignacion del equipo
  useEffect(() => {
    if (!puede('equipos.gestionar')) return;
    void api<RespuestaPaginada<Usuario>>('/usuarios', { parametros: { limite: 200 } })
      .then(({ datos }) => setUsuarios(datos)).catch(() => setUsuarios([]));
    void api<{ datos: Area[] }>('/areas', { parametros: { activas: true } })
      .then(({ datos }) => setAreas(datos)).catch(() => setAreas([]));
  }, [puede]);

  const abrirNuevo = () => {
    setFormulario(EQUIPO_VACIO);
    setModalAbierto(true);
  };

  const abrirEdicion = (equipo: Equipo) => {
    setFormulario({
      id: equipo.id,
      codigo: equipo.codigo,
      nombre_equipo: equipo.nombre_equipo,
      tipo: equipo.tipo,
      marca: equipo.marca ?? '',
      modelo: equipo.modelo ?? '',
      numero_serie: equipo.numero_serie ?? '',
      sistema_operativo: equipo.sistema_operativo ?? '',
      procesador: equipo.procesador ?? '',
      ram_gb: equipo.ram_gb ? String(equipo.ram_gb) : '',
      almacenamiento: equipo.almacenamiento ?? '',
      direccion_ip: equipo.direccion_ip ?? '',
      direccion_mac: equipo.direccion_mac ?? '',
      anydesk_id: equipo.anydesk_id ?? '',
      anydesk_password: '',
      usuario_id: equipo.usuario_id ? String(equipo.usuario_id) : '',
      area_id: equipo.area_id ? String(equipo.area_id) : '',
      ubicacion: equipo.ubicacion ?? '',
      estado: equipo.estado,
      observaciones: equipo.observaciones ?? '',
      fecha_asignacion: equipo.fecha_asignacion ? equipo.fecha_asignacion.slice(0, 10) : '',
      activo: equipo.activo
    });
    setModalAbierto(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/equipos/${formulario.id}` : '/equipos', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: {
          codigo: formulario.codigo.trim(),
          nombre_equipo: formulario.nombre_equipo.trim(),
          tipo: formulario.tipo,
          marca: formulario.marca || null,
          modelo: formulario.modelo || null,
          numero_serie: formulario.numero_serie || null,
          sistema_operativo: formulario.sistema_operativo || null,
          procesador: formulario.procesador || null,
          ram_gb: formulario.ram_gb ? Number(formulario.ram_gb) : null,
          almacenamiento: formulario.almacenamiento || null,
          direccion_ip: formulario.direccion_ip || null,
          direccion_mac: formulario.direccion_mac || null,
          anydesk_id: formulario.anydesk_id || null,
          anydesk_password: formulario.anydesk_password || null,
          usuario_id: formulario.usuario_id ? Number(formulario.usuario_id) : null,
          area_id: formulario.area_id ? Number(formulario.area_id) : null,
          ubicacion: formulario.ubicacion || null,
          estado: formulario.estado,
          observaciones: formulario.observaciones || null,
          fecha_asignacion: formulario.fecha_asignacion || null,
          activo: formulario.activo
        }
      });
      setModalAbierto(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar el equipo');
    } finally {
      setGuardando(false);
    }
  };

  /** La revelacion queda registrada en la bitacora del sistema. */
  const revelarCredencial = async (equipo: Equipo) => {
    setError(null);
    try {
      const { datos } = await api<{ datos: { anydesk_id: string; password: string } }>(`/equipos/${equipo.id}/credenciales`);
      setCredencial({ equipo, ...datos });
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible obtener la credencial');
    }
  };

  const darDeBaja = (equipo: Equipo) => confirmar({
    titulo: 'Dar de baja el equipo',
    mensaje: (
      <>
        <strong>{equipo.codigo} - {equipo.nombre_equipo}</strong> pasara al estado De baja y dejara de
        figurar entre los equipos activos. Su ficha y su historial se conservan.
      </>
    ),
    textoConfirmar: 'Dar de baja',
    icono: Ban,
    alConfirmar: async () => {
      await api(`/equipos/${equipo.id}`, { metodo: 'DELETE' });
      await cargar();
    }
  });

  const reactivar = async (equipo: Equipo) => {
    await api(`/equipos/${equipo.id}/activar`, { metodo: 'PUT' });
    await cargar();
  };

  const campo = (etiqueta: string, clave: keyof FormularioEquipo, extra: Record<string, unknown> = {}) => (
    <div>
      <label className="etiqueta">{etiqueta}</label>
      <input
        className="campo"
        value={String(formulario[clave] ?? '')}
        onChange={(e) => setFormulario((f) => ({ ...f, [clave]: e.target.value }))}
        {...extra}
      />
    </div>
  );

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Equipos de la empresa"
        descripcion="Parque informatico, asignacion por usuario y datos de acceso remoto"
        icono={Monitor}
      >
        <button
          type="button"
          className="boton-secundario"
          onClick={() => void descargarPdf('/equipos/reporte/pdf', {}, 'parque-de-equipos.pdf')}
        >
          <FileDown className="h-4 w-4" />
          Reporte PDF
        </button>
        {puede('equipos.gestionar') && (
          <button type="button" className="boton-primario" onClick={abrirNuevo}>
            <PlusCircle className="h-4 w-4" />
            Nuevo equipo
          </button>
        )}
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}

      {resumen && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador etiqueta="Equipos activos" valor={resumen.total} icono={Monitor} />
          <Indicador etiqueta="Operativos" valor={resumen.operativos} icono={Cpu} tono="exito" />
          <Indicador etiqueta="En reparacion" valor={resumen.en_reparacion} icono={Wrench} tono="advertencia" />
          <Indicador etiqueta="Sin asignar" valor={resumen.sin_asignar} icono={Users} tono="info" />
          <Indicador etiqueta="Con acceso remoto" valor={resumen.con_acceso_remoto} icono={Network} tono="neutro" />
        </div>
      )}

      <Panel titulo="Filtros" icono={Filter}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Busqueda</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
              <input
                className="campo pl-9"
                placeholder="Codigo, equipo, IP o responsable"
                value={filtros.busqueda}
                onChange={(e) => { setFiltros((f) => ({ ...f, busqueda: e.target.value })); setPagina(1); }}
              />
            </div>
          </div>
          <div>
            <label className="etiqueta">Tipo</label>
            <select className="campo" value={filtros.tipo}
              onChange={(e) => { setFiltros((f) => ({ ...f, tipo: e.target.value })); setPagina(1); }}>
              <option value="">Todos</option>
              {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Estado</label>
            <select className="campo" value={filtros.estado}
              onChange={(e) => { setFiltros((f) => ({ ...f, estado: e.target.value })); setPagina(1); }}>
              <option value="">Todos</option>
              {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          </div>
        </div>
      </Panel>

      <section className="panel overflow-hidden">
        {!equipos && <Cargando texto="Consultando equipos" />}
        {equipos && equipos.length === 0 && (
          <Vacio icono={Monitor} texto="No se encontraron equipos con los criterios aplicados" />
        )}
        {equipos && equipos.length > 0 && (
          <div className="overflow-x-auto">
            <table className="tabla">
              <thead>
                <tr>
                  <th>Codigo</th>
                  <th>Equipo</th>
                  <th>Asignado a</th>
                  <th>Sistema operativo</th>
                  <th className="text-right">RAM</th>
                  <th>Direccion IP</th>
                  <th>AnyDesk</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {equipos.map((equipo) => (
                  <tr key={equipo.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                      {equipo.codigo}
                    </td>
                    <td>
                      <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                        {equipo.tipo === 'Laptop' ? <Laptop className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                          : <Monitor className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />}
                        {equipo.nombre_equipo}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">
                        {[equipo.marca, equipo.modelo].filter(Boolean).join(' ') || equipo.tipo}
                      </p>
                    </td>
                    <td>
                      <p className="whitespace-nowrap text-slate-700 dark:text-slate-200">
                        {equipo.usuario_nombre ?? 'Sin asignar'}
                      </p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">{equipo.area_nombre ?? '-'}</p>
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{equipo.sistema_operativo ?? '-'}</td>
                    <td className="whitespace-nowrap text-right text-slate-600 dark:text-slate-300">
                      {equipo.ram_gb ? `${equipo.ram_gb} GB` : '-'}
                    </td>
                    <td className="whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-300">
                      {equipo.direccion_ip ?? '-'}
                    </td>
                    <td className="whitespace-nowrap">
                      {equipo.anydesk_id
                        ? (
                          <span className="font-mono text-xs text-slate-600 dark:text-slate-300">
                            {equipo.anydesk_id}
                            {equipo.tiene_password && (
                              <KeyRound className="ml-1.5 inline h-3 w-3 text-institucional-600 dark:text-institucional-300" />
                            )}
                          </span>
                        )
                        : <span className="text-xs text-slate-400 dark:text-slate-500">-</span>}
                    </td>
                    <td><Etiqueta texto={equipo.estado} clase={ESTILO_ESTADO[equipo.estado]} /></td>
                    <td>
                      <Acciones>
                        {puede('equipos.credenciales') && equipo.tiene_password && (
                          <BotonAccion
                            icono={Eye}
                            rotulo="Ver contrasena remota"
                            alPulsar={() => void revelarCredencial(equipo)}
                          />
                        )}
                        <BotonAccion
                          icono={FileDown}
                          rotulo="Ficha en PDF"
                          alPulsar={() => void descargarPdf(`/equipos/${equipo.id}/ficha/pdf`, {}, `equipo-${equipo.codigo}.pdf`)}
                        />
                        {puede('equipos.gestionar') && (
                          <>
                            <BotonAccion icono={PencilLine} rotulo="Editar equipo" alPulsar={() => abrirEdicion(equipo)} />
                            {equipo.activo
                              ? <BotonAccion icono={Ban} rotulo="Dar de baja" tono="peligro" alPulsar={() => darDeBaja(equipo)} />
                              : <BotonAccion icono={RotateCcw} rotulo="Reactivar" alPulsar={() => void reactivar(equipo)} />}
                          </>
                        )}
                      </Acciones>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && (
          <Paginacion
            info={info}
            alCambiarPagina={setPagina}
            alCambiarLimite={(nuevo) => { setLimite(nuevo); setPagina(1); }}
          />
        )}
      </section>

      <Modal
        titulo={formulario.id ? 'Editar equipo' : 'Registrar equipo'}
        icono={Monitor}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        ancho="max-w-3xl"
      >
        <form onSubmit={guardar} className="space-y-5">
          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
              <Monitor className="h-3.5 w-3.5" /> Identificacion
            </p>
            <div className="grid gap-3 sm:grid-cols-3">
              {campo('Codigo', 'codigo', { required: true, minLength: 2, maxLength: 40, placeholder: 'PC-001', className: 'campo font-mono uppercase' })}
              {campo('Nombre del equipo', 'nombre_equipo', { required: true, minLength: 2, maxLength: 100, placeholder: 'CONTAB-01' })}
              <div>
                <label className="etiqueta">Tipo</label>
                <select className="campo" value={formulario.tipo}
                  onChange={(e) => setFormulario((f) => ({ ...f, tipo: e.target.value as TipoEquipo }))}>
                  {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              {campo('Marca', 'marca', { maxLength: 60, placeholder: 'Dell' })}
              {campo('Modelo', 'modelo', { maxLength: 80, placeholder: 'OptiPlex 3080' })}
              {campo('Numero de serie', 'numero_serie', { maxLength: 80 })}
            </div>
          </section>

          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
              <Cpu className="h-3.5 w-3.5" /> Caracteristicas tecnicas
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {campo('Sistema operativo', 'sistema_operativo', { maxLength: 80, placeholder: 'Windows 11 Pro' })}
              {campo('Procesador', 'procesador', { maxLength: 100, placeholder: 'Intel Core i5' })}
              <div>
                <label className="etiqueta">Memoria RAM (GB)</label>
                <div className="relative">
                  <MemoryStick className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    type="number" min={1} max={2048} className="campo pl-9" placeholder="16"
                    value={formulario.ram_gb}
                    onChange={(e) => setFormulario((f) => ({ ...f, ram_gb: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <label className="etiqueta">Almacenamiento</label>
                <div className="relative">
                  <HardDrive className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    className="campo pl-9" maxLength={80} placeholder="SSD 512 GB"
                    value={formulario.almacenamiento}
                    onChange={(e) => setFormulario((f) => ({ ...f, almacenamiento: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          </section>

          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
              <Network className="h-3.5 w-3.5" /> Conectividad y acceso remoto
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {campo('Direccion IP', 'direccion_ip', { maxLength: 45, placeholder: '192.168.0.45' })}
              {campo('Direccion MAC', 'direccion_mac', { maxLength: 17, placeholder: 'A4:BB:6D:11:22:33' })}
              {campo('Identificador AnyDesk', 'anydesk_id', { maxLength: 40, placeholder: '123 456 789' })}
              <div>
                <label className="etiqueta">Contrasena AnyDesk</label>
                <input
                  type="password"
                  className="campo"
                  maxLength={200}
                  autoComplete="new-password"
                  placeholder={formulario.id ? 'Dejar vacio para conservar' : 'Se guarda cifrada'}
                  value={formulario.anydesk_password}
                  onChange={(e) => setFormulario((f) => ({ ...f, anydesk_password: e.target.value }))}
                />
              </div>
            </div>
            <p className="superficie mt-3 flex items-start gap-2 p-3 text-xs text-slate-600 dark:text-slate-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-institucional-700 dark:text-institucional-300" />
              La contrasena se guarda cifrada y nunca se incluye en listados ni documentos. Consultarla
              exige permiso propio y queda registrada en la bitacora de auditoria.
            </p>
          </section>

          <section>
            <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
              <Users className="h-3.5 w-3.5" /> Asignacion
            </p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <label className="etiqueta">Asignado a</label>
                <select className="campo" value={formulario.usuario_id}
                  onChange={(e) => setFormulario((f) => ({ ...f, usuario_id: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {usuarios.map((u) => <option key={u.id} value={u.id}>{u.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta">Area</label>
                <select className="campo" value={formulario.area_id}
                  onChange={(e) => setFormulario((f) => ({ ...f, area_id: e.target.value }))}>
                  <option value="">Sin area</option>
                  {areas.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta">Estado</label>
                <select className="campo" value={formulario.estado}
                  onChange={(e) => setFormulario((f) => ({ ...f, estado: e.target.value as EstadoEquipo }))}>
                  {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
                </select>
              </div>
              <div>
                <label className="etiqueta">Fecha de asignacion</label>
                <input type="date" className="campo" value={formulario.fecha_asignacion}
                  onChange={(e) => setFormulario((f) => ({ ...f, fecha_asignacion: e.target.value }))} />
              </div>
              <div className="sm:col-span-2 lg:col-span-2">
                {campo('Ubicacion', 'ubicacion', { maxLength: 120, placeholder: 'Contabilidad - Escritorio 3' })}
              </div>
              <div className="sm:col-span-2">
                {campo('Observaciones', 'observaciones', { maxLength: 500 })}
              </div>
            </div>
          </section>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
            <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" className="boton-primario" disabled={guardando}>Guardar equipo</button>
          </div>
        </form>
      </Modal>

      <Modal
        titulo="Acceso remoto del equipo"
        icono={KeyRound}
        abierto={credencial !== null}
        alCerrar={() => setCredencial(null)}
        ancho="max-w-md"
      >
        {credencial && (
          <div className="space-y-4">
            <div className="superficie p-4">
              <p className="font-semibold text-institucional-900 dark:text-slate-100">
                {credencial.equipo.codigo} - {credencial.equipo.nombre_equipo}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {credencial.equipo.usuario_nombre ?? 'Sin asignar'} - {credencial.equipo.direccion_ip ?? 'sin IP'}
              </p>
            </div>

            <div>
              <p className="etiqueta">Identificador AnyDesk</p>
              <p className="font-mono text-lg font-bold text-institucional-900 dark:text-slate-100">
                {credencial.anydesk_id ?? 'No registrado'}
              </p>
            </div>

            <div>
              <p className="etiqueta">Contrasena</p>
              <p className="select-all font-mono text-lg font-bold text-institucional-900 dark:text-slate-100">
                {credencial.password}
              </p>
            </div>

            <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800
                          dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
              <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
              Esta consulta quedo registrada en la bitacora de auditoria con su usuario y la fecha.
            </p>

            <div className="flex justify-end">
              <button type="button" className="boton-secundario" onClick={() => setCredencial(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      {dialogo}
    </div>
  );
};
