import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { verificarCsrf } from './middleware/csrf.js';
import { verificarOrigen } from './middleware/origen.js';
import { forzarHttps } from './middleware/https.js';
import { accesoCerrado } from './middleware/accesoCerrado.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { areasRouter } from './modules/areas/areas.routes.js';
import { sucursalesRouter } from './modules/sucursales/sucursales.routes.js';
import { categoriasRouter } from './modules/categorias/categorias.routes.js';
import { rolesRouter } from './modules/roles/roles.routes.js';
import { permisosRouter } from './modules/permisos/permisos.routes.js';
import { usuariosRouter } from './modules/usuarios/usuarios.routes.js';
import { ticketsRouter } from './modules/tickets/tickets.routes.js';
import { adjuntosRouter } from './modules/comentarios/comentarios.routes.js';
import { auditoriaRouter } from './modules/auditoria/auditoria.routes.js';
import { notificacionesRouter } from './modules/notificaciones/notificaciones.routes.js';
import { inventarioRouter } from './modules/inventario/inventario.routes.js';
import { equiposRouter } from './modules/equipos/equipos.routes.js';
import { comprasRouter } from './modules/compras/compras.routes.js';

/** Techo general de peticiones, para que un cliente no sature el servicio. */
const limitadorGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { ok: false, mensaje: 'Demasiadas peticiones. Intente nuevamente en un minuto.' }
});

export const crearApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(forzarHttps);

  app.use(helmet({
    // La interfaz se sirve aparte; la API solo responde datos y documentos
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
        formAction: ["'none'"]
      }
    },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    hsts: env.nodeEnv === 'production' ? { maxAge: 31536000, includeSubDomains: true } : false
  }));

  app.use(cors({
    origin: env.cors.origins,
    credentials: true,
    exposedHeaders: ['Content-Disposition']
  }));

  app.use(compression());
  app.use(cookieParser());
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/salud', (_req, res) => res.json({
    ok: true,
    servicio: 'API Sistema de Tickets TI',
    version: '1.10.0',
    autor: env.autor,
    modulo: env.autorRol,
    fecha: new Date().toISOString()
  }));

  const api = express.Router();
  api.use(limitadorGeneral);
  api.use(accesoCerrado);
  api.use(verificarCsrf);
  api.use(verificarOrigen);

  api.use('/auth', authRouter);
  api.use('/areas', areasRouter);
  api.use('/sucursales', sucursalesRouter);
  api.use('/categorias', categoriasRouter);
  api.use('/roles', rolesRouter);
  api.use('/permisos', permisosRouter);
  api.use('/usuarios', usuariosRouter);
  api.use('/tickets', ticketsRouter);
  api.use('/adjuntos', adjuntosRouter);
  api.use('/auditoria', auditoriaRouter);
  api.use('/notificaciones', notificacionesRouter);
  api.use('/inventario', inventarioRouter);
  api.use('/equipos', equiposRouter);
  api.use('/compras', comprasRouter);

  app.use(env.apiPrefix, api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
