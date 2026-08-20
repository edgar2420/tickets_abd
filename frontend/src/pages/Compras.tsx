import { useCallback, useEffect, useState, type FormEvent } from 'react';
import {
  BadgeCheck, ClipboardCheck, FileDown, Filter, Info, PackageCheck, PlusCircle,
  ShoppingCart, ThumbsUp, XCircle
} from 'lucide-react';
import { api, descargarPdf } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { usarNotificaciones } from '../context/NotificacionesContext';
import {
  Acciones, Alerta, BotonAccion, Cargando, EncabezadoPagina, Etiqueta, Indicador, Modal, Panel, Vacio
} from '../components/Ui';
import { Paginacion } from '../components/Paginacion';
import { estiloPrioridad, fechaHora } from '../lib/formato';
import type {
  Equipo, EstadoCompra, InfoPaginacion, PrioridadTicket, RespuestaPaginada,
  ResumenCompras, SolicitudCompra, Sucursal
} from '../lib/tipos';

const TIPOS_EQUIPO = ['Escritorio', 'Laptop', 'Servidor', 'Impresora', 'Monitor', 'Red', 'Otro'];
const PRIORIDADES: PrioridadTicket[] = ['Baja', 'Media', 'Alta', 'Critica'];
const ESTADOS: EstadoCompra[] = [
  'Solicitada', 'En revision', 'Aprobada por TI', 'Aprobada por Gerencia', 'Comprada', 'Entregada', 'Rechazada'
];

const ESTILO_ESTADO: Record<EstadoCompra, string> = {
  'Solicitada': 'bg-sky-100 text-sky-800 border-sky-300 dark:bg-sky-500/15 dark:text-sky-300 dark:border-sky-500/30',
  'En revision': 'bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-500/15 dark:text-yellow-300 dark:border-yellow-500/30',
  'Aprobada por TI': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:border-amber-500/30',
  'Aprobada por Gerencia': 'bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-500/15 dark:text-emerald-300 dark:border-emerald-500/30',
  'Comprada': 'bg-violet-100 text-violet-800 border-violet-300 dark:bg-violet-500/15 dark:text-violet-300 dark:border-violet-500/30',
  'Entregada': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-500/15 dark:text-green-300 dark:border-green-500/30',
  'Rechazada': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-500/15 dark:text-red-300 dark:border-red-500/30'
};

export const codigoCompra = (id: number) => `SC-${String(id).padStart(5, '0')}`;

const SOLICITUD_VACIA = {
  titulo: '', justificacion: '', tipo_equipo: 'Escritorio', cantidad: '1',
  especificaciones: '', prioridad: 'Media' as PrioridadTicket
};

/** Par etiqueta/valor de la ficha. */
const Dato = ({ etiqueta, valor }: { etiqueta: string; valor?: string | number | null }) => (
  <div>
    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">{etiqueta}</p>
    <p className="mt-0.5 text-sm font-medium text-slate-800 dark:text-slate-100">
      {valor === null || valor === undefined || valor === '' ? 'Pendiente' : valor}
    </p>
  </div>
);

export const Compras = () => {
  const { puede, usuario } = usarAuth();
  const { ultimoEventoTicket } = usarNotificaciones();

  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[] | null>(null);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenCompras | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [filtros, setFiltros] = useState({ estado: '', sucursal_id: '', busqueda: '' });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimite] = useState(25);

  const [nueva, setNueva] = useState(SOLICITUD_VACIA);
  const [modalNueva, setModalNueva] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [ficha, setFicha] = useState<SolicitudCompra | null>(null);
  const [accion, setAccion] = useState<{ solicitud: SolicitudCompra; tipo: string } | null>(null);
  const [datosAccion, setDatosAccion] = useState<Record<string, string>>({});
  const [equipos, setEquipos] = useState<Equipo[]>([]);

  const cargar = useCallback(async () => {
    try {
      const [lista, resumenCompras] = await Promise.all([
        api<RespuestaPaginada<SolicitudCompra>>('/compras', { parametros: { ...filtros, limite, pagina } }),
        api<{ datos: ResumenCompras }>('/compras/resumen')
      ]);
      setSolicitudes(lista.datos);
      setInfo(lista.paginacion);
      setResumen(resumenCompras.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar las solicitudes');
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoTicket]);

  useEffect(() => {
    void api<{ datos: Sucursal[] }>('/sucursales').then(({ datos }) => setSucursales(datos)).catch(() => setSucursales([]));
  }, []);

  const registrar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api('/compras', {
        metodo: 'POST',
        cuerpo: {
          titulo: nueva.titulo.trim(),
          justificacion: nueva.justificacion.trim(),
          tipo_equipo: nueva.tipo_equipo,
          cantidad: Number(nueva.cantidad) || 1,
          especificaciones: nueva.especificaciones || null,
          prioridad: nueva.prioridad
        }
      });
      setModalNueva(false);
      setNueva(SOLICITUD_VACIA);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar la solicitud');
    } finally {
      setGuardando(false);
    }
  };

  const abrirAccion = (solicitud: SolicitudCompra, tipo: string) => {
    setDatosAccion({
      monto_estimado: solicitud.monto_estimado ?? '',
      proveedor_sugerido: solicitud.proveedor_sugerido ?? '',
      observacion_ti: solicitud.observacion_ti ?? ''
    });
    if (tipo === 'entregar' && equipos.length === 0) {
      void api<RespuestaPaginada<Equipo>>('/equipos', { parametros: { limite: 200 } })
        .then(({ datos }) => setEquipos(datos)).catch(() => setEquipos([]));
    }
    setAccion({ solicitud, tipo });
  };

  /** Envia la accion del circuito con el cuerpo que corresponde a cada paso. */
  const ejecutarAccion = async (evento: FormEvent) => {
    evento.preventDefault();
    if (!accion) return;
    setGuardando(true);
    setError(null);

    const cuerpos: Record<string, unknown> = {
      revisar: {
        observacion_ti: datosAccion.observacion_ti || null,
        monto_estimado: datosAccion.monto_estimado ? Number(datosAccion.monto_estimado) : null,
        proveedor_sugerido: datosAccion.proveedor_sugerido || null
      },
      'aprobar-ti': {
        observacion_ti: datosAccion.observacion_ti || null,
        monto_estimado: datosAccion.monto_estimado ? Number(datosAccion.monto_estimado) : null,
        proveedor_sugerido: datosAccion.proveedor_sugerido || null
      },
      'aprobar-gerencia': { observacion_gerencia: datosAccion.observacion_gerencia || null },
      rechazar: { motivo_rechazo: datosAccion.motivo_rechazo ?? '' },
      comprar: {
        numero_orden: datosAccion.numero_orden || null,
        monto_final: datosAccion.monto_final ? Number(datosAccion.monto_final) : null
      },
      entregar: { equipo_id: datosAccion.equipo_id ? Number(datosAccion.equipo_id) : null }
    };

    try {
      await api(`/compras/${accion.solicitud.id}/${accion.tipo}`, { metodo: 'PUT', cuerpo: cuerpos[accion.tipo] });
      setAccion(null);
      setDatosAccion({});
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la accion');
    } finally {
      setGuardando(false);
    }
  };

  const campoAccion = (clave: string, etiqueta: string, opciones: Record<string, unknown> = {}) => (
    <div>
      <label className="etiqueta">{etiqueta}</label>
      <input
        className="campo"
        value={datosAccion[clave] ?? ''}
        onChange={(e) => setDatosAccion((d) => ({ ...d, [clave]: e.target.value }))}
        {...opciones}
      />
    </div>
  );

  const TITULOS: Record<string, string> = {
    revisar: 'Revision tecnica de TI',
    'aprobar-ti': 'Aprobar tecnicamente y elevar a Gerencia',
    'aprobar-gerencia': 'Aprobacion de Gerencia',
    rechazar: 'Rechazar la solicitud',
    comprar: 'Registrar la compra ejecutada',
    entregar: 'Registrar la entrega'
  };

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

      {error && <Alerta mensaje={error} />}

      {resumen && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Indicador etiqueta="Solicitudes" valor={resumen.total} icono={ShoppingCart} />
          <Indicador etiqueta="Por revisar" valor={resumen.solicitadas + resumen.en_revision} icono={ClipboardCheck} tono="info" />
          <Indicador etiqueta="En Gerencia" valor={resumen.esperando_gerencia} icono={ThumbsUp} tono="advertencia" />
          <Indicador etiqueta="Entregadas" valor={resumen.entregadas} icono={PackageCheck} tono="exito" />
          <Indicador
            etiqueta="Monto ejecutado"
            valor={Number(resumen.monto_ejecutado ?? 0).toFixed(2)}
            icono={BadgeCheck}
            tono="neutro"
          />
        </div>
      )}

      <Panel titulo="Filtros" icono={Filter}>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className="etiqueta">Estado</label>
            <select className="campo" value={filtros.estado}
              onChange={(e) => { setFiltros((f) => ({ ...f, estado: e.target.value })); setPagina(1); }}>
              <option value="">Todos</option>
              {ESTADOS.map((estado) => <option key={estado} value={estado}>{estado}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Sucursal</label>
            <select className="campo" value={filtros.sucursal_id}
              onChange={(e) => { setFiltros((f) => ({ ...f, sucursal_id: e.target.value })); setPagina(1); }}>
              <option value="">Todas</option>
              {sucursales.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="etiqueta">Busqueda</label>
            <input className="campo" placeholder="Titulo o justificacion" value={filtros.busqueda}
              onChange={(e) => { setFiltros((f) => ({ ...f, busqueda: e.target.value })); setPagina(1); }} />
          </div>
        </div>
      </Panel>

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
                  <th>Codigo</th>
                  <th>Solicitud</th>
                  <th>Solicitante</th>
                  <th>Sucursal</th>
                  <th className="text-right">Cant.</th>
                  <th>Prioridad</th>
                  <th>Estado</th>
                  <th className="text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {solicitudes.map((s) => (
                  <tr key={s.id}>
                    <td className="whitespace-nowrap font-mono text-xs font-semibold text-institucional-800 dark:text-institucional-200">
                      {codigoCompra(s.id)}
                    </td>
                    <td>
                      <p className="font-medium text-slate-800 dark:text-slate-100">{s.titulo}</p>
                      <p className="text-xs text-slate-400 dark:text-slate-400">{s.tipo_equipo}</p>
                    </td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{s.solicitante_nombre}</td>
                    <td className="whitespace-nowrap text-slate-600 dark:text-slate-300">{s.sucursal_nombre ?? '-'}</td>
                    <td className="text-right text-slate-600 dark:text-slate-300">{s.cantidad}</td>
                    <td><Etiqueta texto={s.prioridad} clase={estiloPrioridad[s.prioridad]} /></td>
                    <td><Etiqueta texto={s.estado} clase={ESTILO_ESTADO[s.estado]} /></td>
                    <td>
                      <Acciones>
                        <BotonAccion icono={Info} rotulo="Ver ficha" alPulsar={() => setFicha(s)} />
                        {puede('compras.revisar') && ['Solicitada', 'En revision'].includes(s.estado) && (
                          <>
                            <BotonAccion icono={ClipboardCheck} rotulo="Revisar y cotizar" alPulsar={() => abrirAccion(s, 'revisar')} />
                            <BotonAccion icono={ThumbsUp} rotulo="Aprobar tecnicamente" tono="exito" alPulsar={() => abrirAccion(s, 'aprobar-ti')} />
                          </>
                        )}
                        {puede('compras.aprobar') && s.estado === 'Aprobada por TI' && (
                          <BotonAccion icono={BadgeCheck} rotulo="Aprobar presupuesto" tono="exito" alPulsar={() => abrirAccion(s, 'aprobar-gerencia')} />
                        )}
                        {puede('compras.gestionar') && s.estado === 'Aprobada por Gerencia' && (
                          <BotonAccion icono={ShoppingCart} rotulo="Registrar compra" alPulsar={() => abrirAccion(s, 'comprar')} />
                        )}
                        {puede('compras.gestionar') && s.estado === 'Comprada' && (
                          <BotonAccion icono={PackageCheck} rotulo="Registrar entrega" tono="exito" alPulsar={() => abrirAccion(s, 'entregar')} />
                        )}
                        {puede('compras.revisar', 'compras.aprobar')
                          && ['Solicitada', 'En revision', 'Aprobada por TI'].includes(s.estado) && (
                          <BotonAccion icono={XCircle} rotulo="Rechazar" tono="peligro" alPulsar={() => abrirAccion(s, 'rechazar')} />
                        )}
                      </Acciones>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {info && (
          <Paginacion
            info={info}
            alCambiarPagina={setPagina}
            alCambiarLimite={(nuevo) => { setLimite(nuevo); setPagina(1); }}
          />
        )}
      </section>

      {/* Alta de la solicitud */}
      <Modal titulo="Solicitar un equipo" icono={ShoppingCart} abierto={modalNueva}
        alCerrar={() => setModalNueva(false)} ancho="max-w-2xl">
        <form onSubmit={registrar} className="space-y-4">
          <div>
            <label className="etiqueta">Que necesita</label>
            <input className="campo" required minLength={6} maxLength={200}
              placeholder="Computadora de escritorio para Contabilidad"
              value={nueva.titulo}
              onChange={(e) => setNueva((n) => ({ ...n, titulo: e.target.value }))} />
          </div>

          <div>
            <label className="etiqueta">Justificacion</label>
            <textarea className="campo min-h-28" required minLength={15}
              placeholder="Explique por que se necesita: que problema resuelve o que tarea permite realizar"
              value={nueva.justificacion}
              onChange={(e) => setNueva((n) => ({ ...n, justificacion: e.target.value }))} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="etiqueta">Tipo de equipo</label>
              <select className="campo" value={nueva.tipo_equipo}
                onChange={(e) => setNueva((n) => ({ ...n, tipo_equipo: e.target.value }))}>
                {TIPOS_EQUIPO.map((tipo) => <option key={tipo} value={tipo}>{tipo}</option>)}
              </select>
            </div>
            <div>
              <label className="etiqueta">Cantidad</label>
              <input type="number" min={1} max={999} className="campo" value={nueva.cantidad}
                onChange={(e) => setNueva((n) => ({ ...n, cantidad: e.target.value }))} />
            </div>
            <div>
              <label className="etiqueta">Prioridad</label>
              <select className="campo" value={nueva.prioridad}
                onChange={(e) => setNueva((n) => ({ ...n, prioridad: e.target.value as PrioridadTicket }))}>
                {PRIORIDADES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="etiqueta">Especificaciones sugeridas</label>
            <input className="campo" maxLength={500}
              placeholder="Intel Core i5, 16 GB de RAM, disco solido de 512 GB"
              value={nueva.especificaciones}
              onChange={(e) => setNueva((n) => ({ ...n, especificaciones: e.target.value }))} />
          </div>

          <p className="superficie p-3 text-xs text-slate-600 dark:text-slate-200">
            La solicitud se registra a nombre de {usuario?.nombre}, area {usuario?.area},
            sucursal {usuario?.sucursal ?? 'sin asignar'}. Pasara primero por la revision tecnica de TI
            y luego por la aprobacion de Gerencia.
          </p>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
            <button type="button" className="boton-secundario" onClick={() => setModalNueva(false)}>Cancelar</button>
            <button type="submit" className="boton-primario" disabled={guardando}>Enviar solicitud</button>
          </div>
        </form>
      </Modal>

      {/* Ficha con el circuito completo */}
      <Modal titulo={ficha ? `Solicitud ${codigoCompra(ficha.id)}` : 'Solicitud'} icono={Info}
        abierto={ficha !== null} alCerrar={() => setFicha(null)} ancho="max-w-2xl">
        {ficha && (
          <div className="space-y-5">
            <div className="superficie flex flex-wrap items-start justify-between gap-3 p-4">
              <div>
                <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">{ficha.titulo}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {ficha.solicitante_nombre} - {ficha.area_nombre ?? 'sin area'} - {ficha.sucursal_nombre ?? 'sin sucursal'}
                </p>
              </div>
              <Etiqueta texto={ficha.estado} clase={ESTILO_ESTADO[ficha.estado]} />
            </div>

            <div>
              <p className="etiqueta">Justificacion</p>
              <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-200">{ficha.justificacion}</p>
            </div>

            {ficha.especificaciones && (
              <div>
                <p className="etiqueta">Especificaciones sugeridas</p>
                <p className="text-sm text-slate-700 dark:text-slate-200">{ficha.especificaciones}</p>
              </div>
            )}

            <div>
              <p className="etiqueta">Circuito de aprobacion</p>
              <ol className="space-y-3 border-l-2 border-slate-200 pl-4 dark:border-noche-700">
                {[
                  { paso: 'Registro del pedido', quien: ficha.solicitante_nombre, cuando: ficha.fecha_creacion, nota: null },
                  { paso: 'Revision tecnica de TI', quien: ficha.revisado_por_nombre, cuando: ficha.fecha_revision, nota: ficha.observacion_ti },
                  { paso: 'Aprobacion de Gerencia', quien: ficha.aprobado_por_nombre, cuando: ficha.fecha_aprobacion, nota: ficha.observacion_gerencia },
                  { paso: 'Compra ejecutada', quien: ficha.comprado_por_nombre, cuando: ficha.fecha_compra, nota: ficha.numero_orden ? `Orden ${ficha.numero_orden}` : null },
                  { paso: 'Entrega', quien: ficha.entregado_por_nombre, cuando: ficha.fecha_entrega, nota: ficha.equipo_codigo ? `Equipo ${ficha.equipo_codigo}` : null }
                ].map(({ paso, quien, cuando, nota }) => (
                  <li key={paso}>
                    <p className={`text-sm font-semibold ${quien ? 'text-institucional-900 dark:text-slate-100' : 'text-slate-400 dark:text-slate-500'}`}>
                      {paso}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {quien ? `${quien} - ${fechaHora(cuando)}` : 'Pendiente'}
                    </p>
                    {nota && <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-300">{nota}</p>}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid gap-4 sm:grid-cols-4">
              <Dato etiqueta="Cantidad" valor={ficha.cantidad} />
              <Dato etiqueta="Monto estimado" valor={ficha.monto_estimado} />
              <Dato etiqueta="Monto final" valor={ficha.monto_final} />
              <Dato etiqueta="Proveedor" valor={ficha.proveedor_sugerido} />
            </div>

            {ficha.estado === 'Rechazada' && (
              <Alerta mensaje={`Rechazada por ${ficha.rechazado_por_nombre ?? 'la organizacion'}: ${ficha.motivo_rechazo ?? 'sin motivo registrado'}`} />
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
              <button type="button" className="boton-secundario"
                onClick={() => void descargarPdf(`/compras/${ficha.id}/pdf`, {}, `${codigoCompra(ficha.id)}.pdf`)}>
                <FileDown className="h-4 w-4" />
                Ficha en PDF
              </button>
              <button type="button" className="boton-primario" onClick={() => setFicha(null)}>Cerrar</button>
            </div>
          </div>
        )}
      </Modal>

      {/* Acciones del circuito */}
      <Modal titulo={accion ? TITULOS[accion.tipo] : ''} icono={ClipboardCheck}
        abierto={accion !== null} alCerrar={() => setAccion(null)} ancho="max-w-lg">
        {accion && (
          <form onSubmit={ejecutarAccion} className="space-y-4">
            <div className="superficie p-4">
              <p className="font-semibold text-institucional-900 dark:text-slate-100">{accion.solicitud.titulo}</p>
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {codigoCompra(accion.solicitud.id)} - {accion.solicitud.solicitante_nombre} - {accion.solicitud.cantidad} unidad(es)
              </p>
            </div>

            {['revisar', 'aprobar-ti'].includes(accion.tipo) && (
              <>
                {campoAccion('monto_estimado', 'Monto estimado', { type: 'number', min: 0, step: '0.01', placeholder: '4500.00' })}
                {campoAccion('proveedor_sugerido', 'Proveedor sugerido', { maxLength: 150 })}
                <div>
                  <label className="etiqueta">Observacion tecnica</label>
                  <textarea className="campo min-h-24" maxLength={500}
                    placeholder="Viabilidad tecnica, alternativas evaluadas o condiciones"
                    value={datosAccion.observacion_ti ?? ''}
                    onChange={(e) => setDatosAccion((d) => ({ ...d, observacion_ti: e.target.value }))} />
                </div>
              </>
            )}

            {accion.tipo === 'aprobar-gerencia' && (
              <div>
                <label className="etiqueta">Observacion de Gerencia</label>
                <textarea className="campo min-h-24" maxLength={500}
                  placeholder="Partida presupuestaria, condiciones o plazo"
                  value={datosAccion.observacion_gerencia ?? ''}
                  onChange={(e) => setDatosAccion((d) => ({ ...d, observacion_gerencia: e.target.value }))} />
              </div>
            )}

            {accion.tipo === 'rechazar' && (
              <div>
                <label className="etiqueta">Motivo del rechazo</label>
                <textarea className="campo min-h-24" required minLength={10} maxLength={500}
                  placeholder="Explique por que no se aprueba la solicitud"
                  value={datosAccion.motivo_rechazo ?? ''}
                  onChange={(e) => setDatosAccion((d) => ({ ...d, motivo_rechazo: e.target.value }))} />
              </div>
            )}

            {accion.tipo === 'comprar' && (
              <>
                {campoAccion('numero_orden', 'Numero de orden de compra', { maxLength: 60, placeholder: 'OC-2026-0145' })}
                {campoAccion('monto_final', 'Monto final', { type: 'number', min: 0, step: '0.01' })}
              </>
            )}

            {accion.tipo === 'entregar' && (
              <div>
                <label className="etiqueta">Equipo del parque (opcional)</label>
                <select className="campo" value={datosAccion.equipo_id ?? ''}
                  onChange={(e) => setDatosAccion((d) => ({ ...d, equipo_id: e.target.value }))}>
                  <option value="">Sin vincular</option>
                  {equipos.map((e) => <option key={e.id} value={e.id}>{e.codigo} - {e.nombre_equipo}</option>)}
                </select>
                <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
                  Si el equipo ya fue dado de alta en el parque, vinculelo para dejar la trazabilidad completa.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
              <button type="button" className="boton-secundario" onClick={() => setAccion(null)}>Cancelar</button>
              <button
                type="submit"
                className={accion.tipo === 'rechazar' ? 'boton-peligro' : 'boton-primario'}
                disabled={guardando}
              >
                Confirmar
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};
