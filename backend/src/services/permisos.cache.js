import { query } from '../config/db.js';

const TTL_MS = 60_000;
const cache = new Map(); // rol_id -> { permisos: Set<string>, expira: number }

/** Devuelve el conjunto de codigos de permiso vigentes para un rol. */
export const permisosDeRol = async (rolId) => {
  const hit = cache.get(rolId);
  if (hit && hit.expira > Date.now()) return hit.permisos;

  const { rows } = await query(
    `SELECT p.codigo
       FROM rol_permisos rp
       JOIN permisos p ON p.id = rp.permiso_id
       JOIN roles r    ON r.id = rp.rol_id
      WHERE rp.rol_id = $1 AND r.activo = TRUE`,
    [rolId]
  );
  const permisos = new Set(rows.map((r) => r.codigo));
  cache.set(rolId, { permisos, expira: Date.now() + TTL_MS });
  return permisos;
};

/** Invalida la cache tras modificar la matriz de permisos de un rol. */
export const invalidarCachePermisos = (rolId = null) => {
  if (rolId === null) cache.clear();
  else cache.delete(Number(rolId));
};
