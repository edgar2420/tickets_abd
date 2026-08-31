import type { FormEvent, ReactNode } from 'react';
import { Cpu, HardDrive, MemoryStick, Monitor, Network, ShieldAlert, Users } from 'lucide-react';
import { ESTADOS, TIPOS, type FormularioEquipo } from '../constantes';
import { CompositorCodigo } from './CompositorCodigo';
import type { Area, EstadoEquipo, Sucursal, TipoEquipo, Usuario } from '../../../lib/tipos';

type Actualizar = (actualizar: (previo: FormularioEquipo) => FormularioEquipo) => void;

const Seccion = ({ titulo, icono: Icono, children }: {
  titulo: string;
  icono: typeof Monitor;
  children: ReactNode;
}) => (
  <section>
    <p className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
      <Icono className="h-3.5 w-3.5" /> {titulo}
    </p>
    {children}
  </section>
);

const Seleccion = ({ etiqueta, valor, alCambiar, children }: {
  etiqueta: string;
  valor: string;
  alCambiar: (valor: string) => void;
  children: ReactNode;
}) => (
  <div>
    <label className="etiqueta">{etiqueta}</label>
    <select className="campo" value={valor} onChange={(e) => alCambiar(e.target.value)}>{children}</select>
  </div>
);

export const Formulario = ({ formulario, setFormulario, usuarios, areas, sucursales, alEnviar }: {
  formulario: FormularioEquipo;
  setFormulario: Actualizar;
  usuarios: Usuario[];
  areas: Area[];
  sucursales: Sucursal[];
  alEnviar: (evento: FormEvent) => void;
}) => {
  const campo = (etiqueta: string, clave: keyof FormularioEquipo, extra: Record<string, unknown> = {}) => (
    <div>
      <label className="etiqueta">{etiqueta}</label>
      <input
        className="campo"
        value={String(formulario[clave] ?? '')}
        onChange={(e) => setFormulario((previo) => ({ ...previo, [clave]: e.target.value }))}
        {...extra}
      />
    </div>
  );

  return (
    <form id="form-equipo" onSubmit={alEnviar} className="space-y-5">
      <Seccion titulo="Identificacion" icono={Monitor}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Tipo de equipo</label>
            <select
              className="campo"
              value={formulario.tipo}
              onChange={(e) => setFormulario((previo) => ({ ...previo, tipo: e.target.value as TipoEquipo }))}
            >
              {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="etiqueta">Area</label>
            <select
              className="campo"
              value={formulario.area_id}
              onChange={(e) => setFormulario((previo) => ({ ...previo, area_id: e.target.value }))}
            >
              <option value="">Sin area</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>{area.codigo} - {area.nombre}</option>
              ))}
            </select>
          </div>

          <CompositorCodigo
            codigo={formulario.codigo}
            tipo={formulario.tipo}
            areaId={formulario.area_id}
            areas={areas}
            esNuevo={formulario.id === null}
            alCambiar={(codigo) => setFormulario((previo) => ({ ...previo, codigo }))}
          />

          {campo('Nombre del equipo', 'nombre_equipo', {
            required: true, minLength: 2, maxLength: 100, placeholder: 'CONTAB-01'
          })}
          {campo('Marca', 'marca', { maxLength: 60, placeholder: 'Dell' })}
          {campo('Modelo', 'modelo', { maxLength: 80, placeholder: 'OptiPlex 3080' })}
          {campo('Numero de serie', 'numero_serie', { maxLength: 80 })}
        </div>
      </Seccion>

      <Seccion titulo="Caracteristicas tecnicas" icono={Cpu}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {campo('Sistema operativo', 'sistema_operativo', { maxLength: 80, placeholder: 'Windows 11 Pro' })}
          {campo('Procesador', 'procesador', { maxLength: 100, placeholder: 'Intel Core i5' })}
          <div>
            <label className="etiqueta">Memoria RAM (GB)</label>
            <div className="relative">
              <MemoryStick className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-400" />
              <input
                type="number"
                min={1}
                max={2048}
                className="campo pl-9"
                placeholder="16"
                value={formulario.ram_gb}
                onChange={(e) => setFormulario((previo) => ({ ...previo, ram_gb: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <label className="etiqueta">Almacenamiento</label>
            <div className="relative">
              <HardDrive className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-400" />
              <input
                className="campo pl-9"
                maxLength={80}
                placeholder="SSD 512 GB"
                value={formulario.almacenamiento}
                onChange={(e) => setFormulario((previo) => ({ ...previo, almacenamiento: e.target.value }))}
              />
            </div>
          </div>
        </div>
      </Seccion>

      <Seccion titulo="Conectividad y acceso remoto" icono={Network}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {campo('Direccion IP', 'direccion_ip', { maxLength: 45, placeholder: '192.168.0.45' })}
          {campo('Direccion MAC', 'direccion_mac', { maxLength: 17, placeholder: 'A4:BB:6D:11:22:33' })}
          {campo('Identificador AnyDesk', 'anydesk_id', { maxLength: 40, placeholder: '123 456 789' })}
          <div>
            <label className="etiqueta">Contraseña AnyDesk</label>
            <input
              type="password"
              className="campo"
              maxLength={200}
              autoComplete="new-password"
              placeholder={formulario.id ? 'Dejar vacio para conservar' : 'Se guarda cifrada'}
              value={formulario.anydesk_password}
              onChange={(e) => setFormulario((previo) => ({ ...previo, anydesk_password: e.target.value }))}
            />
          </div>
        </div>
        <p className="superficie mt-3 flex items-start gap-2 p-3 text-xs text-slate-600 dark:text-slate-200">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-institucional-700 dark:text-institucional-300" />
          La contraseña se guarda cifrada y nunca se incluye en listados ni documentos. Consultarla
          exige permiso propio y queda registrada en la bitacora de auditoria.
        </p>
      </Seccion>

      <Seccion titulo="Asignacion" icono={Users}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Seleccion
            etiqueta="Asignado a"
            valor={formulario.usuario_id}
            alCambiar={(valor) => {
              // La persona ya tiene area y sucursal: se copian para no volver a
              // preguntar lo mismo, y para que el codigo del equipo salga solo.
              const elegido = usuarios.find((u) => String(u.id) === valor);
              setFormulario((previo) => ({
                ...previo,
                usuario_id: valor,
                sucursal_id: elegido?.sucursal_id ? String(elegido.sucursal_id) : previo.sucursal_id,
                area_id: elegido?.area_id ? String(elegido.area_id) : previo.area_id
              }));
            }}
          >
            <option value="">Sin asignar</option>
            {usuarios.map((usuario) => (
              <option key={usuario.id} value={usuario.id}>
                {usuario.nombre}{usuario.sucursal ? ` - ${usuario.sucursal}` : ''}
              </option>
            ))}
          </Seleccion>
          <Seleccion
            etiqueta="Sucursal"
            valor={formulario.sucursal_id}
            alCambiar={(valor) => setFormulario((previo) => ({ ...previo, sucursal_id: valor }))}
          >
            <option value="">Sin sucursal</option>
            {sucursales.map((sucursal) => <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>)}
          </Seleccion>
          <Seleccion
            etiqueta="Estado"
            valor={formulario.estado}
            alCambiar={(valor) => setFormulario((previo) => ({ ...previo, estado: valor as EstadoEquipo }))}
          >
            {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
          </Seleccion>
          <div>
            <label className="etiqueta">Fecha de asignacion</label>
            <input
              type="date"
              className="campo"
              value={formulario.fecha_asignacion}
              onChange={(e) => setFormulario((previo) => ({ ...previo, fecha_asignacion: e.target.value }))}
            />
          </div>
          <div className="lg:col-span-2">
            {campo('Ubicacion', 'ubicacion', { maxLength: 120, placeholder: 'Contabilidad - Escritorio 3' })}
          </div>
          <div className="sm:col-span-2 lg:col-span-4">
            {campo('Observaciones', 'observaciones', { maxLength: 500 })}
          </div>
        </div>
      </Seccion>

    </form>
  );
};
