import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import {
  Alerta, Boton, Campo, Cargando, Dato, Insignia, PiePagina, Panel, Selector, estilos
} from '../components/Comunes';
import { codigoTicket, duracionEmpleada, fechaHora } from '../lib/formato';
import { colorEstado, colorPrioridad, tema } from '../lib/tema';
import { OBJETIVOS, PRIORIDADES } from '../lib/constantes';
import type { PrioridadTicket, Ticket } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'DetalleTicket'>;

export const DetalleTicketScreen = ({ route }: Propiedades) => {
  const { id } = route.params;
  const { usuario, puede } = usarAuth();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [refrescando, setRefrescando] = useState(false);

  const [formulario, setFormulario] = useState<'' | 'resolver' | 'espera' | 'prioridad'>('');
  const [solucion, setSolucion] = useState('');
  const [minutos, setMinutos] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [motivo, setMotivo] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadTicket>('Media');

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Ticket }>(`/tickets/${id}`);
      setTicket(datos);
      setPrioridad(datos.prioridad);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar el ticket');
    }
  }, [id]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  const ejecutar = async (ruta: string, cuerpo?: unknown) => {
    setProcesando(true);
    setError(null);
    try {
      const { datos } = await api<{ datos: Ticket }>(ruta, { metodo: 'PUT', cuerpo });
      setTicket(datos);
      setFormulario('');
      setSolucion('');
      setMinutos('');
      setObservaciones('');
      setMotivo('');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la operacion');
    } finally {
      setProcesando(false);
    }
  };

  if (!ticket && !error) return <Cargando texto="Consultando el ticket" />;
  if (!ticket) {
    return (
      <View style={[estilos.pantalla, { padding: 16 }]}>
        <Alerta mensaje={error ?? 'Este ticket no existe'} />
      </View>
    );
  }

  const atiende = puede('tickets.responder');
  const esSolicitante = ticket.solicitante_id === usuario?.id;
  const cerrado = ticket.estado === 'Cerrado';

  const puedeTomar = atiende && ticket.estado === 'Nuevo';
  const puedeIniciar = atiende && ['Asignado', 'En Espera', 'Resuelto'].includes(ticket.estado);
  const puedeEsperar = atiende && ['Asignado', 'En Proceso'].includes(ticket.estado);
  const puedeResolver = puede('tickets.resolver') && ticket.estado === 'En Proceso';
  const puedePrioridad = puede('tickets.priorizar') && !cerrado;
  const puedeCerrar = ticket.estado === 'Resuelto' && (esSolicitante || puede('tickets.resolver'));

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        <View>
          <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: tema.acento }}>
            {codigoTicket(ticket)}
          </Text>
          <Text style={estilos.titulo}>{ticket.titulo}</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
            <Insignia texto={ticket.estado} color={colorEstado[ticket.estado] ?? tema.suave} />
            <Insignia texto={`Prioridad ${ticket.prioridad}`} color={colorPrioridad[ticket.prioridad] ?? tema.suave} />
            <Insignia texto={ticket.servicio} color={tema.suave} />
            {ticket.vencido && <Insignia texto="Objetivo vencido" color={tema.critico} />}
          </View>
        </View>

        {error && <Alerta mensaje={error} />}

        {ticket.estado === 'En Espera' && ticket.motivo_espera && (
          <Panel titulo="En espera" icono="pause-circle">
            <Text style={{ fontSize: 14, color: tema.texto }}>{ticket.motivo_espera}</Text>
            <Text style={{ fontSize: 12, color: tema.suave }}>Desde {fechaHora(ticket.fecha_espera)}</Text>
          </Panel>
        )}

        <Panel titulo="Descripcion reportada" icono="file-text">
          <Text style={{ fontSize: 14, color: tema.texto, lineHeight: 20 }}>{ticket.descripcion}</Text>
          {ticket.observaciones && (
            <Text style={{ fontSize: 13, color: tema.suave, lineHeight: 19 }}>{ticket.observaciones}</Text>
          )}
        </Panel>

        <Panel titulo="Solucion tecnica" icono="check-circle">
          <Text style={{ fontSize: 14, color: ticket.solucion_detalle ? tema.texto : tema.suave, lineHeight: 20 }}>
            {ticket.solucion_detalle ?? 'Aun no se ha registrado una solucion.'}
          </Text>
        </Panel>

        <Panel titulo="Trazabilidad" icono="user-check">
          <Dato etiqueta="Solicitante" valor={ticket.solicitante_nombre} />
          <Dato etiqueta="Area" valor={ticket.solicitante_area} />
          <Dato etiqueta="Ubicacion" valor={ticket.ubicacion ?? ticket.sucursal_nombre} />
          <Dato etiqueta="Activo" valor={ticket.equipo_codigo} />
          <Dato etiqueta="Atendido por" valor={ticket.asignado_nombre} />
          <Dato etiqueta="Resuelto por" valor={ticket.resuelto_por_nombre} />
        </Panel>

        <Panel titulo="Atencion" icono="clock">
          <Dato
            etiqueta="Objetivo"
            valor={`${OBJETIVOS[ticket.prioridad].texto} (${OBJETIVOS[ticket.prioridad].horas} h)`}
          />
          <Dato etiqueta="Vence" valor={ticket.fecha_objetivo ? fechaHora(ticket.fecha_objetivo) : null} />
          <Dato etiqueta="Prioridad definida por" valor={ticket.prioridad_por_nombre} />
          <Dato etiqueta="Tiempo empleado" valor={duracionEmpleada(ticket.minutos_empleados)} />
          <Dato etiqueta="Creacion" valor={fechaHora(ticket.fecha_creacion)} />
          <Dato etiqueta="Cierre" valor={ticket.fecha_cierre ? fechaHora(ticket.fecha_cierre) : null} />
        </Panel>

        {formulario === 'resolver' && (
          <Panel titulo="Registrar la solucion" icono="check-circle">
            <Campo etiqueta="Solucion aplicada" valor={solucion} alCambiar={setSolucion} multiline />
            <Campo
              etiqueta="Tiempo empleado (minutos)"
              valor={minutos}
              alCambiar={setMinutos}
              keyboardType="numeric"
              placeholder="90"
            />
            <Campo etiqueta="Observaciones" valor={observaciones} alCambiar={setObservaciones} multiline />
            <Boton
              texto="Guardar solucion"
              icono="save"
              deshabilitado={procesando || solucion.trim().length < 10}
              alPresionar={() => void ejecutar(`/tickets/${id}/resolver`, {
                solucion_detalle: solucion.trim(),
                minutos_empleados: minutos === '' ? null : Number(minutos),
                observaciones: observaciones.trim() || null
              })}
            />
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setFormulario('')} />
          </Panel>
        )}

        {formulario === 'espera' && (
          <Panel titulo="Poner en espera" icono="pause-circle">
            <Campo etiqueta="Motivo de la espera" valor={motivo} alCambiar={setMotivo} multiline />
            <Boton
              texto="Poner en espera"
              icono="pause-circle"
              deshabilitado={procesando || motivo.trim().length < 10}
              alPresionar={() => void ejecutar(`/tickets/${id}/espera`, { motivo_espera: motivo.trim() })}
            />
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setFormulario('')} />
          </Panel>
        )}

        {formulario === 'prioridad' && (
          <Panel titulo="Definir la prioridad" icono="bar-chart-2">
            <Selector opciones={PRIORIDADES} valor={prioridad} alCambiar={(v) => setPrioridad(v as PrioridadTicket)} />
            <Text style={{ fontSize: 12, color: tema.suave }}>
              Atencion {OBJETIVOS[prioridad].texto.toLowerCase()} ({OBJETIVOS[prioridad].horas} h).
            </Text>
            <Campo etiqueta="Motivo" valor={motivo} alCambiar={setMotivo} placeholder="Opcional" />
            <Boton
              texto="Guardar prioridad"
              icono="save"
              deshabilitado={procesando}
              alPresionar={() => void ejecutar(`/tickets/${id}/prioridad`, {
                prioridad, motivo: motivo.trim() || null
              })}
            />
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setFormulario('')} />
          </Panel>
        )}

        {formulario === '' && (
          <View style={{ gap: 8 }}>
            {puedeTomar && (
              <Boton texto="Tomar el ticket" icono="user-check" variante="acento"
                deshabilitado={procesando} alPresionar={() => void ejecutar(`/tickets/${id}/tomar`)} />
            )}
            {puedeIniciar && (
              <Boton
                texto={ticket.estado === 'En Espera' ? 'Reanudar la atencion' : 'Iniciar la atencion'}
                icono="play-circle"
                variante="acento"
                deshabilitado={procesando}
                alPresionar={() => void ejecutar(`/tickets/${id}/iniciar`)}
              />
            )}
            {puedeEsperar && (
              <Boton texto="Poner en espera" icono="pause-circle" variante="secundario"
                alPresionar={() => setFormulario('espera')} />
            )}
            {puedeResolver && (
              <Boton texto="Registrar solucion" icono="check-circle"
                alPresionar={() => setFormulario('resolver')} />
            )}
            {puedePrioridad && (
              <Boton texto="Definir la prioridad" icono="bar-chart-2" variante="secundario"
                alPresionar={() => setFormulario('prioridad')} />
            )}
            {puedeCerrar && (
              <Boton texto="Cerrar el ticket" icono="check-square"
                deshabilitado={procesando} alPresionar={() => void ejecutar(`/tickets/${id}/cerrar`)} />
            )}
          </View>
        )}
      </ScrollView>
      <PiePagina />
    </View>
  );
};
