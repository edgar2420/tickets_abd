import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Crea el rol con el que la API trabaja a diario.
 *
 * Hasta ahora la aplicacion se conectaba con la cuenta dueña de las tablas,
 * capaz de borrarlas o alterarlas. Una falla de inyeccion en cualquier
 * consulta habria tenido ese alcance. El rol que se crea aqui solo puede
 * leer y escribir filas: no puede crear, alterar ni destruir estructuras,
 * ni vaciar tablas de un golpe.
 *
 * Es ademas el requisito previo para cualquier politica de seguridad por
 * fila, porque el dueño de una tabla las omite salvo que se fuercen.
 *
 * Uso:
 *   node src/scripts/privilegios.js
 *
 * Toma la clave del nuevo rol de DB_APP_PASSWORD y se conecta con las
 * credenciales administradoras de DB_ADMIN_USER y DB_ADMIN_PASSWORD.
 */

const ROL = process.env.DB_APP_USER ?? 'tickets_api';
const CLAVE = process.env.DB_APP_PASSWORD;

/**
 * Una sentencia CREATE ROLE no admite parametros: la clave debe ir escrita
 * en el texto. Por eso se exige un formato acotado y se rechaza cualquier
 * caracter que pudiera cerrar la cadena y alterar la sentencia.
 */
const FORMATO_CLAVE = /^[A-Za-z0-9._-]{16,}$/;
const FORMATO_ROL = /^[a-z_][a-z0-9_]{2,62}$/;

if (!CLAVE || !FORMATO_CLAVE.test(CLAVE)) {
  console.error('[privilegios] DB_APP_PASSWORD debe tener 16 caracteres o mas, solo letras, numeros, punto, guion y guion bajo.');
  console.error('[privilegios] Genere una de 48 caracteres con: openssl rand -hex 24');
  process.exit(1);
}

const admin = new pg.Pool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 5432),
  user: process.env.DB_ADMIN_USER ?? 'postgres',
  password: process.env.DB_ADMIN_PASSWORD ?? 'postgres',
  database: process.env.DB_NAME ?? 'tickets_ti'
});

const paso = async (descripcion, sentencia, parametros = []) => {
  await admin.query(sentencia, parametros);
  console.log('  ' + descripcion);
};

const ejecutar = async () => {
  console.log('[privilegios] Rol de ejecucion: ' + ROL);

  if (!FORMATO_ROL.test(ROL)) {
    console.error('[privilegios] El nombre del rol no tiene un formato admitido.');
    process.exit(1);
  }

  const { rows } = await admin.query('SELECT 1 FROM pg_roles WHERE rolname = $1', [ROL]);
  const verbo = rows[0] ? 'ALTER' : 'CREATE';
  await paso(rows[0] ? 'clave actualizada' : 'rol creado', `${verbo} ROLE ${ROL} WITH LOGIN PASSWORD '${CLAVE}'`);

  await paso('sin permiso para crear estructuras', `ALTER ROLE ${ROL} NOSUPERUSER NOCREATEDB NOCREATEROLE NOBYPASSRLS`);
  await paso('acceso a la base', `GRANT CONNECT ON DATABASE ${process.env.DB_NAME ?? 'tickets_ti'} TO ${ROL}`);
  await paso('lectura del esquema, sin poder crear en el', `GRANT USAGE ON SCHEMA public TO ${ROL}`);
  await paso('nadie mas obtiene permisos por omision', 'REVOKE ALL ON SCHEMA public FROM PUBLIC');

  await paso(
    'lectura y escritura de filas, sin vaciado masivo',
    `GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO ${ROL}`
  );
  await paso('uso de los contadores de identidad', `GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${ROL}`);
  await paso(
    'las tablas futuras heredan el mismo criterio',
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO ${ROL}`
  );
  await paso(
    'las secuencias futuras tambien',
    `ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO ${ROL}`
  );

  const { rows: comprobacion } = await admin.query(
    `SELECT
       has_table_privilege($1, 'tickets', 'SELECT') AS puede_leer,
       has_table_privilege($1, 'tickets', 'INSERT') AS puede_escribir,
       has_table_privilege($1, 'tickets', 'TRUNCATE') AS puede_vaciar,
       has_schema_privilege($1, 'public', 'CREATE')  AS puede_crear`,
    [ROL]
  );
  const c = comprobacion[0];

  console.log('\n[privilegios] Verificacion:');
  console.log(`  leer filas .............. ${c.puede_leer ? 'si' : 'NO'}`);
  console.log(`  escribir filas .......... ${c.puede_escribir ? 'si' : 'NO'}`);
  console.log(`  vaciar tablas ........... ${c.puede_vaciar ? 'SI (revisar)' : 'no'}`);
  console.log(`  crear o borrar tablas ... ${c.puede_crear ? 'SI (revisar)' : 'no'}`);

  const correcto = c.puede_leer && c.puede_escribir && !c.puede_vaciar && !c.puede_crear;
  console.log(
    correcto
      ? `\n[privilegios] Listo. Apunte DB_USER=${ROL} y DB_PASSWORD a la clave definida.`
      : '\n[privilegios] Los privilegios no quedaron como se esperaba. Revise la salida.'
  );

  await admin.end();
  process.exit(correcto ? 0 : 1);
};

ejecutar().catch(async (error) => {
  console.error('[privilegios] Error:', error.message);
  await admin.end();
  process.exit(1);
});
