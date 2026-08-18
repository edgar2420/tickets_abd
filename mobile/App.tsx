import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProveedorAuth, usarAuth } from './src/context/AuthContext';
import { LoginScreen } from './src/screens/LoginScreen';
import { TicketsScreen } from './src/screens/TicketsScreen';
import { NuevoTicketScreen } from './src/screens/NuevoTicketScreen';
import { DetalleTicketScreen } from './src/screens/DetalleTicketScreen';
import { NotificacionesScreen } from './src/screens/NotificacionesScreen';
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
      <Pila.Screen name="Tickets" component={TicketsScreen} options={{ title: 'Mesa de Ayuda TI' }} />
      <Pila.Screen name="NuevoTicket" component={NuevoTicketScreen} options={{ title: 'Nuevo ticket' }} />
      <Pila.Screen name="DetalleTicket" component={DetalleTicketScreen} options={{ title: 'Detalle' }} />
      <Pila.Screen name="Notificaciones" component={NotificacionesScreen} options={{ title: 'Notificaciones' }} />
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
