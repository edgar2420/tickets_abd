import os from 'node:os';
import path from 'node:path';
import { DocumentoPDF, PALETA } from '../../backend/src/services/pdf/documento.js';

const PUERTO_WEB = 5173;

const VIRTUALES = /vEthernet|VirtualBox|VMware|Hyper-V|Loopback|Bluetooth/i;

const esDeLaRed = (direccion) => direccion.startsWith('192.168.')
  || direccion.startsWith('10.')
  || /^172\.(1[6-9]|2[0-9]|3[01])\./.test(direccion);

const interfacesDeRed = () => Object.entries(os.networkInterfaces())
  .flatMap(([nombre, lista]) => (lista ?? [])
    .filter((dato) => dato.family === 'IPv4' && !dato.internal && esDeLaRed(dato.address))
    .map((dato) => ({ nombre, direccion: dato.address })))
  .filter((item) => !VIRTUALES.test(item.nombre));

const construir = async () => {
  const interfaces = interfacesDeRed();

  if (interfaces.length === 0) {
    console.error('[acceso] El equipo no esta conectado a ninguna red.');
    process.exit(1);
  }

  const doc = new DocumentoPDF({
    titulo: 'Acceso al sistema desde la red',
    subtitulo: 'Mesa de Ayuda TI - prueba desde otro equipo',
    codigo: 'ACCESO-RED',
    icono: 'red'
  });

  doc.titulo1('Direccion para conectarse', 'red');
  doc.parrafo('Este equipo esta en mas de una red. Entregue la direccion que corresponda a la red donde '
    + 'esta conectada la otra persona: si esta por cable, la del cable; si esta por Wi-Fi, la del Wi-Fi.');
  doc.tabla([
    { titulo: 'Red', campo: 'nombre', ancho: 0.35 },
    { titulo: 'Direccion para el navegador', campo: 'enlace', ancho: 0.65 }
  ], interfaces.map((item) => ({
    nombre: item.nombre,
    enlace: `http://${item.direccion}:${PUERTO_WEB}`
  })), { alturaFila: 24 });
  doc.nota(`http://${interfaces[0].direccion}:${PUERTO_WEB}`, { icono: 'red', color: PALETA.acento });

  doc.titulo1('Que debe estar encendido', 'engranaje');
  doc.tabla([
    { titulo: 'Componente', campo: 'componente', ancho: 0.3 },
    { titulo: 'Como se levanta', campo: 'comando', ancho: 0.4 },
    { titulo: 'Puerto', campo: 'puerto', ancho: 0.3 }
  ], [
    { componente: 'Base de datos', comando: 'Servicio de PostgreSQL', puerto: '5432' },
    { componente: 'API', comando: 'npm start (carpeta backend)', puerto: '4000' },
    { componente: 'Aplicacion web', comando: 'npm run dev (carpeta frontend)', puerto: String(PUERTO_WEB) }
  ], { alturaFila: 22 });

  doc.titulo1('Permiso del firewall de Windows', 'escudo');
  doc.parrafo('Sin este paso el otro equipo no llega, aunque todo este encendido. Se hace una sola vez '
    + 'por red, desde PowerShell abierto como administrador, en la carpeta del proyecto:');
  doc.nota('powershell -ExecutionPolicy Bypass -File scripts\\abrir-red-local.ps1',
    { icono: 'engranaje', color: PALETA.acento });
  doc.parrafo('Al terminar la prueba conviene cerrarlo de nuevo:');
  doc.nota('powershell -ExecutionPolicy Bypass -File scripts\\abrir-red-local.ps1 -Cerrar',
    { icono: 'engranaje' });

  doc.titulo1('Como entra la otra persona', 'usuario');
  doc.lista([
    'Abre el navegador y escribe la direccion de arriba.',
    'Inicia sesion con el usuario y la contraseña que usted le entregue en persona.',
    'Cada persona debe tener su propia cuenta: no se comparte la cuenta administradora.',
    'La contraseña se cambia desde el icono de la llave, en la barra superior.'
  ]);

  doc.titulo1('Advertencias', 'alerta');
  doc.lista([
    'La conexion viaja sin cifrar. Sirve para una prueba interna, no para publicar el sistema.',
    'La direccion cambia cada vez que el equipo se conecta a otra red o el router le asigna otra IP.',
    'Si el equipo se apaga o se cierran las ventanas de la API y de la web, el acceso se corta.',
    'Tras varios intentos fallidos de contraseña la cuenta queda bloqueada por quince minutos.'
  ]);

  const salida = path.resolve(process.cwd(), 'docs/pdf/Acceso-Red-Local.pdf');
  await doc.aArchivo(salida);
  for (const item of interfaces) {
    console.log(`[acceso] ${item.nombre.padEnd(12)} http://${item.direccion}:${PUERTO_WEB}`);
  }
  console.log('[acceso] Ficha generada en:', salida);
};

construir().catch((error) => {
  console.error('[acceso] Error al generar la ficha:', error);
  process.exit(1);
});
