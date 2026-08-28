import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, Text, TextInput, View } from 'react-native';
import { api } from '../lib/api';
import { Alerta, Cargando, Dato, Insignia, Tarjeta, Vacio, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';
import type { Equipo } from '../lib/tipos';

const COLOR_ESTADO: Record<string, string> = {
  'Operativo': tema.ok,
  'En reparacion': tema.advertencia,
  'En resguardo': tema.acento,
  'De baja': tema.suave
};

export const EquiposScreen = () => {
  const [equipos, setEquipos] = useState<Equipo[] | null>(null);
  const [busqueda, setBusqueda] = useState('');
  const [abierto, setAbierto] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: Equipo[] }>('/equipos', {
        parametros: { limite: 100, pagina: 1, busqueda }
      });
      setEquipos(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar los equipos');
    }
  }, [busqueda]);

  useEffect(() => {
    const temporizador = setTimeout(() => { void cargar(); }, 300);
    return () => clearTimeout(temporizador);
  }, [cargar]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  return (
    <View style={estilos.pantalla}>
      <View style={{ padding: 12, backgroundColor: tema.panel, borderBottomWidth: 1, borderBottomColor: tema.borde }}>
        <TextInput
          style={estilos.campo}
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Buscar por codigo, nombre o serie"
          placeholderTextColor={tema.suave}
        />
      </View>

      {error && <View style={{ padding: 12 }}><Alerta mensaje={error} /></View>}
      {!equipos && !error && <Cargando texto="Consultando el parque" />}

      {equipos && (
        <FlatList
          data={equipos}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={estilos.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
          ListEmptyComponent={<Vacio texto="No se encontraron equipos" />}
          renderItem={({ item }) => (
            <Tarjeta alPresionar={() => setAbierto(abierto === item.id ? null : item.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: tema.acento }}>
                  {item.codigo}
                </Text>
                <Insignia texto={item.estado} color={COLOR_ESTADO[item.estado] ?? tema.suave} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: tema.texto }}>{item.nombre_equipo}</Text>
              <Text style={{ fontSize: 12, color: tema.suave }}>
                {[item.tipo, item.marca, item.modelo].filter(Boolean).join(' ')}
              </Text>

              {abierto === item.id && (
                <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: tema.borde, paddingTop: 10 }}>
                  <Dato etiqueta="Numero de serie" valor={item.numero_serie} />
                  <Dato etiqueta="Ubicacion" valor={item.ubicacion} />
                  <Dato etiqueta="Responsable" valor={item.usuario_nombre} />
                  <Dato etiqueta="Area" valor={item.area_nombre} />
                  <Dato etiqueta="Sucursal" valor={item.sucursal_nombre} />
                </View>
              )}
            </Tarjeta>
          )}
        />
      )}
    </View>
  );
};
