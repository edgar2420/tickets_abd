import { BadgeCheck, ClipboardCheck, PackageCheck, ShoppingCart, ThumbsUp, XCircle, type LucideIcon } from 'lucide-react';
import type { TipoAccion } from './constantes';
import type { EstadoCompra } from '../../lib/tipos';

type Tono = 'neutro' | 'exito' | 'peligro';

interface Definicion {
  tipo: TipoAccion;
  rotulo: string;
  icono: LucideIcon;
  tono: Tono;
  permisos: string[];
  estados: EstadoCompra[];
}

const CATALOGO: Definicion[] = [
  {
    tipo: 'revisar',
    rotulo: 'Revisar y sugerir equipo',
    icono: ClipboardCheck,
    tono: 'neutro',
    permisos: ['compras.revisar'],
    estados: ['Solicitada', 'En revision']
  },
  {
    tipo: 'aprobar-ti',
    rotulo: 'Aprobar tecnicamente',
    icono: ThumbsUp,
    tono: 'exito',
    permisos: ['compras.revisar'],
    estados: ['Solicitada', 'En revision']
  },
  {
    tipo: 'aprobar-gerencia',
    rotulo: 'Aprobar presupuesto',
    icono: BadgeCheck,
    tono: 'exito',
    permisos: ['compras.aprobar'],
    estados: ['Aprobada por TI']
  },
  {
    tipo: 'comprar',
    rotulo: 'Registrar compra',
    icono: ShoppingCart,
    tono: 'neutro',
    permisos: ['compras.gestionar'],
    estados: ['Aprobada por Gerencia']
  },
  {
    tipo: 'entregar',
    rotulo: 'Registrar entrega',
    icono: PackageCheck,
    tono: 'exito',
    permisos: ['compras.gestionar'],
    estados: ['Comprada']
  },
  {
    tipo: 'rechazar',
    rotulo: 'Rechazar',
    icono: XCircle,
    tono: 'peligro',
    permisos: ['compras.revisar', 'compras.aprobar'],
    estados: ['Solicitada', 'En revision', 'Aprobada por TI']
  }
];

export const accionesDisponibles = (estado: EstadoCompra, puede: (...codigos: string[]) => boolean) =>
  CATALOGO.filter((accion) => accion.estados.includes(estado) && puede(...accion.permisos));
