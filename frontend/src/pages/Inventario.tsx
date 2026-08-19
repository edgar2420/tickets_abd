import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  AlertTriangle, Ban, Boxes, FileDown, Filter, Package, PackageMinus, PackagePlus,
  PencilLine, PlusCircle, RotateCcw, Search, TrendingDown, TrendingUp
} from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { Alerta, Cargando, EncabezadoPagina, Etiqueta, Indicador, Modal, Panel, Vacio } from '../components/Ui';
import { Paginacion } from '../components/Paginacion';
import { usarConfirmacion } from '../components/Confirmacion';
import { fechaHora } from '../lib/formato';
import type {
  Articulo, InfoPaginacion, Movimiento, RespuestaPaginada, ResumenInventario,
  TipoArticulo, TipoMovimiento
} from '../lib/tipos';

const TIPOS: TipoArticulo[] = ['Equipo', 'Consumible', 'Repuesto', 'Licencia', 'Accesorio'];

const ESTILO_MOVIMIENTO: Record<TipoMovimiento, string> = {
  'Entrada': 'bg-green-100 text-green-800 border-green-300',
  'Salida': 'bg-red-100 text-red-800 border-red-300',
  'Ajuste': 'bg-yellow-100 text-yellow-800 border-yellow-300'
};

interface FormularioArticulo {
  id: number | null;
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: TipoArticulo;
  unidad: string;
  stock_minimo: string;
  ubicacion: string;
  activo: boolean;
}

const ARTICULO_VACIO: FormularioArticulo = {
  id: null, codigo: '', nombre: '', descripcion: '', tipo: 'Equipo',
  unidad: 'Unidad', stock_minimo: '0', ubicacion: '', activo: true
};

export const Inventario = () => {
  const { puede } = usarAuth();
  const { confirmar, dialogo } = usarConfirmacion();

  const [vista, setVista] = useState<'articulos' | 'movimientos'>('articulos');
  const [resumen, setResumen] = useState<ResumenInventario | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [articulos, setArticulos] = useState<Articulo[] | null>(null);
  const [pagArticulos, setPagArticulos] = useState<InfoPaginacion | null>(null);
  const [filtros, setFiltros] = useState({ busqueda: '', tipo: '', solo_criticos: false });
  const [paginaArticulos, setPaginaArticulos] = useState(1);
  const [limiteArticulos, setLimiteArticulos] = useState(25);

  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [pagMovimientos, setPagMovimientos] = useState<InfoPaginacion | null>(null);
  const [filtroMovimiento, setFiltroMovimiento] = useState({ tipo: '', articulo_id: '' });
  const [paginaMovimientos, setPaginaMovimientos] = useState(1);
  const [limiteMovimientos, setLimiteMovimientos] = useState(25);

  const [formulario, setFormulario] = useState<FormularioArticulo>(ARTICULO_VACIO);
  const [modalArticulo, setModalArticulo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [movimiento, setMovimiento] = useState<{ articulo: Articulo; tipo: TipoMovimiento } | null>(null);
  const [datosMovimiento, setDatosMovimiento] = useState({ cantidad: '1', motivo: '' });

  const cargarResumen = useCallback(async () => {
    const { datos } = await api<{ datos: ResumenInventario }>('/inventario/resumen');
    setResumen(datos);
  }, []);

  const cargarArticulos = useCallback(async () => {
    const respuesta = await api<RespuestaPaginada<Articulo>>('/inventario/articulos', {
      parametros: {
        busqueda: filtros.busqueda,
        tipo: filtros.tipo,
        solo_criticos: filtros.solo_criticos ? 'true' : '',
        limite: limiteArticulos,
        pagina: paginaArticulos
      }
    });
    setArticulos(respuesta.datos);
    setPagArticulos(respuesta.paginacion);
  }, [filtros, paginaArticulos, limiteArticulos]);

  const cargarMovimientos = useCallback(async () => {
    const respuesta = await api<RespuestaPaginada<Movimiento>>('/inventario/movimientos', {
      parametros: {
        tipo: filtroMovimiento.tipo,
        articulo_id: filtroMovimiento.articulo_id,
        limite: limiteMovimientos,
        pagina: paginaMovimientos
      }
    });
    setMovimientos(respuesta.datos);
    setPagMovimientos(respuesta.paginacion);
  }, [filtroMovimiento, paginaMovimientos, limiteMovimientos]);

  const recargar = useCallback(async () => {
    try {
      await Promise.all([cargarResumen(), cargarArticulos(), cargarMovimientos()]);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar el inventario');
    }
  }, [cargarResumen, cargarArticulos, cargarMovimientos]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const abrirNuevo = () => {
    setFormulario(ARTICULO_VACIO);
    setModalArticulo(true);
  };

  const abrirEdicion = (articulo: Articulo) => {
    setFormulario({
      id: articulo.id,
      codigo: articulo.codigo,
      nombre: articulo.nombre,
      descripcion: articulo.descripcion ?? '',
      tipo: articulo.tipo,
      unidad: articulo.unidad,
      stock_minimo: String(articulo.stock_minimo),
      ubicacion: articulo.ubicacion ?? '',
      activo: articulo.activo
    });
    setModalArticulo(true);
  };

  const guardarArticulo = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/inventario/articulos/${formulario.id}` : '/inventario/articulos', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: {
          codigo: formulario.codigo.trim(),
          nombre: formulario.nombre.trim(),
          descripcion: formulario.descripcion || null,
          tipo: formulario.tipo,
          unidad: formulario.unidad.trim(),
          stock_minimo: Number(formulario.stock_minimo) || 0,
          ubicacion: formulario.ubicacion || null,
          activo: formulario.activo
        }
      });
      setModalArticulo(false);
      await recargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible guardar el articulo');
    } finally {
      setGuardando(false);
    }
  };

  const registrarMovimiento = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!movimiento) return;
    setGuardando(true);
    setError(null);
    try {
      await api(`/inventario/articulos/${movimiento.articulo.id}/movimientos`, {
        metodo: 'POST',
        cuerpo: {
          tipo: movimiento.tipo,
          cantidad: Number(datosMovimiento.cantidad),
          motivo: datosMovimiento.motivo || null
        }
      });
      setMovimiento(null);
      setDatosMovimiento({ cantidad: '1', motivo: '' });
      await recargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar el movimiento');
    } finally {
      setGuardando(false);
    }
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
    alConfirmar: async () => {
      await api(`/inventario/articulos/${articulo.id}`, { metodo: 'DELETE' });
      await recargar();
    }
  });

  const activar = async (articulo: Articulo) => {
    await api(`/inventario/articulos/${articulo.id}/activar`, { metodo: 'PUT' });
    await recargar();
  };

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
          <button type="button" className="boton-primario" onClick={abrirNuevo}>
            <PlusCircle className="h-4 w-4" />
            Nuevo articulo
          </button>
        )}
      </EncabezadoPagina>

      {error && <Alerta mensaje={error} />}

      {resumen && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador etiqueta="Articulos activos" valor={resumen.articulos} icono={Package} />
          <Indicador etiqueta="Unidades en stock" valor={resumen.unidades} icono={Boxes} color="text-sky-700" fondo="bg-sky-50" />
          <Indicador etiqueta="Bajo minimo" valor={resumen.bajo_minimo} icono={AlertTriangle} color="text-amber-600" fondo="bg-amber-50" />
          <Indicador etiqueta="Entradas (30 dias)" valor={resumen.entradas_mes} icono={TrendingUp} color="text-emerald-700" fondo="bg-emerald-50" />
          <Indicador etiqueta="Salidas (30 dias)" valor={resumen.salidas_mes} icono={TrendingDown} color="text-rose-700" fondo="bg-rose-50" />
        </div>
      )}

      <div className="flex gap-2">
        {(['articulos', 'movimientos'] as const).map((opcion) => (
          <button
            key={opcion}
            type="button"
            onClick={() => setVista(opcion)}
            className={vista === opcion ? 'ficha-activa' : 'ficha-inactiva'}
          >
            {opcion === 'articulos' ? <Package className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
            {opcion === 'articulos' ? 'Articulos' : 'Movimientos'}
          </button>
        ))}
      </div>

      {vista === 'articulos' && (
        <>
          <Panel titulo="Filtros" icono={Filter}>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="etiqueta">Busqueda</label>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400 dark:text-slate-500" />
                  <input
                    className="campo pl-9"
                    placeholder="Codigo o nombre"
                    value={filtros.busqueda}
                    onChange={(e) => { setFiltros((f) => ({ ...f, busqueda: e.target.value })); setPaginaArticulos(1); }}
                  />
                </div>
              </div>
              <div>
                <label className="etiqueta">Tipo</label>
                <select
                  className="campo"
                  value={filtros.tipo}
                  onChange={(e) => { setFiltros((f) => ({ ...f, tipo: e.target.value })); setPaginaArticulos(1); }}
                >
                  <option value="">Todos</option>
                  {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
                </select>
              </div>
              <label className="flex items-end gap-2 pb-2.5 text-sm text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-slate-300 dark:border-slate-700"
                  checked={filtros.solo_criticos}
                  onChange={(e) => { setFiltros((f) => ({ ...f, solo_criticos: e.target.checked })); setPaginaArticulos(1); }}
                />
                Solo articulos bajo el minimo
              </label>
            </div>
          </Panel>

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
                      <th>Codigo</th>
                      <th>Articulo</th>
                      <th>Tipo</th>
                      <th>Ubicacion</th>
                      <th className="text-right">Minimo</th>
                      <th className="text-right">Stock</th>
                      <th>Estado</th>
                      <th className="text-right">Acciones</th>
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
                            <p className="text-xs text-slate-400 dark:text-slate-500">{articulo.descripcion}</p>
                          )}
                        </td>
                        <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{articulo.tipo}</td>
                        <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{articulo.ubicacion ?? '-'}</td>
                        <td className="text-right text-slate-500 dark:text-slate-400">{articulo.stock_minimo}</td>
                        <td className={`text-right font-bold ${articulo.bajo_minimo ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {articulo.stock_actual}
                          <span className="ml-1 text-xs font-normal text-slate-400 dark:text-slate-500">{articulo.unidad}</span>
                        </td>
                        <td>
                          {!articulo.activo
                            ? <Etiqueta texto="Inactivo" clase="bg-slate-100 text-slate-600 border-slate-300" />
                            : articulo.stock_actual === 0
                              ? <Etiqueta texto="Agotado" clase="bg-red-100 text-red-800 border-red-300 animate-pulse" />
                              : articulo.bajo_minimo
                                ? <Etiqueta texto="Bajo minimo" clase="bg-yellow-100 text-yellow-800 border-yellow-300" />
                                : <Etiqueta texto="Disponible" clase="bg-green-100 text-green-800 border-green-300" />}
                        </td>
                        <td>
                          <div className="flex justify-end gap-2">
                            {puede('inventario.movimientos') && articulo.activo && (
                              <>
                                <button
                                  type="button"
                                  className="boton-icono border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                                  title="Registrar entrada"
                                  onClick={() => { setMovimiento({ articulo, tipo: 'Entrada' }); setDatosMovimiento({ cantidad: '1', motivo: '' }); }}
                                >
                                  <PackagePlus className="h-4 w-4" />
                                </button>
                                <button
                                  type="button"
                                  className="boton-icono border-rose-200 text-rose-700 hover:bg-rose-50"
                                  title="Registrar salida"
                                  disabled={articulo.stock_actual === 0}
                                  onClick={() => { setMovimiento({ articulo, tipo: 'Salida' }); setDatosMovimiento({ cantidad: '1', motivo: '' }); }}
                                >
                                  <PackageMinus className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            <button
                              type="button"
                              className="boton-icono"
                              title="Kardex PDF"
                              onClick={() => void descargarPdf(`/inventario/articulos/${articulo.id}/kardex/pdf`, {}, `kardex-${articulo.codigo}.pdf`)}
                            >
                              <FileDown className="h-4 w-4" />
                            </button>
                            {puede('inventario.articulos') && (
                              <>
                                <button type="button" className="boton-icono" title="Editar" onClick={() => abrirEdicion(articulo)}>
                                  <PencilLine className="h-4 w-4" />
                                </button>
                                {articulo.activo ? (
                                  <button type="button" className="boton-icono-peligro" title="Desactivar" onClick={() => desactivar(articulo)}>
                                    <Ban className="h-4 w-4" />
                                  </button>
                                ) : (
                                  <button type="button" className="boton-icono" title="Reactivar" onClick={() => void activar(articulo)}>
                                    <RotateCcw className="h-4 w-4" />
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pagArticulos && (
              <Paginacion
                info={pagArticulos}
                alCambiarPagina={setPaginaArticulos}
                alCambiarLimite={(limite) => { setLimiteArticulos(limite); setPaginaArticulos(1); }}
              />
            )}
          </section>
        </>
      )}

      {vista === 'movimientos' && (
        <>
          <Panel titulo="Filtros del kardex" icono={Filter}>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="etiqueta">Tipo de movimiento</label>
                <select
                  className="campo"
                  value={filtroMovimiento.tipo}
                  onChange={(e) => { setFiltroMovimiento((f) => ({ ...f, tipo: e.target.value })); setPaginaMovimientos(1); }}
                >
                  <option value="">Todos</option>
                  <option value="Entrada">Entrada</option>
                  <option value="Salida">Salida</option>
                  <option value="Ajuste">Ajuste</option>
                </select>
              </div>
              <div>
                <label className="etiqueta">Articulo</label>
                <select
                  className="campo"
                  value={filtroMovimiento.articulo_id}
                  onChange={(e) => { setFiltroMovimiento((f) => ({ ...f, articulo_id: e.target.value })); setPaginaMovimientos(1); }}
                >
                  <option value="">Todos</option>
                  {(articulos ?? []).map((a) => <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>)}
                </select>
              </div>
            </div>
          </Panel>

          <section className="panel overflow-hidden">
            {!movimientos && <Cargando texto="Consultando movimientos" />}
            {movimientos && movimientos.length === 0 && (
              <Vacio icono={TrendingUp} texto="No se registraron movimientos con los criterios aplicados" />
            )}
            {movimientos && movimientos.length > 0 && (
              <div className="overflow-x-auto">
                <table className="tabla">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Tipo</th>
                      <th>Articulo</th>
                      <th className="text-right">Cantidad</th>
                      <th className="text-right">Anterior</th>
                      <th className="text-right">Resultante</th>
                      <th>Motivo</th>
                      <th>Registrado por</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movimientos.map((m) => (
                      <tr key={m.id}>
                        <td className="whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">{fechaHora(m.fecha)}</td>
                        <td><Etiqueta texto={m.tipo} clase={ESTILO_MOVIMIENTO[m.tipo]} /></td>
                        <td>
                          <span className="font-mono text-xs text-institucional-700 dark:text-institucional-300">{m.articulo_codigo}</span>
                          <span className="ml-2 text-slate-700 dark:text-slate-200">{m.articulo_nombre}</span>
                        </td>
                        <td className={`text-right font-bold ${m.tipo === 'Salida' ? 'text-rose-600' : 'text-emerald-700'}`}>
                          {m.tipo === 'Salida' ? '-' : m.tipo === 'Entrada' ? '+' : ''}{m.cantidad}
                        </td>
                        <td className="text-right text-slate-500 dark:text-slate-400">{m.stock_anterior}</td>
                        <td className="text-right font-semibold text-slate-700 dark:text-slate-200">{m.stock_resultante}</td>
                        <td className="max-w-xs truncate text-slate-600 dark:text-slate-300">{m.motivo ?? '-'}</td>
                        <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{m.usuario_nombre}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {pagMovimientos && (
              <Paginacion
                info={pagMovimientos}
                alCambiarPagina={setPaginaMovimientos}
                alCambiarLimite={(limite) => { setLimiteMovimientos(limite); setPaginaMovimientos(1); }}
              />
            )}
          </section>
        </>
      )}

      <Modal
        titulo={formulario.id ? 'Editar articulo' : 'Registrar articulo'}
        icono={Package}
        abierto={modalArticulo}
        alCerrar={() => setModalArticulo(false)}
      >
        <form onSubmit={guardarArticulo} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="etiqueta">Codigo</label>
              <input className="campo font-mono uppercase" required minLength={2} maxLength={40}
                placeholder="TON26A"
                value={formulario.codigo}
                onChange={(e) => setFormulario((f) => ({ ...f, codigo: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Tipo</label>
              <select className="campo" value={formulario.tipo}
                onChange={(e) => setFormulario((f) => ({ ...f, tipo: e.target.value as TipoArticulo }))}>
                {TIPOS.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="etiqueta">Nombre</label>
              <input className="campo" required minLength={3} maxLength={150}
                value={formulario.nombre}
                onChange={(e) => setFormulario((f) => ({ ...f, nombre: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="etiqueta">Descripcion</label>
              <input className="campo" maxLength={255}
                value={formulario.descripcion}
                onChange={(e) => setFormulario((f) => ({ ...f, descripcion: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Unidad de medida</label>
              <input className="campo" required maxLength={20}
                value={formulario.unidad}
                onChange={(e) => setFormulario((f) => ({ ...f, unidad: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Stock minimo</label>
              <input type="number" min={0} className="campo"
                value={formulario.stock_minimo}
                onChange={(e) => setFormulario((f) => ({ ...f, stock_minimo: e.target.value }))} />
            </div>
            <div className="sm:col-span-2">
              <label className="etiqueta">Ubicacion</label>
              <input className="campo" maxLength={100} placeholder="Deposito TI - Estante B"
                value={formulario.ubicacion}
                onChange={(e) => setFormulario((f) => ({ ...f, ubicacion: e.target.value }))} />
            </div>
          </div>

          {formulario.id === null && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-400">
              El articulo se crea con stock cero. El saldo solo cambia mediante entradas, salidas o ajustes.
            </p>
          )}

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
            <button type="button" className="boton-secundario" onClick={() => setModalArticulo(false)}>Cancelar</button>
            <button type="submit" className="boton-primario" disabled={guardando}>Guardar articulo</button>
          </div>
        </form>
      </Modal>

      <Modal
        titulo={movimiento?.tipo === 'Salida' ? 'Registrar salida' : 'Registrar entrada'}
        icono={movimiento?.tipo === 'Salida' ? PackageMinus : PackagePlus}
        abierto={movimiento !== null}
        alCerrar={() => setMovimiento(null)}
        ancho="max-w-lg"
      >
        {movimiento && (
          <form onSubmit={registrarMovimiento} className="space-y-4">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800">
              <p className="font-semibold text-institucional-900 dark:text-slate-100">{movimiento.articulo.nombre}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Codigo {movimiento.articulo.codigo} - Stock actual:{' '}
                <strong>{movimiento.articulo.stock_actual} {movimiento.articulo.unidad}</strong>
              </p>
            </div>

            <div>
              <label className="etiqueta">Cantidad</label>
              <input
                type="number"
                min={1}
                max={movimiento.tipo === 'Salida' ? movimiento.articulo.stock_actual : undefined}
                className="campo"
                required
                autoFocus
                value={datosMovimiento.cantidad}
                onChange={(e) => setDatosMovimiento((d) => ({ ...d, cantidad: e.target.value }))}
              />
              {movimiento.tipo === 'Salida' && (
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
                  Maximo disponible: {movimiento.articulo.stock_actual} {movimiento.articulo.unidad}
                </p>
              )}
            </div>

            <div>
              <label className="etiqueta">Motivo</label>
              <input
                className="campo"
                maxLength={255}
                placeholder={movimiento.tipo === 'Salida' ? 'Entrega a Contabilidad' : 'Compra segun factura 001-234'}
                value={datosMovimiento.motivo}
                onChange={(e) => setDatosMovimiento((d) => ({ ...d, motivo: e.target.value }))}
              />
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs dark:border-slate-700 dark:bg-slate-800">
              Saldo resultante:{' '}
              <strong className="text-institucional-900 dark:text-slate-100">
                {movimiento.tipo === 'Salida'
                  ? movimiento.articulo.stock_actual - (Number(datosMovimiento.cantidad) || 0)
                  : movimiento.articulo.stock_actual + (Number(datosMovimiento.cantidad) || 0)}{' '}
                {movimiento.articulo.unidad}
              </strong>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-slate-700">
              <button type="button" className="boton-secundario" onClick={() => setMovimiento(null)}>Cancelar</button>
              <button type="submit" className="boton-primario" disabled={guardando}>
                Registrar {movimiento.tipo.toLowerCase()}
              </button>
            </div>
          </form>
        )}
      </Modal>

      {dialogo}
    </div>
  );
};
