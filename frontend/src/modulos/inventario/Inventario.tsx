import { useState, type FormEvent } from 'react';
import {
  AlertTriangle, Ban, Boxes, FileDown, Package, PackageMinus, PackagePlus, PlusCircle,
  TrendingDown, TrendingUp, Wrench
} from 'lucide-react';
import { Alerta, EncabezadoPagina, Indicador, Modal } from '../../components/Ui';
import { usarConfirmacion } from '../../components/Confirmacion';
import { usarAuth } from '../../context/AuthContext';
import { descargarPdf } from '../../lib/api';
import { usarInventario } from './usarInventario';
import type { Vista } from './constantes';
import { FiltrosArticulos, FiltrosKardex } from './componentes/Filtros';
import { TablaArticulos } from './componentes/TablaArticulos';
import { TablaMovimientos } from './componentes/TablaMovimientos';
import { FormularioArticulo, FormularioMovimiento, FormularioSituacion } from './componentes/Formularios';
import type { Articulo } from '../../lib/tipos';

const VISTAS: { clave: Vista; rotulo: string; icono: typeof Package }[] = [
  { clave: 'articulos', rotulo: 'Articulos', icono: Package },
  { clave: 'movimientos', rotulo: 'Movimientos', icono: TrendingUp }
];

export const Inventario = () => {
  const { puede } = usarAuth();
  const { confirmar, dialogo } = usarConfirmacion();
  const [vista, setVista] = useState<Vista>('articulos');
  const [modalArticulo, setModalArticulo] = useState(false);
  const inventario = usarInventario();

  const nuevo = () => {
    inventario.abrirNuevo();
    setModalArticulo(true);
  };

  const editar = (articulo: Articulo) => {
    inventario.abrirEdicion(articulo);
    setModalArticulo(true);
  };

  const guardar = async (evento: FormEvent) => {
    evento.preventDefault();
    if (await inventario.guardarArticulo()) setModalArticulo(false);
  };

  const desactivar = (articulo: Articulo) => confirmar({
    titulo: 'Desactivar articulo',
    mensaje: (
      <>
        <strong>{articulo.nombre}</strong> dejara de admitir movimientos. Su kardex historico
        y el saldo de {articulo.stock_actual} {articulo.unidad.toLowerCase()} se conservan.
      </>
    ),
    textoConfirmar: 'Desactivar',
    icono: Ban,
    alConfirmar: () => inventario.desactivar(articulo)
  });

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Inventario de sistemas"
        descripcion="Catalogo de articulos y kardex de entradas y salidas"
        icono={Boxes}
      >
        <button
          type="button"
          className="boton-secundario"
          onClick={() => void descargarPdf('/inventario/reporte/pdf', {}, 'inventario.pdf')}
        >
          <FileDown className="h-4 w-4" />
          Reporte PDF
        </button>
        {puede('inventario.articulos') && (
          <button type="button" className="boton-primario" onClick={nuevo}>
            <PlusCircle className="h-4 w-4" />
            Nuevo articulo
          </button>
        )}
      </EncabezadoPagina>

      {inventario.error && <Alerta mensaje={inventario.error} />}

      {inventario.resumen && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador etiqueta="Articulos activos" valor={inventario.resumen.articulos} icono={Package} />
          <Indicador etiqueta="Unidades en stock" valor={inventario.resumen.unidades} icono={Boxes} tono="info" />
          <Indicador etiqueta="Bajo minimo" valor={inventario.resumen.bajo_minimo} icono={AlertTriangle} tono="advertencia" />
          <Indicador etiqueta="Entradas (30 dias)" valor={inventario.resumen.entradas_mes} icono={TrendingUp} tono="exito" />
          <Indicador etiqueta="Salidas (30 dias)" valor={inventario.resumen.salidas_mes} icono={TrendingDown} tono="critico" />
        </div>
      )}

      <div className="flex gap-2">
        {VISTAS.map(({ clave, rotulo, icono: Icono }) => (
          <button
            key={clave}
            type="button"
            onClick={() => setVista(clave)}
            className={vista === clave ? 'ficha-activa' : 'ficha-inactiva'}
          >
            <Icono className="h-4 w-4" />
            {rotulo}
          </button>
        ))}
      </div>

      {vista === 'articulos' && (
        <>
          <FiltrosArticulos filtros={inventario.filtros} alCambiar={inventario.setFiltros} />
          <TablaArticulos
            articulos={inventario.articulos}
            info={inventario.pagArticulos}
            puede={puede}
            alMover={inventario.abrirMovimiento}
            alCambiarSituacion={inventario.abrirCambioEstado}
            alEditar={editar}
            alDesactivar={desactivar}
            alActivar={(articulo) => void inventario.activar(articulo)}
            alCambiarPagina={inventario.setPaginaArticulos}
            alCambiarLimite={inventario.setLimiteArticulos}
          />
        </>
      )}

      {vista === 'movimientos' && (
        <>
          <FiltrosKardex
            filtros={inventario.filtroMovimiento}
            articulos={inventario.articulos}
            alCambiar={inventario.setFiltroMovimiento}
          />
          <TablaMovimientos
            movimientos={inventario.movimientos}
            info={inventario.pagMovimientos}
            alCambiarPagina={inventario.setPaginaMovimientos}
            alCambiarLimite={inventario.setLimiteMovimientos}
          />
        </>
      )}

      <Modal
        titulo={inventario.formulario.id ? 'Editar articulo' : 'Registrar articulo'}
        icono={Package}
        abierto={modalArticulo}
        alCerrar={() => setModalArticulo(false)}
        ancho="max-w-4xl"
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => setModalArticulo(false)}>Cancelar</button>
            <button type="submit" form="form-articulo" className="boton-primario" disabled={inventario.guardando}>
              Guardar articulo
            </button>
          </>
        }
      >
        <FormularioArticulo
          formulario={inventario.formulario}
          setFormulario={inventario.setFormulario}
          alEnviar={guardar}
        />
      </Modal>

      <Modal
        titulo={inventario.movimiento?.tipo === 'Salida' ? 'Registrar salida' : 'Registrar entrada'}
        icono={inventario.movimiento?.tipo === 'Salida' ? PackageMinus : PackagePlus}
        abierto={inventario.movimiento !== null}
        alCerrar={() => inventario.setMovimiento(null)}
        ancho="max-w-3xl"
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => inventario.setMovimiento(null)}>Cancelar</button>
            <button type="submit" form="form-movimiento" className="boton-primario" disabled={inventario.guardando}>
              Registrar {inventario.movimiento?.tipo === 'Salida' ? 'salida' : 'entrada'}
            </button>
          </>
        }
      >
        {inventario.movimiento && (
          <FormularioMovimiento
            movimiento={inventario.movimiento}
            datos={inventario.datosMovimiento}
            setDatos={inventario.setDatosMovimiento}
            alEnviar={(evento) => { evento.preventDefault(); void inventario.registrarMovimiento(); }}
          />
        )}
      </Modal>

      <Modal
        titulo="Cambiar la situacion del articulo"
        icono={Wrench}
        abierto={inventario.cambioEstado !== null}
        alCerrar={() => inventario.setCambioEstado(null)}
        ancho="max-w-3xl"
        acciones={
          <>
            <button type="button" className="boton-secundario" onClick={() => inventario.setCambioEstado(null)}>Cancelar</button>
            <button type="submit" form="form-situacion" className="boton-primario" disabled={inventario.guardando}>
              Guardar situacion
            </button>
          </>
        }
      >
        {inventario.cambioEstado && (
          <FormularioSituacion
            articulo={inventario.cambioEstado}
            datos={inventario.datosEstado}
            setDatos={inventario.setDatosEstado}
            alEnviar={(evento) => { evento.preventDefault(); void inventario.guardarEstado(); }}
          />
        )}
      </Modal>

      {dialogo}
    </div>
  );
};
