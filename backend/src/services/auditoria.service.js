import { query } from '../config/db.js';

/**
 * Registra una accion en la bitacora. Cada operacion registrada aqui es la
 * fuente de datos del reporte PDF de trazabilidad del sistema.
 */
export const registrarAuditoria = async ({ usuarioId, entidad, entidadId = null, accion, detalle = null, ip = null }) => {
  try {
    await query(
      `INSERT INTO auditoria (usuario_id, entidad, entidad_id, accion, detalle, ip)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [usuarioId ?? null, entidad, entidadId, accion, detalle ? JSON.stringify(detalle) : null, ip]
    );
  } catch (error) {
    console.error('[auditoria] No se pudo registrar la accion:', error.message);
  }
};

export const listarAuditoria = async ({ desde = null, hasta = null, entidad = null, usuarioId = null, limite = 500 }) => {
  const { rows } = await query(
    `SELECT a.id, a.entidad, a.entidad_id, a.accion, a.detalle, a.ip, a.fecha,
            u.nombre AS usuario_nombre, u.usuario AS usuario_login
       FROM auditoria a
       LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE ($1::timestamp IS NULL OR a.fecha >= $1)
        AND ($2::timestamp IS NULL OR a.fecha <= $2)
        AND ($3::varchar   IS NULL OR a.entidad = $3)
        AND ($4::int       IS NULL OR a.usuario_id = $4)
      ORDER BY a.fecha DESC
      LIMIT $5`,
    [desde, hasta, entidad, usuarioId, limite]
  );
  return rows;
};
