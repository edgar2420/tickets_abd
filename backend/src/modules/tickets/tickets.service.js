import { query } from '../../config/db.js';
import { HttpError } from '../../utils/httpError.js';
import { construirActaTicket, rutaDocumento, codigoTicket } from '../../services/pdf/documentos.service.js';

export const SELECT_TICKET = `
  SELECT t.id, t.titulo, t.descripcion, t.categoria, t.prioridad, t.estado,
         t.solucion_detalle, t.fecha_creacion, t.fecha_asignacion, t.fecha_resolucion,
         t.solicitante_id,  s.nombre  AS solicitante_nombre,  sa.nombre AS solicitante_area,
         t.sucursal_id,     suc.nombre AS sucursal_nombre,     suc.codigo AS sucursal_codigo,
         t.asignado_id,     asg.nombre AS asignado_nombre,
         t.resuelto_por_id, res.nombre AS resuelto_por_nombre,
         EXTRACT(EPOCH FROM (COALESCE(t.fecha_resolucion, CURRENT_TIMESTAMP) - t.fecha_creacion)) / 3600 AS horas_atencion
    FROM tickets t
    JOIN usuarios s       ON s.id = t.solicitante_id
    JOIN areas    sa      ON sa.id = s.area_id
    LEFT JOIN sucursales suc ON suc.id = t.sucursal_id
    LEFT JOIN usuarios asg ON asg.id = t.asignado_id
    LEFT JOIN usuarios res ON res.id = t.resuelto_por_id`;

/** Recupera un ticket con toda su trazabilidad resuelta. */
export const obtenerTicket = async (id) => {
  const { rows } = await query(`${SELECT_TICKET} WHERE t.id = $1`, [id]);
  if (!rows[0]) throw HttpError.notFound('El ticket indicado no existe');
  return rows[0];
};

/**
 * Listado con filtros. El alcance de visibilidad depende de los permisos:
 * tickets.ver_todos accede al universo completo; en caso contrario solo a los propios.
 */
export const listarTickets = async (filtros, usuario) => {
  const verTodos = usuario.permisos.includes('tickets.ver_todos');
  const { rows } = await query(
    `${SELECT_TICKET}
      WHERE ($1::bool = TRUE OR t.solicitante_id = $2)
        AND ($3::varchar   IS NULL OR t.estado = $3)
        AND ($4::varchar   IS NULL OR t.categoria = $4)
        AND ($5::varchar   IS NULL OR t.prioridad = $5)
        AND ($6::int       IS NULL OR t.asignado_id = $6)
        AND ($7::int       IS NULL OR s.area_id = $7)
        AND ($12::int      IS NULL OR t.sucursal_id = $12)
        AND ($8::timestamp IS NULL OR t.fecha_creacion >= $8)
        AND ($9::timestamp IS NULL OR t.fecha_creacion <= $9)
        AND ($10::text     IS NULL OR t.titulo ILIKE '%' || $10 || '%' OR t.descripcion ILIKE '%' || $10 || '%')
      ORDER BY
        CASE t.prioridad WHEN 'Critica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Media' THEN 3 ELSE 4 END,
        t.fecha_creacion DESC
      LIMIT $11 OFFSET $13`,
    [
      verTodos, usuario.id,
      filtros.estado ?? null, filtros.categoria ?? null, filtros.prioridad ?? null,
      filtros.asignado_id ?? null, filtros.area_id ?? null,
      filtros.desde ?? null, filtros.hasta ?? null, filtros.busqueda ?? null,
      filtros.limite ?? 25,
      filtros.sucursal_id ?? null,
      filtros.desplazamiento ?? 0
    ]
  );
  return rows;
};

/** Cantidad total de tickets que cumplen los filtros, para la paginacion. */
export const contarTickets = async (filtros, usuario) => {
  const verTodos = usuario.permisos.includes('tickets.ver_todos');
  const { rows } = await query(
    `SELECT COUNT(*)::int AS total
       FROM tickets t
       JOIN usuarios s ON s.id = t.solicitante_id
      WHERE ($1::bool = TRUE OR t.solicitante_id = $2)
        AND ($3::varchar   IS NULL OR t.estado = $3)
        AND ($4::varchar   IS NULL OR t.categoria = $4)
        AND ($5::varchar   IS NULL OR t.prioridad = $5)
        AND ($6::int       IS NULL OR t.asignado_id = $6)
        AND ($7::int       IS NULL OR s.area_id = $7)
        AND ($8::timestamp IS NULL OR t.fecha_creacion >= $8)
        AND ($9::timestamp IS NULL OR t.fecha_creacion <= $9)
        AND ($10::text     IS NULL OR t.titulo ILIKE '%' || $10 || '%' OR t.descripcion ILIKE '%' || $10 || '%')
        AND ($11::int      IS NULL OR t.sucursal_id = $11)`,
    [
      verTodos, usuario.id,
      filtros.estado ?? null, filtros.categoria ?? null, filtros.prioridad ?? null,
      filtros.asignado_id ?? null, filtros.area_id ?? null,
      filtros.desde ?? null, filtros.hasta ?? null, filtros.busqueda ?? null,
      filtros.sucursal_id ?? null
    ]
  );
  return rows[0].total;
};

/** Indicadores agregados para el tablero y los reportes. */
export const indicadores = async (filtros = {}, usuario = null) => {
  const verTodos = usuario ? usuario.permisos.includes('tickets.ver_todos') : true;
  const { rows } = await query(
    `SELECT
        COUNT(*)::int                                                     AS total,
        COUNT(*) FILTER (WHERE estado = 'Abierto')::int                   AS abiertos,
        COUNT(*) FILTER (WHERE estado = 'En Proceso')::int                AS en_proceso,
        COUNT(*) FILTER (WHERE estado = 'Resuelto')::int                  AS resueltos,
        COUNT(*) FILTER (WHERE estado = 'Cerrado')::int                   AS cerrados,
        COUNT(*) FILTER (WHERE prioridad = 'Critica'
                           AND estado IN ('Abierto','En Proceso'))::int   AS criticos
       FROM tickets t
      WHERE ($1::bool = TRUE OR t.solicitante_id = $2)
        AND ($3::timestamp IS NULL OR t.fecha_creacion >= $3)
        AND ($4::timestamp IS NULL OR t.fecha_creacion <= $4)`,
    [verTodos, usuario?.id ?? 0, filtros.desde ?? null, filtros.hasta ?? null]
  );
  return rows[0];
};

/** Distribucion por categoria, prioridad y area para el tablero de indicadores. */
export const distribuciones = async () => {
  const porCategoria = await query(
    `SELECT categoria AS etiqueta, COUNT(*)::int AS total FROM tickets GROUP BY categoria ORDER BY total DESC`
  );
  const porEstado = await query(
    `SELECT estado AS etiqueta, COUNT(*)::int AS total FROM tickets GROUP BY estado ORDER BY total DESC`
  );
  const porArea = await query(
    `SELECT a.nombre AS etiqueta, COUNT(*)::int AS total
       FROM tickets t JOIN usuarios u ON u.id = t.solicitante_id JOIN areas a ON a.id = u.area_id
      GROUP BY a.nombre ORDER BY total DESC LIMIT 10`
  );
  // Ranking de solicitantes: quienes generan mas requerimientos
  const porSolicitante = await query(
    `SELECT u.nombre AS etiqueta, a.nombre AS detalle, COUNT(*)::int AS total
       FROM tickets t JOIN usuarios u ON u.id = t.solicitante_id JOIN areas a ON a.id = u.area_id
      GROUP BY u.nombre, a.nombre ORDER BY total DESC LIMIT 10`
  );
  const porSucursal = await query(
    `SELECT COALESCE(s.nombre, 'Sin sucursal') AS etiqueta, COUNT(*)::int AS total
       FROM tickets t LEFT JOIN sucursales s ON s.id = t.sucursal_id
      GROUP BY s.nombre ORDER BY total DESC LIMIT 10`
  );
  return {
    porSucursal: porSucursal.rows,
    porCategoria: porCategoria.rows,
    porEstado: porEstado.rows,
    porArea: porArea.rows,
    porSolicitante: porSolicitante.rows
  };
};

/** Bitacora de auditoria asociada a un ticket. */
export const bitacoraTicket = async (ticketId) => {
  const { rows } = await query(
    `SELECT a.accion, a.detalle, a.ip, a.fecha, u.nombre AS usuario_nombre
       FROM auditoria a LEFT JOIN usuarios u ON u.id = a.usuario_id
      WHERE a.entidad = 'TICKET' AND a.entidad_id = $1
      ORDER BY a.fecha ASC`,
    [ticketId]
  );
  return rows;
};

/**
 * Documentacion automatica: cada transicion del ticket deja un acta PDF
 * archivada en el repositorio documental del sistema.
 */
export const archivarActaTicket = async (ticketId, accion) => {
  try {
    const ticket = await obtenerTicket(ticketId);
    const bitacora = await bitacoraTicket(ticketId);
    const sello = new Date().toISOString().replace(/[:.]/g, '-');
    const destino = rutaDocumento('tickets', `${codigoTicket(ticketId)}-${accion}-${sello}.pdf`);
    await construirActaTicket(ticket, bitacora, { accion }).aArchivo(destino);
    return destino;
  } catch (error) {
    console.error('[documentacion] No se pudo archivar el acta del ticket:', error.message);
    return null;
  }
};
