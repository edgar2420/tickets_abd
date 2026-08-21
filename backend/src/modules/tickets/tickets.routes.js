import { Router } from 'express';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import * as ctrl from './tickets.controller.js';
import { comentariosRouter } from '../comentarios/comentarios.routes.js';

export const ticketsRouter = Router();
ticketsRouter.use(autenticar);

ticketsRouter.use('/:id/comentarios', comentariosRouter);

ticketsRouter.get('/tablero', requierePermiso('tickets.ver_propios', 'tickets.ver_todos'), ctrl.tablero);
ticketsRouter.get('/reporte/pdf', requierePermiso('reportes.exportar', 'tickets.ver_todos'), ctrl.reportePdf);
ticketsRouter.get('/mensual', requierePermiso('reportes.ver', 'tickets.ver_todos'), ctrl.mensual);
ticketsRouter.get('/mensual/pdf', requierePermiso('reportes.ver', 'tickets.ver_todos'), ctrl.mensualPdf);

ticketsRouter.get('/', requierePermiso('tickets.ver_propios', 'tickets.ver_todos'), ctrl.listar);
ticketsRouter.get('/:id', requierePermiso('tickets.ver_propios', 'tickets.ver_todos'), ctrl.detalle);
ticketsRouter.get('/:id/pdf', requierePermiso('tickets.ver_propios', 'tickets.ver_todos'), ctrl.actaPdf);

ticketsRouter.post('/', requierePermiso('tickets.crear'), validate(ctrl.crearTicketSchema), ctrl.crear);
ticketsRouter.put('/:id/tomar', requierePermiso('tickets.responder'), ctrl.tomar);
ticketsRouter.put('/:id/asignar', requierePermiso('tickets.responder'), validate(ctrl.asignarSchema), ctrl.asignar);
ticketsRouter.put('/:id/resolver', requierePermiso('tickets.resolver'), validate(ctrl.resolverSchema), ctrl.resolver);
ticketsRouter.put('/:id/cerrar', requierePermiso('tickets.ver_propios', 'tickets.ver_todos'), ctrl.cerrar);
