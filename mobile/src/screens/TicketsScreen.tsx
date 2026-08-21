import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { obtenerSocket } from '../lib/socket';
import { usarAuth } from '../context/AuthContext';
import { Boton, Cargando, Insignia, PiePagina, Vacio, estilos } from '../components/Comunes';
import { codigoTicket, colorEstado, colorPrioridad, fechaHora, tema } from '../lib/tema';
import type { Ticket } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'Tickets'>;

export const TicketsScreen = ({ navigation }: Propiedades) => {
  const { usuario, puede, cerrarSesion } = usarAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Ticket[] }>('/tickets');
      setTickets(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'Error al cargar los tickets');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket) return;
    const alCambiar = () => void cargar();
    socket.on('ticket:creado', alCambiar);
    socket.on('ticket:actualizado', alCambiar);
    socket.on('ticket:resuelto', alCambiar);
    return () => {
      socket.off('ticket:creado', alCambiar);
      socket.off('ticket:actualizado', alCambiar);
      socket.off('ticket:resuelto', alCambiar);
    };
  }, [cargar]);

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
          <TouchableOpacity onPress={() => navigation.navigate('Notificaciones')}>
            <Feather name="bell" size={20} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => void cerrarSesion()}>
            <Feather name="log-out" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )
    });
  }, [navigation, cerrarSesion]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  return (
    <View style={estilos.pantalla}>
      <View style={{ padding: 16, gap: 10 }}>
        <View>
          <Text style={estilos.titulo}>{puede('tickets.ver_todos') ? 'Todos los tickets' : 'Mis tickets'}</Text>
          <Text style={estilos.subtitulo}>{usuario?.nombre} - {usuario?.rol}</Text>
        </View>
        {puede('tickets.crear') && (
          <Boton texto="Registrar nuevo ticket" icono="plus-circle" alPresionar={() => navigation.navigate('NuevoTicket')} />
        )}
        {error && <Text style={estilos.error}>{error}</Text>}
      </View>

      {!tickets && <Cargando texto="Consultando tickets" />}

      {tickets && (
        <FlatList
          data={tickets}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
          ListEmptyComponent={<Vacio texto="No existen tickets registrados" />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[estilos.panel, { padding: 14, gap: 8 }]}
              onPress={() => navigation.navigate('DetalleTicket', { id: item.id })}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: tema.acento }}>
                  {codigoTicket(item.id)}
                </Text>
                <Insignia texto={item.estado} color={colorEstado[item.estado]} />
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tema.texto }}>{item.titulo}</Text>
              <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                <Insignia texto={item.categoria} color={tema.suave} />
                <Insignia texto={item.prioridad} color={colorPrioridad[item.prioridad]} />
              </View>
              <Text style={{ fontSize: 11, color: tema.suave }}>
                {item.solicitante_nombre} - {fechaHora(item.fecha_creacion)}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <PiePagina />
    </View>
  );
};
