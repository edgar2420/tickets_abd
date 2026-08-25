import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell, Boxes, Building, Building2, ClipboardList, Eraser, FileBarChart, Gauge, KeyRound, LayoutGrid, Lightbulb, LogOut, Monitor, Moon,
  ShoppingCart,
  PanelLeftClose, PanelLeftOpen, ScrollText, ShieldCheck, Sun, Tags, Ticket,
  UserCog, Users, Wrench, type LucideIcon
} from 'lucide-react';
import { usarAuth } from '../context/AuthContext';
import { CambioPassword } from './CambioPassword';
import { limpiarCacheYCookies } from '../lib/limpieza';
import { usarNotificaciones } from '../context/NotificacionesContext';
import { usarTema } from '../context/TemaContext';
import { PiePagina } from './PiePagina';
import { tiempoRelativo } from '../lib/formato';

interface Enlace {
  ruta: string;
  texto: string;
  icono: LucideIcon;
  permisos: string[];
  grupo: 'Operacion' | 'Administracion';
}

const ENLACES: Enlace[] = [
  { ruta: '/tablero', texto: 'Tablero', icono: Gauge, permisos: ['tickets.ver_propios', 'tickets.ver_todos'], grupo: 'Operacion' },
  { ruta: '/reportes', texto: 'Reporte mensual', icono: FileBarChart, permisos: ['reportes.ver', 'tickets.ver_todos'], grupo: 'Operacion' },
  { ruta: '/tickets', texto: 'Tickets', icono: Ticket, permisos: ['tickets.ver_propios', 'tickets.ver_todos'], grupo: 'Operacion' },
  { ruta: '/tickets/nuevo', texto: 'Nuevo ticket', icono: ClipboardList, permisos: ['tickets.crear'], grupo: 'Operacion' },
  { ruta: '/inventario', texto: 'Inventario', icono: Boxes, permisos: ['inventario.ver'], grupo: 'Operacion' },
  { ruta: '/equipos', texto: 'Equipos', icono: Monitor, permisos: ['equipos.ver'], grupo: 'Operacion' },
  { ruta: '/mantenimiento', texto: 'Mantenimiento', icono: Wrench, permisos: ['mantenimiento.ver'], grupo: 'Operacion' },
  { ruta: '/compras', texto: 'Compras', icono: ShoppingCart, permisos: ['compras.solicitar', 'compras.ver_todas'], grupo: 'Operacion' },
  { ruta: '/proyectos', texto: 'Proyectos', icono: Lightbulb, permisos: ['proyectos.solicitar', 'proyectos.ver_todas'], grupo: 'Operacion' },
  { ruta: '/admin/usuarios', texto: 'Usuarios', icono: Users, permisos: ['admin.usuarios'], grupo: 'Administracion' },
  { ruta: '/admin/roles', texto: 'Roles y permisos', icono: ShieldCheck, permisos: ['admin.roles'], grupo: 'Administracion' },
  { ruta: '/admin/sucursales', texto: 'Sucursales', icono: Building, permisos: ['admin.sucursales'], grupo: 'Administracion' },
  { ruta: '/admin/areas', texto: 'Areas', icono: Building2, permisos: ['admin.areas'], grupo: 'Administracion' },
  { ruta: '/admin/categorias', texto: 'Categorias', icono: Tags, permisos: ['admin.categorias'], grupo: 'Administracion' },
  { ruta: '/auditoria', texto: 'Auditoria', icono: ScrollText, permisos: ['auditoria.ver'], grupo: 'Administracion' }
];

const PanelNotificaciones = () => {
  const { notificaciones, noLeidas, marcarLeida, marcarTodas } = usarNotificaciones();
  const [abierto, setAbierto] = useState(false);
  const contenedor = useRef<HTMLDivElement>(null);
  const navegar = useNavigate();

  useEffect(() => {
    const alClicFuera = (evento: MouseEvent) => {
      if (contenedor.current && !contenedor.current.contains(evento.target as Node)) setAbierto(false);
    };
    document.addEventListener('mousedown', alClicFuera);
    return () => document.removeEventListener('mousedown', alClicFuera);
  }, []);

  return (
    <div className="relative" ref={contenedor}>
      <button
        type="button"
        onClick={() => setAbierto((v) => !v)}
        className="relative rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
        aria-label="Notificaciones"
      >
        <Bell className="h-5 w-5" />
        {noLeidas > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {noLeidas > 99 ? '99+' : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl dark:bg-noche-850 dark:border-noche-700">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2 dark:border-noche-700">
            <span className="text-xs font-semibold uppercase tracking-wide text-institucional-900 dark:text-slate-100">Notificaciones</span>
            <button type="button" onClick={() => void marcarTodas()} className="text-xs text-institucional-700 hover:underline dark:text-institucional-300">
              Marcar todas
            </button>
          </header>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {notificaciones.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-slate-500 dark:text-slate-300">Sin notificaciones registradas</li>
            )}
            {notificaciones.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  onClick={() => {
                    void marcarLeida(n.id);
                    setAbierto(false);
                    if (n.ticket_id) navegar(`/tickets/${n.ticket_id}`);
                  }}
                  className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-noche-800 ${n.leida ? '' : 'bg-institucional-50/60 dark:bg-institucional-500/10'}`}
                >
                  <p className="text-sm font-semibold text-institucional-900 dark:text-slate-100">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-200">{n.mensaje}</p>
                  <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-400">{tiempoRelativo(n.fecha)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const InterruptorTema = () => {
  const { tema, alternar } = usarTema();
  return (
    <button
      type="button"
      onClick={alternar}
      className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
      title={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
      aria-label={tema === 'oscuro' ? 'Cambiar a tema claro' : 'Cambiar a tema oscuro'}
    >
      {tema === 'oscuro' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
};

const CLAVE_MENU = 'tickets_ti_menu_visible';

export const Layout = () => {
  const { usuario, cerrarSesion, puede } = usarAuth();
  const [modalPassword, setModalPassword] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(() => localStorage.getItem(CLAVE_MENU) !== 'oculto');
  const navegar = useNavigate();

  useEffect(() => {
    localStorage.setItem(CLAVE_MENU, menuAbierto ? 'visible' : 'oculto');
  }, [menuAbierto]);

  const enlaces = ENLACES.filter((enlace) => puede(...enlace.permisos));

  const salir = () => {
    cerrarSesion();
    navegar('/login', { replace: true });
  };

  const limpiar = async () => {
    if (!window.confirm('Se borraran la cache, las cookies y los datos guardados en este navegador, y se cerrara la sesion. Continuar?')) return;
    cerrarSesion();
    await limpiarCacheYCookies();
    window.location.replace('/login');
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <header className="z-30 shrink-0 bg-institucional-900 text-white shadow dark:bg-noche-850 dark:border-b dark:border-noche-700">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label={menuAbierto ? 'Ocultar menu' : 'Mostrar menu'}
              title={menuAbierto ? 'Ocultar menu' : 'Mostrar menu'}
            >
              {menuAbierto ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
            </button>
            <LayoutGrid className="h-6 w-6 text-institucional-200" />
            <div className="leading-tight">
              <p className="text-sm font-bold uppercase tracking-wide">Mesa de Ayuda TI</p>
              <p className="text-[11px] text-institucional-200">Gestion de tickets y control de acceso</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <InterruptorTema />
            <PanelNotificaciones />
            <button
              type="button"
              onClick={() => navegar('/perfil')}
              className="hidden rounded-md px-2 py-1 text-right transition hover:bg-white/10 sm:block"
              title="Ver mi perfil"
            >
              <p className="text-sm font-semibold">{usuario?.nombre}</p>
              <p className="text-[11px] text-institucional-200">
                {usuario?.rol} - {usuario?.area}
                {usuario?.sucursal ? ` - ${usuario.sucursal}` : ''}
              </p>
            </button>
            <button
              type="button"
              onClick={() => setModalPassword(true)}
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Cambiar mi contrasena"
              title="Cambiar mi contrasena"
            >
              <KeyRound className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => void limpiar()}
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Limpiar cache y cookies"
              title="Limpiar cache y cookies de este navegador"
            >
              <Eraser className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={salir}
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar sesion"
              title="Cerrar sesion"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside
          className={`fixed inset-y-0 left-0 z-20 flex w-64 shrink-0 transform flex-col overflow-hidden
                      border-r border-slate-200 bg-white pt-20 transition-all duration-300
                      dark:border-noche-700 dark:bg-noche-850 lg:static lg:z-auto lg:pt-0 ${
            menuAbierto ? 'translate-x-0 lg:w-64' : '-translate-x-full lg:w-0 lg:translate-x-0 lg:border-r-0'
          }`}
        >
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4">
            {enlaces.map(({ ruta, texto, icono: Icono, grupo }, indice) => {
              const abreGrupo = indice > 0 && enlaces[indice - 1].grupo !== grupo;

              return (
                <div key={ruta} className="contents">
                  {abreGrupo && (
                    <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400">
                      {grupo}
                    </p>
                  )}
                  <NavLink
                    to={ruta}
                    end={ruta === '/tickets'}
                    onClick={() => {
                      if (window.innerWidth < 1024) setMenuAbierto(false);
                    }}
                    className={({ isActive }) => (isActive ? 'enlace-menu-activo' : 'enlace-menu-inactivo')}
                  >
                    <Icono className="h-4 w-4" />
                    {texto}
                  </NavLink>
                </div>
              );
            })}
          </nav>

          <div className="mx-4 mb-4 mt-auto rounded-lg border border-slate-200 bg-slate-50 p-3 dark:bg-noche-800 dark:border-noche-700">
            <p className="flex items-center gap-2 text-xs font-semibold text-institucional-900 dark:text-slate-100">
              <UserCog className="h-4 w-4 text-institucional-700 dark:text-institucional-300" />
              Permisos activos
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-300">
              {usuario?.permisos.length} permisos atomicos concedidos por el rol <strong>{usuario?.rol}</strong>.
            </p>
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 sm:p-6 dark:bg-noche-950">
          <Outlet />
        </main>
      </div>

      <PiePagina />

      <CambioPassword
        abierto={modalPassword}
        usuario={usuario?.usuario ?? ''}
        alCerrar={() => setModalPassword(false)}
      />
    </div>
  );
};
