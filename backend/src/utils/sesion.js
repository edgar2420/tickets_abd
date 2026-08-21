import crypto from 'node:crypto';
import { env } from '../config/env.js';

export const COOKIE_SESION = 'tickets_sesion';
export const COOKIE_CSRF = 'tickets_csrf';
export const CABECERA_CSRF = 'x-csrf-token';

const DURACIONES = { h: 3600, d: 86400, m: 60 };

const vigenciaEnMilisegundos = (expresion) => {
  const coincidencia = /^(\d+)([hdm])$/.exec(String(expresion).trim());
  if (!coincidencia) return 8 * 3600 * 1000;
  return Number(coincidencia[1]) * DURACIONES[coincidencia[2]] * 1000;
};

const baseCookie = () => ({
  sameSite: 'strict',
  secure: env.cookies.seguras,
  path: '/',
  maxAge: vigenciaEnMilisegundos(env.jwt.expiresIn)
});

export const abrirSesion = (res, token) => {
  const csrf = crypto.randomBytes(24).toString('hex');
  res.cookie(COOKIE_SESION, token, { ...baseCookie(), httpOnly: true });
  res.cookie(COOKIE_CSRF, csrf, { ...baseCookie(), httpOnly: false });
  return csrf;
};

export const cerrarSesion = (res) => {
  const opciones = { path: '/', sameSite: 'strict', secure: env.cookies.seguras };
  res.clearCookie(COOKIE_SESION, { ...opciones, httpOnly: true });
  res.clearCookie(COOKIE_CSRF, opciones);
};

export const tokenDeLaPeticion = (req) => {
  const enCookie = req.cookies?.[COOKIE_SESION];
  if (enCookie) return { token: enCookie, origen: 'cookie' };

  const cabecera = req.headers.authorization ?? '';
  if (cabecera.startsWith('Bearer ')) return { token: cabecera.slice(7).trim(), origen: 'cabecera' };

  return { token: null, origen: null };
};

export const tokenDeCookies = (cabecera) => {
  if (!cabecera) return null;
  const par = cabecera.split(';')
    .map((trozo) => trozo.trim().split('='))
    .find(([nombre]) => nombre === COOKIE_SESION);
  return par ? decodeURIComponent(par[1]) : null;
};
