import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { Alerta, Boton, Cargando, Insignia, Selector, Tarjeta, Vacio, estilos } from '../components/Comunes';
import { codigoTicket, fechaCorta } from '../lib/formato';
import { colorEstado, colorPrioridad, tema } from '../lib/tema';
import { ESTADOS } from '../lib/constantes';
import type { Ticket } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'Tickets'>;

const FILTROS_ESTADO = ['Todos', ...ESTADOS];

export const TicketsScreen = ({ navigation }: Propiedades) => {
  const { puede } = usarAuth();
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [estado, setEstado] = useState('Todos');
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Ticket[] }>('/tickets', {
        parametros: { limite: 50, pagina: 1, estado: estado === 'Todos' ? '' : estado }
      });
      setTickets(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar los tickets');
    }
  }, [estado]);

  useEffect(() => {
    const quitar = navigation.addListener('focus', () => { void cargar(); });
    return quitar;
  }, [navigation, cargar]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  return (
    <View style={estilos.pantalla}>
      <View style={{ padding: 12, gap: 10, backgroundColor: tema.panel, borderBottomWidth: 1, borderBottomColor: tema.borde }}>
        <Selector opciones={FILTROS_ESTADO} valor={estado} alCambiar={setEstado} />
        {puede('tickets.crear') && (
          <Boton texto="Registrar un ticket" icono="plus-circle" alPresionar={() => navigation.navigate('NuevoTicket')} />
        )}
      </View>

      {error && <View style={{ padding: 12 }}><Alerta mensaje={error} /></View>}
      {!tickets && !error && <Cargando texto="Consultando tickets" />}

      {tickets && (
        <FlatList
          data={tickets}
          keyExtractor={(t) => String(t.id)}
          contentContainerStyle={estilos.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
          ListEmptyComponent={<Vacio texto="No hay tickets con ese criterio" />}
          renderItem={({ item }) => (
            <Tarjeta alPresionar={() => navigation.navigate('DetalleTicket', { id: item.id })}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: tema.acento }}>
                  {codigoTicket(item)}
                </Text>
                {item.vencido && (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                    <Feather name="alert-triangle" size={12} color={tema.critico} />
                    <Text style={{ fontSize: 11, fontWeight: '700', color: tema.critico }}>Vencido</Text>
                  </View>
                )}
              </View>
              <Text style={{ fontSize: 15, fontWeight: '600', color: tema.texto }}>{item.titulo}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Insignia texto={item.estado} color={colorEstado[item.estado] ?? tema.suave} />
                <Insignia texto={item.prioridad} color={colorPrioridad[item.prioridad] ?? tema.suave} />
                <Insignia texto={item.servicio} color={tema.suave} />
              </View>
              <Text style={{ fontSize: 12, color: tema.suave }}>
                {item.solicitante_nombre} - {fechaCorta(item.fecha_creacion)}
              </Text>
            </Tarjeta>
          )}
        />
      )}
    </View>
  );
};
