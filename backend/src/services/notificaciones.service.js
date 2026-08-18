import { query } from '../config/db.js';
import { emitir, salaUsuario, SALA_TECNICOS } from '../realtime/socket.js';

/** Persiste una notificacion y la emite en tiempo real al destinatario. */
export const notificarUsuario = async ({ usuarioId, ticketId = null, tipo, titulo, mensaje }) => {
  const { rows } = await query(
    `INSERT INTO notificaciones (usuario_id, ticket_id, tipo, titulo, mensaje)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, usuario_id, ticket_id, tipo, titulo, mensaje, leida, fecha`,
    [usuarioId, ticketId, tipo, titulo, mensaje]
  );
  emitir(salaUsuario(usuarioId), 'notificacion:nueva', rows[0]);
  return rows[0];
};

/** Notifica a todo el equipo tecnico (usuarios con permiso tickets.ver_todos). */
export const notificarEquipoTecnico = async ({ ticketId = null, tipo, titulo, mensaje, excluirUsuarioId = null }) => {
  const { rows } = await query(
    `SELECT DISTINCT u.id
       FROM usuarios u
       JOIN rol_permisos rp ON rp.rol_id = u.rol_id
       JOIN permisos p      ON p.id = rp.permiso_id
      WHERE p.codigo = 'tickets.ver_todos' AND u.activo = TRUE
        AND ($1::int IS NULL OR u.id <> $1)`,
    [excluirUsuarioId]
  );
  for (const { id } of rows) {
    await query(
      `INSERT INTO notificaciones (usuario_id, ticket_id, tipo, titulo, mensaje) VALUES ($1,$2,$3,$4,$5)`,
      [id, ticketId, tipo, titulo, mensaje]
    );
  }
  emitir(SALA_TECNICOS, 'notificacion:nueva', { ticket_id: ticketId, tipo, titulo, mensaje, fecha: new Date().toISOString() });
};

export const listarNotificaciones = async (usuarioId, soloNoLeidas = false) => {
  const { rows } = await query(
    `SELECT id, ticket_id, tipo, titulo, mensaje, leida, fecha
       FROM notificaciones
      WHERE usuario_id = $1 AND ($2::boolean = FALSE OR leida = FALSE)
      ORDER BY fecha DESC LIMIT 100`,
    [usuarioId, soloNoLeidas]
  );
  return rows;
};

export const marcarLeida = async (usuarioId, notificacionId) => {
  const { rowCount } = await query(
    `UPDATE notificaciones SET leida = TRUE WHERE id = $1 AND usuario_id = $2`,
    [notificacionId, usuarioId]
  );
  return rowCount > 0;
};

export const marcarTodasLeidas = async (usuarioId) => {
  const { rowCount } = await query(`UPDATE notificaciones SET leida = TRUE WHERE usuario_id = $1 AND leida = FALSE`, [usuarioId]);
  return rowCount;
};
