import React, { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { Alerta, Boton, Campo, Dato, PiePagina, Panel, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';

const LARGO_MINIMO = 10;

export const PerfilScreen = () => {
  const { usuario, cerrarSesion } = usarAuth();

  const [cambiando, setCambiando] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const coinciden = nueva.length > 0 && nueva === repetida;
  const sinEspacios = !/\s/.test(nueva);
  const conNumero = /\d/.test(nueva);
  const conLetra = /[a-zA-Z]/.test(nueva);
  const cumple = nueva.length >= LARGO_MINIMO && sinEspacios && conNumero && conLetra;

  const cambiar = async () => {
    setGuardando(true);
    setError(null);
    setAviso(null);
    try {
      await api('/auth/cambiar-password', {
        metodo: 'POST',
        cuerpo: { passwordActual: actual, passwordNueva: nueva }
      });
      setAviso('Su contraseña fue cambiada. La proxima vez use la nueva.');
      setActual('');
      setNueva('');
      setRepetida('');
      setCambiando(false);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        {error && <Alerta mensaje={error} />}
        {aviso && (
          <Text style={{
            backgroundColor: '#DCFCE7', borderColor: '#86EFAC', borderWidth: 1, borderRadius: 8,
            padding: 10, color: '#166534', fontSize: 13
          }}>
            {aviso}
          </Text>
        )}

        <Panel titulo="Mi cuenta" icono="user">
          <Dato etiqueta="Nombre" valor={usuario?.nombre} />
          <Dato etiqueta="Usuario" valor={usuario?.usuario} />
          <Dato etiqueta="Rol" valor={usuario?.rol} />
          <Dato etiqueta="Area" valor={usuario?.area} />
          <Dato etiqueta="Sucursal" valor={usuario?.sucursal} />
          <Dato etiqueta="Permisos activos" valor={`${usuario?.permisos.length ?? 0} concedidos por el rol`} />
        </Panel>

        {cambiando ? (
          <Panel titulo="Cambiar mi contraseña" icono="key">
            <Campo etiqueta="Contraseña actual" valor={actual} alCambiar={setActual}
              secureTextEntry autoCapitalize="none" />
            <Campo etiqueta="Contraseña nueva" valor={nueva} alCambiar={setNueva}
              secureTextEntry autoCapitalize="none" />
            <Campo etiqueta="Repita la contraseña nueva" valor={repetida} alCambiar={setRepetida}
              secureTextEntry autoCapitalize="none" />

            <View style={{ gap: 3 }}>
              {[
                [`Al menos ${LARGO_MINIMO} caracteres`, nueva.length >= LARGO_MINIMO],
                ['Sin espacios en blanco', sinEspacios],
                ['Al menos un numero', conNumero],
                ['Al menos una letra', conLetra],
                ['Las dos coinciden', coinciden]
              ].map(([texto, cumplida]) => (
                <Text key={String(texto)} style={{
                  fontSize: 12,
                  color: cumplida ? tema.ok : tema.suave
                }}>
                  {cumplida ? '-' : '-'} {texto}
                </Text>
              ))}
            </View>

            <Boton texto="Cambiar contraseña" icono="key"
              deshabilitado={guardando || !cumple || !coinciden || actual.length === 0}
              alPresionar={() => void cambiar()} />
            <Boton texto="Cancelar" variante="secundario" alPresionar={() => setCambiando(false)} />
          </Panel>
        ) : (
          <Boton texto="Cambiar mi contraseña" icono="key" variante="secundario"
            alPresionar={() => { setCambiando(true); setAviso(null); }} />
        )}

        <Boton texto="Cerrar sesion" icono="log-out" variante="peligro"
          alPresionar={() => void cerrarSesion()} />
      </ScrollView>
      <PiePagina />
    </View>
  );
};
