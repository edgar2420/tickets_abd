import { query } from '../../config/db.js';

const SITUACION = `
  CASE
    WHEN e.ultimo_mantenimiento IS NULL THEN 'Sin registro'
    WHEN proximo.fecha < CURRENT_DATE THEN 'Vencido'
    WHEN proximo.fecha <= CURRENT_DATE + INTERVAL '30 days' THEN 'Por vencer'
    ELSE 'Al dia'
  END`;

const PROXIMO = `
  LEFT JOIN LATERAL (
    SELECT (e.ultimo_mantenimiento + (CASE e.frecuencia_mantenimiento
              WHEN 'Mensual' THEN INTERVAL '1 month'
              WHEN 'Trimestral' THEN INTERVAL '3 months'
              WHEN 'Semestral' THEN INTERVAL '6 months'
              WHEN 'Anual' THEN INTERVAL '12 months'
            END))::date AS fecha
  ) proximo ON TRUE`;

const SELECT_PLAN = `
  SELECT e.id, e.codigo, e.nombre_equipo, e.tipo, e.ubicacion, e.estado,
         e.frecuencia_mantenimiento, e.ultimo_mantenimiento,
         proximo.fecha AS proximo_mantenimiento,
         ${SITUACION} AS situacion,
         u.nombre AS responsable_nombre,
         s.nombre AS sucursal_nombre,
         (SELECT COUNT(*)::int FROM mantenimientos m WHERE m.equipo_id = e.id) AS realizados
    FROM equipos e
    ${PROXIMO}
    LEFT JOIN usuarios u ON u.id = e.usuario_id
    LEFT JOIN sucursales s ON s.id = e.sucursal_id
   WHERE e.activo = TRUE
     AND e.frecuencia_mantenimiento IS NOT NULL`;

export const listarPlan = async (filtros = {}) => {
  const { rows } = await query(
    `${SELECT_PLAN}
       AND ($1::varchar IS NULL OR ${SITUACION} = $1)
       AND ($2::varchar IS NULL OR e.frecuencia_mantenimiento = $2)
       AND ($3::int IS NULL OR e.sucursal_id = $3)
       AND ($4::text IS NULL OR e.codigo ILIKE '%' || $4 || '%'
            OR e.nombre_equipo ILIKE '%' || $4 || '%')
     ORDER BY
       CASE ${SITUACION}
         WHEN 'Vencido' THEN 1 WHEN 'Por vencer' THEN 2 WHEN 'Sin registro' THEN 3 ELSE 4
       END,
       proximo.fecha NULLS FIRST,
       e.codigo`,
    [
      filtros.situacion ?? null,
      filtros.frecuencia ?? null,
      filtros.sucursal_id ?? null,
      filtros.busqueda ?? null
    ]
  );
  return rows;
};

export const resumenPlan = async () => {
  const { rows } = await query(
    `SELECT
       COUNT(*)::int AS con_plan,
       COUNT(*) FILTER (WHERE ${SITUACION} = 'Vencido')::int      AS vencidos,
       COUNT(*) FILTER (WHERE ${SITUACION} = 'Por vencer')::int   AS por_vencer,
       COUNT(*) FILTER (WHERE ${SITUACION} = 'Al dia')::int       AS al_dia,
       COUNT(*) FILTER (WHERE ${SITUACION} = 'Sin registro')::int AS sin_registro,
       (SELECT COUNT(*)::int FROM equipos
         WHERE activo = TRUE AND frecuencia_mantenimiento IS NULL) AS sin_plan
     FROM equipos e
     ${PROXIMO}
    WHERE e.activo = TRUE AND e.frecuencia_mantenimiento IS NOT NULL`
  );
  return rows[0];
};

export const obtenerEquipoDelPlan = async (id) => {
  const { rows } = await query(`${SELECT_PLAN} AND e.id = $1`, [id]);
  return rows[0] ?? null;
};

export const historialDeEquipo = async (equipoId, limite = 20) => {
  const { rows } = await query(
    `SELECT m.id, m.fecha, m.observaciones, m.ticket_id, m.fecha_registro,
            u.nombre AS realizado_por_nombre,
            t.anio AS ticket_anio, t.numero AS ticket_numero
       FROM mantenimientos m
       LEFT JOIN usuarios u ON u.id = m.realizado_por_id
       LEFT JOIN tickets t ON t.id = m.ticket_id
      WHERE m.equipo_id = $1
      ORDER BY m.fecha DESC, m.id DESC
      LIMIT $2`,
    [equipoId, limite]
  );
  return rows;
};
