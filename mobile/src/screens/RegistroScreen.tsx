import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { API_URL } from '../lib/config';
import { Alerta, Boton, Campo, Panel, PiePagina, Selector, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';

const LARGO_MINIMO = 10;

interface Catalogo {
  areas: { id: number; nombre: string }[];
  sucursales: { id: number; nombre: string; codigo: string }[];
}

export const RegistroScreen = ({ alVolver }: { alVolver: () => void }) => {
  const [catalogo, setCatalogo] = useState<Catalogo | null>(null);
  const [nombre, setNombre] = useState('');
  const [usuario, setUsuario] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [repetida, setRepetida] = useState('');
  const [area, setArea] = useState('');
  const [sucursal, setSucursal] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/auth/catalogo-registro`)
      .then((r) => r.json())
      .then((r) => {
        setCatalogo(r.datos);
        setArea(r.datos?.areas?.[0]?.nombre ?? '');
        setSucursal(r.datos?.sucursales?.[0]?.nombre ?? '');
      })
      .catch(() => setError('No fue posible cargar las areas y sucursales'));
  }, []);

  const coinciden = password.length > 0 && password === repetida;
  const sinEspacios = !/\s/.test(password);
  const conNumero = /\d/.test(password);
  const conLetra = /[a-zA-Z]/.test(password);
  const cumple = password.length >= LARGO_MINIMO && sinEspacios && conNumero && conLetra;

  const completo = nombre.trim().length >= 6 && usuario.trim().length >= 3
    && area !== '' && sucursal !== '' && cumple && coinciden;

  const registrar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const idArea = catalogo?.areas.find((a) => a.nombre === area)?.id;
      const idSucursal = catalogo?.sucursales.find((s) => s.nombre === sucursal)?.id;

      const respuesta = await fetch(`${API_URL}/auth/registro`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombre.trim(),
          usuario: usuario.trim(),
          email: email.trim() || null,
          password,
          area_id: idArea,
          sucursal_id: idSucursal
        })
      });
      const cuerpo = await respuesta.json();
      if (!respuesta.ok) throw new Error(cuerpo.mensaje ?? 'No fue posible registrar la cuenta');
      setListo(true);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar la cuenta');
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    return (
      <View style={[estilos.pantalla, { justifyContent: 'center', padding: 24 }]}>
        <View style={{ alignItems: 'center', gap: 12 }}>
          <Feather name="check-circle" size={44} color={tema.ok} />
          <Text style={estilos.titulo}>Su cuenta quedo registrada</Text>
          <Text style={[estilos.subtitulo, { textAlign: 'center' }]}>
            Sistemas debe habilitarla antes de que pueda entrar. Le llegara un aviso en cuanto la aprueben.
          </Text>
          <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
            <Boton texto="Volver al inicio de sesion" icono="arrow-left" alPresionar={alVolver} />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        <View>
          <Text style={estilos.titulo}>Crear una cuenta</Text>
          <Text style={estilos.subtitulo}>
            Complete sus datos. Sistemas revisara la solicitud y le habilitara el acceso.
          </Text>
        </View>

        {error && <Alerta mensaje={error} />}

        <Panel titulo="Quien es usted" icono="user">
          <Campo etiqueta="Nombre completo" valor={nombre} alCambiar={setNombre} maxLength={120} />
          <Campo etiqueta="Usuario" valor={usuario} autoCapitalize="none"
            alCambiar={(v) => setUsuario(v.toLowerCase().replace(/[^a-z0-9._-]/g, ''))}
            placeholder="maria.quispe" maxLength={40} />
          <Campo etiqueta="Correo (opcional)" valor={email} alCambiar={setEmail} autoCapitalize="none" />
        </Panel>

        <Panel titulo="Donde trabaja" icono="map-pin">
          <Selector etiqueta="Area" opciones={(catalogo?.areas ?? []).map((a) => a.nombre)}
            valor={area} alCambiar={setArea} />
          <Selector etiqueta="Sucursal" opciones={(catalogo?.sucursales ?? []).map((s) => s.nombre)}
            valor={sucursal} alCambiar={setSucursal} />
        </Panel>

        <Panel titulo="Su contraseña" icono="key">
          <Campo etiqueta="Contraseña" valor={password} alCambiar={setPassword}
            secureTextEntry autoCapitalize="none" />
          <Campo etiqueta="Repita la contraseña" valor={repetida} alCambiar={setRepetida}
            secureTextEntry autoCapitalize="none" />
          <View style={{ gap: 3 }}>
            {[
              [`Al menos ${LARGO_MINIMO} caracteres`, password.length >= LARGO_MINIMO],
              ['Sin espacios en blanco', sinEspacios],
              ['Al menos un numero', conNumero],
              ['Al menos una letra', conLetra],
              ['Las dos coinciden', coinciden]
            ].map(([texto, ok]) => (
              <Text key={String(texto)} style={{ fontSize: 12, color: ok ? tema.ok : tema.suave }}>
                {texto}
              </Text>
            ))}
          </View>
        </Panel>

        <Boton texto="Enviar la solicitud" icono="user-plus"
          deshabilitado={enviando || !completo} alPresionar={() => void registrar()} />
        <Boton texto="Ya tengo cuenta" variante="secundario" icono="arrow-left" alPresionar={alVolver} />
      </ScrollView>
      <PiePagina />
    </View>
  );
};
