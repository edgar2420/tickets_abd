import { useState, type FormEvent } from 'react';
import {
  BadgeCheck, ClipboardCheck, FileDown, Filter, Info, Lightbulb, PlusCircle, Rocket, XCircle
} from 'lucide-react';
import { Alerta, EncabezadoPagina, Indicador, Modal, Panel } from '../../components/Ui';
import { descargarPdf } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { usarProyectos } from './usarProyectos';
import { ESTADOS, TIPOS, TITULOS_ACCION, codigoProyecto } from './constantes';
import { Tabla } from './componentes/Tabla';
import { Ficha } from './componentes/Ficha';
import { FormularioAccion, FormularioPeticion } from './componentes/Formularios';

export const Proyectos = () => {
  const { puede } = usarAuth();
  const puedeGestionar = puede('proyectos.gestionar');
  const [modalNueva, setModalNueva] = useState(false);
  const proyectos = usarProyectos(puedeGestionar);

  const enviarPeticion = async (evento: FormEvent) => {
    evento.preventDefault();
    if (await proyectos.registrar()) setModalNueva(false);
  };

  const enviarAccion = (evento: FormEvent) => {
    evento.preventDefault();
    void proyectos.ejecutarAccion();
  };

  const anchoAccion = proyectos.accion && ['evaluar', 'aprobar'].includes(proyectos.accion.tipo)
    ? 'max-w-5xl'
    : 'max-w-xl';

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Peticiones de proyecto"
        descripcion="Mejoras al sistema e ideas de software propuestas por las areas"
        icono={Lightbulb}
      >
        {puede('proyectos.ver_todas') && (
          <button
            type="button"
            className="boton-secundario"
            onClick={() => void descargarPdf('/proyectos/reporte/pdf', {}, 'peticiones-de-proyecto.pdf')}
          >
            <FileDown className="h-4 w-4" />
            Reporte PDF
          </button>
        )}
        {puede('proyectos.solicitar') && (
          <button type="button" className="boton-primario" onClick={() => setModalNueva(true)}>
            <PlusCircle className="h-4 w-4" />
            Proponer una mejora
          </button>
        )}
      </EncabezadoPagina>

      {proyectos.error && <Alerta mensaje={proyectos.error} />}

      {proyectos.resumen && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador etiqueta="Peticiones" valor={proyectos.resumen.total} icono={Lightbulb} />
          <Indicador etiqueta="Por evaluar" valor={proyectos.resumen.recibidas} icono={ClipboardCheck} tono="info" />
          <Indicador etiqueta="Evaluadas" valor={proyectos.resumen.en_evaluacion} icono={BadgeCheck} tono="advertencia" />
          <Indicador etiqueta="En curso" valor={proyectos.resumen.en_curso} icono={Rocket} tono="advertencia" />
          <Indicador
            etiqueta="Implementadas"
            valor={proyectos.resumen.implementadas}
            icono={BadgeCheck}
            tono="exito"
            pie={`${proyectos.resumen.rechazadas} no aprobadas`}
          />
        </div>
      )}

      <Panel titulo="Filtros" icono={Filter}>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="etiqueta">Estado</label>
            <select
              className="campo"
              value={proyectos.filtros.estado}
              onChange={(evento) => proyectos.setFiltros({ estado: evento.target.value })}
            >
              <option value="">Todos</option>
              {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Tipo</label>
            <select
              className="campo"
              value={proyectos.filtros.tipo}
              onChange={(evento) => proyectos.setFiltros({ tipo: evento.target.value })}
            >
              <option value="">Todos</option>
              {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Sucursal</label>
            <select
              className="campo"
              value={proyectos.filtros.sucursal_id}
              onChange={(evento) => proyectos.setFiltros({ sucursal_id: evento.target.value })}
            >
              <option value="">Todas</option>
              {proyectos.sucursales.map((sucursal) => (
                <option key={sucursal.id} value={sucursal.id}>{sucursal.nombre}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="etiqueta">Busqueda</label>
            <input
              className="campo"
              placeholder="Titulo o problema"
              value={proyectos.filtros.busqueda}
              onChange={(evento) => proyectos.setFiltros({ busqueda: evento.target.value })}
            />
          </div>
        </div>
      </Panel>

      <Tabla
        proyectos={proyectos.proyectos}
        info={proyectos.info}
        puede={puede}
        alAbrirFicha={proyectos.setFicha}
        alAccionar={proyectos.abrirAccion}
        alCambiarPagina={proyectos.setPagina}
        alCambiarLimite={proyectos.setLimite}
      />

      <Modal
        titulo="Proponer una mejora o una idea de software"
        icono={Lightbulb}
        abierto={modalNueva}
        alCerrar={() => setModalNueva(false)}
        ancho="max-w-6xl"
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => setModalNueva(false)}>Cancelar</button>
            <button type="submit" form="form-proyecto" className="boton-primario" disabled={proyectos.guardando}>
              Enviar la peticion
            </button>
          </>
        }
      >
        <FormularioPeticion
          nueva={proyectos.nueva}
          setNueva={proyectos.setNueva}
          alEnviar={enviarPeticion}
        />
      </Modal>

      <Modal
        titulo={proyectos.ficha ? `Peticion ${codigoProyecto(proyectos.ficha.id)}` : 'Peticion'}
        icono={Info}
        abierto={proyectos.ficha !== null}
        alCerrar={() => proyectos.setFicha(null)}
        ancho="max-w-6xl"
        acciones={
          <button type="button" className="boton-primario" onClick={() => proyectos.setFicha(null)}>Cerrar</button>
        }
      >
        {proyectos.ficha && <Ficha ficha={proyectos.ficha} />}
      </Modal>

      <Modal
        titulo={proyectos.accion ? TITULOS_ACCION[proyectos.accion.tipo] : ''}
        icono={proyectos.accion?.tipo === 'rechazar' ? XCircle : ClipboardCheck}
        abierto={proyectos.accion !== null}
        alCerrar={() => proyectos.setAccion(null)}
        ancho={anchoAccion}
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => proyectos.setAccion(null)}>Cancelar</button>
            <button
              type="submit"
              form="form-accion-proyecto"
              className={proyectos.accion?.tipo === 'rechazar' ? 'boton-peligro' : 'boton-primario'}
              disabled={proyectos.guardando}
            >
              Confirmar
            </button>
          </>
        }
      >
        {proyectos.accion && (
          <FormularioAccion
            accion={proyectos.accion}
            datos={proyectos.datosAccion}
            setDatos={proyectos.setDatosAccion}
            responsables={proyectos.responsables}
            alEnviar={enviarAccion}
          />
        )}
      </Modal>
    </div>
  );
};
