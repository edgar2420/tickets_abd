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
import { cifrar } from '../utils/cifrado.js';

const PASSWORD = 'Prueba123*';

const CUENTAS = [
  // --- Equipo de Tecnologias de la Informacion, en la fabrica ---
  // Reciben las solicitudes de compra y atienden los tickets de toda la empresa
  {
    nombre: 'Ing. William Abuawad',
    usuario: 'wabuawad',
    area: 'Tecnologias de la Informacion',
    sucursal: 'Fabrica Santa Cruz',
    rol: 'admin',
    proposito: 'Responsable de sistemas: atiende, resuelve y gestiona las compras'
  },
  {
    nombre: 'Ricardo Ayala Pena',
    usuario: 'gerente',
    area: 'Gerencia',
    sucursal: 'Fabrica Santa Cruz',
    rol: 'gerencia',
    proposito: 'Aprueba presupuestariamente las solicitudes de compra'
  },
  {
    nombre: 'Luis Mamani Colque',
    usuario: 'tecnico',
    area: 'Tecnologias de la Informacion',
    sucursal: 'Fabrica Santa Cruz',
    rol: 'tecnico_l1',
    proposito: 'Tecnico de primer nivel'
  },
  {
    nombre: 'Jorge Choque Silva',
    usuario: 'tecnico2',
    area: 'Tecnologias de la Informacion',
    sucursal: 'Fabrica Santa Cruz',
    rol: 'tecnico_l1',
    proposito: 'Tecnico de primer nivel, para probar la asignacion entre tecnicos'
  },
  {
    nombre: 'Patricia Nina Alvarez',
    usuario: 'tecnico3',
    area: 'Tecnologias de la Informacion',
    sucursal: 'Fabrica Santa Cruz',
    rol: 'tecnico_l2',
    proposito: 'Tecnico de segundo nivel, para probar el escalamiento'
  },

  // --- Un solicitante por cada sucursal, para ver el corte por origen ---
  {
    nombre: 'Ana Quispe Torrez',
    usuario: 'solicitante',
    area: 'Contabilidad',
    sucursal: 'Fabrica Santa Cruz',
    rol: 'cliente',
    proposito: 'Solicitante de Contabilidad en la fabrica'
  },
  {
    nombre: 'Mario Cespedes Rivero',
    usuario: 'silos',
    area: 'Operaciones',
    sucursal: 'Silos Central de Insumos',
    rol: 'cliente',
    proposito: 'Solicitante de Operaciones en los silos'
  },
  {
    nombre: 'Carlos Vargas Rojas',
    usuario: 'lapaz',
    area: 'Recursos Humanos',
    sucursal: 'Sucursal La Paz',
    rol: 'cliente',
    proposito: 'Solicitante de Recursos Humanos en La Paz'
  },
  {
    nombre: 'Maria Flores Colque',
    usuario: 'cochabamba',
    area: 'Comercial',
    sucursal: 'Sucursal Cochabamba',
    rol: 'cliente',
    proposito: 'Solicitante de Comercial en Cochabamba'
  },
  {
    nombre: 'Elena Padilla Vaca',
    usuario: 'sucre',
    area: 'Comercial',
    sucursal: 'Sucursal Sucre',
    rol: 'cliente',
    proposito: 'Solicitante de Comercial en Sucre'
  },
  {
    nombre: 'Hugo Mendoza Ticona',
    usuario: 'oruro',
    area: 'Operaciones',
    sucursal: 'Sucursal Oruro',
    rol: 'cliente',
    proposito: 'Solicitante de Operaciones en Oruro'
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

// Parque de equipos de ejemplo, con acceso remoto y asignacion por usuario
const EQUIPOS = [
  { codigo: 'PC-001', nombre_equipo: 'CONTAB-01', tipo: 'Escritorio', marca: 'Dell', modelo: 'OptiPlex 3080',
    sistema_operativo: 'Windows 11 Pro', procesador: 'Intel Core i5-10500', ram_gb: 16,
    almacenamiento: 'SSD 512 GB', direccion_ip: '192.168.0.41', direccion_mac: 'A4:BB:6D:11:22:01',
    anydesk_id: '451 223 780', password: 'Remoto#Contab01', usuario: 'solicitante',
    ubicacion: 'Contabilidad - Escritorio 3', estado: 'Operativo' },
  { codigo: 'PC-002', nombre_equipo: 'RRHH-01', tipo: 'Escritorio', marca: 'HP', modelo: 'ProDesk 400 G7',
    sistema_operativo: 'Windows 10 Pro', procesador: 'Intel Core i3-10100', ram_gb: 8,
    almacenamiento: 'HDD 1 TB', direccion_ip: '192.168.0.42', direccion_mac: 'A4:BB:6D:11:22:02',
    anydesk_id: '451 223 781', password: 'Remoto#Rrhh01', usuario: 'lapaz',
    ubicacion: 'Recursos Humanos - Escritorio 1', estado: 'Operativo' },
  { codigo: 'LP-001', nombre_equipo: 'COMERCIAL-LP1', tipo: 'Laptop', marca: 'Lenovo', modelo: 'ThinkPad E14',
    sistema_operativo: 'Windows 11 Pro', procesador: 'AMD Ryzen 5 5500U', ram_gb: 16,
    almacenamiento: 'SSD 256 GB', direccion_ip: '192.168.0.61', direccion_mac: 'A4:BB:6D:11:22:03',
    anydesk_id: '451 223 782', password: 'Remoto#Comercial', usuario: 'cochabamba',
    ubicacion: 'Comercial - Movil', estado: 'Operativo' },
  { codigo: 'LP-002', nombre_equipo: 'SOPORTE-LP1', tipo: 'Laptop', marca: 'Dell', modelo: 'Latitude 3420',
    sistema_operativo: 'Windows 11 Pro', procesador: 'Intel Core i7-1165G7', ram_gb: 32,
    almacenamiento: 'SSD 1 TB', direccion_ip: '192.168.0.62', direccion_mac: 'A4:BB:6D:11:22:04',
    anydesk_id: '451 223 783', password: 'Remoto#Soporte', usuario: 'tecnico',
    ubicacion: 'Tecnologias de la Informacion', estado: 'Operativo' },
  { codigo: 'SRV-001', nombre_equipo: 'SRV-ARCHIVOS', tipo: 'Servidor', marca: 'HPE', modelo: 'ProLiant ML30',
    sistema_operativo: 'Ubuntu Server 24.04 LTS', procesador: 'Intel Xeon E-2314', ram_gb: 64,
    almacenamiento: 'RAID 1 - 2 TB', direccion_ip: '192.168.0.10', direccion_mac: 'A4:BB:6D:11:22:05',
    anydesk_id: null, password: null, usuario: null,
    ubicacion: 'Sala de servidores', estado: 'Operativo' },
  { codigo: 'PC-003', nombre_equipo: 'RECEPCION-01', tipo: 'Escritorio', marca: 'Acer', modelo: 'Veriton X',
    sistema_operativo: 'Windows 10 Pro', procesador: 'Intel Pentium Gold', ram_gb: 4,
    almacenamiento: 'HDD 500 GB', direccion_ip: '192.168.0.43', direccion_mac: 'A4:BB:6D:11:22:06',
    anydesk_id: '451 223 784', password: 'Remoto#Recepcion', usuario: null,
    ubicacion: 'Recepcion', estado: 'En reparacion' }
];

const cargarEquipos = async () => {
  console.log('\n  PARQUE DE EQUIPOS');
  console.log('  ' + '-'.repeat(88));
  for (const equipo of EQUIPOS) {
    let usuarioId = null;
    let areaId = null;
    let sucursalId = null;
    if (equipo.usuario) {
      const { rows } = await pool.query(
        'SELECT id, area_id, sucursal_id FROM usuarios WHERE usuario = $1', [equipo.usuario]
      );
      if (rows[0]) {
        usuarioId = rows[0].id;
        areaId = rows[0].area_id;
        sucursalId = rows[0].sucursal_id;
      }
    }
    // Los equipos sin responsable quedan en la casa central
    if (!sucursalId) {
      const { rows } = await pool.query("SELECT id FROM sucursales WHERE codigo = 'SCZ'");
      sucursalId = rows[0]?.id ?? null;
    }
    await pool.query(
      `INSERT INTO equipos (codigo, nombre_equipo, tipo, marca, modelo, sistema_operativo, procesador,
                            ram_gb, almacenamiento, direccion_ip, direccion_mac, anydesk_id, anydesk_password,
                            usuario_id, area_id, sucursal_id, ubicacion, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18)
       ON CONFLICT (codigo) DO UPDATE
         SET nombre_equipo = EXCLUDED.nombre_equipo, tipo = EXCLUDED.tipo, marca = EXCLUDED.marca,
             modelo = EXCLUDED.modelo, sistema_operativo = EXCLUDED.sistema_operativo,
             procesador = EXCLUDED.procesador, ram_gb = EXCLUDED.ram_gb,
             almacenamiento = EXCLUDED.almacenamiento, direccion_ip = EXCLUDED.direccion_ip,
             direccion_mac = EXCLUDED.direccion_mac, anydesk_id = EXCLUDED.anydesk_id,
             anydesk_password = EXCLUDED.anydesk_password, usuario_id = EXCLUDED.usuario_id,
             area_id = EXCLUDED.area_id, sucursal_id = EXCLUDED.sucursal_id,
             ubicacion = EXCLUDED.ubicacion, estado = EXCLUDED.estado, activo = TRUE`,
      [equipo.codigo, equipo.nombre_equipo, equipo.tipo, equipo.marca, equipo.modelo,
        equipo.sistema_operativo, equipo.procesador, equipo.ram_gb, equipo.almacenamiento,
        equipo.direccion_ip, equipo.direccion_mac, equipo.anydesk_id, cifrar(equipo.password),
        usuarioId, areaId, sucursalId, equipo.ubicacion, equipo.estado]
    );
    console.log(`  ${equipo.codigo.padEnd(9)} ${equipo.nombre_equipo.padEnd(16)} ${String(equipo.sistema_operativo).padEnd(26)} ${String(equipo.ram_gb).padStart(3)} GB  ${String(equipo.direccion_ip).padEnd(14)} ${equipo.usuario ?? 'sin asignar'}`);
  }
  console.log('  Contrasenas de acceso remoto guardadas cifradas. Se consultan desde el modulo de Equipos.');
};

const ejecutar = async () => {
  const hash = await bcrypt.hash(PASSWORD, 10);

  console.log('\n  USUARIO         CONTRASENA     ROL           AREA');
  console.log('  ' + '-'.repeat(88));

  for (const cuenta of CUENTAS) {
    const areaId = await idDe('areas', cuenta.area);
    const rolId = await idDe('roles', cuenta.rol);
    const sucursalId = await idDe('sucursales', cuenta.sucursal);

    await pool.query(
      `INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, sucursal_id, rol_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (usuario) DO UPDATE
         SET nombre = EXCLUDED.nombre,
             email = EXCLUDED.email,
             password_hash = EXCLUDED.password_hash,
             area_id = EXCLUDED.area_id,
             sucursal_id = EXCLUDED.sucursal_id,
             rol_id = EXCLUDED.rol_id,
             activo = TRUE`,
      [cuenta.nombre, cuenta.usuario, `${cuenta.usuario}@empresa.local`, hash, areaId, sucursalId, rolId]
    );

    console.log(
      `  ${cuenta.usuario.padEnd(15)} ${PASSWORD.padEnd(14)} ${cuenta.rol.padEnd(13)} ${cuenta.sucursal.padEnd(22)} ${cuenta.area}`
    );
    console.log(`  ${''.padEnd(15)} ${cuenta.nombre} - ${cuenta.proposito}`);
  }

  const { rows: administrador } = await pool.query("SELECT id FROM usuarios WHERE usuario = 'admin'");
  await cargarInventario(administrador[0].id);
  await cargarEquipos();

  console.log('\n  Todas las cuentas comparten la contrasena ' + PASSWORD);
  console.log('  Desactivelas o cambie sus contrasenas antes de publicar el sistema en produccion.\n');
  await pool.end();
};

ejecutar().catch(async (error) => {
  console.error('[demo] Error:', error.message);
  await pool.end();
  process.exit(1);
});
