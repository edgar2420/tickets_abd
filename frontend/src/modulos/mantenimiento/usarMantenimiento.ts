import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api';
import type { Equipo } from '../../lib/tipos';
import {
  FILTROS_VACIOS, type EquipoDelPlan, type RegistroMantenimiento, type ResumenPlan
} from './constantes';

export const usarMantenimiento = () => {
  const [plan, setPlan] = useState<EquipoDelPlan[] | null>(null);
  const [resumen, setResumen] = useState<ResumenPlan | null>(null);
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [filtros, setFiltros] = useState(FILTROS_VACIOS);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const [enPlan, setEnPlan] = useState<EquipoDelPlan | Equipo | null>(null);
  const [enRegistro, setEnRegistro] = useState<EquipoDelPlan | null>(null);
  const [historialDe, setHistorialDe] = useState<EquipoDelPlan | null>(null);
  const [historial, setHistorial] = useState<RegistroMantenimiento[]>([]);

  const cargar = useCallback(async () => {
    try {
      const [lista, totales] = await Promise.all([
        api<{ datos: EquipoDelPlan[] }>('/mantenimiento', { parametros: filtros }),
        api<{ datos: ResumenPlan }>('/mantenimiento/resumen')
      ]);
      setPlan(lista.datos);
      setResumen(totales.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar el plan de mantenimiento');
    }
  }, [filtros]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    void api<{ datos: Equipo[] }>('/equipos', { parametros: { limite: 200 } })
      .then(({ datos }) => setEquipos(datos))
      .catch(() => setEquipos([]));
  }, []);

  useEffect(() => {
    if (!historialDe) return;
    void api<{ datos: { historial: RegistroMantenimiento[] } }>(`/mantenimiento/${historialDe.id}/historial`)
      .then(({ datos }) => setHistorial(datos.historial))
      .catch(() => setHistorial([]));
  }, [historialDe]);

  const ejecutar = async (accion: () => Promise<unknown>) => {
    setGuardando(true);
    setError(null);
    try {
      await accion();
      await cargar();
      return true;
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la operacion');
      return false;
    } finally {
      setGuardando(false);
    }
  };

  const guardarPlan = (id: number, cuerpo: unknown) =>
    ejecutar(() => api(`/mantenimiento/${id}/plan`, { metodo: 'PUT', cuerpo }));

  const registrar = (id: number, cuerpo: unknown) =>
    ejecutar(() => api(`/mantenimiento/${id}/registrar`, { metodo: 'POST', cuerpo }));

  const generarTicket = (id: number) =>
    ejecutar(() => api(`/mantenimiento/${id}/ticket`, { metodo: 'POST' }));

  return {
    plan, resumen, equipos, filtros, setFiltros, error, guardando, cargar,
    enPlan, setEnPlan, enRegistro, setEnRegistro,
    historialDe, setHistorialDe, historial,
    guardarPlan, registrar, generarTicket
  };
};
