import type { FormEvent } from 'react';
import { ClipboardCheck, FileDown, Info, PlusCircle, ShoppingCart } from 'lucide-react';
import { Alerta, EncabezadoPagina, Modal } from '../../components/Ui';
import { descargarPdf } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { usarCompras } from './usarCompras';
import { ACCIONES_AMPLIAS, TITULOS_ACCION, codigoCompra } from './constantes';
import { Indicadores } from './componentes/Indicadores';
import { Filtros } from './componentes/Filtros';
import { Tabla } from './componentes/Tabla';
import { Ficha } from './componentes/Ficha';
import { FormularioSolicitud } from './componentes/FormularioSolicitud';
import { FormularioAccion } from './componentes/FormularioAccion';
import { useState } from 'react';

export const Compras = () => {
  const { puede, usuario } = usarAuth();
  const soloAprueba = puede('compras.aprobar') && !puede('compras.revisar');
  const [modalNueva, setModalNueva] = useState(false);
  const compras = usarCompras();

  const enviarSolicitud = async (evento: FormEvent) => {
    evento.preventDefault();
    if (await compras.registrar()) setModalNueva(false);
  };

  const enviarAccion = (evento: FormEvent) => {
    evento.preventDefault();
    void compras.ejecutarAccion();
  };

  const anchoAccion = compras.accion && ACCIONES_AMPLIAS.includes(compras.accion.tipo) ? 'max-w-5xl' : 'max-w-xl';

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Solicitudes de compra"
        descripcion="Pedidos de equipos con revision tecnica de TI y aprobacion de Gerencia"
        icono={ShoppingCart}
      >
        {puede('compras.ver_todas') && (
          <button
            type="button"
            className="boton-secundario"
            onClick={() => void descargarPdf('/compras/reporte/pdf', {}, 'solicitudes-de-compra.pdf')}
          >
            <FileDown className="h-4 w-4" />
            Reporte PDF
          </button>
        )}
        {puede('compras.solicitar') && (
          <button type="button" className="boton-primario" onClick={() => setModalNueva(true)}>
            <PlusCircle className="h-4 w-4" />
            Solicitar equipo
          </button>
        )}
      </EncabezadoPagina>

      {compras.error && <Alerta mensaje={compras.error} />}

      {compras.resumen && <Indicadores resumen={compras.resumen} soloAprueba={soloAprueba} />}

      <Filtros filtros={compras.filtros} sucursales={compras.sucursales} alCambiar={compras.setFiltros} />

      <Tabla
        solicitudes={compras.solicitudes}
        info={compras.info}
        puede={puede}
        alAbrirFicha={compras.setFicha}
        alAccionar={compras.abrirAccion}
        alCambiarPagina={compras.setPagina}
        alCambiarLimite={compras.setLimite}
      />

      <Modal
        titulo="Solicitar un equipo"
        icono={ShoppingCart}
        abierto={modalNueva}
        alCerrar={() => setModalNueva(false)}
        ancho="max-w-3xl"
      >
        <FormularioSolicitud
          nueva={compras.nueva}
          setNueva={compras.setNueva}
          usuario={usuario}
          guardando={compras.guardando}
          alEnviar={enviarSolicitud}
          alCancelar={() => setModalNueva(false)}
        />
      </Modal>

      <Modal
        titulo={compras.ficha ? `Solicitud ${codigoCompra(compras.ficha.id)}` : 'Solicitud'}
        icono={Info}
        abierto={compras.ficha !== null}
        alCerrar={() => compras.setFicha(null)}
        ancho="max-w-6xl"
      >
        {compras.ficha && <Ficha ficha={compras.ficha} alCerrar={() => compras.setFicha(null)} />}
      </Modal>

      <Modal
        titulo={compras.accion ? TITULOS_ACCION[compras.accion.tipo] : ''}
        icono={ClipboardCheck}
        abierto={compras.accion !== null}
        alCerrar={() => compras.setAccion(null)}
        ancho={anchoAccion}
      >
        {compras.accion && (
          <FormularioAccion
            accion={compras.accion}
            datos={compras.datosAccion}
            setDatos={compras.setDatosAccion}
            equipos={compras.equipos}
            guardando={compras.guardando}
            alEnviar={enviarAccion}
            alCancelar={() => compras.setAccion(null)}
          />
        )}
      </Modal>
    </div>
  );
};
