import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { pool } from '../config/db.js';

const aqui = path.dirname(fileURLToPath(import.meta.url));
const dirSql = path.resolve(aqui, '../../../db');

/** Aplica el esquema y la carga inicial de datos de forma idempotente. */
const ejecutar = async () => {
  for (const archivo of ['01_schema.sql', '02_seed.sql']) {
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
