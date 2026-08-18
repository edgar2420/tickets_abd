import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dirSql = path.resolve(aqui, '../../../db');

/** Aplica el esquema y la carga inicial de datos de forma idempotente. */
const ejecutar = async () => {
  const { readdir } = await import('node:fs/promises');
  const archivos = (await readdir(dirSql)).filter((a) => a.endsWith('.sql')).sort();
  for (const archivo of archivos) {
    const sql = await readFile(path.join(dirSql, archivo), 'utf8');
    console.log('[migracion] Aplicando ' + archivo);
    await pool.query(sql);
  }
  console.log('[migracion] Base de datos lista');
  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[migracion] Error:', error.message);
  await pool.end();
  process.exit(1);
});
