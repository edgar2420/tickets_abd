import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { autenticar } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { sinCache } from '../../middleware/cache.js';
import { login, perfil, cambiarPassword, logout, loginSchema, cambioPasswordSchema } from './auth.controller.js';

const limitadorLogin = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 40,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiados intentos de inicio de sesion. Intente nuevamente en unos minutos.' }
});

const retardoProgresivo = slowDown({
  windowMs: 10 * 60 * 1000,
  delayAfter: 5,
  delayMs: (usados) => (usados - 5) * 500,
  maxDelayMs: 5000,
  skipSuccessfulRequests: true
});

export const authRouter = Router();

authRouter.use(sinCache);

authRouter.post('/login', limitadorLogin, retardoProgresivo, validate(loginSchema), login);
authRouter.get('/perfil', autenticar, perfil);
authRouter.post('/cambiar-password', autenticar, validate(cambioPasswordSchema), cambiarPassword);
authRouter.post('/logout', autenticar, logout);
