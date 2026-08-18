import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { autenticar } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { login, perfil, cambiarPassword, logout, loginSchema, cambioPasswordSchema } from './auth.controller.js';

const limitadorLogin = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiados intentos de inicio de sesion. Intente nuevamente en unos minutos.' }
});

export const authRouter = Router();

authRouter.post('/login', limitadorLogin, validate(loginSchema), login);
authRouter.get('/perfil', autenticar, perfil);
authRouter.post('/cambiar-password', autenticar, validate(cambioPasswordSchema), cambiarPassword);
authRouter.post('/logout', autenticar, logout);
