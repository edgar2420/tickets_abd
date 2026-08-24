import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Categoria, ReporteMensual, Sucursal } from '../../lib/tipos';

export interface FiltrosReporte {
  sucursal_id: string;
  categoria: string;
  prioridad: string;
}

const mesVigente = () => new Date().toISOString().slice(0, 7);

export const usarReporteMensual = (habilitado: boolean) => {
  const [mes, setMes] = useState(mesVigente());
  const [filtros, setFiltrosEstado] = useState<FiltrosReporte>({ sucursal_id: '', categoria: '', prioridad: '' });
  const [reporte, setReporte] = useState<ReporteMensual | null>(null);
  const [sucursales, setSucursales] = useState<Sucursal[]>([]);
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!habilitado) return;
    try {
      const { datos } = await api<{ datos: ReporteMensual }>('/tickets/mensual', {
        parametros: { mes, ...filtros }
      });
      setReporte(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible obtener el reporte mensual');
    }
  }, [habilitado, mes, filtros]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    if (!habilitado) return;
    void api<{ datos: Sucursal[] }>('/sucursales').then(({ datos }) => setSucursales(datos)).catch(() => setSucursales([]));
    void api<{ datos: Categoria[] }>('/categorias', { parametros: { activas: true } })
      .then(({ datos }) => setCategorias(datos)).catch(() => setCategorias([]));
  }, [habilitado]);

  const setFiltros = (cambio: Partial<FiltrosReporte>) =>
    setFiltrosEstado((previos) => ({ ...previos, ...cambio }));

  const limpiar = () => setFiltrosEstado({ sucursal_id: '', categoria: '', prioridad: '' });

  const hayFiltros = Boolean(filtros.sucursal_id || filtros.categoria || filtros.prioridad);

  return {
    mes, setMes, filtros, setFiltros, limpiar, hayFiltros,
    reporte, sucursales, categorias, error, mesVigente: mesVigente()
  };
};
