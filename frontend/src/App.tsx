import { Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorAuth } from './context/AuthContext';
import { ProveedorTema } from './context/TemaContext';
import { ProveedorNotificaciones } from './context/NotificacionesContext';
import { Layout } from './components/Layout';
import { RutaProtegida } from './components/RutaProtegida';
import { RUTAS, RUTA_INICIAL, RUTA_PUBLICA } from './rutas';

export const App = () => (
  <ProveedorTema>
    <ProveedorAuth>
      <ProveedorNotificaciones>
        <Routes>
          <Route path={RUTA_PUBLICA.path} element={RUTA_PUBLICA.elemento} />
          <Route element={<RutaProtegida><Layout /></RutaProtegida>}>
            <Route index element={<Navigate to={RUTA_INICIAL} replace />} />
            {RUTAS.map(({ path, elemento, permisos }) => (
              <Route
                key={path}
                path={path}
                element={<RutaProtegida permisos={permisos}>{elemento}</RutaProtegida>}
              />
            ))}
          </Route>
          <Route path="*" element={<Navigate to={RUTA_INICIAL} replace />} />
        </Routes>
      </ProveedorNotificaciones>
    </ProveedorAuth>
  </ProveedorTema>
);
