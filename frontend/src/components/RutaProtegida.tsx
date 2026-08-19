import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { usarAuth } from '../context/AuthContext';
import { Cargando } from './Ui';

/** Restringe el acceso a una ruta segun los permisos atomicos del usuario. */
export const RutaProtegida = ({ permisos = [], children }: { permisos?: string[]; children: ReactNode }) => {
  const { usuario, cargando, puede } = usarAuth();
  const ubicacion = useLocation();

  if (cargando) return <Cargando texto="Validando sesion" />;
  if (!usuario) return <Navigate to="/login" state={{ desde: ubicacion.pathname }} replace />;

  if (permisos.length > 0 && !puede(...permisos)) {
    return (
      <div className="panel mx-auto max-w-lg p-8 text-center">
        <ShieldAlert className="mx-auto h-10 w-10 text-rose-600" />
        <h2 className="mt-3 text-lg font-bold text-institucional-900 dark:text-slate-100">Acceso restringido</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Su rol no cuenta con el permiso requerido para consultar esta seccion.
        </p>
        <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">Permiso requerido: {permisos.join(' o ')}</p>
      </div>
    );
  }

  return <>{children}</>;
};
