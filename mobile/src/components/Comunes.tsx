import React from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { tema } from '../lib/tema';

export const PiePagina = () => (
  <View style={estilos.pie}>
    <Feather name="shield" size={12} color={tema.acento} />
    <Text style={estilos.pieTextoFuerte}>Ing. Edgar Rojas Apaza</Text>
    <Text style={estilos.pieTexto}>Desarrollo de Modulo de Tickets</Text>
  </View>
);

export const Insignia = ({ texto, color }: { texto: string; color: string }) => (
  <View style={[estilos.insignia, { borderColor: color }]}>
    <Text style={[estilos.insigniaTexto, { color }]}>{texto}</Text>
  </View>
);

export const Boton = ({ texto, icono, alPresionar, variante = 'primario', deshabilitado = false }: {
  texto: string;
  icono?: keyof typeof Feather.glyphMap;
  alPresionar: () => void;
  variante?: 'primario' | 'secundario' | 'acento';
  deshabilitado?: boolean;
}) => {
  const fondo = variante === 'secundario' ? '#FFFFFF' : variante === 'acento' ? tema.acento : tema.primario;
  const colorTexto = variante === 'secundario' ? tema.texto : '#FFFFFF';
  return (
    <TouchableOpacity
      onPress={alPresionar}
      disabled={deshabilitado}
      style={[estilos.boton, { backgroundColor: fondo, opacity: deshabilitado ? 0.6 : 1 },
        variante === 'secundario' && { borderWidth: 1, borderColor: tema.borde }]}
    >
      {icono && <Feather name={icono} size={16} color={colorTexto} />}
      <Text style={[estilos.botonTexto, { color: colorTexto }]}>{texto}</Text>
    </TouchableOpacity>
  );
};

export const Panel = ({ titulo, icono, children }: {
  titulo?: string;
  icono?: keyof typeof Feather.glyphMap;
  children: React.ReactNode;
}) => (
  <View style={estilos.panel}>
    {titulo && (
      <View style={estilos.panelEncabezado}>
        {icono && <Feather name={icono} size={14} color={tema.acento} />}
        <Text style={estilos.panelTitulo}>{titulo}</Text>
      </View>
    )}
    <View style={estilos.panelCuerpo}>{children}</View>
  </View>
);

export const Dato = ({ etiqueta, valor }: { etiqueta: string; valor?: string | null }) => (
  <View style={estilos.dato}>
    <Text style={estilos.datoEtiqueta}>{etiqueta.toUpperCase()}</Text>
    <Text style={estilos.datoValor}>{valor ?? 'No registrado'}</Text>
  </View>
);

export const Cargando = ({ texto = 'Cargando' }: { texto?: string }) => (
  <View style={estilos.cargando}>
    <ActivityIndicator color={tema.acento} />
    <Text style={estilos.cargandoTexto}>{texto}</Text>
  </View>
);

export const Vacio = ({ texto }: { texto: string }) => (
  <View style={estilos.cargando}>
    <Feather name="inbox" size={22} color={tema.suave} />
    <Text style={estilos.cargandoTexto}>{texto}</Text>
  </View>
);

export const estilos = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: tema.fondo },
  contenido: { padding: 16, gap: 12 },
  titulo: { fontSize: 20, fontWeight: '700', color: tema.primario },
  subtitulo: { fontSize: 13, color: tema.suave },
  panel: { backgroundColor: tema.panel, borderRadius: 10, borderWidth: 1, borderColor: tema.borde, overflow: 'hidden' },
  panelEncabezado: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: tema.borde
  },
  panelTitulo: { fontSize: 12, fontWeight: '700', color: tema.primario, letterSpacing: 0.6, textTransform: 'uppercase' },
  panelCuerpo: { padding: 14, gap: 10 },
  insignia: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  insigniaTexto: { fontSize: 11, fontWeight: '700' },
  boton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    borderRadius: 8, paddingVertical: 12, paddingHorizontal: 16
  },
  botonTexto: { fontSize: 14, fontWeight: '700' },
  campo: {
    backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: tema.borde, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: tema.texto
  },
  etiqueta: { fontSize: 11, fontWeight: '700', color: tema.suave, letterSpacing: 0.6, textTransform: 'uppercase', marginBottom: 4 },
  dato: { gap: 2 },
  datoEtiqueta: { fontSize: 10, fontWeight: '700', color: tema.suave, letterSpacing: 0.6 },
  datoValor: { fontSize: 14, color: tema.texto, fontWeight: '500' },
  cargando: { alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 40 },
  cargandoTexto: { fontSize: 13, color: tema.suave },
  error: {
    backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1, borderRadius: 8,
    padding: 10, color: '#991B1B', fontSize: 13
  },
  pie: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 10, borderTopWidth: 1, borderTopColor: tema.borde, backgroundColor: '#FFFFFF'
  },
  pieTextoFuerte: { fontSize: 11, fontWeight: '700', color: tema.primario },
  pieTexto: { fontSize: 11, color: tema.suave }
});
