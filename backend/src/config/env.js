import dotenv from 'dotenv';
dotenv.config();

const required = (key, fallback) => {
  const value = process.env[key] ?? fallback;
  if (value === undefined) throw new Error(`Variable de entorno requerida no definida: ${key}`);
  return value;
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
  cors: {
    origins: (process.env.CORS_ORIGINS ?? 'http://localhost:5173,http://localhost:19006')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean)
  },
  cifrado: {
    // Semilla del cifrado de credenciales de acceso remoto
    semilla: required('CLAVE_CIFRADO', 'cambiar-esta-semilla-de-cifrado-en-produccion')
  },
  docs: {
    outputDir: process.env.DOCS_OUTPUT_DIR ?? 'storage/documentos'
  },
  autor: 'Ing. Edgar Rojas Apaza',
  autorRol: 'Desarrollo de Modulo de Tickets'
};
