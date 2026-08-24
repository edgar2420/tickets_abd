import { query, pool } from '../src/config/db.js';

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

const { rows: proyectos } = await query('SELECT id FROM solicitudes_proyecto WHERE titulo LIKE $1', [PREFIJO]);
const idsProyecto = proyectos.map((proyecto) => proyecto.id);
if (idsProyecto.length) {
  await borrar('auditoria de proyectos',
    "DELETE FROM auditoria WHERE entidad = 'PROYECTO' AND entidad_id = ANY($1)", [idsProyecto]);
  await borrar('peticiones de proyecto',
    'DELETE FROM solicitudes_proyecto WHERE id = ANY($1)', [idsProyecto]);
}

await borrar('movimientos de los articulos de prueba',
  "DELETE FROM inventario_movimientos WHERE articulo_id IN (SELECT id FROM inventario_articulos WHERE codigo LIKE 'QA-%')", []);
await borrar('articulos de prueba',
  "DELETE FROM inventario_articulos WHERE codigo LIKE 'QA-%'", []);
await borrar('equipos de prueba',
  "DELETE FROM equipos WHERE codigo LIKE '%-QA-%' OR nombre_equipo LIKE 'QA-%'", []);
await borrar('notificaciones de las cuentas de prueba',
  "DELETE FROM notificaciones WHERE usuario_id IN (SELECT id FROM usuarios WHERE usuario LIKE 'qa.%')", []);
await borrar('auditoria de las cuentas de prueba',
  "DELETE FROM auditoria WHERE usuario_id IN (SELECT id FROM usuarios WHERE usuario LIKE 'qa.%')", []);
await borrar('cuentas de prueba',
  "DELETE FROM usuarios WHERE usuario LIKE 'qa.%'", []);

console.log('\nBase de datos sin residuos de prueba.');
await pool.end();
