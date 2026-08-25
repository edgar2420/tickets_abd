import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const CUENTAS = process.argv.slice(2).filter((a) => a !== '--si');
const confirmado = process.argv.includes('--si');

const AYUDA = `
  Deja los registros en cero conservando unicamente las cuentas indicadas.
  No toca roles, permisos, areas, sucursales ni categorias.

    npm run limpiar-registros -- <usuario> [usuario...] --si

  Ejemplo:
    npm run limpiar-registros -- edgar william --si
`;

if (CUENTAS.length === 0) {
  console.log(AYUDA);
  process.exit(1);
}

const OPERATIVAS = [
  'adjuntos',
  'comentarios',
  'notificaciones',
  'inventario_movimientos',
  'inventario_articulos',
  'solicitudes_proyecto',
  'solicitudes_compra',
  'mantenimientos',
  'tickets',
  'equipos',
  'auditoria'
];

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_ADMIN_USER ?? process.env.DB_USER ?? 'postgres',
  password: process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tickets_ti'
});

const ejecutar = async () => {
  const { rows: conservadas } = await pool.query(
    'SELECT id, usuario, nombre FROM usuarios WHERE LOWER(usuario) = ANY($1::text[]) ORDER BY id',
    [CUENTAS.map((c) => c.toLowerCase())]
  );

  const faltantes = CUENTAS.filter(
    (c) => !conservadas.some((u) => u.usuario.toLowerCase() === c.toLowerCase())
  );
  if (faltantes.length) {
    console.error('[limpieza] No existen estas cuentas:', faltantes.join(', '));
    const { rows } = await pool.query('SELECT usuario FROM usuarios ORDER BY usuario');
    console.error('[limpieza] Cuentas registradas:', rows.map((r) => r.usuario).join(', '));
    process.exit(1);
  }

  const { rows: aBorrar } = await pool.query(
    'SELECT usuario FROM usuarios WHERE NOT (id = ANY($1::int[])) ORDER BY usuario',
    [conservadas.map((u) => u.id)]
  );

  console.log('[limpieza] Se conservan:');
  for (const u of conservadas) console.log(`   ${u.usuario} (${u.nombre})`);
  console.log('[limpieza] Se eliminan las cuentas:', aBorrar.map((u) => u.usuario).join(', ') || 'ninguna');
  console.log('[limpieza] Se vacian:', OPERATIVAS.join(', '));

  if (!confirmado) {
    console.log('\n[limpieza] Nada se toco. Vuelva a ejecutarlo con --si para confirmar.');
    return;
  }

  const cliente = await pool.connect();
  try {
    await cliente.query('BEGIN');

    for (const tabla of OPERATIVAS) {
      const { rowCount } = await cliente.query(`DELETE FROM ${tabla}`);
      console.log(`   ${String(rowCount).padStart(5)}  ${tabla}`);
    }

    const { rowCount } = await cliente.query(
      'DELETE FROM usuarios WHERE NOT (id = ANY($1::int[]))',
      [conservadas.map((u) => u.id)]
    );
    console.log(`   ${String(rowCount).padStart(5)}  usuarios`);

    await cliente.query('COMMIT');
  } catch (error) {
    await cliente.query('ROLLBACK');
    throw error;
  } finally {
    cliente.release();
  }

  const { rows: final } = await pool.query('SELECT usuario, nombre FROM usuarios ORDER BY id');
  console.log('\n[limpieza] Registros en cero. Cuentas que quedan:');
  for (const u of final) console.log(`   ${u.usuario} (${u.nombre})`);
};

ejecutar()
  .catch((error) => {
    console.error('[limpieza] Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
