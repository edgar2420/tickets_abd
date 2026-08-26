import { Ban, Eye, FileDown, Info, KeyRound, Laptop, Monitor, PencilLine, RotateCcw } from 'lucide-react';
import { Acciones, BotonAccion, Cargando, Etiqueta, Vacio } from '../../../components/Ui';
import { Paginacion } from '../../../components/Paginacion';
import { descargarPdf } from '../../../lib/api';
import { ESTILO_ESTADO } from '../constantes';
import type { Equipo, InfoPaginacion } from '../../../lib/tipos';

const COLUMNAS = [
  { titulo: 'Codigo', derecha: false },
  { titulo: 'Equipo', derecha: false },
  { titulo: 'Asignado a', derecha: false },
  { titulo: 'Sucursal', derecha: false },
  { titulo: 'Sistema operativo', derecha: false },
  { titulo: 'RAM', derecha: true },
  { titulo: 'Direccion IP', derecha: false },
  { titulo: 'AnyDesk', derecha: false },
  { titulo: 'Estado', derecha: false },
  { titulo: 'Acciones', derecha: true }
];

const AnyDesk = ({ equipo }: { equipo: Equipo }) => {
  if (!equipo.anydesk_id) return <span className="text-xs text-slate-400 dark:text-slate-400">-</span>;
  return (
    <span className="font-mono text-xs text-slate-600 dark:text-slate-200">
      {equipo.anydesk_id}
      {equipo.tiene_password && (
        <KeyRound className="ml-1.5 inline h-3 w-3 text-institucional-600 dark:text-institucional-300" />
      )}
    </span>
  );
};

export const Tabla = ({
  equipos, info, puede, alVerFicha, alRevelar, alEditar, alDarDeBaja, alReactivar, alCambiarPagina, alCambiarLimite
}: {
  equipos: Equipo[] | null;
  info: InfoPaginacion | null;
  puede: (...codigos: string[]) => boolean;
  alVerFicha: (equipo: Equipo) => void;
  alRevelar: (equipo: Equipo) => void;
  alEditar: (equipo: Equipo) => void;
  alDarDeBaja: (equipo: Equipo) => void;
  alReactivar: (equipo: Equipo) => void;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite: (limite: number) => void;
}) => (
  <section className="panel overflow-hidden">
    {!equipos && <Cargando texto="Consultando equipos" />}

    {equipos && equipos.length === 0 && (
      <Vacio icono={Monitor} texto="No se encontraron equipos con los criterios aplicados" />
    )}

    {equipos && equipos.length > 0 && (
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
            {equipos.map((equipo) => (
              <tr key={equipo.id}>
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                  {equipo.codigo}
                </td>
                <td>
                  <p className="flex items-center gap-2 font-medium text-slate-800 dark:text-slate-100">
                    {equipo.tipo === 'Laptop'
                      ? <Laptop className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />
                      : <Monitor className="h-3.5 w-3.5 text-slate-400 dark:text-slate-400" />}
                    {equipo.nombre_equipo}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">
                    {[equipo.marca, equipo.modelo].filter(Boolean).join(' ') || equipo.tipo}
                  </p>
                </td>
                <td>
                  <p className="whitespace-nowrap text-slate-700 dark:text-slate-200">
                    {equipo.usuario_nombre ?? 'Sin asignar'}
                  </p>
                  <p className="text-xs text-slate-400 dark:text-slate-400">{equipo.area_nombre ?? '-'}</p>
                </td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{equipo.sucursal_nombre ?? '-'}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">{equipo.sistema_operativo ?? '-'}</td>
                <td className="whitespace-nowrap text-right text-slate-600 dark:text-slate-200">
                  {equipo.ram_gb ? `${equipo.ram_gb} GB` : '-'}
                </td>
                <td className="whitespace-nowrap font-mono text-xs text-slate-600 dark:text-slate-200">
                  {equipo.direccion_ip ?? '-'}
                </td>
                <td className="whitespace-nowrap"><AnyDesk equipo={equipo} /></td>
                <td><Etiqueta texto={equipo.estado} clase={ESTILO_ESTADO[equipo.estado]} /></td>
                <td>
                  <Acciones>
                    {puede('equipos.credenciales') && equipo.tiene_password && (
                      <BotonAccion icono={Eye} rotulo="Ver contraseña remota" alPulsar={() => alRevelar(equipo)} />
                    )}
                    <BotonAccion icono={Info} rotulo="Ver ficha del equipo" alPulsar={() => alVerFicha(equipo)} />
                    <BotonAccion
                      icono={FileDown}
                      rotulo="Ficha en PDF"
                      alPulsar={() => void descargarPdf(`/equipos/${equipo.id}/ficha/pdf`, {}, `equipo-${equipo.codigo}.pdf`)}
                    />
                    {puede('equipos.gestionar') && (
                      <>
                        <BotonAccion icono={PencilLine} rotulo="Editar equipo" alPulsar={() => alEditar(equipo)} />
                        {equipo.activo
                          ? <BotonAccion icono={Ban} rotulo="Dar de baja" tono="peligro" alPulsar={() => alDarDeBaja(equipo)} />
                          : <BotonAccion icono={RotateCcw} rotulo="Reactivar" alPulsar={() => alReactivar(equipo)} />}
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
