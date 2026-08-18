import { useEffect, useRef, useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  Bell, Building2, ClipboardList, Gauge, LayoutGrid, LogOut, Menu, ScrollText,
  ShieldCheck, Tags, Ticket, UserCog, Users, X, type LucideIcon
} from 'lucide-react';
import { usarAuth } from '../context/AuthContext';
import { usarNotificaciones } from '../context/NotificacionesContext';
import { PiePagina } from './PiePagina';
import { tiempoRelativo } from '../lib/formato';

interface Enlace {
  ruta: string;
  texto: string;
  icono: LucideIcon;
  permisos: string[];
}

const ENLACES: Enlace[] = [
  { ruta: '/tablero', texto: 'Tablero', icono: Gauge, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { ruta: '/tickets', texto: 'Tickets', icono: Ticket, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { ruta: '/tickets/nuevo', texto: 'Nuevo ticket', icono: ClipboardList, permisos: ['tickets.crear'] },
  { ruta: '/admin/usuarios', texto: 'Usuarios', icono: Users, permisos: ['admin.usuarios'] },
  { ruta: '/admin/roles', texto: 'Roles y permisos', icono: ShieldCheck, permisos: ['admin.roles'] },
  { ruta: '/admin/areas', texto: 'Areas', icono: Building2, permisos: ['admin.areas'] },
  { ruta: '/admin/categorias', texto: 'Categorias', icono: Tags, permisos: ['admin.categorias'] },
  { ruta: '/auditoria', texto: 'Auditoria', icono: ScrollText, permisos: ['reportes.ver', 'admin.usuarios'] }
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
        <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-institucional-900">Notificaciones</span>
            <button type="button" onClick={() => void marcarTodas()} className="text-xs text-institucional-700 hover:underline">
              Marcar todas
            </button>
          </header>
          <ul className="max-h-96 divide-y divide-slate-100 overflow-y-auto">
            {notificaciones.length === 0 && (
              <li className="px-4 py-6 text-center text-xs text-slate-500">Sin notificaciones registradas</li>
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
                  className={`w-full px-4 py-3 text-left transition hover:bg-slate-50 ${n.leida ? '' : 'bg-institucional-50/60'}`}
                >
                  <p className="text-sm font-semibold text-institucional-900">{n.titulo}</p>
                  <p className="mt-0.5 text-xs text-slate-600">{n.mensaje}</p>
                  <p className="mt-1 text-[11px] text-slate-400">{tiempoRelativo(n.fecha)}</p>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export const Layout = () => {
  const { usuario, cerrarSesion, puede } = usarAuth();
  const [menuAbierto, setMenuAbierto] = useState(false);
  const navegar = useNavigate();

  const enlaces = ENLACES.filter((enlace) => puede(...enlace.permisos));

  const salir = () => {
    cerrarSesion();
    navegar('/login', { replace: true });
  };

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 bg-institucional-900 text-white shadow">
        <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-md p-2 text-white/80 transition hover:bg-white/10 lg:hidden"
              onClick={() => setMenuAbierto((v) => !v)}
              aria-label="Abrir menu"
            >
              {menuAbierto ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <LayoutGrid className="h-6 w-6 text-institucional-200" />
            <div className="leading-tight">
              <p className="text-sm font-bold uppercase tracking-wide">Mesa de Ayuda TI</p>
              <p className="text-[11px] text-institucional-200">Gestion de tickets y control de acceso</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <PanelNotificaciones />
            <div className="hidden text-right sm:block">
              <p className="text-sm font-semibold">{usuario?.nombre}</p>
              <p className="text-[11px] text-institucional-200">
                {usuario?.rol} - {usuario?.area}
              </p>
            </div>
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

      <div className="flex flex-1">
        <aside
          className={`fixed inset-y-0 left-0 z-20 w-64 transform border-r border-slate-200 bg-white pt-20 transition-transform lg:static lg:z-auto lg:translate-x-0 lg:pt-0 ${
            menuAbierto ? 'translate-x-0' : '-translate-x-full'
          }`}
        >
          <nav className="flex flex-col gap-1 p-4">
            {enlaces.map(({ ruta, texto, icono: Icono }, indice) => {
              // Rotulo separador al pasar de la operacion diaria a la administracion
              const abreAdministracion = indice > 0
                && enlaces[indice - 1].permisos[0].startsWith('tickets')
                && !ruta.startsWith('/tickets');

              return (
                <div key={ruta} className="contents">
                  {abreAdministracion && (
                    <p className="mb-1 mt-4 px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Administracion
                    </p>
                  )}
                  <NavLink
                    to={ruta}
                    end={ruta === '/tickets'}
                    onClick={() => setMenuAbierto(false)}
                    className={({ isActive }) => (isActive ? 'enlace-menu-activo' : 'enlace-menu-inactivo')}
                  >
                    <Icono className="h-4 w-4" />
                    {texto}
                  </NavLink>
                </div>
              );
            })}
          </nav>

          <div className="mx-4 mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <p className="flex items-center gap-2 text-xs font-semibold text-institucional-900">
              <UserCog className="h-4 w-4 text-institucional-700" />
              Permisos activos
            </p>
            <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
              {usuario?.permisos.length} permisos atomicos concedidos por el rol <strong>{usuario?.rol}</strong>.
            </p>
          </div>
        </aside>

        <main className="flex-1 bg-slate-100 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>

      <PiePagina />
    </div>
  );
};
