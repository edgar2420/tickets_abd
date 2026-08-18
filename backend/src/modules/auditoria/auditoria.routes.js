import { Router } from 'express';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/httpError.js';
import { listarAuditoria, registrarAuditoria } from '../../services/auditoria.service.js';
import { construirReporteAuditoria, construirMatrizRoles } from '../../services/pdf/documentos.service.js';

export const auditoriaRouter = Router();
auditoriaRouter.use(autenticar);

auditoriaRouter.get('/', requierePermiso('reportes.ver', 'admin.usuarios'), asyncHandler(async (req, res) => {
  const datos = await listarAuditoria({
    desde: req.query.desde ?? null,
    hasta: req.query.hasta ?? null,
    entidad: req.query.entidad ?? null,
    usuarioId: req.query.usuario_id ?? null
  });
  res.json({ ok: true, datos });
}));

auditoriaRouter.get('/pdf', requierePermiso('reportes.exportar', 'admin.usuarios'), asyncHandler(async (req, res) => {
  const filas = await listarAuditoria({
    desde: req.query.desde ?? null,
    hasta: req.query.hasta ?? null,
    entidad: req.query.entidad ?? null,
    limite: 3000
  });
  const buffer = await construirReporteAuditoria({ filas, filtros: req.query }).aBuffer();
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_AUDITORIA_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="bitacora-auditoria.pdf"');
  res.send(buffer);
}));

/** Documento PDF de la matriz de roles y permisos vigente. */
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
