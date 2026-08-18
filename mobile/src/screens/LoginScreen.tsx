import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { usarAuth } from '../context/AuthContext';
import { Boton, PiePagina, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';

export const LoginScreen = () => {
  const { iniciarSesion } = usarAuth();
  const [usuario, setUsuario] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [verPassword, setVerPassword] = useState(false);

  const ingresar = async () => {
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(usuario.trim(), password);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible iniciar sesion');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: tema.primario }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}>
          <View style={{ alignItems: 'center', marginBottom: 28 }}>
            <Feather name="shield" size={44} color="#93C5FD" />
            <Text style={{ color: '#FFFFFF', fontSize: 20, fontWeight: '700', marginTop: 12, textAlign: 'center' }}>
              Mesa de Ayuda TI
            </Text>
            <Text style={{ color: '#BFDBFE', fontSize: 13, marginTop: 4, textAlign: 'center' }}>
              Gestion de tickets y control de acceso
            </Text>
          </View>

          <View style={[estilos.panel, { padding: 18, gap: 14 }]}>
            <View>
              <Text style={estilos.etiqueta}>Usuario</Text>
              <TextInput
                style={estilos.campo}
                autoCapitalize="none"
                autoCorrect={false}
                value={usuario}
                onChangeText={setUsuario}
                placeholder="usuario institucional"
                placeholderTextColor="#94A3B8"
              />
            </View>
            <View>
              <Text style={estilos.etiqueta}>Contrasena</Text>
              <View style={{ justifyContent: 'center' }}>
                <TextInput
                  style={[estilos.campo, { paddingRight: 44 }]}
                  secureTextEntry={!verPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="contrasena"
                  placeholderTextColor="#94A3B8"
                />
                <TouchableOpacity
                  onPress={() => setVerPassword((v) => !v)}
                  style={{ position: 'absolute', right: 10, padding: 4 }}
                  accessibilityLabel={verPassword ? 'Ocultar contrasena' : 'Mostrar contrasena'}
                >
                  <Feather name={verPassword ? 'eye-off' : 'eye'} size={18} color={tema.suave} />
                </TouchableOpacity>
              </View>
              {password.length > 0 && password === password.toUpperCase() && password !== password.toLowerCase() && (
                <Text style={{ marginTop: 6, fontSize: 12, color: '#B45309', fontWeight: '600' }}>
                  La contrasena esta escrita en mayusculas
                </Text>
              )}
            </View>

            {error && <Text style={estilos.error}>{error}</Text>}

            <Boton
              texto={enviando ? 'Validando credenciales' : 'Ingresar'}
              icono="log-in"
              alPresionar={() => void ingresar()}
              deshabilitado={enviando || !usuario || !password}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
      <PiePagina />
    </View>
  );
};
