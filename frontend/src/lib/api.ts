const BASE = import.meta.env.VITE_API_URL ?? '/api/v1';
const CLAVE_TOKEN = 'tickets_ti_token';

export const almacenToken = {
  obtener: () => localStorage.getItem(CLAVE_TOKEN),
  guardar: (token: string) => localStorage.setItem(CLAVE_TOKEN, token),
  limpiar: () => localStorage.removeItem(CLAVE_TOKEN)
};

export class ErrorApi extends Error {
  estado: number;
  detalle: unknown;
  constructor(estado: number, mensaje: string, detalle: unknown = null) {
    super(mensaje);
    this.estado = estado;
    this.detalle = detalle;
  }
}

interface Opciones {
  metodo?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  cuerpo?: unknown;
  parametros?: Record<string, string | number | boolean | null | undefined>;
}

const construirUrl = (ruta: string, parametros?: Opciones['parametros']) => {
  const url = new URL(BASE + ruta, window.location.origin);
  Object.entries(parametros ?? {}).forEach(([clave, valor]) => {
    if (valor !== null && valor !== undefined && valor !== '') url.searchParams.set(clave, String(valor));
  });
  return url.toString();
};

/** Cliente HTTP con inyeccion automatica del token JWT. */
export const api = async <T,>(ruta: string, opciones: Opciones = {}): Promise<T> => {
  const token = almacenToken.obtener();
  const respuesta = await fetch(construirUrl(ruta, opciones.parametros), {
    method: opciones.metodo ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });

  if (respuesta.status === 401) {
    almacenToken.limpiar();
    window.dispatchEvent(new CustomEvent('sesion:expirada'));
  }

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, datos.mensaje ?? 'Error de comunicacion con el servidor', datos.detalle);
  }
  return datos as T;
};

/** Descarga un PDF autenticado y lo abre en una pestana nueva. */
export const descargarPdf = async (ruta: string, parametros?: Opciones['parametros'], nombre = 'documento.pdf') => {
  const token = almacenToken.obtener();
  const respuesta = await fetch(construirUrl(ruta, parametros), {
    headers: token ? { Authorization: `Bearer ${token}` } : {}
  });
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, 'No fue posible generar el documento PDF');
  const blob = await respuesta.blob();
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
