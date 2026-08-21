import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import { ARTICULO_VACIO, type FormularioArticulo } from './constantes';
import type {
  Articulo, EstadoArticulo, InfoPaginacion, Movimiento, RespuestaPaginada, ResumenInventario, TipoMovimiento
} from '../../lib/tipos';

export interface FiltrosArticulo {
  busqueda: string;
  tipo: string;
  estado: string;
  solo_criticos: boolean;
}

export interface FiltrosMovimiento {
  tipo: string;
  articulo_id: string;
}

export interface MovimientoEnCurso {
  articulo: Articulo;
  tipo: TipoMovimiento;
}

const mensajeDe = (fallo: unknown, alternativa: string) =>
  fallo instanceof Error ? fallo.message : alternativa;

export const usarInventario = () => {
  const [resumen, setResumen] = useState<ResumenInventario | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [articulos, setArticulos] = useState<Articulo[] | null>(null);
  const [pagArticulos, setPagArticulos] = useState<InfoPaginacion | null>(null);
  const [filtros, setFiltrosEstado] = useState<FiltrosArticulo>({
    busqueda: '', tipo: '', estado: '', solo_criticos: false
  });
  const [paginaArticulos, setPaginaArticulos] = useState(1);
  const [limiteArticulos, setLimiteArticulosEstado] = useState(25);

  const [movimientos, setMovimientos] = useState<Movimiento[] | null>(null);
  const [pagMovimientos, setPagMovimientos] = useState<InfoPaginacion | null>(null);
  const [filtroMovimiento, setFiltroMovimientoEstado] = useState<FiltrosMovimiento>({ tipo: '', articulo_id: '' });
  const [paginaMovimientos, setPaginaMovimientos] = useState(1);
  const [limiteMovimientos, setLimiteMovimientosEstado] = useState(25);

  const [formulario, setFormulario] = useState<FormularioArticulo>(ARTICULO_VACIO);
  const [movimiento, setMovimiento] = useState<MovimientoEnCurso | null>(null);
  const [datosMovimiento, setDatosMovimiento] = useState({ cantidad: '1', motivo: '' });
  const [cambioEstado, setCambioEstado] = useState<Articulo | null>(null);
  const [datosEstado, setDatosEstado] = useState<{ estado: EstadoArticulo; motivo: string }>({
    estado: 'Disponible', motivo: ''
  });

  const recargar = useCallback(async () => {
    try {
      const [totales, lista, kardex] = await Promise.all([
        api<{ datos: ResumenInventario }>('/inventario/resumen'),
        api<RespuestaPaginada<Articulo>>('/inventario/articulos', {
          parametros: {
            busqueda: filtros.busqueda,
            tipo: filtros.tipo,
            estado: filtros.estado,
            solo_criticos: filtros.solo_criticos ? 'true' : '',
            limite: limiteArticulos,
            pagina: paginaArticulos
          }
        }),
        api<RespuestaPaginada<Movimiento>>('/inventario/movimientos', {
          parametros: {
            tipo: filtroMovimiento.tipo,
            articulo_id: filtroMovimiento.articulo_id,
            limite: limiteMovimientos,
            pagina: paginaMovimientos
          }
        })
      ]);

      setResumen(totales.datos);
      setArticulos(lista.datos);
      setPagArticulos(lista.paginacion);
      setMovimientos(kardex.datos);
      setPagMovimientos(kardex.paginacion);
      setError(null);
    } catch (fallo) {
      setError(mensajeDe(fallo, 'Error al cargar el inventario'));
    }
  }, [filtros, paginaArticulos, limiteArticulos, filtroMovimiento, paginaMovimientos, limiteMovimientos]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  const setFiltros = (cambio: Partial<FiltrosArticulo>) => {
    setFiltrosEstado((previos) => ({ ...previos, ...cambio }));
    setPaginaArticulos(1);
  };

  const setLimiteArticulos = (limite: number) => {
    setLimiteArticulosEstado(limite);
    setPaginaArticulos(1);
  };

  const setFiltroMovimiento = (cambio: Partial<FiltrosMovimiento>) => {
    setFiltroMovimientoEstado((previos) => ({ ...previos, ...cambio }));
    setPaginaMovimientos(1);
  };

  const setLimiteMovimientos = (limite: number) => {
    setLimiteMovimientosEstado(limite);
    setPaginaMovimientos(1);
  };

  const abrirNuevo = () => setFormulario(ARTICULO_VACIO);

  const abrirEdicion = (articulo: Articulo) => setFormulario({
    id: articulo.id,
    codigo: articulo.codigo,
    nombre: articulo.nombre,
    descripcion: articulo.descripcion ?? '',
    tipo: articulo.tipo,
    unidad: articulo.unidad,
    stock_minimo: String(articulo.stock_minimo),
    ubicacion: articulo.ubicacion ?? '',
    estado: articulo.estado,
    activo: articulo.activo
  });

  const guardarArticulo = async () => {
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
          estado: formulario.estado,
          activo: formulario.activo
        }
      });
      await recargar();
      return true;
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible guardar el articulo'));
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const abrirMovimiento = (articulo: Articulo, tipo: TipoMovimiento) => {
    setMovimiento({ articulo, tipo });
    setDatosMovimiento({ cantidad: '1', motivo: '' });
  };

  const registrarMovimiento = async () => {
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
      setError(mensajeDe(fallo, 'No fue posible registrar el movimiento'));
    } finally {
      setGuardando(false);
    }
  };

  const abrirCambioEstado = (articulo: Articulo) => {
    setCambioEstado(articulo);
    setDatosEstado({ estado: articulo.estado, motivo: '' });
  };

  const guardarEstado = async () => {
    if (!cambioEstado) return;
    setGuardando(true);
    setError(null);
    try {
      await api(`/inventario/articulos/${cambioEstado.id}/estado`, {
        metodo: 'PUT',
        cuerpo: { estado: datosEstado.estado, motivo: datosEstado.motivo || null }
      });
      setCambioEstado(null);
      await recargar();
    } catch (fallo) {
      setError(mensajeDe(fallo, 'No fue posible cambiar la situacion'));
    } finally {
      setGuardando(false);
    }
  };

  const desactivar = async (articulo: Articulo) => {
    await api(`/inventario/articulos/${articulo.id}`, { metodo: 'DELETE' });
    await recargar();
  };

  const activar = async (articulo: Articulo) => {
    await api(`/inventario/articulos/${articulo.id}/activar`, { metodo: 'PUT' });
    await recargar();
  };

  return {
    resumen,
    error,
    guardando,
    articulos,
    pagArticulos,
    filtros,
    setFiltros,
    setPaginaArticulos,
    setLimiteArticulos,
    movimientos,
    pagMovimientos,
    filtroMovimiento,
    setFiltroMovimiento,
    setPaginaMovimientos,
    setLimiteMovimientos,
    formulario,
    setFormulario,
    abrirNuevo,
    abrirEdicion,
    guardarArticulo,
    movimiento,
    setMovimiento,
    datosMovimiento,
    setDatosMovimiento,
    abrirMovimiento,
    registrarMovimiento,
    cambioEstado,
    setCambioEstado,
    datosEstado,
    setDatosEstado,
    abrirCambioEstado,
    guardarEstado,
    desactivar,
    activar
  };
};
