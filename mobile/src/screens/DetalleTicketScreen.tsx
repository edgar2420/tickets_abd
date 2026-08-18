import React, { useCallback, useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { obtenerSocket } from '../lib/socket';
import { usarAuth } from '../context/AuthContext';
import { Boton, Cargando, Dato, Insignia, Panel, PiePagina, estilos } from '../components/Comunes';
import { codigoTicket, colorEstado, colorPrioridad, fechaHora, tema } from '../lib/tema';
import type { Ticket } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'DetalleTicket'>;

export const DetalleTicketScreen = ({ route, navigation }: Propiedades) => {
  const { id } = route.params;
  const { usuario, puede } = usarAuth();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [procesando, setProcesando] = useState(false);
  const [modalSolucion, setModalSolucion] = useState(false);
  const [solucion, setSolucion] = useState('');

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Ticket }>(`/tickets/${id}`);
      setTicket(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar el ticket');
    }
  }, [id]);

  useEffect(() => {
    void cargar();
    navigation.setOptions({ title: codigoTicket(id) });
  }, [cargar, id, navigation]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket) return;
    socket.emit('ticket:suscribir', id);
    const alCambiar = (actualizado: Ticket) => {
      if (actualizado.id === id) void cargar();
    };
    socket.on('ticket:actualizado', alCambiar);
    socket.on('ticket:resuelto', alCambiar);
    return () => {
      socket.emit('ticket:desuscribir', id);
      socket.off('ticket:actualizado', alCambiar);
      socket.off('ticket:resuelto', alCambiar);
    };
  }, [id, cargar]);

  const ejecutar = async (ruta: string, cuerpo?: unknown) => {
    setProcesando(true);
    setError(null);
    try {
      const { datos } = await api<{ datos: Ticket }>(ruta, { metodo: 'PUT', cuerpo });
      setTicket(datos);
      setModalSolucion(false);
      setSolucion('');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible completar la operacion');
    } finally {
      setProcesando(false);
    }
  };

  if (!ticket) return <Cargando texto="Consultando el ticket" />;

  const esSolicitante = ticket.solicitante_id === usuario?.id;
  const puedeTomar = puede('tickets.responder') && ticket.estado === 'Abierto';
  const puedeResolver = puede('tickets.resolver') && ['Abierto', 'En Proceso'].includes(ticket.estado);
  const puedeCerrar = ticket.estado === 'Resuelto' && (esSolicitante || puede('tickets.resolver'));

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <View style={{ gap: 8 }}>
          <Text style={estilos.titulo}>{ticket.titulo}</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            <Insignia texto={ticket.estado} color={colorEstado[ticket.estado]} />
            <Insignia texto={`Prioridad ${ticket.prioridad}`} color={colorPrioridad[ticket.prioridad]} />
            <Insignia texto={ticket.categoria} color={tema.suave} />
          </View>
        </View>

        {error && <Text style={estilos.error}>{error}</Text>}

        <Panel titulo="Descripcion reportada" icono="file-text">
          <Text style={{ fontSize: 14, lineHeight: 21, color: tema.texto }}>{ticket.descripcion}</Text>
        </Panel>

        <Panel titulo="Trazabilidad" icono="users">
          <Dato etiqueta="Solicitante" valor={ticket.solicitante_nombre} />
          <Dato etiqueta="Area solicitante" valor={ticket.solicitante_area} />
          <Dato etiqueta="Atendido por" valor={ticket.asignado_nombre} />
          <Dato etiqueta="Resuelto por" valor={ticket.resuelto_por_nombre} />
        </Panel>

        <Panel titulo="Linea de tiempo" icono="clock">
          <Dato etiqueta="Creacion" valor={fechaHora(ticket.fecha_creacion)} />
          <Dato etiqueta="Asignacion" valor={ticket.fecha_asignacion ? fechaHora(ticket.fecha_asignacion) : null} />
          <Dato etiqueta="Resolucion" valor={ticket.fecha_resolucion ? fechaHora(ticket.fecha_resolucion) : null} />
        </Panel>

        <Panel titulo="Solucion tecnica" icono="check-circle">
          <Text style={{ fontSize: 14, lineHeight: 21, color: ticket.solucion_detalle ? tema.texto : tema.suave }}>
            {ticket.solucion_detalle ?? 'Aun no se ha registrado una solucion para este requerimiento.'}
          </Text>
        </Panel>

        <View style={{ gap: 10 }}>
          {puedeTomar && (
            <Boton texto="Atender ticket" icono="play-circle" variante="acento"
              deshabilitado={procesando} alPresionar={() => void ejecutar(`/tickets/${id}/tomar`)} />
          )}
          {puedeResolver && (
            <Boton texto="Registrar solucion" icono="check-circle"
              deshabilitado={procesando} alPresionar={() => setModalSolucion(true)} />
          )}
          {puedeCerrar && (
            <Boton texto="Cerrar ticket" icono="archive" variante="secundario"
              deshabilitado={procesando} alPresionar={() => void ejecutar(`/tickets/${id}/cerrar`)} />
          )}
        </View>
      </ScrollView>

      <Modal visible={modalSolucion} animationType="slide" transparent onRequestClose={() => setModalSolucion(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(15,23,42,0.6)', justifyContent: 'flex-end' }}>
          <View style={{ backgroundColor: '#FFFFFF', borderTopLeftRadius: 16, borderTopRightRadius: 16, padding: 18, gap: 12 }}>
            <Text style={estilos.titulo}>Registrar solucion tecnica</Text>
            <TextInput
              style={[estilos.campo, { minHeight: 120, textAlignVertical: 'top' }]}
              multiline
              value={solucion}
              onChangeText={setSolucion}
              placeholder="Describa el diagnostico y las acciones ejecutadas"
              placeholderTextColor="#94A3B8"
            />
            <Boton
              texto="Guardar solucion"
              icono="save"
              deshabilitado={procesando || solucion.trim().length < 10}
              alPresionar={() => void ejecutar(`/tickets/${id}/resolver`, { solucion_detalle: solucion.trim() })}
            />
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setModalSolucion(false)} />
          </View>
        </View>
      </Modal>

      <PiePagina />
    </View>
  );
};
