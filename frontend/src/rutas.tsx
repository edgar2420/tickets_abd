import type { JSX } from 'react';
import { Login, Registro } from './modulos/acceso';
import { Tablero } from './modulos/tablero';
import { Reportes } from './modulos/reportes';
import { Perfil } from './modulos/perfil';
import { DetalleTicket, NuevoTicket, Tickets } from './modulos/tickets';
import { Inventario } from './modulos/inventario';
import { Equipos } from './modulos/equipos';
import { Mantenimiento } from './modulos/mantenimiento';
import { Compras } from './modulos/compras';
import { Proyectos } from './modulos/proyectos';
import { Auditoria } from './modulos/auditoria';
import {
  AdminAreas, AdminCategorias, AdminRoles, AdminSucursales, AdminUsuarios
} from './modulos/administracion';

export interface Ruta {
  path: string;
  elemento: JSX.Element;
  permisos?: string[];
}

export const RUTA_PUBLICA = { path: '/login', elemento: <Login /> };

export const RUTA_REGISTRO = { path: '/registro', elemento: <Registro /> };

export const RUTA_INICIAL = '/tablero';

export const RUTAS: Ruta[] = [
  { path: '/perfil', elemento: <Perfil /> },
  { path: '/tablero', elemento: <Tablero />, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { path: '/reportes', elemento: <Reportes />, permisos: ['reportes.ver', 'tickets.ver_todos'] },
  { path: '/tickets', elemento: <Tickets />, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { path: '/tickets/nuevo', elemento: <NuevoTicket />, permisos: ['tickets.crear'] },
  { path: '/tickets/:id', elemento: <DetalleTicket />, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { path: '/inventario', elemento: <Inventario />, permisos: ['inventario.ver'] },
  { path: '/equipos', elemento: <Equipos />, permisos: ['equipos.ver'] },
  { path: '/mantenimiento', elemento: <Mantenimiento />, permisos: ['mantenimiento.ver'] },
  { path: '/compras', elemento: <Compras />, permisos: ['compras.solicitar', 'compras.ver_todas'] },
  { path: '/proyectos', elemento: <Proyectos />, permisos: ['proyectos.solicitar', 'proyectos.ver_todas'] },
  { path: '/auditoria', elemento: <Auditoria />, permisos: ['auditoria.ver'] },
  { path: '/admin/usuarios', elemento: <AdminUsuarios />, permisos: ['admin.usuarios'] },
  { path: '/admin/roles', elemento: <AdminRoles />, permisos: ['admin.roles'] },
  { path: '/admin/areas', elemento: <AdminAreas />, permisos: ['admin.areas'] },
  { path: '/admin/sucursales', elemento: <AdminSucursales />, permisos: ['admin.sucursales'] },
  { path: '/admin/categorias', elemento: <AdminCategorias />, permisos: ['admin.categorias'] }
];
