import type { JSX } from 'react';
import { Login } from './modulos/acceso';
import { Tablero } from './modulos/tablero';
import { DetalleTicket, NuevoTicket, Tickets } from './modulos/tickets';
import { Inventario } from './modulos/inventario';
import { Equipos } from './modulos/equipos';
import { Compras } from './modulos/compras';
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

export const RUTA_INICIAL = '/tablero';

export const RUTAS: Ruta[] = [
  { path: '/tablero', elemento: <Tablero />, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { path: '/tickets', elemento: <Tickets />, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { path: '/tickets/nuevo', elemento: <NuevoTicket />, permisos: ['tickets.crear'] },
  { path: '/tickets/:id', elemento: <DetalleTicket />, permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { path: '/inventario', elemento: <Inventario />, permisos: ['inventario.ver'] },
  { path: '/equipos', elemento: <Equipos />, permisos: ['equipos.ver'] },
  { path: '/compras', elemento: <Compras />, permisos: ['compras.solicitar', 'compras.ver_todas'] },
  { path: '/auditoria', elemento: <Auditoria />, permisos: ['reportes.ver', 'admin.usuarios'] },
  { path: '/admin/usuarios', elemento: <AdminUsuarios />, permisos: ['admin.usuarios'] },
  { path: '/admin/roles', elemento: <AdminRoles />, permisos: ['admin.roles'] },
  { path: '/admin/areas', elemento: <AdminAreas />, permisos: ['admin.areas'] },
  { path: '/admin/sucursales', elemento: <AdminSucursales />, permisos: ['admin.sucursales'] },
  { path: '/admin/categorias', elemento: <AdminCategorias />, permisos: ['admin.categorias'] }
];
