import {
  Ban, FileDown, Package, PackageMinus, PackagePlus, PencilLine, RotateCcw, Wrench
} from 'lucide-react';
import { Acciones, BotonAccion, Cargando, Etiqueta, Vacio } from '../../../components/Ui';
import { Paginacion } from '../../../components/Paginacion';
import { descargarPdf } from '../../../lib/api';
import { ESTILO_ESTADO } from '../constantes';
import type { Articulo, InfoPaginacion, TipoMovimiento } from '../../../lib/tipos';

const COLUMNAS = [
  { titulo: 'Codigo', derecha: false },
  { titulo: 'Articulo', derecha: false },
  { titulo: 'Tipo', derecha: false },
  { titulo: 'Ubicacion', derecha: false },
  { titulo: 'Minimo', derecha: true },
  { titulo: 'Stock', derecha: true },
  { titulo: 'Estado', derecha: false },
  { titulo: 'Acciones', derecha: true }
];

const Aviso = ({ articulo }: { articulo: Articulo }) => {
  if (!articulo.activo) return null;
  if (articulo.stock_actual === 0) {
    return <span className="mt-1 block text-xs font-semibold text-rose-600 dark:text-rose-400">Agotado</span>;
  }
  if (articulo.bajo_minimo) {
    return <span className="mt-1 block text-xs font-semibold text-amber-600 dark:text-amber-400">Bajo minimo</span>;
  }
  return null;
};

export const TablaArticulos = ({
  articulos, info, puede, alMover, alCambiarSituacion, alEditar, alDesactivar, alActivar,
  alCambiarPagina, alCambiarLimite
}: {
  articulos: Articulo[] | null;
  info: InfoPaginacion | null;
  puede: (...codigos: string[]) => boolean;
  alMover: (articulo: Articulo, tipo: TipoMovimiento) => void;
  alCambiarSituacion: (articulo: Articulo) => void;
  alEditar: (articulo: Articulo) => void;
  alDesactivar: (articulo: Articulo) => void;
  alActivar: (articulo: Articulo) => void;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite: (limite: number) => void;
}) => (
  <section className="panel overflow-hidden">
    {!articulos && <Cargando texto="Consultando articulos" />}

    {articulos && articulos.length === 0 && (
      <Vacio icono={Package} texto="No se encontraron articulos con los criterios aplicados" />
    )}

    {articulos && articulos.length > 0 && (
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
            {articulos.map((articulo) => (
              <tr key={articulo.id}>
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                  {articulo.codigo}
                </td>
                <td>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{articulo.nombre}</p>
                  {articulo.descripcion && (
                    <p className="text-xs text-slate-400 dark:text-slate-400">{articulo.descripcion}</p>
                  )}
                </td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{articulo.tipo}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{articulo.ubicacion ?? '-'}</td>
                <td className="text-right text-slate-500 dark:text-slate-300">{articulo.stock_minimo}</td>
                <td className={`text-right font-bold ${articulo.bajo_minimo ? 'text-rose-600' : 'text-emerald-700'}`}>
                  {articulo.stock_actual}
                  <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-400">{articulo.unidad}</span>
                </td>
                <td>
                  <Etiqueta texto={articulo.estado} clase={ESTILO_ESTADO[articulo.estado]} />
                  <Aviso articulo={articulo} />
                </td>
                <td>
                  <Acciones>
                    {puede('inventario.movimientos') && articulo.activo && (
                      <>
                        <BotonAccion
                          icono={PackagePlus}
                          rotulo="Registrar entrada"
                          tono="exito"
                          alPulsar={() => alMover(articulo, 'Entrada')}
                        />
                        <BotonAccion
                          icono={PackageMinus}
                          rotulo="Registrar salida"
                          tono="peligro"
                          deshabilitado={articulo.stock_actual === 0}
                          alPulsar={() => alMover(articulo, 'Salida')}
                        />
                      </>
                    )}
                    <BotonAccion
                      icono={FileDown}
                      rotulo="Kardex en PDF"
                      alPulsar={() => void descargarPdf(
                        `/inventario/articulos/${articulo.id}/kardex/pdf`, {}, `kardex-${articulo.codigo}.pdf`
                      )}
                    />
                    {puede('inventario.articulos') && (
                      <>
                        <BotonAccion icono={Wrench} rotulo="Cambiar situacion" alPulsar={() => alCambiarSituacion(articulo)} />
                        <BotonAccion icono={PencilLine} rotulo="Editar articulo" alPulsar={() => alEditar(articulo)} />
                        {articulo.activo
                          ? <BotonAccion icono={Ban} rotulo="Desactivar" tono="peligro" alPulsar={() => alDesactivar(articulo)} />
                          : <BotonAccion icono={RotateCcw} rotulo="Reactivar" alPulsar={() => alActivar(articulo)} />}
                      </>
                    )}
                  </Acciones>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}

    {info && <Paginacion info={info} alCambiarPagina={alCambiarPagina} alCambiarLimite={alCambiarLimite} />}
  </section>
);
