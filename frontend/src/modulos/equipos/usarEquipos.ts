import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { EQUIPO_VACIO, type FormularioEquipo } from './constantes';
import type {
  Area, Equipo, InfoPaginacion, RespuestaPaginada, ResumenEquipos, Sucursal, Usuario
} from '../../lib/tipos';

export interface FiltrosEquipo {
  busqueda: string;
  tipo: string;
  estado: string;
  sucursal_id: string;
}

export interface Credencial {
  equipo: Equipo;
  anydesk_id: string;
  password: string;
}

const mensajeDe = (fallo: unknown, alternativa: string) =>
  fallo instanceof Error ? fallo.message : alternativa;

const aCuerpo = (formulario: FormularioEquipo) => ({
  codigo: formulario.codigo.trim(),
  nombre_equipo: formulario.nombre_equipo.trim(),
  tipo: formulario.tipo,
  marca: formulario.marca || null,
  modelo: formulario.modelo || null,
  numero_serie: formulario.numero_serie || null,
  sistema_operativo: formulario.sistema_operativo || null,
  procesador: formulario.procesador || null,
  ram_gb: formulario.ram_gb ? Number(formulario.ram_gb) : null,
  almacenamiento: formulario.almacenamiento || null,
  direccion_ip: formulario.direccion_ip || null,
  direccion_mac: formulario.direccion_mac || null,
  anydesk_id: formulario.anydesk_id || null,
  anydesk_password: formulario.anydesk_password || null,
  usuario_id: formulario.usuario_id ? Number(formulario.usuario_id) : null,
  area_id: formulario.area_id ? Number(formulario.area_id) : null,
  sucursal_id: formulario.sucursal_id ? Number(formulario.sucursal_id) : null,
  ubicacion: formulario.ubicacion || null,
  estado: formulario.estado,
  observaciones: formulario.observaciones || null,
  fecha_asignacion: formulario.fecha_asignacion || null,
  activo: formulario.activo
});

export const usarEquipos = (puede: (...codigos: string[]) => boolean) => {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [info, setInfo] = useState<InfoPaginacion | null>(null);
  const [resumen, setResumen] = useState<ResumenEquipos | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [filtros, setFiltrosEstado] = useState<FiltrosEquipo>({ busqueda: '', tipo: '', estado: '', sucursal_id: '' });
  const [pagina, setPagina] = useState(1);
  const [limite, setLimiteEstado] = useState(25);

  const [formulario, setFormulario] = useState<FormularioEquipo>(EQUIPO_VACIO);
  const [credencial, setCredencial] = useState<Credencial | null>(null);
  const [ficha, setFicha] = useState<Equipo | null>(null);

  const cargar = useCallback(async () => {
    try {
      const [lista, totales] = await Promise.all([
        api<RespuestaPaginada<Equipo>>('/equipos', { parametros: { ...filtros, limite, pagina } }),
        api<{ datos: ResumenEquipos }>('/equipos/resumen')
      ]);
      setEquipos(lista.datos);
      setInfo(lista.paginacion);
      setResumen(totales.datos);
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo, 'Error al cargar los equipos'));
    }
  }, [filtros, limite, pagina]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!puede('equipos.gestionar')) return;
    void api<RespuestaPaginada<Usuario>>('/usuarios', { parametros: { limite: 200 } })
      .then(({ datos }) => setUsuarios(datos)).catch(() => setUsuarios([]));
    void api<{ datos: Area[] }>('/areas', { parametros: { activas: true } })
      .then(({ datos }) => setAreas(datos)).catch(() => setAreas([]));
  }, [puede]);

  useEffect(() => {
    void api<{ datos: Sucursal[] }>('/sucursales')
      .then(({ datos }) => setSucursales(datos)).catch(() => setSucursales([]));
  }, []);

  const setFiltros = (cambio: Partial<FiltrosEquipo>) => {
    setFiltrosEstado((previos) => ({ ...previos, ...cambio }));
    setPagina(1);
  };

  const setLimite = (nuevo: number) => {
    setLimiteEstado(nuevo);
    setPagina(1);
  };

  const abrirNuevo = () => setFormulario(EQUIPO_VACIO);

  const abrirEdicion = (equipo: Equipo) => setFormulario({
    id: equipo.id,
    codigo: equipo.codigo,
    nombre_equipo: equipo.nombre_equipo,
    tipo: equipo.tipo,
    marca: equipo.marca ?? '',
    modelo: equipo.modelo ?? '',
    numero_serie: equipo.numero_serie ?? '',
    sistema_operativo: equipo.sistema_operativo ?? '',
    procesador: equipo.procesador ?? '',
    ram_gb: equipo.ram_gb ? String(equipo.ram_gb) : '',
    almacenamiento: equipo.almacenamiento ?? '',
    direccion_ip: equipo.direccion_ip ?? '',
    direccion_mac: equipo.direccion_mac ?? '',
    anydesk_id: equipo.anydesk_id ?? '',
    anydesk_password: '',
    usuario_id: equipo.usuario_id ? String(equipo.usuario_id) : '',
    area_id: equipo.area_id ? String(equipo.area_id) : '',
    sucursal_id: equipo.sucursal_id ? String(equipo.sucursal_id) : '',
    ubicacion: equipo.ubicacion ?? '',
    estado: equipo.estado,
    observaciones: equipo.observaciones ?? '',
    fecha_asignacion: equipo.fecha_asignacion ? equipo.fecha_asignacion.slice(0, 10) : '',
    activo: equipo.activo
  });

  const guardar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await api(formulario.id ? `/equipos/${formulario.id}` : '/equipos', {
        metodo: formulario.id ? 'PUT' : 'POST',
        cuerpo: aCuerpo(formulario)
      });
      await cargar();
      return true;
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible guardar el equipo'));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const revelarCredencial = async (equipo: Equipo) => {
    setError(null);
    try {
      const { datos } = await api<{ datos: { anydesk_id: string; password: string } }>(
        `/equipos/${equipo.id}/credenciales`
      );
      setCredencial({ equipo, ...datos });
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible obtener la credencial'));
    }
  };

  const darDeBaja = async (equipo: Equipo) => {
    await api(`/equipos/${equipo.id}`, { metodo: 'DELETE' });
    await cargar();
  };

  const reactivar = async (equipo: Equipo) => {
    await api(`/equipos/${equipo.id}/activar`, { metodo: 'PUT' });
    await cargar();
  };

  return {
    equipos,
    info,
    resumen,
    usuarios,
    areas,
    sucursales,
    error,
    guardando,
    filtros,
    setFiltros,
    setPagina,
    setLimite,
    formulario,
    setFormulario,
    abrirNuevo,
    abrirEdicion,
    guardar,
    credencial,
    setCredencial,
    revelarCredencial,
    ficha,
    setFicha,
    darDeBaja,
    reactivar
  };
};
