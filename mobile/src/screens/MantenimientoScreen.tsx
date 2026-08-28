import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, Text, View } from 'react-native';
import { api } from '../lib/api';
import { usarAuth } from '../context/AuthContext';
import {
  Alerta, Boton, Campo, Cargando, Indicador, Insignia, Selector, Tarjeta, Vacio, estilos
} from '../components/Comunes';
import { fechaCorta } from '../lib/formato';
import { colorSituacion, tema } from '../lib/tema';
import { SITUACIONES_MANTENIMIENTO } from '../lib/constantes';
import type { EquipoDelPlan, ResumenMantenimiento } from '../lib/tipos';

const FILTROS = ['Todas', ...SITUACIONES_MANTENIMIENTO];

export const MantenimientoScreen = () => {
  const { puede } = usarAuth();
  const gestiona = puede('mantenimiento.gestionar');

  const [plan, setPlan] = useState<EquipoDelPlan[] | null>(null);
  const [resumen, setResumen] = useState<ResumenMantenimiento | null>(null);
  const [situacion, setSituacion] = useState('Todas');
  const [error, setError] = useState<string | null>(null);
  const [refrescando, setRefrescando] = useState(false);
  const [procesando, setProcesando] = useState(false);

  const [registrando, setRegistrando] = useState<EquipoDelPlan | null>(null);
  const [observaciones, setObservaciones] = useState('');

  const cargar = useCallback(async () => {
    try {
      const [lista, totales] = await Promise.all([
        api<{ datos: EquipoDelPlan[] }>('/mantenimiento', {
          parametros: { situacion: situacion === 'Todas' ? '' : situacion }
        }),
        api<{ datos: ResumenMantenimiento }>('/mantenimiento/resumen')
      ]);
      setPlan(lista.datos);
      setResumen(totales.datos);
      setError(null);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cargar el plan');
    }
  }, [situacion]);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const refrescar = async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  };

  const generarTicket = (equipo: EquipoDelPlan) => {
    Alert.alert(
      'Generar el ticket',
      `Se creara un ticket de mantenimiento para ${equipo.codigo}.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Generar',
          onPress: () => {
            setProcesando(true);
            void api(`/mantenimiento/${equipo.id}/ticket`, { metodo: 'POST' })
              .then(() => cargar())
              .catch((fallo) => setError(fallo instanceof Error ? fallo.message : 'No fue posible generar el ticket'))
              .finally(() => setProcesando(false));
          }
        }
      ]
    );
  };

  const registrar = async () => {
    if (!registrando) return;
    setProcesando(true);
    setError(null);
    try {
      await api(`/mantenimiento/${registrando.id}/registrar`, {
        metodo: 'POST',
        cuerpo: {
          fecha: new Date().toISOString().slice(0, 10),
          observaciones: observaciones.trim() || null
        }
      });
      setRegistrando(null);
      setObservaciones('');
      await cargar();
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar el mantenimiento');
    } finally {
      setProcesando(false);
    }
  };

  return (
    <View style={estilos.pantalla}>
      <View style={{ padding: 12, gap: 10, backgroundColor: tema.panel, borderBottomWidth: 1, borderBottomColor: tema.borde }}>
        {resumen && (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Indicador etiqueta="Vencidos" valor={resumen.vencidos} color={tema.critico} />
            <Indicador etiqueta="Por vencer" valor={resumen.por_vencer} color={tema.advertencia} />
            <Indicador etiqueta="Al dia" valor={resumen.al_dia} color={tema.ok} />
          </View>
        )}
        <Selector opciones={FILTROS} valor={situacion} alCambiar={setSituacion} />
      </View>

      {error && <View style={{ padding: 12 }}><Alerta mensaje={error} /></View>}

      {registrando && (
        <View style={{ padding: 12, gap: 10, backgroundColor: tema.panel, borderBottomWidth: 1, borderBottomColor: tema.borde }}>
          <Text style={{ fontSize: 14, fontWeight: '700', color: tema.primario }}>
            Mantenimiento de {registrando.codigo}
          </Text>
          <Campo
            etiqueta="Observaciones"
            valor={observaciones}
            alCambiar={setObservaciones}
            multiline
            placeholder="Limpieza interna, revision de ventiladores"
          />
          <Boton texto="Registrar" icono="check-circle" deshabilitado={procesando} alPresionar={() => void registrar()} />
          <Boton texto="Cancelar" variante="secundario" alPresionar={() => setRegistrando(null)} />
        </View>
      )}

      {!plan && !error && <Cargando texto="Consultando el plan" />}

      {plan && (
        <FlatList
          data={plan}
          keyExtractor={(e) => String(e.id)}
          contentContainerStyle={estilos.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => void refrescar()} />}
          ListEmptyComponent={<Vacio texto="Ningun equipo tiene frecuencia asignada" />}
          renderItem={({ item }) => (
            <Tarjeta>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ fontFamily: 'monospace', fontSize: 13, fontWeight: '700', color: tema.acento }}>
                  {item.codigo}
                </Text>
                <Insignia texto={item.situacion} color={colorSituacion[item.situacion] ?? tema.suave} />
              </View>
              <Text style={{ fontSize: 14, fontWeight: '600', color: tema.texto }}>{item.nombre_equipo}</Text>
              <Text style={{ fontSize: 12, color: tema.suave }}>
                {item.frecuencia_mantenimiento} - ultimo {item.ultimo_mantenimiento ? fechaCorta(item.ultimo_mantenimiento) : 'nunca'}
              </Text>
              <Text style={{ fontSize: 12, color: tema.suave }}>
                Proximo: {item.proximo_mantenimiento ? fechaCorta(item.proximo_mantenimiento) : 'sin calcular'}
              </Text>
              {gestiona && (
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                  <View style={{ flex: 1 }}>
                    <Boton texto="Ticket" icono="inbox" variante="secundario"
                      deshabilitado={procesando} alPresionar={() => generarTicket(item)} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Boton texto="Registrar" icono="check-circle"
                      deshabilitado={procesando} alPresionar={() => { setRegistrando(item); setObservaciones(''); }} />
                  </View>
                </View>
              )}
            </Tarjeta>
          )}
        />
      )}
    </View>
  );
};
