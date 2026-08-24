import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { revisarPassword } from '../utils/password.js';

dotenv.config();

const ADMIN = {
  nombre: process.env.ADMIN_NOMBRE ?? 'Ing. Edgar Rojas Apaza',
  usuario: process.env.ADMIN_USUARIO ?? 'admin',
  email: process.env.ADMIN_EMAIL ?? null,
  password: process.env.ADMIN_PASSWORD ?? '24112001Edgar'
};

const OPERATIVAS = [
  'adjuntos',
  'comentarios',
  'notificaciones',
  'inventario_movimientos',
  'inventario_articulos',
  'solicitudes_proyecto',
  'solicitudes_compra',
  'equipos',
  'tickets',
  'auditoria'
];

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_ADMIN_USER ?? process.env.DB_USER ?? 'postgres',
  password: process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tickets_ti'
});

const confirmado = process.argv.includes('--si');

const ejecutar = async () => {
  const fallas = revisarPassword(ADMIN.password, ADMIN.usuario);
  if (fallas.length) {
    console.error('[reinicio] La clave del administrador no cumple la politica:');
    fallas.forEach((falla) => console.error('  ' + falla));
    process.exit(1);
  }

  const { rows: antes } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM usuarios)::int              AS usuarios,
            (SELECT COUNT(*) FROM tickets)::int               AS tickets,
            (SELECT COUNT(*) FROM equipos)::int               AS equipos,
            (SELECT COUNT(*) FROM inventario_articulos)::int  AS articulos,
            (SELECT COUNT(*) FROM solicitudes_compra)::int    AS compras,
            (SELECT COUNT(*) FROM auditoria)::int             AS auditoria`
  );

  console.log('[reinicio] Contenido actual de la base:');
  Object.entries(antes[0]).forEach(([tabla, total]) => console.log(`  ${tabla.padEnd(12)} ${total}`));

  if (!confirmado) {
    console.log('\n[reinicio] Esto borra todos los registros operativos y deja solo la cuenta administradora.');
    console.log('[reinicio] Vuelva a ejecutar con --si para confirmar.');
    await pool.end();
    process.exit(0);
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    for (const tabla of OPERATIVAS) {
      const { rowCount } = await cliente.query(`DELETE FROM ${tabla}`);
      console.log(`  ${String(rowCount).padStart(5)}  ${tabla}`);
      await cliente.query(`ALTER SEQUENCE IF EXISTS ${tabla}_id_seq RESTART WITH 1`);
    }

    await cliente.query('DELETE FROM usuarios');
    await cliente.query('ALTER SEQUENCE IF EXISTS usuarios_id_seq RESTART WITH 1');

    const hash = await bcrypt.hash(ADMIN.password, 10);
    const { rows } = await cliente.query(
      `INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, sucursal_id, rol_id)
       SELECT $1, $2, $3, $4,
              (SELECT id FROM areas WHERE nombre = 'Tecnologias de la Informacion'),
              (SELECT id FROM sucursales ORDER BY id LIMIT 1),
              (SELECT id FROM roles WHERE nombre = 'admin')
       RETURNING id, usuario, nombre`,
      [ADMIN.nombre, ADMIN.usuario, ADMIN.email, hash]
    );

    await cliente.query('COMMIT');

    console.log('\n[reinicio] Base reiniciada.');
    console.log(`[reinicio] Unica cuenta: ${rows[0].usuario} (${rows[0].nombre})`);
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  const { rows: despues } = await pool.query(
    `SELECT (SELECT COUNT(*) FROM usuarios)::int     AS usuarios,
            (SELECT COUNT(*) FROM roles)::int        AS roles,
            (SELECT COUNT(*) FROM permisos)::int     AS permisos,
            (SELECT COUNT(*) FROM areas)::int        AS areas,
            (SELECT COUNT(*) FROM sucursales)::int   AS sucursales,
            (SELECT COUNT(*) FROM categorias)::int   AS categorias,
            (SELECT COUNT(*) FROM tickets)::int      AS tickets`
  );

  console.log('\n[reinicio] Estado final:');
  Object.entries(despues[0]).forEach(([tabla, total]) => console.log(`  ${tabla.padEnd(12)} ${total}`));

  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[reinicio] Error:', error.message);
  await pool.end();
  process.exit(1);
});
