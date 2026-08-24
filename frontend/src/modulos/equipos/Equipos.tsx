import { useState, type FormEvent } from 'react';
import { Ban, Cpu, FileDown, KeyRound, Monitor, Network, PlusCircle, Users, Wrench } from 'lucide-react';
import { Alerta, EncabezadoPagina, Indicador, Modal } from '../../components/Ui';
import { usarConfirmacion } from '../../components/Confirmacion';
import { usarAuth } from '../../context/AuthContext';
import { descargarPdf } from '../../lib/api';
import { usarEquipos } from './usarEquipos';
import { Filtros } from './componentes/Filtros';
import { Tabla } from './componentes/Tabla';
import { Formulario } from './componentes/Formulario';
import { Ficha } from './componentes/Ficha';
import { Credencial } from './componentes/Credencial';
import type { Equipo } from '../../lib/tipos';

export const Equipos = () => {
  const { puede } = usarAuth();
  const { confirmar, dialogo } = usarConfirmacion();
  const [modalAbierto, setModalAbierto] = useState(false);
  const equipos = usarEquipos(puede);

  const nuevo = () => {
    equipos.abrirNuevo();
    setModalAbierto(true);
  };

  const editar = (equipo: Equipo) => {
    equipos.setFicha(null);
    equipos.abrirEdicion(equipo);
    setModalAbierto(true);
  };

  const revelar = (equipo: Equipo) => {
    equipos.setFicha(null);
    void equipos.revelarCredencial(equipo);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (await equipos.guardar()) setModalAbierto(false);
  };

  const darDeBaja = (equipo: Equipo) => confirmar({
    titulo: 'Dar de baja el equipo',
    mensaje: (
      <>
        <strong>{equipo.codigo} - {equipo.nombre_equipo}</strong> pasara al estado De baja y dejara de
        figurar entre los equipos activos. Su ficha y su historial se conservan.
      </>
    ),
    textoConfirmar: 'Dar de baja',
    icono: Ban,
    alConfirmar: () => equipos.darDeBaja(equipo)
  });

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Equipos de la empresa"
        descripcion="Parque informatico, asignacion por usuario y datos de acceso remoto"
        icono={Monitor}
      >
        <button
          type="button"
          className="boton-secundario"
          onClick={() => void descargarPdf('/equipos/reporte/pdf', {}, 'parque-de-equipos.pdf')}
        >
          <FileDown className="h-4 w-4" />
          Reporte PDF
        </button>
        {puede('equipos.gestionar') && (
          <button type="button" className="boton-primario" onClick={nuevo}>
            <PlusCircle className="h-4 w-4" />
            Nuevo equipo
          </button>
        )}
      </EncabezadoPagina>

      {equipos.error && <Alerta mensaje={equipos.error} />}

      {equipos.resumen && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador etiqueta="Equipos activos" valor={equipos.resumen.total} icono={Monitor} />
          <Indicador etiqueta="Operativos" valor={equipos.resumen.operativos} icono={Cpu} tono="exito" />
          <Indicador etiqueta="En reparacion" valor={equipos.resumen.en_reparacion} icono={Wrench} tono="advertencia" />
          <Indicador etiqueta="Sin asignar" valor={equipos.resumen.sin_asignar} icono={Users} tono="info" />
          <Indicador etiqueta="Con acceso remoto" valor={equipos.resumen.con_acceso_remoto} icono={Network} tono="neutro" />
        </div>
      )}

      <Filtros filtros={equipos.filtros} sucursales={equipos.sucursales} alCambiar={equipos.setFiltros} />

      <Tabla
        equipos={equipos.equipos}
        info={equipos.info}
        puede={puede}
        alVerFicha={equipos.setFicha}
        alRevelar={(equipo) => void equipos.revelarCredencial(equipo)}
        alEditar={editar}
        alDarDeBaja={darDeBaja}
        alReactivar={(equipo) => void equipos.reactivar(equipo)}
        alCambiarPagina={equipos.setPagina}
        alCambiarLimite={equipos.setLimite}
      />

      <Modal
        titulo={equipos.formulario.id ? 'Editar equipo' : 'Registrar equipo'}
        icono={Monitor}
        abierto={modalAbierto}
        alCerrar={() => setModalAbierto(false)}
        ancho="max-w-6xl"
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => setModalAbierto(false)}>Cancelar</button>
            <button type="submit" form="form-equipo" className="boton-primario" disabled={equipos.guardando}>
              Guardar equipo
            </button>
          </>
        }
      >
        <Formulario
          formulario={equipos.formulario}
          setFormulario={equipos.setFormulario}
          usuarios={equipos.usuarios}
          areas={equipos.areas}
          sucursales={equipos.sucursales}
          alEnviar={guardar}
        />
      </Modal>

      <Modal
        titulo="Ficha del equipo"
        icono={Monitor}
        abierto={equipos.ficha !== null}
        alCerrar={() => equipos.setFicha(null)}
        ancho="max-w-5xl"
        acciones={
          <button type="button" className="boton-primario" onClick={() => equipos.setFicha(null)}>Cerrar</button>
        }
      >
        {equipos.ficha && (
          <Ficha ficha={equipos.ficha} puede={puede} alRevelar={revelar} alEditar={editar} />
        )}
      </Modal>

      <Modal
        titulo="Acceso remoto del equipo"
        icono={KeyRound}
        abierto={equipos.credencial !== null}
        alCerrar={() => equipos.setCredencial(null)}
        ancho="max-w-2xl"
        acciones={
          <button type="button" className="boton-secundario" onClick={() => equipos.setCredencial(null)}>Cerrar</button>
        }
      >
        {equipos.credencial && <Credencial credencial={equipos.credencial} />}
      </Modal>

      {dialogo}
    </div>
  );
};
