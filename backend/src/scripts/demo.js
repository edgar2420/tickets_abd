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

// Catalogo inicial del inventario, con su carga de existencias
const ARTICULOS = [
  { codigo: 'TON26A', nombre: 'Toner HP 26A negro', descripcion: 'Consumible para impresora laser LaserJet Pro',
    tipo: 'Consumible', unidad: 'Unidad', stock_minimo: 3, ubicacion: 'Deposito TI - Estante B', inicial: 12 },
  { codigo: 'MOU-USB', nombre: 'Mouse optico USB', descripcion: 'Mouse alambrico de reposicion',
    tipo: 'Accesorio', unidad: 'Unidad', stock_minimo: 5, ubicacion: 'Deposito TI - Estante A', inicial: 20 },
  { codigo: 'TEC-ESP', nombre: 'Teclado USB en espanol', descripcion: 'Teclado alambrico distribucion latinoamericana',
    tipo: 'Accesorio', unidad: 'Unidad', stock_minimo: 4, ubicacion: 'Deposito TI - Estante A', inicial: 9 },
  { codigo: 'CAB-RJ45', nombre: 'Cable de red UTP categoria 6', descripcion: 'Patch cord de 3 metros',
    tipo: 'Repuesto', unidad: 'Unidad', stock_minimo: 10, ubicacion: 'Deposito TI - Caja 3', inicial: 35 },
  { codigo: 'SSD480', nombre: 'Disco solido 480 GB', descripcion: 'Unidad SATA para reemplazo en equipos de escritorio',
    tipo: 'Repuesto', unidad: 'Unidad', stock_minimo: 2, ubicacion: 'Deposito TI - Gabinete seguro', inicial: 5 },
  { codigo: 'LAP-I5', nombre: 'Laptop corporativa i5', descripcion: 'Equipo de dotacion para personal administrativo',
    tipo: 'Equipo', unidad: 'Unidad', stock_minimo: 1, ubicacion: 'Deposito TI - Gabinete seguro', inicial: 3 },
  { codigo: 'LIC-OFF', nombre: 'Licencia de ofimatica', descripcion: 'Licencia anual por usuario',
    tipo: 'Licencia', unidad: 'Licencia', stock_minimo: 5, ubicacion: 'Repositorio digital', inicial: 25 }
];

const cargarInventario = async (usuarioId) => {
  console.log('\n  INVENTARIO INICIAL');
  console.log('  ' + '-'.repeat(88));
  for (const articulo of ARTICULOS) {
    const { rows } = await pool.query(
      `INSERT INTO inventario_articulos (codigo, nombre, descripcion, tipo, unidad, stock_minimo, ubicacion)
       VALUES ($1,$2,$3,$4,$5,$6,$7)
       ON CONFLICT (codigo) DO UPDATE
         SET nombre = EXCLUDED.nombre, descripcion = EXCLUDED.descripcion, tipo = EXCLUDED.tipo,
             unidad = EXCLUDED.unidad, stock_minimo = EXCLUDED.stock_minimo,
             ubicacion = EXCLUDED.ubicacion, activo = TRUE
       RETURNING id, stock_actual`,
      [articulo.codigo, articulo.nombre, articulo.descripcion, articulo.tipo,
        articulo.unidad, articulo.stock_minimo, articulo.ubicacion]
    );
    const { id, stock_actual: actual } = rows[0];

    // La carga inicial se asienta como movimiento, para que el kardex cuadre con el saldo
    if (actual === 0 && articulo.inicial > 0) {
      await pool.query(
        `INSERT INTO inventario_movimientos
           (articulo_id, tipo, cantidad, stock_anterior, stock_resultante, motivo, usuario_id)
         VALUES ($1, 'Entrada', $2, 0, $2, 'Carga inicial del inventario', $3)`,
        [id, articulo.inicial, usuarioId]
      );
      await pool.query('UPDATE inventario_articulos SET stock_actual = $1 WHERE id = $2', [articulo.inicial, id]);
    }
    console.log(`  ${articulo.codigo.padEnd(10)} ${articulo.nombre.padEnd(38)} stock ${String(articulo.inicial).padStart(3)} ${articulo.unidad}`);
  }
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

  const { rows: administrador } = await pool.query("SELECT id FROM usuarios WHERE usuario = 'admin'");
  await cargarInventario(administrador[0].id);

  console.log('\n  Todas las cuentas comparten la contrasena ' + PASSWORD);
  console.log('  Desactivelas o cambie sus contrasenas antes de publicar el sistema en produccion.\n');
  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[demo] Error:', error.message);
  await pool.end();
  process.exit(1);
});
