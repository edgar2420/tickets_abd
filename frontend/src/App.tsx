import { Navigate, Route, Routes } from 'react-router-dom';
import { ProveedorAuth } from './context/AuthContext';
import { ProveedorTema } from './context/TemaContext';
import { ProveedorNotificaciones } from './context/NotificacionesContext';
import { Layout } from './components/Layout';
import { RutaProtegida } from './components/RutaProtegida';
import { Login } from './pages/Login';
import { Tablero } from './pages/Tablero';
import { Tickets } from './pages/Tickets';
import { NuevoTicket } from './pages/NuevoTicket';
import { DetalleTicket } from './pages/DetalleTicket';
import { AdminUsuarios } from './pages/AdminUsuarios';
import { AdminRoles } from './pages/AdminRoles';
import { AdminAreas } from './pages/AdminAreas';
import { AdminSucursales } from './pages/AdminSucursales';
import { AdminCategorias } from './pages/AdminCategorias';
import { Auditoria } from './pages/Auditoria';
import { Inventario } from './pages/Inventario';
import { Equipos } from './pages/Equipos';
import { Compras } from './pages/Compras';

const Privado = ({ permisos, elemento }: { permisos?: string[]; elemento: JSX.Element }) => (
  <RutaProtegida permisos={permisos}>{elemento}</RutaProtegida>
);

export const App = () => (
  <ProveedorTema>
    <ProveedorAuth>
    <ProveedorNotificaciones>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          element={
            <RutaProtegida>
              <Layout />
            </RutaProtegida>
          }
        >
          <Route index element={<Navigate to="/tablero" replace />} />
          <Route path="/tablero" element={<Privado permisos={['tickets.ver_propios', 'tickets.ver_todos']} elemento={<Tablero />} />} />
          <Route path="/tickets" element={<Privado permisos={['tickets.ver_propios', 'tickets.ver_todos']} elemento={<Tickets />} />} />
          <Route path="/tickets/nuevo" element={<Privado permisos={['tickets.crear']} elemento={<NuevoTicket />} />} />
          <Route path="/tickets/:id" element={<Privado permisos={['tickets.ver_propios', 'tickets.ver_todos']} elemento={<DetalleTicket />} />} />
          <Route path="/admin/usuarios" element={<Privado permisos={['admin.usuarios']} elemento={<AdminUsuarios />} />} />
          <Route path="/admin/roles" element={<Privado permisos={['admin.roles']} elemento={<AdminRoles />} />} />
          <Route path="/admin/areas" element={<Privado permisos={['admin.areas']} elemento={<AdminAreas />} />} />
          <Route path="/admin/sucursales" element={<Privado permisos={['admin.sucursales']} elemento={<AdminSucursales />} />} />
          <Route path="/admin/categorias" element={<Privado permisos={['admin.categorias']} elemento={<AdminCategorias />} />} />
          <Route path="/inventario" element={<Privado permisos={['inventario.ver']} elemento={<Inventario />} />} />
          <Route path="/equipos" element={<Privado permisos={['equipos.ver']} elemento={<Equipos />} />} />
          <Route path="/compras" element={<Privado permisos={['compras.solicitar', 'compras.ver_todas']} elemento={<Compras />} />} />
          <Route path="/auditoria" element={<Privado permisos={['reportes.ver', 'admin.usuarios']} elemento={<Auditoria />} />} />
        </Route>
        <Route path="*" element={<Navigate to="/tablero" replace />} />
      </Routes>
      </ProveedorNotificaciones>
    </ProveedorAuth>
  </ProveedorTema>
);
