/**
 * Crea las cuentas de prueba necesarias para recorrer el ciclo completo del
 * ticket con varios perfiles y areas: quien solicita, quien atiende y quien
 * escala. Todas comparten la misma contrasena para agilizar las pruebas.
 *
 * Es idempotente: si la cuenta ya existe, repone su contrasena, area y rol.
 * No forma parte de la carga inicial del sistema, porque son credenciales
 * conocidas que no deben existir en un despliegue productivo.
 *
 * Uso:  npm run demo
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const PASSWORD = 'Prueba123*';

const CUENTAS = [
  // --- Solicitantes: solo crean y consultan sus propios tickets ---
  {
    nombre: 'Ana Quispe Torrez',
    usuario: 'solicitante',
    area: 'Contabilidad',
    rol: 'cliente',
    proposito: 'Solicitante de Contabilidad'
  },
  {
    nombre: 'Carlos Vargas Rojas',
    usuario: 'solicitante2',
    area: 'Recursos Humanos',
    rol: 'cliente',
    proposito: 'Solicitante de Recursos Humanos'
  },
  {
    nombre: 'Maria Flores Colque',
    usuario: 'solicitante3',
    area: 'Comercial',
    rol: 'cliente',
    proposito: 'Solicitante de Comercial'
  },
  // --- Mesa de ayuda: atienden y resuelven tickets de toda la organizacion ---
  {
    nombre: 'Luis Mamani Colque',
    usuario: 'tecnico',
    area: 'Tecnologias de la Informacion',
    rol: 'tecnico_l1',
    proposito: 'Tecnico de primer nivel'
  },
  {
    nombre: 'Jorge Choque Silva',
    usuario: 'tecnico2',
    area: 'Tecnologias de la Informacion',
    rol: 'tecnico_l1',
    proposito: 'Tecnico de primer nivel, para probar la asignacion entre tecnicos'
  },
  {
    nombre: 'Patricia Nina Alvarez',
    usuario: 'tecnico3',
    area: 'Tecnologias de la Informacion',
    rol: 'tecnico_l2',
    proposito: 'Tecnico de segundo nivel, para probar el escalamiento'
  }
];

const idDe = async (tabla, nombre) => {
  const { rows } = await pool.query(`SELECT id FROM ${tabla} WHERE nombre = $1`, [nombre]);
  if (!rows[0]) throw new Error(`No se encontro "${nombre}" en la tabla ${tabla}`);
  return rows[0].id;
};

const ejecutar = async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);

  console.log('\n  USUARIO         CONTRASENA     ROL           AREA');
  console.log('  ' + '-'.repeat(88));

  for (const cuenta of CUENTAS) {
    const areaId = await idDe('areas', cuenta.area);
    const rolId = await idDe('roles', cuenta.rol);

    await pool.query(
      `INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, rol_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (usuario) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             area_id = EXCLUDED.area_id,
             rol_id = EXCLUDED.rol_id,
             activo = TRUE`,
      [cuenta.nombre, cuenta.usuario, `${cuenta.usuario}@empresa.local`, hash, areaId, rolId]
    );

    console.log(
      `  ${cuenta.usuario.padEnd(15)} ${PASSWORD.padEnd(14)} ${cuenta.rol.padEnd(13)} ${cuenta.area}`
    );
    console.log(`  ${''.padEnd(15)} ${cuenta.nombre} - ${cuenta.proposito}`);
  }

  console.log('\n  Todas las cuentas comparten la contrasena ' + PASSWORD);
  console.log('  Desactivelas o cambie sus contrasenas antes de publicar el sistema en produccion.\n');
  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[demo] Error:', error.message);
  await pool.end();
  process.exit(1);
});
