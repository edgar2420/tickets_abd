import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Building, Clock, Gauge, Layers, MapPin, Ticket, Users } from 'lucide-react';
import { api } from '../../lib/api';
import { usarAuth } from '../../context/AuthContext';
import { usarNotificaciones } from '../../context/NotificacionesContext';
import { Alerta, Cargando, EncabezadoPagina, Indicador, Panel } from '../../components/Ui';
import { IndicadoresSistemas } from './componentes/IndicadoresSistemas';
import { BarraDistribucion, RankingSolicitantes, type Ranking } from './componentes/Distribuciones';
import type { Distribucion, Indicadores } from '../../lib/tipos';

interface RespuestaTablero {
  datos: {
    resumen: Indicadores;
    graficos: {
      porSucursal: Distribucion[];
      porCategoria: Distribucion[];
      porEstado: Distribucion[];
      porArea: Distribucion[];
      porServicio: Distribucion[];
      porUbicacion: Distribucion[];
      porResponsable: Distribucion[];
      porSolicitante: Ranking[];
    } | null;
  };
}

export const Tablero = () => {
  const { puede } = usarAuth();
  const { ultimoEventoTicket } = usarNotificaciones();
  const [datos, setDatos] = useState<RespuestaTablero['datos'] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const verTodo = puede('tickets.ver_todos');

  const cargar = useCallback(async () => {
    try {
      const respuesta = await api<RespuestaTablero>('/tickets/tablero');
      setDatos(respuesta.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar los indicadores');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar, ultimoEventoTicket]);

  if (error) return <Alerta mensaje={error} />;
  if (!datos) return <Cargando texto="Calculando indicadores" />;

  const { resumen, graficos } = datos;

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo={verTodo ? 'Tablero de Sistemas' : 'Tablero de control'}
        descripcion={verTodo
          ? 'Estado consolidado de la mesa de ayuda y de la carga del area'
          : 'Situacion actual de sus tickets'}
        icono={Gauge}
      />

      {verTodo ? (
        <IndicadoresSistemas resumen={resumen} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-3">
          <Indicador etiqueta="Abiertos" valor={resumen.abiertos} icono={Layers} tono="info" />
          <Indicador etiqueta="En proceso" valor={resumen.en_proceso} icono={Clock} tono="advertencia" />
          <Indicador etiqueta="Criticos activos" valor={resumen.criticos} icono={AlertTriangle} tono="critico" />
        </div>
      )}

      {graficos && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <Panel titulo="Carga por responsable" icono={Users}>
              <BarraDistribucion filas={graficos.porResponsable ?? []} />
            </Panel>
            <Panel titulo="Quien solicita mas tickets" icono={Users}>
              <RankingSolicitantes filas={graficos.porSolicitante} />
            </Panel>
            <Panel titulo="Tickets por ubicacion" icono={MapPin}>
              <BarraDistribucion filas={graficos.porUbicacion ?? []} />
            </Panel>
          </div>

          <div className="space-y-4">
            <Panel titulo="Tickets por servicio" icono={Layers}>
              <BarraDistribucion filas={graficos.porServicio ?? []} />
            </Panel>
            <Panel titulo="Tickets por categoria" icono={Layers}>
              <BarraDistribucion filas={graficos.porCategoria} />
            </Panel>
            <Panel titulo="Tickets por sucursal" icono={Building}>
              <BarraDistribucion filas={graficos.porSucursal} />
            </Panel>
            <Panel titulo="Tickets por area solicitante" icono={Ticket}>
              <BarraDistribucion filas={graficos.porArea} />
            </Panel>
          </div>
        </div>
      )}
    </div>
  );
};
