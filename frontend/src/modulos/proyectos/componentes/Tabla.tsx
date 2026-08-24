import { BadgeCheck, ClipboardCheck, Info, Lightbulb, TrendingUp, XCircle } from 'lucide-react';
import { Acciones, BotonAccion, Cargando, Etiqueta, Vacio } from '../../../components/Ui';
import { Paginacion } from '../../../components/Paginacion';
import { estiloPrioridad } from '../../../lib/formato';
import { ESTILO_ESTADO, codigoProyecto, enSituacion, type TipoAccionProyecto } from '../constantes';
import type { EstadoProyecto, InfoPaginacion, SolicitudProyecto } from '../../../lib/tipos';

const COLUMNAS = ['Codigo', 'Peticion', 'Tipo', 'Solicitante', 'Area', 'Urgencia', 'Estado', 'Situacion'];

interface Disponible {
  tipo: TipoAccionProyecto;
  rotulo: string;
  icono: typeof Info;
  tono: 'neutro' | 'exito' | 'peligro';
  permisos: string[];
  estados: EstadoProyecto[];
}

const CATALOGO: Disponible[] = [
  {
    tipo: 'evaluar',
    rotulo: 'Evaluar tecnicamente',
    icono: ClipboardCheck,
    tono: 'neutro',
    permisos: ['proyectos.evaluar'],
    estados: ['Recibida', 'En evaluacion']
  },
  {
    tipo: 'aprobar',
    rotulo: 'Aprobar e incorporar',
    icono: BadgeCheck,
    tono: 'exito',
    permisos: ['proyectos.gestionar'],
    estados: ['En evaluacion']
  },
  {
    tipo: 'avance',
    rotulo: 'Registrar avance',
    icono: TrendingUp,
    tono: 'neutro',
    permisos: ['proyectos.gestionar'],
    estados: ['Aprobada', 'En desarrollo', 'En pruebas']
  },
  {
    tipo: 'rechazar',
    rotulo: 'No aprobar',
    icono: XCircle,
    tono: 'peligro',
    permisos: ['proyectos.evaluar', 'proyectos.gestionar'],
    estados: ['Recibida', 'En evaluacion', 'Aprobada']
  }
];

const Avance = ({ proyecto }: { proyecto: SolicitudProyecto }) => {
  if (!['En desarrollo', 'En pruebas', 'Implementada'].includes(proyecto.estado)) return null;
  return (
    <div className="mt-1 h-1.5 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-noche-700">
      <div className="h-full rounded-full bg-institucional-600" style={{ width: `${proyecto.avance}%` }} />
    </div>
  );
};

export const Tabla = ({ proyectos, info, puede, alAbrirFicha, alAccionar, alCambiarPagina, alCambiarLimite }: {
  proyectos: SolicitudProyecto[] | null;
  info: InfoPaginacion | null;
  puede: (...codigos: string[]) => boolean;
  alAbrirFicha: (proyecto: SolicitudProyecto) => void;
  alAccionar: (proyecto: SolicitudProyecto, tipo: TipoAccionProyecto) => void;
  alCambiarPagina: (pagina: number) => void;
  alCambiarLimite: (limite: number) => void;
}) => (
  <section className="panel overflow-hidden">
    {!proyectos && <Cargando texto="Consultando peticiones" />}

    {proyectos && proyectos.length === 0 && (
      <Vacio
        icono={Lightbulb}
        texto="Todavia no hay peticiones de proyecto. Use el boton de arriba para proponer una mejora o una idea de software."
      />
    )}

    {proyectos && proyectos.length > 0 && (
      <div className="overflow-x-auto">
        <table className="tabla">
          <thead>
            <tr>
              {COLUMNAS.map((columna) => <th key={columna}>{columna}</th>)}
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {proyectos.map((proyecto) => (
              <tr
                key={proyecto.id}
                onClick={() => alAbrirFicha(proyecto)}
                className="cursor-pointer transition hover:bg-institucional-50/70 dark:hover:bg-noche-700/60"
              >
                <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                  {codigoProyecto(proyecto.id)}
                </td>
                <td>
                  <p className="font-medium text-slate-800 dark:text-slate-100">{proyecto.titulo}</p>
                  <Avance proyecto={proyecto} />
                </td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{proyecto.tipo}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{proyecto.solicitante_nombre}</td>
                <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{proyecto.area_nombre}</td>
                <td><Etiqueta texto={proyecto.urgencia} clase={estiloPrioridad[proyecto.urgencia]} /></td>
                <td><Etiqueta texto={proyecto.estado} clase={ESTILO_ESTADO[proyecto.estado]} /></td>
                <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                  {enSituacion(proyecto.estado)}
                </td>
                <td onClick={(evento) => evento.stopPropagation()}>
                  <Acciones>
                    <BotonAccion icono={Info} rotulo="Ver la peticion" alPulsar={() => alAbrirFicha(proyecto)} />
                    {CATALOGO
                      .filter((accion) => accion.estados.includes(proyecto.estado) && puede(...accion.permisos))
                      .map((accion) => (
                        <BotonAccion
                          key={accion.tipo}
                          icono={accion.icono}
                          rotulo={accion.rotulo}
                          tono={accion.tono}
                          alPulsar={() => alAccionar(proyecto, accion.tipo)}
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
