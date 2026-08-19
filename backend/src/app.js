import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import { env } from './config/env.js';
import { notFoundHandler, errorHandler } from './middleware/error.js';
import { authRouter } from './modules/auth/auth.routes.js';
import { areasRouter } from './modules/areas/areas.routes.js';
import { categoriasRouter } from './modules/categorias/categorias.routes.js';
import { rolesRouter } from './modules/roles/roles.routes.js';
import { permisosRouter } from './modules/permisos/permisos.routes.js';
import { usuariosRouter } from './modules/usuarios/usuarios.routes.js';
import { ticketsRouter } from './modules/tickets/tickets.routes.js';
import { adjuntosRouter } from './modules/comentarios/comentarios.routes.js';
import { auditoriaRouter } from './modules/auditoria/auditoria.routes.js';
import { inventarioRouter } from './modules/inventario/inventario.routes.js';
import { notificacionesRouter } from './modules/notificaciones/notificaciones.routes.js';

export const crearApp = () => {
  const app = express();

  app.set('trust proxy', 1);
  app.use(helmet({ crossOriginResourcePolicy: false }));
  app.use(cors({ origin: env.cors.origins, credentials: true }));
  app.use(compression());
  app.use(express.json({ limit: '2mb' }));
  app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

  app.get('/salud', (_req, res) => res.json({
    ok: true,
    servicio: 'API Sistema de Tickets TI',
    version: '1.0.0',
    autor: env.autor,
    modulo: env.autorRol,
    fecha: new Date().toISOString()
  }));

  const api = express.Router();
  api.use('/auth', authRouter);
  api.use('/areas', areasRouter);
  api.use('/categorias', categoriasRouter);
  api.use('/roles', rolesRouter);
  api.use('/permisos', permisosRouter);
  api.use('/usuarios', usuariosRouter);
  api.use('/tickets', ticketsRouter);
  api.use('/adjuntos', adjuntosRouter);
  api.use('/auditoria', auditoriaRouter);
  api.use('/inventario', inventarioRouter);
  api.use('/notificaciones', notificacionesRouter);

  app.use(env.apiPrefix, api);
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
