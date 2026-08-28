import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { obtenerSocket } from '../lib/socket';
import { Boton, Cargando, PiePagina, Vacio, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';
import { fechaHora } from '../lib/formato';
import type { Notificacion } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'Notificaciones'>;

export const NotificacionesScreen = ({ navigation }: Propiedades) => {
  const [notificaciones, setNotificaciones] = useState<Notificacion[] | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    const { datos } = await api<{ datos: Notificacion[] }>('/notificaciones');
    setNotificaciones(datos);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket) return;
    const alRecibir = (notificacion: Notificacion) =>
      setNotificaciones((previas) => [{ ...notificacion, leida: false }, ...(previas ?? [])]);
    socket.on('notificacion:nueva', alRecibir);
    return () => {
      socket.off('notificacion:nueva', alRecibir);
    };
  }, []);

  const abrir = async (notificacion: Notificacion) => {
    if (!notificacion.leida && notificacion.id) {
      await api(`/notificaciones/${notificacion.id}/leida`, { metodo: 'PUT' }).catch(() => undefined);
    }
    if (notificacion.ticket_id) navigation.navigate('DetalleTicket', { id: notificacion.ticket_id });
  };

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  if (!notificaciones) return <Cargando texto="Consultando notificaciones" />;

  return (
    <View style={estilos.pantalla}>
      <View style={{ padding: 16 }}>
        <Boton
          texto="Marcar todas como leidas"
          icono="check-square"
          variante="secundario"
          alPresionar={() => {
            void api('/notificaciones/leidas', { metodo: 'PUT' }).then(() => cargar());
          }}
        />
      </View>

      <FlatList
        data={notificaciones}
        keyExtractor={(item, indice) => String(item.id ?? indice)}
        contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20, gap: 10 }}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
        ListEmptyComponent={<Vacio texto="Sin notificaciones registradas" />}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[estilos.panel, { padding: 14, gap: 6, backgroundColor: item.leida ? '#FFFFFF' : '#EFF6FF' }]}
            onPress={() => void abrir(item)}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Feather name="bell" size={14} color={tema.acento} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: tema.primario, flex: 1 }}>{item.titulo}</Text>
            </View>
            <Text style={{ fontSize: 13, color: tema.texto }}>{item.mensaje}</Text>
            <Text style={{ fontSize: 11, color: tema.suave }}>{fechaHora(item.fecha)}</Text>
          </TouchableOpacity>
        )}
      />

      <PiePagina />
    </View>
  );
};
