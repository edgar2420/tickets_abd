import React, { useEffect, useState } from 'react';
import { ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { Boton, Panel, PiePagina, estilos } from '../components/Comunes';
import { tema } from '../lib/tema';
import type { PrioridadTicket, Ticket } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'NuevoTicket'>;

const PRIORIDADES: PrioridadTicket[] = ['Baja', 'Media', 'Alta', 'Critica'];

interface Categoria {
  id: number;
  nombre: string;
  descripcion: string | null;
}

const Selector = <T extends string>({ etiqueta, opciones, valor, alCambiar }: {
  etiqueta: string;
  opciones: T[];
  valor: T;
  alCambiar: (opcion: T) => void;
}) => (
  <View>
    <Text style={estilos.etiqueta}>{etiqueta}</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {opciones.map((opcion) => {
        const activo = opcion === valor;
        return (
          <TouchableOpacity
            key={opcion}
            onPress={() => alCambiar(opcion)}
            style={{
              paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, borderWidth: 1,
              borderColor: activo ? tema.primario : tema.borde,
              backgroundColor: activo ? tema.primario : '#FFFFFF'
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: '600', color: activo ? '#FFFFFF' : tema.texto }}>{opcion}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  </View>
);

export const NuevoTicketScreen = ({ navigation }: Propiedades) => {
  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState('');
  const [prioridad, setPrioridad] = useState<PrioridadTicket>('Media');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  // El catalogo de categorias se administra desde el panel web
  useEffect(() => {
    void api<{ datos: Categoria[] }>('/categorias', { parametros: { activas: true } })
      .then(({ datos }) => {
        setCategorias(datos);
        setCategoria((actual) => actual || datos[0]?.nombre || '');
      })
      .catch(() => setError('No fue posible cargar las categorias'));
  }, []);

  const registrar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const { datos } = await api<{ datos: Ticket }>('/tickets', {
        metodo: 'POST',
        cuerpo: { titulo, descripcion, categoria, prioridad }
      });
      navigation.replace('DetalleTicket', { id: datos.id });
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar el ticket');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido}>
        <Panel titulo="Datos del requerimiento" icono="clipboard">
          <View>
            <Text style={estilos.etiqueta}>Titulo</Text>
            <TextInput
              style={estilos.campo}
              value={titulo}
              onChangeText={setTitulo}
              placeholder="Resumen breve del problema"
              placeholderTextColor="#94A3B8"
            />
          </View>

          <Selector
            etiqueta="Categoria"
            opciones={categorias.map((c) => c.nombre)}
            valor={categoria}
            alCambiar={setCategoria}
          />
          <Selector etiqueta="Prioridad" opciones={PRIORIDADES} valor={prioridad} alCambiar={setPrioridad} />

          <View>
            <Text style={estilos.etiqueta}>Descripcion detallada</Text>
            <TextInput
              style={[estilos.campo, { minHeight: 130, textAlignVertical: 'top' }]}
              multiline
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Equipo afectado, mensaje de error y pasos realizados"
              placeholderTextColor="#94A3B8"
            />
          </View>

          {error && <Text style={estilos.error}>{error}</Text>}

          <Boton
            texto="Registrar ticket"
            icono="save"
            deshabilitado={enviando || !categoria || titulo.trim().length < 6 || descripcion.trim().length < 10}
            alPresionar={() => void registrar()}
          />
        </Panel>
      </ScrollView>
      <PiePagina />
    </View>
  );
};
