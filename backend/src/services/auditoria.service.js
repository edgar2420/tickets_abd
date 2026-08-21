import { query } from '../config/db.js';

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

export const contarAuditoria = async ({ desde = null, hasta = null, entidad = null, usuarioId = null }) => {
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total FROM auditoria a
      WHERE ($1::timestamp IS NULL OR a.fecha >= $1)
        AND ($2::timestamp IS NULL OR a.fecha <= $2)
        AND ($3::varchar   IS NULL OR a.entidad = $3)
        AND ($4::int       IS NULL OR a.usuario_id = $4)`,
    [desde, hasta, entidad, usuarioId]
  );
  return rows[0].total;
};

export const listarAuditoria = async ({ desde = null, hasta = null, entidad = null, usuarioId = null, limite = 25, desplazamiento = 0 }) => {
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
      LIMIT $5 OFFSET $6`,
    [desde, hasta, entidad, usuarioId, limite, desplazamiento]
  );
  return rows;
};
