/**
 * Crea las cuentas de demostracion necesarias para recorrer el ciclo completo
 * del ticket: quien solicita, quien atiende y quien supervisa.
 *
 * Es idempotente: si la cuenta ya existe solo repone su contrasena, area y rol.
 * No forma parte de la carga inicial del sistema, porque son credenciales
 * conocidas que no deben existir en un despliegue productivo.
 *
 * Uso:  npm run demo
 */
import bcrypt from 'bcryptjs';
import { pool } from '../config/db.js';

const CUENTAS = [
  {
    nombre: 'Ana Quispe Torrez',
    usuario: 'solicitante',
    email: 'solicitante@empresa.local',
    password: 'Solicitante123*',
    area: 'Contabilidad',
    rol: 'cliente',
    proposito: 'Registra y consulta unicamente sus propios tickets'
  },
  {
    nombre: 'Luis Mamani Colque',
    usuario: 'tecnico',
    email: 'tecnico@empresa.local',
    password: 'Tecnico123*',
    area: 'Tecnologias de la Informacion',
    rol: 'tecnico_l1',
    proposito: 'Atiende, asigna y resuelve tickets de toda la organizacion'
  }
];

const idDe = async (tabla, nombre) => {
  const { rows } = await pool.query(`SELECT id FROM ${tabla} WHERE nombre = $1`, [nombre]);
  if (!rows[0]) throw new Error(`No se encontro "${nombre}" en la tabla ${tabla}`);
  return rows[0].id;
};

const ejecutar = async () => {
  for (const cuenta of CUENTAS) {
    const areaId = await idDe('areas', cuenta.area);
    const rolId = await idDe('roles', cuenta.rol);
    const hash = await bcrypt.hash(cuenta.password, 10);

    const { rows } = await pool.query(
      `INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, rol_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (usuario) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             area_id = EXCLUDED.area_id,
             rol_id = EXCLUDED.rol_id,
             activo = TRUE
       RETURNING id`,
      [cuenta.nombre, cuenta.usuario, cuenta.email, hash, areaId, rolId]
    );

    console.log(
      `[demo] ${cuenta.usuario.padEnd(12)} / ${cuenta.password.padEnd(17)}` +
      ` rol=${cuenta.rol.padEnd(11)} area=${cuenta.area}  (id ${rows[0].id})`
    );
    console.log(`       ${cuenta.proposito}`);
  }

  console.log('\n[demo] Cuentas de demostracion listas. Cambie o desactive estas credenciales antes de publicar en produccion.');
  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[demo] Error:', error.message);
  await pool.end();
  process.exit(1);
});
