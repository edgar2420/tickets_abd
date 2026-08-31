import { useCallback, useEffect, useState } from 'react';
import { Check, UserPlus, X } from 'lucide-react';
import { api } from '../../../lib/api';
import { Acciones, BotonAccion, Alerta, Panel } from '../../../components/Ui';
import { fechaHora } from '../../../lib/formato';
import type { Rol, Usuario } from '../../../lib/tipos';

export const CuentasPendientes = ({ roles, alCambiar }: {
  roles: Rol[];
  alCambiar: () => void;
}) => {
  const [pendientes, setPendientes] = useState<Usuario[]>([]);
  const [roporCuenta, setRolPorCuenta] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Usuario[] }>('/usuarios/pendientes');
      setPendientes(datos);
      setError(null);
    } catch {
      setPendientes([]);
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setProcesando(true);
    setError(null);
    try {
      await accion();
      await cargar();
      alCambiar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la operacion');
    } finally {
      setProcesando(false);
    }
  };

  if (pendientes.length === 0) return null;

  return (
    <Panel titulo={`Cuentas que esperan aprobacion (${pendientes.length})`} icono={UserPlus}>
      {error && <div className="mb-3"><Alerta mensaje={error} /></div>}

      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              <th>Persona</th>
              <th>Usuario</th>
              <th>Area</th>
              <th>Sucursal</th>
              <th>Solicitada</th>
              <th>Rol que se le asigna</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {pendientes.map((cuenta) => (
              <tr key={cuenta.id}>
                <td className="font-medium text-slate-800 dark:text-slate-100">{cuenta.nombre}</td>
                <td className="font-mono text-xs text-slate-600 dark:text-slate-200">{cuenta.usuario}</td>
                <td className="text-slate-600 dark:text-slate-200">{cuenta.area}</td>
                <td className="text-slate-600 dark:text-slate-200">{cuenta.sucursal ?? '-'}</td>
                <td className="text-xs text-slate-500 dark:text-slate-300">
                  {cuenta.fecha_creacion ? fechaHora(cuenta.fecha_creacion) : '-'}
                </td>
                <td>
                  <select
                    className="campo py-1.5 text-xs"
                    value={roporCuenta[cuenta.id] ?? String(cuenta.rol_id)}
                    onChange={(e) => setRolPorCuenta((r) => ({ ...r, [cuenta.id]: e.target.value }))}
                  >
                    {roles.map((rol) => <option key={rol.id} value={rol.id}>{rol.nombre}</option>)}
                  </select>
                </td>
                <td>
                  <Acciones>
                    <BotonAccion
                      icono={Check}
                      rotulo="Aprobar y habilitar el acceso"
                      tono="exito"
                      deshabilitado={procesando}
                      alPulsar={() => void ejecutar(() => api(`/usuarios/${cuenta.id}/aprobar`, {
                        metodo: 'PUT',
                        cuerpo: { rol_id: Number(roporCuenta[cuenta.id] ?? cuenta.rol_id) }
                      }))}
                    />
                    <BotonAccion
                      icono={X}
                      rotulo="Rechazar y retirar la solicitud"
                      tono="peligro"
                      deshabilitado={procesando}
                      alPulsar={() => void ejecutar(() => api(`/usuarios/${cuenta.id}/registro`, {
                        metodo: 'DELETE'
                      }))}
                    />
                  </Acciones>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
};
