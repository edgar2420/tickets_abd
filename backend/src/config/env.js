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
  /**
   * Reconducir a HTTPS toda peticion en claro. Obligatorio de cara a
   * internet; debe quedar apagado en una red interna sin certificado.
   */
  httpsObligatorio: (process.env.FORZAR_HTTPS ?? 'false') === 'true',
  cookies: {
    /**
     * El atributo "secure" impide que la cookie viaje por HTTP. Es lo
     * correcto de cara a internet, pero una instalacion interna que
     * todavia no tiene certificado debe poder desactivarlo de forma
     * explicita, o el navegador jamas enviaria la sesion.
     */
    seguras: (process.env.COOKIE_SECURE ?? (process.env.NODE_ENV === 'production' ? 'true' : 'false')) === 'true'
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

/**
 * En produccion el servicio no debe arrancar con los valores de ejemplo.
 * Un despliegue que conserve la clave del archivo de muestra permitiria a
 * cualquiera firmar sus propias credenciales de administrador, de modo que
 * es preferible detener el arranque antes que exponer el sistema.
 */
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
