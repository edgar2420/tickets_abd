import crypto from 'node:crypto';
import { env } from '../config/env.js';

const ALGORITMO = 'aes-256-gcm';

/**
 * Clave de cifrado derivada de la semilla de entorno.
 * Se emplea scrypt para que una semilla corta siga produciendo una clave
 * de 32 bytes resistente a la fuerza bruta.
 */
const clave = crypto.scryptSync(env.cifrado.semilla, 'tickets-ti-equipos', 32);

/**
 * Cifra un texto con AES-256-GCM.
 * El resultado concatena vector de inicializacion, etiqueta de autenticidad
 * y texto cifrado, de modo que una alteracion del dato se detecta al descifrar.
 */
export const cifrar = (texto) => {
  if (texto === null || texto === undefined || texto === '') return null;
  const vector = crypto.randomBytes(12);
  const cifrador = crypto.createCipheriv(ALGORITMO, clave, vector);
  const cifrado = Buffer.concat([cifrador.update(String(texto), 'utf8'), cifrador.final()]);
  const etiqueta = cifrador.getAuthTag();
  return [vector.toString('base64'), etiqueta.toString('base64'), cifrado.toString('base64')].join(':');
};

/** Descifra un valor producido por cifrar(). Devuelve null si el dato fue alterado. */
export const descifrar = (guardado) => {
  if (!guardado) return null;
  try {
    const [vector, etiqueta, cifrado] = guardado.split(':');
    if (!vector || !etiqueta || !cifrado) return null;
    const descifrador = crypto.createDecipheriv(ALGORITMO, clave, Buffer.from(vector, 'base64'));
    descifrador.setAuthTag(Buffer.from(etiqueta, 'base64'));
    return Buffer.concat([
      descifrador.update(Buffer.from(cifrado, 'base64')),
      descifrador.final()
    ]).toString('utf8');
  } catch {
    return null;
  }
};

