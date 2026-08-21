import { Info, ShoppingCart } from 'lucide-react';
import { Acciones, BotonAccion, Cargando, Etiqueta, Vacio } from '../../../components/Ui';
import { Paginacion } from '../../../components/Paginacion';
import { estiloPrioridad } from '../../../lib/formato';
import { ESTILO_ESTADO, codigoCompra, type TipoAccion } from '../constantes';
import { enManosDe } from '../recorrido';
import { accionesDisponibles } from '../acciones';
import type { InfoPaginacion, SolicitudCompra } from '../../../lib/tipos';

const COLUMNAS = ['Codigo', 'Solicitud', 'Solicitante', 'Sucursal', 'Cant.', 'Prioridad', 'Estado', 'En manos de'];

export const Tabla = ({ solicitudes, info, puede, alAbrirFicha, alAccionar, alCambiarPagina, alCambiarLimite }: {
  solicitudes: SolicitudCompra[] | null;
  info: InfoPaginacion | null;
  puede: (...codigos: string[]) => boolean;
  alAbrirFicha: (solicitud: SolicitudCompra) => void;
  alAccionar: (solicitud: SolicitudCompra, tipo: TipoAccion) => void;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite: (limite: number) => void;
}) => (
  <section className="panel overflow-hidden">
    {!solicitudes && <Cargando texto="Consultando solicitudes" />}

    {solicitudes && solicitudes.length === 0 && (
      <Vacio icono={ShoppingCart} texto="No hay solicitudes de compra con los criterios aplicados" />
    )}

    {solicitudes && solicitudes.length > 0 && (
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              {COLUMNAS.map((columna) => (
                <th key={columna} className={columna === 'Cant.' ? 'text-right' : undefined}>{columna}</th>
              ))}
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {solicitudes.map((solicitud) => (
              <tr
                key={solicitud.id}
                onClick={() => alAbrirFicha(solicitud)}
                className="cursor-pointer transition hover:bg-institucional-50/70 dark:hover:bg-noche-700/60"
              >
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                  {codigoCompra(solicitud.id)}
                </td>
                <td>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{solicitud.titulo}</p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">{solicitud.tipo_equipo}</p>
                </td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{solicitud.solicitante_nombre}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{solicitud.sucursal_nombre ?? '-'}</td>
                <td className="text-right text-slate-600 dark:text-slate-300">{solicitud.cantidad}</td>
                <td><Etiqueta texto={solicitud.prioridad} clase={estiloPrioridad[solicitud.prioridad]} /></td>
                <td><Etiqueta texto={solicitud.estado} clase={ESTILO_ESTADO[solicitud.estado]} /></td>
                <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {enManosDe(solicitud.estado)}
                </td>
                <td onClick={(evento) => evento.stopPropagation()}>
                  <Acciones>
                    <BotonAccion icono={Info} rotulo="Ver ficha" alPulsar={() => alAbrirFicha(solicitud)} />
                    {accionesDisponibles(solicitud.estado, puede).map((accion) => (
                      <BotonAccion
                        key={accion.tipo}
                        icono={accion.icono}
                        rotulo={accion.rotulo}
                        tono={accion.tono}
                        alPulsar={() => alAccionar(solicitud, accion.tipo)}
                      />
                    ))}
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
