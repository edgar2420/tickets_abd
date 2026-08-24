import { useEffect, useMemo, useState } from 'react';
import {
  Building, Building2, IdCard, KeyRound, Mail, ShieldCheck, UserRound
} from 'lucide-react';
import { api } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { Alerta, Cargando, Dato, EncabezadoPagina, Etiqueta, Panel } from '../../components/Ui';
import { CambioPassword } from '../../components/CambioPassword';
import { fechaHora } from '../../lib/formato';
import type { Permiso } from '../../lib/tipos';

const TONO_MODULO = [
  'bg-institucional-50 text-institucional-800 border-institucional-200 dark:bg-institucional-500/15 dark:text-institucional-200 dark:border-institucional-500/30',
  'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'bg-violet-50 text-violet-800 border-violet-200 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'bg-sky-50 text-sky-800 border-sky-200 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-500/15 dark:text-rose-300 dark:border-rose-500/30'
];

export const Perfil = () => {
  const { usuario } = usarAuth();
  const [permisos, setPermisos] = useState<Permiso[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [modalPassword, setModalPassword] = useState(false);

  useEffect(() => {
    void api<{ datos: Permiso[] }>('/permisos')
      .then(({ datos }) => setPermisos(datos))
      .catch((fallo) => {
        setPermisos([]);
        setError(fallo instanceof Error ? fallo.message : 'No fue posible consultar el detalle de sus permisos');
      });
  }, []);

  const porModulo = useMemo(() => {
    if (!permisos || !usuario) return [];
    const mios = permisos.filter((permiso) => usuario.permisos.includes(permiso.codigo));
    const agrupado = new Map<string, Permiso[]>();
    for (const permiso of mios) {
      const modulo = permiso.modulo ?? 'General';
      agrupado.set(modulo, [...(agrupado.get(modulo) ?? []), permiso]);
    }
    return [...agrupado.entries()].sort(([a], [b]) => a.localeCompare(b));
  }, [permisos, usuario]);

  if (!usuario) return <Cargando texto="Consultando su perfil" />;

  const iniciales = usuario.nombre
    .split(' ')
    .filter((parte) => parte.length > 2)
    .slice(0, 2)
    .map((parte) => parte[0])
    .join('')
    .toUpperCase();

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Mi perfil"
        descripcion="Sus datos, su alcance dentro del sistema y su contrasena"
        icono={UserRound}
      >
        <button type="button" className="boton-primario" onClick={() => setModalPassword(true)}>
          <KeyRound className="h-4 w-4" />
          Cambiar mi contrasena
        </button>
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}

      <section className="panel flex flex-wrap items-center gap-5 p-6">
        <span className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-institucional-800
                         text-2xl font-bold text-white dark:bg-institucional-600">
          {iniciales || usuario.usuario.slice(0, 2).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xl font-bold text-institucional-900 dark:text-slate-100">{usuario.nombre}</p>
          <p className="font-mono text-sm text-slate-500 dark:text-slate-400">{usuario.usuario}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Etiqueta
              texto={usuario.rol}
              clase="bg-institucional-100 text-institucional-800 border-institucional-300
                     dark:bg-institucional-500/20 dark:text-institucional-200 dark:border-institucional-500/40"
            />
            <Etiqueta
              texto={usuario.activo ? 'Cuenta activa' : 'Cuenta desactivada'}
              clase={usuario.activo
                ? 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30'
                : 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'}
            />
          </div>
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Panel titulo="Datos de la cuenta" icono={IdCard}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="Nombre completo" valor={usuario.nombre} />
            <Dato etiqueta="Nombre de usuario" valor={usuario.usuario} />
            <Dato etiqueta="Correo" valor={usuario.email} />
            <Dato etiqueta="Rol asignado" valor={usuario.rol} />
            <Dato etiqueta="Alta de la cuenta" valor={fechaHora(usuario.fecha_creacion)} />
            <Dato etiqueta="Identificador interno" valor={usuario.id} />
          </div>
        </Panel>

        <Panel titulo="Donde trabaja" icono={Building}>
          <div className="grid gap-4 sm:grid-cols-2">
            <Dato etiqueta="Area" valor={usuario.area} />
            <Dato etiqueta="Sucursal" valor={usuario.sucursal} />
            <Dato etiqueta="Codigo de sucursal" valor={usuario.sucursal_codigo} />
          </div>
          <p className="superficie mt-4 flex items-start gap-2 p-3 text-xs text-slate-600 dark:text-slate-200">
            <Building2 className="mt-0.5 h-4 w-4 shrink-0 text-institucional-700 dark:text-institucional-300" />
            Los tickets y las solicitudes que registre quedan a nombre de esta area y esta sucursal.
            Si alguno de los dos no corresponde, pidale a un administrador que lo corrija.
          </p>
        </Panel>
      </div>

      <Panel titulo={`Lo que puede hacer (${usuario.permisos.length} permisos)`} icono={ShieldCheck}>
        {!permisos && <Cargando texto="Consultando sus permisos" />}
        {permisos && porModulo.length === 0 && (
          <p className="py-3 text-sm text-slate-400 dark:text-slate-500">No tiene permisos asignados.</p>
        )}
        {permisos && porModulo.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {porModulo.map(([modulo, lista], indice) => (
              <div key={modulo} className="superficie p-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-institucional-800 dark:text-institucional-200">
                  {modulo}
                </p>
                <ul className="space-y-1.5">
                  {lista.map((permiso) => (
                    <li key={permiso.codigo}>
                      <Etiqueta
                        texto={permiso.codigo}
                        clase={`font-mono ${TONO_MODULO[indice % TONO_MODULO.length]}`}
                      />
                      <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{permiso.descripcion}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Panel titulo="Seguridad de la cuenta" icono={KeyRound}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="max-w-2xl text-sm text-slate-600 dark:text-slate-200">
            La contrasena se guarda cifrada y nadie puede consultarla, ni siquiera un administrador:
            solo puede restablecerla por una nueva. Cambiela usted mismo cuando quiera, y hagalo de
            inmediato si sospecha que alguien mas la conoce.
          </p>
          <button type="button" className="boton-secundario" onClick={() => setModalPassword(true)}>
            <KeyRound className="h-4 w-4" />
            Cambiar mi contrasena
          </button>
        </div>
        {usuario.email === null && (
          <p className="superficie mt-4 flex items-start gap-2 p-3 text-xs text-slate-600 dark:text-slate-200">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-institucional-700 dark:text-institucional-300" />
            Su cuenta no tiene correo registrado. Pidale a un administrador que lo cargue para poder
            recibir avisos fuera del sistema.
          </p>
        )}
      </Panel>

      <CambioPassword
        abierto={modalPassword}
        usuario={usuario.usuario}
        alCerrar={() => setModalPassword(false)}
      />
    </div>
  );
};
