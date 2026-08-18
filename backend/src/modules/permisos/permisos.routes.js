import { Router } from 'express';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { asyncHandler } from '../../utils/httpError.js';

export const permisosRouter = Router();
permisosRouter.use(autenticar);

/** Catalogo de permisos atomicos agrupado por modulo (alimenta la matriz de checkboxes). */
permisosRouter.get('/', requierePermiso('admin.roles'), asyncHandler(async (_req, res) => {
  const { rows } = await query('SELECT id, codigo, descripcion, modulo FROM permisos ORDER BY modulo, codigo');
  const agrupados = rows.reduce((acumulado, permiso) => {
    acumulado[permiso.modulo] = acumulado[permiso.modulo] ?? [];
    acumulado[permiso.modulo].push(permiso);
    return acumulado;
  }, {});
  res.json({ ok: true, datos: rows, porModulo: agrupados });
}));
