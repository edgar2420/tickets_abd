import React, { useEffect, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import { Alerta, Boton, Campo, PiePagina, Panel, Selector, estilos } from '../components/Comunes';
import { AYUDA_SERVICIO, PRIORIDADES, SERVICIOS } from '../lib/constantes';
import { tema } from '../lib/tema';
import type { Categoria, Equipo, PrioridadTicket, ServicioTicket, Ticket } from '../lib/tipos';
import type { ParametrosNavegacion } from '../navegacion';

type Propiedades = NativeStackScreenProps<ParametrosNavegacion, 'NuevoTicket'>;

const SIN_EQUIPO = 'Ninguno';

export const NuevoTicketScreen = ({ navigation }: Propiedades) => {
  const { puede } = usarAuth();
  const defineLaPrioridad = puede('tickets.priorizar');

  const [titulo, setTitulo] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [servicio, setServicio] = useState<ServicioTicket>('Soporte informatico');
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [categoria, setCategoria] = useState('');
  const [ubicacion, setUbicacion] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [equipoCodigo, setEquipoCodigo] = useState(SIN_EQUIPO);
  const [prioridad, setPrioridad] = useState<PrioridadTicket>('Media');
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    void api<{ datos: Categoria[] }>('/categorias', { parametros: { activas: true } })
      .then(({ datos }) => {
        setCategorias(datos);
        setCategoria((actual) => actual || datos[0]?.nombre || '');
      })
      .catch(() => setError('No fue posible cargar las categorias'));

    void api<{ datos: Equipo[] }>('/equipos/mios')
      .then(({ datos }) => setEquipos(datos))
      .catch(() => setEquipos([]));
  }, []);

  const registrar = async () => {
    setEnviando(true);
    setError(null);
    try {
      const equipo = equipos.find((e) => e.codigo === equipoCodigo) ?? null;
      const cuerpo: Record<string, unknown> = {
        titulo: titulo.trim(),
        descripcion: descripcion.trim(),
        servicio,
        categoria,
        ubicacion: ubicacion.trim() || null,
        observaciones: observaciones.trim() || null,
        equipo_id: equipo ? equipo.id : null
      };
      if (defineLaPrioridad) cuerpo.prioridad = prioridad;

      const { datos } = await api<{ datos: Ticket }>('/tickets', { metodo: 'POST', cuerpo });
      navigation.replace('DetalleTicket', { id: datos.id });
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar el ticket');
    } finally {
      setEnviando(false);
    }
  };

  const listo = titulo.trim().length >= 6 && descripcion.trim().length >= 10 && categoria.length > 0;

  return (
    <View style={estilos.pantalla}>
      <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
        {error && <Alerta mensaje={error} />}

        <Panel titulo="Que ocurre" icono="edit-3">
          <Campo
            etiqueta="Titulo"
            valor={titulo}
            alCambiar={setTitulo}
            maxLength={200}
            placeholder="Resumen breve del problema"
          />
          <Campo
            etiqueta="Detalle"
            valor={descripcion}
            alCambiar={setDescripcion}
            multiline
            placeholder="Equipo afectado, mensaje de error y pasos ya realizados"
          />
        </Panel>

        <Panel titulo="Clasificacion" icono="layers">
          <Selector
            etiqueta="Servicio"
            opciones={SERVICIOS}
            valor={servicio}
            alCambiar={(v) => setServicio(v as ServicioTicket)}
          />
          <Text style={{ fontSize: 12, color: tema.suave }}>{AYUDA_SERVICIO[servicio]}</Text>

          <Selector
            etiqueta="Categoria"
            opciones={categorias.map((c) => c.nombre)}
            valor={categoria}
            alCambiar={setCategoria}
          />
        </Panel>

        <Panel titulo="Donde y con que" icono="map-pin">
          <Campo
            etiqueta="Ubicacion"
            valor={ubicacion}
            alCambiar={setUbicacion}
            maxLength={120}
            placeholder="Piso, oficina o area"
          />
          <Selector
            etiqueta="Activo relacionado"
            opciones={[SIN_EQUIPO, ...equipos.map((e) => e.codigo)]}
            valor={equipoCodigo}
            alCambiar={setEquipoCodigo}
          />
          {equipos.length === 0 && (
            <Text style={{ fontSize: 12, color: tema.suave }}>No tiene equipos asignados a su nombre.</Text>
          )}
          <Campo
            etiqueta="Observaciones"
            valor={observaciones}
            alCambiar={setObservaciones}
            multiline
            maxLength={1000}
            placeholder="Dato adicional que ayude a la atencion"
          />
        </Panel>

        {defineLaPrioridad ? (
          <Panel titulo="Prioridad" icono="bar-chart-2">
            <Selector
              opciones={PRIORIDADES}
              valor={prioridad}
              alCambiar={(v) => setPrioridad(v as PrioridadTicket)}
            />
          </Panel>
        ) : (
          <Text style={{ fontSize: 12, color: tema.suave }}>
            La prioridad y el objetivo de atencion los determina la administracion de Sistemas.
          </Text>
        )}

        <Boton
          texto={enviando ? 'Registrando' : 'Registrar ticket'}
          icono="save"
          alPresionar={() => void registrar()}
          deshabilitado={enviando || !listo}
        />
        {!listo && (
          <Text style={{ fontSize: 12, color: tema.suave, textAlign: 'center' }}>
            Complete el titulo, el detalle y la categoria.
          </Text>
        )}
      </ScrollView>
      <PiePagina />
    </View>
  );
};
