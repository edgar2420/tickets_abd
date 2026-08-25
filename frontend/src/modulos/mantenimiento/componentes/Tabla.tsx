import { CalendarClock, ClipboardCheck, History, Ticket as IconoTicket, Wrench } from 'lucide-react';
import { Acciones, BotonAccion, Etiqueta, Vacio } from '../../../components/Ui';
import { fechaCorta } from '../../../lib/formato';
import { ESTILO_SITUACION, type EquipoDelPlan } from '../constantes';

export const Tabla = ({ plan, puedeGestionar, alPlanificar, alRegistrar, alVerHistorial, alGenerarTicket }: {
  plan: EquipoDelPlan[];
  puedeGestionar: boolean;
  alPlanificar: (equipo: EquipoDelPlan) => void;
  alRegistrar: (equipo: EquipoDelPlan) => void;
  alVerHistorial: (equipo: EquipoDelPlan) => void;
  alGenerarTicket: (equipo: EquipoDelPlan) => void;
}) => {
  if (plan.length === 0) {
    return <Vacio icono={Wrench} texto="Ningun equipo tiene una frecuencia de mantenimiento asignada" />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="tabla">
        <thead>
          <tr>
            <th>Equipo</th>
            <th>Ubicacion</th>
            <th>Frecuencia</th>
            <th>Ultimo</th>
            <th>Proximo</th>
            <th>Situacion</th>
            <th>Hechos</th>
            <th className="text-right">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {plan.map((equipo) => (
            <tr key={equipo.id}>
              <td className="whitespace-nowrap">
                <p className="font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                  {equipo.codigo}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{equipo.nombre_equipo}</p>
              </td>
              <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">
                {equipo.ubicacion ?? equipo.sucursal_nombre ?? '-'}
              </td>
              <td className="whitespace-nowrap text-slate-600 dark:text-slate-200">
                {equipo.frecuencia_mantenimiento}
              </td>
              <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
                {equipo.ultimo_mantenimiento ? fechaCorta(equipo.ultimo_mantenimiento) : 'Nunca'}
              </td>
              <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-300">
                {equipo.proximo_mantenimiento ? fechaCorta(equipo.proximo_mantenimiento) : 'Sin calcular'}
              </td>
              <td><Etiqueta texto={equipo.situacion} clase={ESTILO_SITUACION[equipo.situacion]} /></td>
              <td className="text-center text-slate-600 dark:text-slate-200">{equipo.realizados}</td>
              <td>
                <Acciones>
                  <BotonAccion
                    icono={History}
                    rotulo="Ver el historial"
                    alPulsar={() => alVerHistorial(equipo)}
                  />
                  {puedeGestionar && (
                    <>
                      <BotonAccion
                        icono={IconoTicket}
                        rotulo="Generar el ticket de mantenimiento"
                        alPulsar={() => alGenerarTicket(equipo)}
                      />
                      <BotonAccion
                        icono={ClipboardCheck}
                        rotulo="Registrar el mantenimiento realizado"
                        tono="exito"
                        alPulsar={() => alRegistrar(equipo)}
                      />
                      <BotonAccion
                        icono={CalendarClock}
                        rotulo="Cambiar la frecuencia"
                        alPulsar={() => alPlanificar(equipo)}
                      />
                    </>
                  )}
                </Acciones>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
