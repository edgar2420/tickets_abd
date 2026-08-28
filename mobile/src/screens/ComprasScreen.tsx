import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl, ScrollView, Text, View } from 'react-native';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import {
  Alerta, Boton, Campo, Cargando, Dato, Insignia, Panel, Selector, Tarjeta, Vacio, estilos
} from '../components/Comunes';
import { codigoCompra, fechaCorta, montoBs } from '../lib/formato';
import { colorEstadoCompra, colorPrioridad, tema } from '../lib/tema';
import { TIPOS_EQUIPO_COMPRA } from '../lib/constantes';
import type { SolicitudCompra } from '../lib/tipos';

const SOLICITUD_VACIA = {
  titulo: '',
  justificacion: '',
  tipo_equipo: 'Escritorio',
  cantidad: '1',
  especificaciones: ''
};

export const ComprasScreen = () => {
  const { puede } = usarAuth();
  const [solicitudes, setSolicitudes] = useState<SolicitudCompra[] | null>(null);
  const [abierta, setAbierta] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [formulario, setFormulario] = useState(false);
  const [nueva, setNueva] = useState(SOLICITUD_VACIA);
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const { datos } = await api<{ datos: SolicitudCompra[] }>('/compras', {
        parametros: { limite: 50, pagina: 1 }
      });
      setSolicitudes(datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar las solicitudes');
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
      await api('/compras', {
        metodo: 'POST',
        cuerpo: {
          titulo: nueva.titulo.trim(),
          justificacion: nueva.justificacion.trim(),
          tipo_equipo: nueva.tipo_equipo,
          cantidad: Number(nueva.cantidad) || 1,
          especificaciones: nueva.especificaciones.trim() || null
        }
      });
      setNueva(SOLICITUD_VACIA);
      setFormulario(false);
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar la solicitud');
    } finally {
      setGuardando(false);
    }
  };

  const listo = nueva.titulo.trim().length >= 6 && nueva.justificacion.trim().length >= 15;

  if (formulario) {
    return (
      <View style={estilos.pantalla}>
        <ScrollView contentContainerStyle={estilos.contenido} keyboardShouldPersistTaps="handled">
          {error && <Alerta mensaje={error} />}
          <Panel titulo="Solicitar un equipo" icono="shopping-cart">
            <Campo etiqueta="Que necesita" valor={nueva.titulo}
              alCambiar={(v) => setNueva((n) => ({ ...n, titulo: v }))} maxLength={200} />
            <Campo etiqueta="Para que lo necesita" valor={nueva.justificacion} multiline
              alCambiar={(v) => setNueva((n) => ({ ...n, justificacion: v }))}
              placeholder="Explique el motivo con detalle" />
            <Selector etiqueta="Tipo de equipo" opciones={TIPOS_EQUIPO_COMPRA} valor={nueva.tipo_equipo}
              alCambiar={(v) => setNueva((n) => ({ ...n, tipo_equipo: v }))} />
            <Campo etiqueta="Cantidad" valor={nueva.cantidad} keyboardType="numeric"
              alCambiar={(v) => setNueva((n) => ({ ...n, cantidad: v }))} />
            <Campo etiqueta="Especificaciones sugeridas" valor={nueva.especificaciones} multiline
              alCambiar={(v) => setNueva((n) => ({ ...n, especificaciones: v }))} />
            <Text style={{ fontSize: 12, color: tema.suave }}>
              La prioridad la define la administracion de Sistemas al revisar el pedido.
            </Text>
          </Panel>
          <Boton texto="Enviar solicitud" icono="send" deshabilitado={guardando || !listo}
            alPresionar={() => void enviar()} />
          <Boton texto="Cancelar" variante="secundario" alPresionar={() => setFormulario(false)} />
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={estilos.pantalla}>
      {puede('compras.solicitar') && (
        <View style={{ padding: 12, backgroundColor: tema.panel, borderBottomWidth: 1, borderBottomColor: tema.borde }}>
          <Boton texto="Solicitar un equipo" icono="plus-circle" alPresionar={() => setFormulario(true)} />
        </View>
      )}

      {error && <View style={{ padding: 12 }}><Alerta mensaje={error} /></View>}
      {!solicitudes && !error && <Cargando texto="Consultando solicitudes" />}

      {solicitudes && (
        <FlatList
          data={solicitudes}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={estilos.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
          ListEmptyComponent={<Vacio texto="No hay solicitudes de compra" />}
          renderItem={({ item }) => (
            <Tarjeta alPresionar={() => setAbierta(abierta === item.id ? null : item.id)}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: '700', color: tema.acento }}>
                  {codigoCompra(item.id)}
                </Text>
                <Insignia texto={item.estado} color={colorEstadoCompra[item.estado] ?? tema.suave} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: tema.texto }}>{item.titulo}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                <Insignia texto={item.prioridad} color={colorPrioridad[item.prioridad] ?? tema.suave} />
                <Insignia texto={`${item.cantidad} unidad(es)`} color={tema.suave} />
              </View>
              <Text style={{ fontSize: 12, color: tema.suave }}>
                {item.solicitante_nombre} - {fechaCorta(item.fecha_creacion)}
              </Text>

              {abierta === item.id && (
                <View style={{ gap: 8, marginTop: 8, borderTopWidth: 1, borderTopColor: tema.borde, paddingTop: 10 }}>
                  <Dato etiqueta="Justificacion" valor={item.justificacion} />
                  <Dato etiqueta="Especificaciones" valor={item.especificaciones} />
                  <Dato etiqueta="Equipo sugerido por Sistemas" valor={item.equipo_sugerido} />
                  <Dato etiqueta="Monto referencial" valor={montoBs(item.monto_estimado)} />
                  <Dato etiqueta="Monto final" valor={montoBs(item.monto_final)} />
                  <Dato etiqueta="Observacion tecnica" valor={item.observacion_ti} />
                  <Dato etiqueta="Revisado por" valor={item.revisado_por_nombre} />
                  <Dato etiqueta="Aprobado por Gerencia" valor={item.aprobado_por_nombre} />
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
