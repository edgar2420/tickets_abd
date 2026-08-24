import { z } from 'zod';

export const LARGO_MINIMO = 10;
export const LARGO_MAXIMO = 128;

const OBVIAS = [
  'password', 'contrasena', 'contraseña', '1234567890', 'qwertyuiop',
  'administrador', 'admin12345', 'abcdefghij', '0123456789'
];

export const REGLAS = [
  `Al menos ${LARGO_MINIMO} caracteres`,
  'Sin espacios en blanco',
  'Al menos una letra',
  'Al menos un numero',
  'Distinta del nombre de usuario'
];

export const revisarPassword = (password, usuario = '') => {
  const fallas = [];
  const valor = String(password ?? '');

  if (valor.length < LARGO_MINIMO) fallas.push(`Debe tener al menos ${LARGO_MINIMO} caracteres`);
  if (valor.length > LARGO_MAXIMO) fallas.push(`No puede superar los ${LARGO_MAXIMO} caracteres`);
  if (/\s/.test(valor)) fallas.push('No puede contener espacios en blanco');
  if (!/[A-Za-zÀ-ÿ]/.test(valor)) fallas.push('Debe incluir al menos una letra');
  if (!/\d/.test(valor)) fallas.push('Debe incluir al menos un numero');

  const limpio = valor.toLowerCase();
  if (usuario && limpio === String(usuario).toLowerCase()) {
    fallas.push('No puede ser igual al nombre de usuario');
  }
  if (OBVIAS.includes(limpio)) fallas.push('Es una clave demasiado previsible');

  return fallas;
};

export const passwordSchema = z.string()
  .min(LARGO_MINIMO, `La contrasena debe tener al menos ${LARGO_MINIMO} caracteres`)
  .max(LARGO_MAXIMO, `La contrasena no puede superar los ${LARGO_MAXIMO} caracteres`)
  .refine((valor) => !/\s/.test(valor), 'La contrasena no puede contener espacios en blanco')
  .refine((valor) => /[A-Za-zÀ-ÿ]/.test(valor), 'La contrasena debe incluir al menos una letra')
  .refine((valor) => /\d/.test(valor), 'La contrasena debe incluir al menos un numero')
  .refine((valor) => !OBVIAS.includes(valor.toLowerCase()), 'La contrasena es demasiado previsible');

export const textoLimpio = (largoMinimo, largoMaximo) => z.string()
  .transform((valor) => valor.trim())
  .pipe(z.string().min(largoMinimo).max(largoMaximo));

export const usuarioSchema = z.string()
  .transform((valor) => valor.trim().toLowerCase())
  .pipe(
    z.string()
      .min(3, 'El nombre de usuario debe tener al menos 3 caracteres')
      .max(40, 'El nombre de usuario no puede superar los 40 caracteres')
      .regex(/^[a-z0-9._-]+$/, 'Solo se admiten letras, numeros, punto, guion y guion bajo')
  );
