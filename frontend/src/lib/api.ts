const BASE = import.meta.env.VITE_API_URL || '/api/v1';
const COOKIE_CSRF = 'tickets_csrf';
const CABECERA_CSRF = 'X-CSRF-Token';

const leerCookie = (nombre: string): string | null => {
  const par = document.cookie
    .split(';')
    .map((trozo) => trozo.trim().split('='))
    .find(([clave]) => clave === nombre);
  return par ? decodeURIComponent(par[1]) : null;
};

export const haySesion = () => leerCookie(COOKIE_CSRF) !== null;

interface FallaDeCampo {
  campo: string;
  mensaje: string;
}

const esListaDeFallas = (detalle: unknown): detalle is FallaDeCampo[] =>
  Array.isArray(detalle) && detalle.every((f) => typeof f?.mensaje === 'string');

const componerMensaje = (mensaje: string, detalle: unknown) => {
  if (!esListaDeFallas(detalle) || detalle.length === 0) return mensaje;
  return detalle.map((falla) => falla.mensaje).join('. ');
};

export class ErrorApi extends Error {
  estado: number;
  detalle: unknown;
  campos: FallaDeCampo[];

  constructor(estado: number, mensaje: string, detalle: unknown = null) {
    super(componerMensaje(mensaje, detalle));
    this.estado = estado;
    this.detalle = detalle;
    this.campos = esListaDeFallas(detalle) ? detalle : [];
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

const cabeceras = (base: Record<string, string> = {}) => {
  const csrf = leerCookie(COOKIE_CSRF);
  return csrf ? { ...base, [CABECERA_CSRF]: csrf } : base;
};

const alExpirar = (respuesta: Response) => {
  if (respuesta.status === 401) window.dispatchEvent(new CustomEvent('sesion:expirada'));
};

export const api = async <T,>(ruta: string, opciones: Opciones = {}): Promise<T> => {
  const respuesta = await fetch(construirUrl(ruta, opciones.parametros), {
    method: opciones.metodo ?? 'GET',
    credentials: 'include',
    headers: cabeceras({ 'Content-Type': 'application/json' }),
    body: opciones.cuerpo ? JSON.stringify(opciones.cuerpo) : undefined
  });

  alExpirar(respuesta);

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, datos.mensaje ?? 'Error de comunicacion con el servidor', datos.detalle);
  }
  return datos as T;
};

export const apiFormData = async <T,>(ruta: string, formulario: FormData): Promise<T> => {
  const respuesta = await fetch(construirUrl(ruta), {
    method: 'POST',
    credentials: 'include',
    headers: cabeceras(),
    body: formulario
  });

  alExpirar(respuesta);

  const datos = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    throw new ErrorApi(respuesta.status, datos.mensaje ?? 'No fue posible enviar el mensaje', datos.detalle);
  }
  return datos as T;
};

export const urlAdjunto = async (id: number): Promise<string> => {
  const respuesta = await fetch(construirUrl(`/adjuntos/${id}`), { credentials: 'include' });
  alExpirar(respuesta);
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, 'No fue posible obtener el archivo');
  return URL.createObjectURL(await respuesta.blob());
};

export const descargarPdf = async (
  ruta: string,
  parametros?: Opciones['parametros'],
  nombre = 'documento.pdf'
) => {
  const respuesta = await fetch(construirUrl(ruta, parametros), { credentials: 'include' });
  alExpirar(respuesta);
  if (!respuesta.ok) throw new ErrorApi(respuesta.status, 'No fue posible generar el documento PDF');

  const url = URL.createObjectURL(await respuesta.blob());
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
};
