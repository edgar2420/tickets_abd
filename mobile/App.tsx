import React from 'react';
import { TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Feather } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorAuth, usarAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { InicioScreen } from './src/screens/InicioScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { NuevoTicketScreen } from './src/screens/NuevoTicketScreen';
import { DetalleTicketScreen } from './src/screens/DetalleTicketScreen';
import { MantenimientoScreen } from './src/screens/MantenimientoScreen';
import { EquiposScreen } from './src/screens/EquiposScreen';
import { ComprasScreen } from './src/screens/ComprasScreen';
import { ProyectosScreen } from './src/screens/ProyectosScreen';
import { NotificacionesScreen } from './src/screens/NotificacionesScreen';
import { PerfilScreen } from './src/screens/PerfilScreen';
import { Cargando } from './src/components/Comunes';
import { tema } from './src/lib/tema';
import type { ParametrosNavegacion } from './src/navegacion';

const Pila = createNativeStackNavigator<ParametrosNavegacion>();

const opcionesEncabezado = {
  headerStyle: { backgroundColor: tema.primario },
  headerTintColor: '#FFFFFF',
  headerTitleStyle: { fontWeight: '700' as const }
};

const Navegacion = () => {
  const { usuario, cargando } = usarAuth();

  if (cargando) return <Cargando texto="Validando sesion" />;
  if (!usuario) return <LoginScreen />;

  return (
    <Pila.Navigator screenOptions={opcionesEncabezado}>
      <Pila.Screen
        name="Inicio"
        component={InicioScreen}
        options={({ navigation }) => ({
          title: 'Mesa de Ayuda TI',
          headerRight: () => (
            <TouchableOpacity onPress={() => navigation.navigate('Notificaciones')}>
              <Feather name="bell" size={20} color="#FFFFFF" />
            </TouchableOpacity>
          )
        })}
      />
      <Pila.Screen name="Tickets" component={TicketsScreen} options={{ title: 'Tickets' }} />
      <Pila.Screen name="NuevoTicket" component={NuevoTicketScreen} options={{ title: 'Nuevo ticket' }} />
      <Pila.Screen name="DetalleTicket" component={DetalleTicketScreen} options={{ title: 'Detalle del ticket' }} />
      <Pila.Screen name="Mantenimiento" component={MantenimientoScreen} options={{ title: 'Mantenimiento preventivo' }} />
      <Pila.Screen name="Equipos" component={EquiposScreen} options={{ title: 'Equipos' }} />
      <Pila.Screen name="Compras" component={ComprasScreen} options={{ title: 'Compras' }} />
      <Pila.Screen name="Proyectos" component={ProyectosScreen} options={{ title: 'Proyectos' }} />
      <Pila.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Avisos' }} />
      <Pila.Screen name="Perfil" component={PerfilScreen} options={{ title: 'Mi perfil' }} />
    </Pila.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <ProveedorAuth>
          <StatusBar style="light" />
          <Navegacion />
        </ProveedorAuth>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
