import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { usarNotificaciones } from '../../context/NotificacionesContext';
import { PETICION_VACIA, type TipoAccionProyecto } from './constantes';
import type {
  InfoPaginacion, RespuestaPaginada, ResumenProyectos, SolicitudProyecto, Sucursal, Usuario
} from '../../lib/tipos';

export interface FiltrosProyecto {
  estado: string;
  tipo: string;
  sucursal_id: string;
  busqueda: string;
}

export interface AccionProyecto {
  proyecto: SolicitudProyecto;
  tipo: TipoAccionProyecto;
}

const mensajeDe = (fallo: unknown, alternativa: string) =>
  fallo instanceof Error ? fallo.message : alternativa;

export const usarProyectos = (puedeGestionar: boolean) => {
  const { ultimoEventoProyecto } = usarNotificaciones();

  const [proyectos, setProyectos] = useState<SolicitudProyecto[] | null>(null);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenProyectos | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [responsables, setResponsables] = useState<Usuario[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltrosEstado] = useState<FiltrosProyecto>({
    estado: '', tipo: '', sucursal_id: '', busqueda: ''
  });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimiteEstado] = useState(25);

  const [nueva, setNueva] = useState(PETICION_VACIA);
  const [ficha, setFicha] = useState<SolicitudProyecto | null>(null);
  const [accion, setAccion] = useState<AccionProyecto | null>(null);
  const [datosAccion, setDatosAccion] = useState<Record<string, string>>({});

  const cargar = useCallback(async () => {
    try {
      const [lista, totales] = await Promise.all([
        api<RespuestaPaginada<SolicitudProyecto>>('/proyectos', { parametros: { ...filtros, limite, pagina } }),
        api<{ datos: ResumenProyectos }>('/proyectos/resumen')
      ]);
      setProyectos(lista.datos);
      setInfo(lista.paginacion);
      setResumen(totales.datos);
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo, 'Error al cargar las peticiones de proyecto'));
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoProyecto]);

  useEffect(() => {
    if (!ficha || !proyectos) return;
    const actualizada = proyectos.find((proyecto) => proyecto.id === ficha.id);
    if (actualizada && actualizada.estado !== ficha.estado) setFicha(actualizada);
  }, [proyectos, ficha]);

  useEffect(() => {
    void api<{ datos: Sucursal[] }>('/sucursales')
      .then(({ datos }) => setSucursales(datos))
      .catch(() => setSucursales([]));
  }, []);

  useEffect(() => {
    if (!puedeGestionar) return;
    void api<RespuestaPaginada<Usuario>>('/usuarios', { parametros: { limite: 200 } })
      .then(({ datos }) => setResponsables(datos))
      .catch(() => setResponsables([]));
  }, [puedeGestionar]);

  const setFiltros = (cambio: Partial<FiltrosProyecto>) => {
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
      await api('/proyectos', {
        metodo: 'POST',
        cuerpo: {
          titulo: nueva.titulo.trim(),
          tipo: nueva.tipo,
          problema: nueva.problema.trim(),
          situacion_actual: nueva.situacion_actual.trim(),
          propuesta: nueva.propuesta.trim(),
          beneficio: nueva.beneficio.trim(),
          personas_afectadas: Number(nueva.personas_afectadas) || 1,
          frecuencia: nueva.frecuencia,
          urgencia: nueva.urgencia,
          sistemas_actuales: nueva.sistemas_actuales.trim() || null
        }
      });
      setNueva(PETICION_VACIA);
      await cargar();
      return true;
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible registrar la peticion'));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const abrirAccion = (proyecto: SolicitudProyecto, tipo: TipoAccionProyecto) => {
    setDatosAccion({
      evaluacion_ti: proyecto.evaluacion_ti ?? '',
      esfuerzo_estimado: proyecto.esfuerzo_estimado ?? 'Medio',
      valor_estimado: proyecto.valor_estimado ?? 'Medio',
      estado: proyecto.estado === 'Aprobada' ? 'En desarrollo' : proyecto.estado,
      avance: String(proyecto.avance ?? 0),
      responsable_id: proyecto.responsable_id ? String(proyecto.responsable_id) : ''
    });
    setAccion({ proyecto, tipo });
  };

  const cuerpoDeAccion = (): unknown => {
    if (!accion) return {};
    if (accion.tipo === 'evaluar') {
      return {
        evaluacion_ti: datosAccion.evaluacion_ti,
        esfuerzo_estimado: datosAccion.esfuerzo_estimado,
        valor_estimado: datosAccion.valor_estimado
      };
    }
    if (accion.tipo === 'aprobar') {
      return {
        observacion_aprobacion: datosAccion.observacion_aprobacion || null,
        responsable_id: datosAccion.responsable_id ? Number(datosAccion.responsable_id) : null
      };
    }
    if (accion.tipo === 'avance') {
      return {
        estado: datosAccion.estado,
        avance: Number(datosAccion.avance) || 0,
        responsable_id: datosAccion.responsable_id ? Number(datosAccion.responsable_id) : null
      };
    }
    return { motivo_rechazo: datosAccion.motivo_rechazo ?? '' };
  };

  const ejecutarAccion = async () => {
    if (!accion) return;
    setGuardando(true);
    setError(null);
    try {
      await api(`/proyectos/${accion.proyecto.id}/${accion.tipo}`, {
        metodo: 'PUT',
        cuerpo: cuerpoDeAccion()
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
    proyectos, info, resumen, sucursales, responsables, error, guardando,
    filtros, setFiltros, pagina, setPagina, limite, setLimite,
    nueva, setNueva, ficha, setFicha, accion, setAccion, datosAccion, setDatosAccion,
    registrar, abrirAccion, ejecutarAccion
  };
};
