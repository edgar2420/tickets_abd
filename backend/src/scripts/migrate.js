import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dirSql = path.resolve(aqui, '../../../db');

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_ADMIN_USER ?? process.env.DB_USER ?? 'tickets_app',
  password: process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? 'tickets_app',
  database: process.env.DB_NAME ?? 'tickets_ti'
});

const ejecutar = async () => {
  const archivos = (await readdir(dirSql)).filter((a) => a.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    const sql = await readFile(path.join(dirSql, archivo), 'utf8');
    console.log('[migracion] Aplicando ' + archivo);
    await pool.query(sql);
  }

  const rolApp = process.env.DB_USER;
  const rolAdmin = process.env.DB_ADMIN_USER;
  if (rolApp && rolAdmin && rolApp !== rolAdmin && /^[a-z_][a-z0-9_]{2,62}$/.test(rolApp)) {
    await pool.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${rolApp}`);
    await pool.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${rolApp}`);
    console.log(`[migracion] Permisos de fila concedidos a ${rolApp}`);
  }

  console.log('[migracion] Base de datos lista');
  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[migracion] Error:', error.message);
  await pool.end();
  process.exit(1);
});
