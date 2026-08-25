import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle, CalendarClock, CheckCircle2, Clock, Filter, PlusCircle, RefreshCcw, Search, Wrench
} from 'lucide-react';
import { usarAuth } from '../../context/AuthContext';
import { Alerta, Cargando, EncabezadoPagina, Indicador, Panel } from '../../components/Ui';
import { usarMantenimiento } from './usarMantenimiento';
import { Tabla } from './componentes/Tabla';
import { ModalHistorial, ModalPlan, ModalRegistro } from './componentes/Modales';
import { FILTROS_VACIOS, FRECUENCIAS, SITUACIONES } from './constantes';

export const Mantenimiento = () => {
  const { puede } = usarAuth();
  const navegar = useNavigate();
  const m = usarMantenimiento();
  const puedeGestionar = puede('mantenimiento.gestionar');

  const cambiar = (campo: keyof typeof FILTROS_VACIOS, valor: string) =>
    m.setFiltros((f) => ({ ...f, [campo]: valor }));

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Mantenimiento preventivo"
        descripcion="Plan por equipo, con aviso de lo que esta vencido y por vencer"
        icono={Wrench}
      >
        <button type="button" className="boton-secundario" onClick={() => void m.cargar()}>
          <RefreshCcw className="h-4 w-4" />
          Actualizar
        </button>
        {puedeGestionar && (
          <button
            type="button"
            className="boton-primario"
            onClick={() => m.setEnPlan({ id: 0 } as never)}
          >
            <PlusCircle className="h-4 w-4" />
            Incorporar equipo
          </button>
        )}
      </EncabezadoPagina>

      {m.resumen && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <Indicador etiqueta="Vencidos" valor={m.resumen.vencidos} icono={AlertTriangle} tono="critico" />
          <Indicador etiqueta="Por vencer" valor={m.resumen.por_vencer} icono={Clock} tono="advertencia" />
          <Indicador etiqueta="Al dia" valor={m.resumen.al_dia} icono={CheckCircle2} tono="exito" />
          <Indicador etiqueta="Sin registro" valor={m.resumen.sin_registro} icono={CalendarClock} tono="info" />
          <Indicador etiqueta="Equipos sin plan" valor={m.resumen.sin_plan} icono={Wrench} tono="neutro" />
        </div>
      )}

      <Panel
        titulo="Filtros"
        icono={Filter}
        acciones={
          <button type="button" className="boton-secundario" onClick={() => m.setFiltros(FILTROS_VACIOS)}>
            Limpiar
          </button>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="etiqueta">Situacion</label>
            <select className="campo" value={m.filtros.situacion} onChange={(e) => cambiar('situacion', e.target.value)}>
              <option value="">Todas</option>
              {SITUACIONES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Frecuencia</label>
            <select className="campo" value={m.filtros.frecuencia} onChange={(e) => cambiar('frecuencia', e.target.value)}>
              <option value="">Todas</option>
              {FRECUENCIAS.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Busqueda</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                className="campo pl-9"
                placeholder="Codigo o nombre del equipo"
                value={m.filtros.busqueda}
                onChange={(e) => cambiar('busqueda', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Panel>

      {m.error && <Alerta mensaje={m.error} />}

      <section className="panel overflow-hidden">
        {!m.plan ? (
          <Cargando texto="Consultando el plan de mantenimiento" />
        ) : (
          <Tabla
            plan={m.plan}
            puedeGestionar={puedeGestionar}
            alPlanificar={m.setEnPlan}
            alRegistrar={m.setEnRegistro}
            alVerHistorial={m.setHistorialDe}
            alGenerarTicket={(equipo) => void m.generarTicket(equipo.id)}
          />
        )}
      </section>

      <ModalPlan
        equipo={m.enPlan}
        equipos={m.equipos}
        guardando={m.guardando}
        alCerrar={() => m.setEnPlan(null)}
        alGuardar={(id, cuerpo) => void m.guardarPlan(id, cuerpo).then((ok) => ok && m.setEnPlan(null))}
      />
      <ModalRegistro
        equipo={m.enRegistro}
        guardando={m.guardando}
        alCerrar={() => m.setEnRegistro(null)}
        alGuardar={(id, cuerpo) => void m.registrar(id, cuerpo).then((ok) => ok && m.setEnRegistro(null))}
      />
      <ModalHistorial
        equipo={m.historialDe}
        historial={m.historial}
        alCerrar={() => m.setHistorialDe(null)}
      />

      <p className="text-xs text-slate-400 dark:text-slate-500">
        El ticket generado desde aqui queda registrado con el servicio Mantenimiento.
        <button
          type="button"
          className="ml-1 font-semibold text-institucional-700 underline dark:text-institucional-300"
          onClick={() => navegar('/tickets?servicio=Mantenimiento')}
        >
          Ver los tickets de mantenimiento
        </button>
      </p>
    </div>
  );
};
