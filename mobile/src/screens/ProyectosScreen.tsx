import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import {
  Alerta, Boton, Campo, Cargando, Dato, Insignia, Panel, Selector, Tarjeta, Vacio, estilos
} from '../components/Comunes';
import { codigoProyecto, fechaCorta } from '../lib/formato';
import { colorEstadoProyecto, colorPrioridad, tema } from '../lib/tema';
import { FRECUENCIAS_PROYECTO, PRIORIDADES, TIPOS_PROYECTO } from '../lib/constantes';
import type { SolicitudProyecto } from '../lib/tipos';

const PETICION_VACIA = {
  titulo: '',
  tipo: 'Mejora',
  problema: '',
  situacion_actual: '',
  propuesta: '',
  beneficio: '',
  personas_afectadas: '1',
  frecuencia: 'Semanal',
  urgencia: 'Media',
  sistemas_actuales: ''
};

export const ProyectosScreen = () => {
  const { puede } = usarAuth();
  const [peticiones, setPeticiones] = useState<SolicitudProyecto[] | null>(null);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [formulario, setFormulario] = useState(false);
  const [nueva, setNueva] = useState(PETICION_VACIA);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: SolicitudProyecto[] }>('/proyectos', {
        parametros: { limite: 50, pagina: 1 }
      });
      setPeticiones(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar las peticiones');
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

  const enviar = async () => {
    setGuardando(true);
    setError(null);
    try {
      await api('/proyectos', {
        metodo: 'POST',
        cuerpo: {
          titulo: nueva.titulo.trim(),
          tipo: nueva.tipo,
          problema: nueva.problema.trim(),
          situacion_actual: nueva.situacion_actual.trim(),
          propuesta: nueva.propuesta.trim(),
          beneficio: nueva.beneficio.trim(),
          personas_afectadas: Number(nueva.personas_afectadas) || 1,
          frecuencia: nueva.frecuencia,
          urgencia: nueva.urgencia,
          sistemas_actuales: nueva.sistemas_actuales.trim() || null
        }
      });
      setNueva(PETICION_VACIA);
      setFormulario(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar la peticion');
    } finally {
      setGuardando(false);
    }
  };

  const listo = nueva.titulo.trim().length >= 10
    && nueva.problema.trim().length >= 30
    && nueva.situacion_actual.trim().length >= 20
    && nueva.propuesta.trim().length >= 30
    && nueva.beneficio.trim().length >= 20;

  if (formulario) {
    return (
      <View style={estilos.pantalla}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          {error && <Alerta mensaje={error} />}
          <Panel titulo="Proponer una mejora" icono="zap">
            <Campo etiqueta="Titulo" valor={nueva.titulo} maxLength={200}
              alCambiar={(v) => setNueva((n) => ({ ...n, titulo: v }))} />
            <Selector etiqueta="Tipo" opciones={TIPOS_PROYECTO} valor={nueva.tipo}
              alCambiar={(v) => setNueva((n) => ({ ...n, tipo: v }))} />
            <Campo etiqueta="Que problema resuelve" valor={nueva.problema} multiline
              alCambiar={(v) => setNueva((n) => ({ ...n, problema: v }))}
              placeholder="Minimo treinta caracteres" />
            <Campo etiqueta="Como se hace hoy" valor={nueva.situacion_actual} multiline
              alCambiar={(v) => setNueva((n) => ({ ...n, situacion_actual: v }))} />
            <Campo etiqueta="Que propone" valor={nueva.propuesta} multiline
              alCambiar={(v) => setNueva((n) => ({ ...n, propuesta: v }))} />
            <Campo etiqueta="Que beneficio trae" valor={nueva.beneficio} multiline
              alCambiar={(v) => setNueva((n) => ({ ...n, beneficio: v }))} />
            <Campo etiqueta="Cuantas personas se benefician" valor={nueva.personas_afectadas} keyboardType="numeric"
              alCambiar={(v) => setNueva((n) => ({ ...n, personas_afectadas: v }))} />
            <Selector etiqueta="Cada cuanto ocurre" opciones={FRECUENCIAS_PROYECTO} valor={nueva.frecuencia}
              alCambiar={(v) => setNueva((n) => ({ ...n, frecuencia: v }))} />
            <Selector etiqueta="Urgencia" opciones={PRIORIDADES} valor={nueva.urgencia}
              alCambiar={(v) => setNueva((n) => ({ ...n, urgencia: v }))} />
            <Campo etiqueta="Sistemas que usa hoy" valor={nueva.sistemas_actuales}
              alCambiar={(v) => setNueva((n) => ({ ...n, sistemas_actuales: v }))} />
          </Panel>
          <Boton texto="Enviar la peticion" icono="send" deshabilitado={guardando || !listo}
            alPresionar={() => void enviar()} />
          <Boton texto="Cancelar" variante="secundario" alPresionar={() => setFormulario(false)} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      {puede('proyectos.solicitar') && (
        <View style={{ padding: 12, backgroundColor: tema.panel, borderBottomWidth: 1, borderBottomColor: tema.borde }}>
          <Boton texto="Proponer una mejora" icono="plus-circle" alPresionar={() => setFormulario(true)} />
        </View>
      )}

      {error && <View style={{ padding: 12 }}><Alerta mensaje={error} /></View>}
      {!peticiones && !error && <Cargando texto="Consultando peticiones" />}

      {peticiones && (
        <FlatList
          data={peticiones}
          keyExtractor={(p) => String(p.id)}
          contentContainerStyle={estilos.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
          ListEmptyComponent={<Vacio texto="No hay peticiones de proyecto" />}
          renderItem={({ item }) => (
            <Tarjeta alPresionar={() => setAbierta(abierta === item.id ? null : item.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: tema.acento }}>
                  {codigoProyecto(item.id)}
                </Text>
                <Insignia texto={item.estado} color={colorEstadoProyecto[item.estado] ?? tema.suave} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: tema.texto }}>{item.titulo}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Insignia texto={item.tipo} color={tema.suave} />
                <Insignia texto={`Urgencia ${item.urgencia}`} color={colorPrioridad[item.urgencia] ?? tema.suave} />
              </View>
              <Text style={{ fontSize: 12, color: tema.suave }}>
                {item.solicitante_nombre} - {fechaCorta(item.fecha_creacion)}
              </Text>

              {abierta === item.id && (
                <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: tema.borde, paddingTop: 10 }}>
                  <Dato etiqueta="Problema" valor={item.problema} />
                  <Dato etiqueta="Situacion actual" valor={item.situacion_actual} />
                  <Dato etiqueta="Propuesta" valor={item.propuesta} />
                  <Dato etiqueta="Beneficio" valor={item.beneficio} />
                  <Dato etiqueta="Personas afectadas" valor={String(item.personas_afectadas)} />
                  <Dato etiqueta="Evaluacion de Sistemas" valor={item.evaluacion_ti} />
                  <Dato etiqueta="Esfuerzo estimado" valor={item.esfuerzo_estimado} />
                  <Dato etiqueta="Valor estimado" valor={item.valor_estimado} />
                  {item.motivo_rechazo && <Dato etiqueta="Motivo del rechazo" valor={item.motivo_rechazo} />}
                </View>
              )}
            </Tarjeta>
          )}
        />
      )}
    </View>
  );
};
