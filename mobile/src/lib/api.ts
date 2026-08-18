import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_URL } from './config';

const CLAVE_TOKEN = 'tickets_ti_token';

export const almacenToken = {
  obtener: () => AsyncStorage.getItem(CLAVE_TOKEN),
  guardar: (token: string) => AsyncStorage.setItem(CLAVE_TOKEN, token),
  limpiar: () => AsyncStorage.removeItem(CLAVE_TOKEN)
};

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  parametros?: Record<string, string | number | boolean | undefined | null>;
}

/** Cliente HTTP con inyeccion automatica del token JWT almacenado. */
export const api = async <T,>(ruta: string, opciones: Opciones = {}): Promise<T> => {
  const token = await almacenToken.obtener();
  const consulta = Object.entries(opciones.parametros ?? {})
    .filter(([, valor]) => valor !== undefined && valor !== null && valor !== '')
    .map(([clave, valor]) => `${encodeURIComponent(clave)}=${encodeURIComponent(String(valor))}`)
    .join('&');

  const respuesta = await fetch(`${API_URL}${ruta}${consulta ? `?${consulta}` : ''}`, {
    method: opciones.metodo ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) throw new Error(datos.mensaje ?? 'Error de comunicacion con el servidor');
  return datos as T;
};
