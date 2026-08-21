import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { ReporteMensual } from '../../lib/tipos';

const mesVigente = () => new Date().toISOString().slice(0, 7);

export const usarReporteMensual = (habilitado: boolean) => {
  const [mes, setMes] = useState(mesVigente());
  const [reporte, setReporte] = useState<ReporteMensual | null>(null);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    if (!habilitado) return;
    try {
      const { datos } = await api<{ datos: ReporteMensual }>('/tickets/mensual', { parametros: { mes } });
      setReporte(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible obtener el reporte mensual');
    }
  }, [habilitado, mes]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  return { mes, setMes, reporte, error, mesVigente: mesVigente() };
};
