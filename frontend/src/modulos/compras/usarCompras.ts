import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { usarNotificaciones } from '../../context/NotificacionesContext';
import { cuerpoDeAccion, SOLICITUD_VACIA, type TipoAccion } from './constantes';
import type {
  Equipo, InfoPaginacion, RespuestaPaginada, ResumenCompras, SolicitudCompra, Sucursal
} from '../../lib/tipos';

export interface Filtros {
  estado: string;
  sucursal_id: string;
  busqueda: string;
}

export interface AccionEnCurso {
  solicitud: SolicitudCompra;
  tipo: TipoAccion;
}

const mensajeDe = (fallo: unknown, alternativa: string) =>
  fallo instanceof Error ? fallo.message : alternativa;

export const usarCompras = () => {
  const { ultimoEventoCompra } = usarNotificaciones();

  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[] | null>(null);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenCompras | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltrosEstado] = useState<Filtros>({ estado: '', sucursal_id: '', busqueda: '' });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimiteEstado] = useState(25);

  const [nueva, setNueva] = useState(SOLICITUD_VACIA);
  const [ficha, setFicha] = useState<SolicitudCompra | null>(null);
  const [accion, setAccion] = useState<AccionEnCurso | null>(null);
  const [datosAccion, setDatosAccion] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    try {
      const [lista, totales] = await Promise.all([
        api<RespuestaPaginada<SolicitudCompra>>('/compras', { parametros: { ...filtros, limite, pagina } }),
        api<{ datos: ResumenCompras }>('/compras/resumen')
      ]);
      setSolicitudes(lista.datos);
      setInfo(lista.paginacion);
      setResumen(totales.datos);
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo, 'Error al cargar las solicitudes'));
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoCompra]);

  useEffect(() => {
    if (!ficha || !solicitudes) return;
    const actualizada = solicitudes.find((solicitud) => solicitud.id === ficha.id);
    if (actualizada && actualizada.estado !== ficha.estado) setFicha(actualizada);
  }, [solicitudes, ficha]);

  useEffect(() => {
    void api<{ datos: Sucursal[] }>('/sucursales')
      .then(({ datos }) => setSucursales(datos))
      .catch(() => setSucursales([]));
  }, []);

  const setFiltros = (cambio: Partial<Filtros>) => {
    setFiltrosEstado((previos) => ({ ...previos, ...cambio }));
    setPagina(1);
  };

  const setLimite = (nuevo: number) => {
    setLimiteEstado(nuevo);
    setPagina(1);
  };

  const registrar = async () => {
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
      setNueva(SOLICITUD_VACIA);
      await cargar();
      return true;
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible registrar la solicitud'));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const abrirAccion = (solicitud: SolicitudCompra, tipo: TipoAccion) => {
    setDatosAccion({
      monto_estimado: solicitud.monto_estimado ?? '',
      equipo_sugerido: solicitud.equipo_sugerido ?? '',
      observacion_ti: solicitud.observacion_ti ?? ''
    });
    if (tipo === 'entregar' && equipos.length === 0) {
      void api<RespuestaPaginada<Equipo>>('/equipos', { parametros: { limite: 200 } })
        .then(({ datos }) => setEquipos(datos))
        .catch(() => setEquipos([]));
    }
    setAccion({ solicitud, tipo });
  };

  const ejecutarAccion = async () => {
    if (!accion) return;
    setGuardando(true);
    setError(null);
    try {
      await api(`/compras/${accion.solicitud.id}/${accion.tipo}`, {
        metodo: 'PUT',
        cuerpo: cuerpoDeAccion(accion.tipo, datosAccion)
      });
      setAccion(null);
      setDatosAccion({});
      await cargar();
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible completar la accion'));
    } finally {
      setGuardando(false);
    }
  };

  return {
    solicitudes,
    info,
    resumen,
    sucursales,
    equipos,
    error,
    guardando,
    filtros,
    setFiltros,
    pagina,
    setPagina,
    limite,
    setLimite,
    nueva,
    setNueva,
    ficha,
    setFicha,
    accion,
    setAccion,
    datosAccion,
    setDatosAccion,
    registrar,
    abrirAccion,
    ejecutarAccion
  };
};
