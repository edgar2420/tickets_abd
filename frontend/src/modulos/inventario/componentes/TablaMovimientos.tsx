import { TrendingUp } from 'lucide-react';
import { Cargando, Etiqueta, Vacio } from '../../../components/Ui';
import { Paginacion } from '../../../components/Paginacion';
import { fechaHora } from '../../../lib/formato';
import { ESTILO_MOVIMIENTO } from '../constantes';
import type { InfoPaginacion, Movimiento } from '../../../lib/tipos';

const COLUMNAS = [
  { titulo: 'Fecha', derecha: false },
  { titulo: 'Tipo', derecha: false },
  { titulo: 'Articulo', derecha: false },
  { titulo: 'Cantidad', derecha: true },
  { titulo: 'Anterior', derecha: true },
  { titulo: 'Resultante', derecha: true },
  { titulo: 'Motivo', derecha: false },
  { titulo: 'Registrado por', derecha: false }
];

const signo = (tipo: Movimiento['tipo']) => {
  if (tipo === 'Salida') return '-';
  if (tipo === 'Entrada') return '+';
  return '';
};

export const TablaMovimientos = ({ movimientos, info, alCambiarPagina, alCambiarLimite }: {
  movimientos: Movimiento[] | null;
  info: InfoPaginacion | null;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite: (limite: number) => void;
}) => (
  <section className="panel overflow-hidden">
    {!movimientos && <Cargando texto="Consultando movimientos" />}

    {movimientos && movimientos.length === 0 && (
      <Vacio icono={TrendingUp} texto="No se registraron movimientos con los criterios aplicados" />
    )}

    {movimientos && movimientos.length > 0 && (
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              {COLUMNAS.map(({ titulo, derecha }) => (
                <th key={titulo} className={derecha ? 'text-right' : undefined}>{titulo}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movimientos.map((movimiento) => (
              <tr key={movimiento.id}>
                <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
                  {fechaHora(movimiento.fecha)}
                </td>
                <td><Etiqueta texto={movimiento.tipo} clase={ESTILO_MOVIMIENTO[movimiento.tipo]} /></td>
                <td>
                  <span className="font-mono text-xs text-institucional-700 dark:text-institucional-300">
                    {movimiento.articulo_codigo}
                  </span>
                  <span className="ml-2 text-slate-700 dark:text-slate-200">{movimiento.articulo_nombre}</span>
                </td>
                <td className={`text-right font-bold ${movimiento.tipo === 'Salida' ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {signo(movimiento.tipo)}{movimiento.cantidad}
                </td>
                <td className="text-right text-slate-500 dark:text-slate-300">{movimiento.stock_anterior}</td>
                <td className="text-right font-semibold text-slate-700 dark:text-slate-200">{movimiento.stock_resultante}</td>
                <td className="max-w-xs truncate text-slate-600 dark:text-slate-200">{movimiento.motivo ?? '-'}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{movimiento.usuario_nombre}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {info && <Paginacion info={info} alCambiarPagina={alCambiarPagina} alCambiarLimite={alCambiarLimite} />}
  </section>
);
