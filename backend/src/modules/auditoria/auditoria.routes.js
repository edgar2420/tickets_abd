import { Router } from 'express';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { sinCache } from '../../middleware/cache.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/httpError.js';
import { listarAuditoria, contarAuditoria, registrarAuditoria } from '../../services/auditoria.service.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { construirReporteAuditoria, construirMatrizRoles } from '../../services/pdf/documentos.service.js';

export const auditoriaRouter = Router();
auditoriaRouter.use(autenticar);
auditoriaRouter.use(sinCache);

auditoriaRouter.get('/', requierePermiso('auditoria.ver'), asyncHandler(async (req, res) => {
  const { limite, pagina, desplazamiento } = paginacion(req.query);
  const filtros = {
    desde: req.query.desde ?? null,
    hasta: req.query.hasta ?? null,
    entidad: req.query.entidad ?? null,
    usuarioId: req.query.usuario_id ?? null
  };
  const [datos, total] = await Promise.all([
    listarAuditoria({ ...filtros, limite, desplazamiento }),
    contarAuditoria(filtros)
  ]);
  res.json(respuestaPaginada(datos, total, limite, pagina));
}));

auditoriaRouter.get('/pdf', requierePermiso('auditoria.ver'), asyncHandler(async (req, res) => {
  const hace30Dias = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString().slice(0, 10);
  const desde = req.query.desde || (req.query.hasta || req.query.entidad ? null : hace30Dias);
  const filtros = { ...req.query, desde, limite: 500 };

  const filas = await listarAuditoria({
    desde,
    hasta: req.query.hasta ?? null,
    entidad: req.query.entidad ?? null,
    limite: 500
  });
  const buffer = await construirReporteAuditoria({ filas, filtros }).aBuffer();
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_AUDITORIA_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="bitacora-auditoria.pdf"');
  res.send(buffer);
}));

auditoriaRouter.get('/matriz-rbac/pdf', requierePermiso('admin.roles'), asyncHandler(async (req, res) => {
  const { rows: permisos } = await query('SELECT id, codigo, descripcion, modulo FROM permisos ORDER BY modulo, codigo');
  const { rows: roles } = await query(
    `SELECT r.id, r.nombre, r.descripcion, r.activo,
            COALESCE(json_agg(json_build_object('id', p.id, 'codigo', p.codigo, 'modulo', p.modulo))
                     FILTER (WHERE p.id IS NOT NULL), '[]') AS permisos,
            (SELECT COUNT(*) FROM usuarios u WHERE u.rol_id = r.id) AS total_usuarios
       FROM roles r
       LEFT JOIN rol_permisos rp ON rp.rol_id = r.id
       LEFT JOIN permisos p      ON p.id = rp.permiso_id
      GROUP BY r.id ORDER BY r.nombre`
  );
  const buffer = await construirMatrizRoles({ roles, permisos }).aBuffer();
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_MATRIZ_RBAC_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="matriz-roles-permisos.pdf"');
  res.send(buffer);
}));
