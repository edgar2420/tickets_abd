import bcrypt from 'bcryptjs';
import pg from 'pg';
import dotenv from 'dotenv';
import { revisarPassword } from '../utils/password.js';

dotenv.config();

const [usuario, password] = process.argv.slice(2);

const AYUDA = `
  Restablece la contrasena de una cuenta desde el servidor, sin pedir la anterior.
  Sirve cuando la persona la olvido y no hay otro administrador que pueda entrar.

    npm run clave -- <usuario> <contrasena nueva>

  Ejemplo:
    npm run clave -- edgar MiClaveNueva2026
`;

if (!usuario || !password) {
  console.log(AYUDA);
  process.exit(1);
}

const pool = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_ADMIN_USER ?? process.env.DB_USER ?? 'postgres',
  password: process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tickets_ti'
});

const ejecutar = async () => {
  const fallas = revisarPassword(password, usuario);
  if (fallas.length) {
    console.error('[clave] La contrasena no cumple la politica:');
    for (const falla of fallas) console.error('  -', falla);
    process.exit(1);
  }

  const { rows } = await pool.query(
    'SELECT id, nombre, usuario, activo FROM usuarios WHERE LOWER(usuario) = LOWER($1)',
    [usuario]
  );

  if (rows.length === 0) {
    console.error(`[clave] No existe la cuenta "${usuario}".`);
    const { rows: cuentas } = await pool.query('SELECT usuario FROM usuarios ORDER BY usuario');
    console.error('[clave] Cuentas registradas:', cuentas.map((c) => c.usuario).join(', ') || 'ninguna');
    process.exit(1);
  }

  const cuenta = rows[0];
  const hash = await bcrypt.hash(password, 10);
  await pool.query('UPDATE usuarios SET password_hash = $1 WHERE id = $2', [hash, cuenta.id]);

  await pool.query(
    `INSERT INTO auditoria (usuario_id, entidad, entidad_id, accion, detalle)
     VALUES ($1, 'USUARIO', $2, 'RESTABLECER_PASSWORD', $3)`,
    [cuenta.id, cuenta.id, JSON.stringify({ origen: 'consola del servidor' })]
  );

  console.log(`[clave] Contrasena restablecida para ${cuenta.nombre} (${cuenta.usuario}).`);
  if (!cuenta.activo) {
    console.log('[clave] Atencion: la cuenta esta desactivada y no podra entrar hasta reactivarla.');
  }
  console.log('[clave] Si la cuenta quedo bloqueada por intentos fallidos, reinicie la API para liberarla.');
};

ejecutar()
  .catch((error) => {
    console.error('[clave] Error:', error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
