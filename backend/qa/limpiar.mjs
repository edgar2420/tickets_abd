import { query, pool } from '../src/config/db.js';

/**
 * Retira los datos que dejan las pruebas automatizadas.
 *
 * Todo lo que crean los guiones de QA lleva el prefijo "QA - " en su
 * titulo, de modo que se puede identificar sin ambiguedad y sin tocar la
 * informacion real de la empresa.
 */
const PREFIJO = 'QA - %';

const borrar = async (descripcion, sentencia, parametros = [PREFIJO]) => {
  const { rowCount } = await query(sentencia, parametros);
  console.log(`${String(rowCount).padStart(4)}  ${descripcion}`);
  return rowCount;
};

console.log('=== RETIRO DE DATOS DE PRUEBA ===');

const { rows: tickets } = await query('SELECT id FROM tickets WHERE titulo LIKE $1', [PREFIJO]);
const ids = tickets.map((t) => t.id);

if (ids.length) {
  await borrar('adjuntos', 'DELETE FROM adjuntos WHERE comentario_id IN (SELECT id FROM comentarios WHERE ticket_id = ANY($1))', [ids]);
  await borrar('comentarios', 'DELETE FROM comentarios WHERE ticket_id = ANY($1)', [ids]);
  await borrar('notificaciones de tickets', 'DELETE FROM notificaciones WHERE ticket_id = ANY($1)', [ids]);
  await borrar('auditoria de tickets', "DELETE FROM auditoria WHERE entidad = 'TICKET' AND entidad_id = ANY($1)", [ids]);
  await borrar('movimientos de inventario', 'DELETE FROM inventario_movimientos WHERE motivo LIKE $1');
  await borrar('tickets', 'DELETE FROM tickets WHERE id = ANY($1)', [ids]);
}

const { rows: compras } = await query('SELECT id FROM solicitudes_compra WHERE titulo LIKE $1', [PREFIJO]);
const idsCompra = compras.map((c) => c.id);
if (idsCompra.length) {
  await borrar('auditoria de compras', "DELETE FROM auditoria WHERE entidad = 'COMPRA' AND entidad_id = ANY($1)", [idsCompra]);
  await borrar('solicitudes de compra', 'DELETE FROM solicitudes_compra WHERE id = ANY($1)', [idsCompra]);
}

console.log('\nBase de datos sin residuos de prueba.');
await pool.end();
