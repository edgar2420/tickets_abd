import os from 'node:os';
import dotenv from 'dotenv';
dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Variable de entorno requerida no definida: ${key}`);
  return value;
};

const PUERTOS_DE_RED = [5173, 4173, 8080, 4000];

export const direccionesLocales = () => Object.values(os.networkInterfaces())
  .flat()
  .filter((interfaz) => interfaz && interfaz.family === 'IPv4' && !interfaz.internal)
  .map((interfaz) => interfaz.address);

const origenesDeLaRed = () => direccionesLocales()
  .flatMap((direccion) => PUERTOS_DE_RED.map((puerto) => `http://${direccion}:${puerto}`));

const origenesFijos = () => (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:19006')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

const VIGENCIA_ORIGENES = 30_000;
let cacheOrigenes = { hasta: 0, lista: [] };

export const origenesPermitidos = () => {
  if ((process.env.RED_LOCAL ?? 'false') !== 'true') return origenesFijos();
  const ahora = Date.now();
  if (ahora < cacheOrigenes.hasta) return cacheOrigenes.lista;
  cacheOrigenes = { hasta: ahora + VIGENCIA_ORIGENES, lista: [...origenesFijos(), ...origenesDeLaRed()] };
  return cacheOrigenes.lista;
};

export const env = {
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 4000),
  apiPrefix: process.env.API_PREFIX ?? '/api/v1',
  db: {
    host: required('DB_HOST', 'localhost'),
    port: Number(required('DB_PORT', '5432')),
    user: required('DB_USER', 'tickets_app'),
    password: required('DB_PASSWORD', 'tickets_app'),
    database: required('DB_NAME', 'tickets_ti'),
    max: Number(process.env.DB_POOL_MAX ?? 10)
  },
  jwt: {
    secret: required('JWT_SECRET', 'cambiar-esta-clave-en-produccion'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '8h'
  },
  redLocal: (process.env.RED_LOCAL ?? 'false') === 'true',
  cors: {
    get origins() {
      return origenesPermitidos();
    }
  },
  httpsObligatorio: (process.env.FORZAR_HTTPS ?? 'false') === 'true',
  cookies: {
    seguras: (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true'
  },
  cifrado: {
    semilla: required('CLAVE_CIFRADO', 'cambiar-esta-semilla-de-cifrado-en-produccion')
  },
  docs: {
    outputDir: process.env.DOCS_OUTPUT_DIR ?? 'storage/documentos'
  },
  autor: 'Ing. Edgar Rojas Apaza',
  autorRol: 'Desarrollo de Modulo de Tickets'
};

const SECRETOS = [
  ['JWT_SECRET', env.jwt.secret, 'cambiar-esta-clave-en-produccion'],
  ['CLAVE_CIFRADO', env.cifrado.semilla, 'cambiar-esta-semilla-de-cifrado-en-produccion'],
  ['DB_PASSWORD', env.db.password, 'tickets_app']
];

if (env.nodeEnv === 'production') {
  const observados = SECRETOS
    .filter(([, valor, ejemplo]) => valor === ejemplo || valor.startsWith('cambie-') || valor.length < 24)
    .map(([nombre]) => nombre);

  if (observados.length) {
    throw new Error(
      `No es posible iniciar en produccion con valores de ejemplo o demasiado cortos en: ${observados.join(', ')}. `
      + 'Defina cadenas propias de al menos 24 caracteres.'
    );
  }
}
