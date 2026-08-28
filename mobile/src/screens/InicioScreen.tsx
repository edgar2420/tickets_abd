import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { Alerta, Cargando, Indicador, PiePagina, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';
import type { Indicadores } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'Inicio'>;

interface Modulo {
  destino: keyof ParametrosNavegacion;
  titulo: string;
  icono: keyof typeof Feather.glyphMap;
  permisos: string[];
}

const MODULOS: Modulo[] = [
  { destino: 'Tickets', titulo: 'Tickets', icono: 'inbox', permisos: ['tickets.ver_propios', 'tickets.ver_todos'] },
  { destino: 'NuevoTicket', titulo: 'Nuevo ticket', icono: 'plus-circle', permisos: ['tickets.crear'] },
  { destino: 'Mantenimiento', titulo: 'Mantenimiento', icono: 'tool', permisos: ['mantenimiento.ver'] },
  { destino: 'Equipos', titulo: 'Equipos', icono: 'monitor', permisos: ['equipos.ver'] },
  { destino: 'Compras', titulo: 'Compras', icono: 'shopping-cart', permisos: ['compras.solicitar', 'compras.ver_todas'] },
  { destino: 'Proyectos', titulo: 'Proyectos', icono: 'zap', permisos: ['proyectos.solicitar', 'proyectos.ver_todas'] },
  { destino: 'Notificaciones', titulo: 'Avisos', icono: 'bell', permisos: [] },
  { destino: 'Perfil', titulo: 'Mi perfil', icono: 'user', permisos: [] }
];

export const InicioScreen = ({ navigation }: Propiedades) => {
  const { usuario, puede } = usarAuth();
  const [resumen, setResumen] = useState<Indicadores | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);

  const verTodo = puede('tickets.ver_todos');

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: { resumen: Indicadores } }>('/tickets/tablero');
      setResumen(datos.resumen);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar los indicadores');
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  const disponibles = MODULOS.filter((m) => m.permisos.length === 0 || puede(...m.permisos));

  return (
    <View style={estilos.pantalla}>
      <ScrollView
        contentContainerStyle={estilos.contenido}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
      >
        <View>
          <Text style={estilos.titulo}>Hola, {usuario?.nombre}</Text>
          <Text style={estilos.subtitulo}>
            {usuario?.rol} - {usuario?.area}
            {usuario?.sucursal ? ` - ${usuario.sucursal}` : ''}
          </Text>
        </View>

        {error && <Alerta mensaje={error} />}

        {!resumen && !error && <Cargando texto="Calculando indicadores" />}

        {resumen && (
          <>
            <Text style={estilos.etiqueta}>{verTodo ? 'Mesa de ayuda' : 'Mis tickets'}</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              <Indicador etiqueta="Abiertos" valor={resumen.abiertos} color={tema.acento} />
              <Indicador etiqueta="En proceso" valor={resumen.en_proceso} color={tema.advertencia} />
              <Indicador etiqueta="Criticos" valor={resumen.criticos} color={tema.critico} />
              {verTodo && <Indicador etiqueta="Fuera de objetivo" valor={resumen.vencidos} color={tema.critico} />}
              {verTodo && <Indicador etiqueta="En espera" valor={resumen.en_espera} color={tema.advertencia} />}
              {verTodo && <Indicador etiqueta="Resueltos" valor={resumen.resueltos} color={tema.ok} />}
            </View>
          </>
        )}

        <Text style={estilos.etiqueta}>Modulos</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {disponibles.map((modulo) => (
            <TouchableOpacity
              key={modulo.destino}
              onPress={() => navigation.navigate(modulo.destino as never)}
              activeOpacity={0.7}
              style={{
                flexGrow: 1, flexBasis: '45%', backgroundColor: tema.panel, borderRadius: 10,
                borderWidth: 1, borderColor: tema.borde, padding: 16, gap: 8, alignItems: 'flex-start'
              }}
            >
              <Feather name={modulo.icono} size={22} color={tema.acento} />
              <Text style={{ fontSize: 14, fontWeight: '700', color: tema.primario }}>{modulo.titulo}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <PiePagina />
    </View>
  );
};
