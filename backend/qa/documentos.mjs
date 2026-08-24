import { inflateSync } from 'node:zlib';
import { ADMIN, entrar, prepararEntorno } from './preparar.mjs';

await prepararEntorno();

const BASE = process.env.QA_BASE ?? 'http://localhost:4000/api/v1';
const ORIGEN = 'http://localhost:5173';

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const paginasDe = (buffer) => (buffer.toString('latin1').match(/\/Type \/Page[^s]/g) ?? []).length;

const paginasEnBlanco = (buffer) => {
  const flujos = [];
  let desde = 0;
  for (;;) {
    const inicio = buffer.indexOf('stream', desde);
    if (inicio === -1) break;
    const fin = buffer.indexOf('endstream', inicio);
    if (fin === -1) break;
    let cuerpo = inicio + 6;
    while (buffer[cuerpo] === 13 || buffer[cuerpo] === 10) cuerpo += 1;
    flujos.push(buffer.subarray(cuerpo, fin));
    desde = fin + 9;
  }

  return flujos.filter((flujo) => {
    let contenido;
    try {
      contenido = inflateSync(flujo).toString('latin1');
    } catch {
      return false;
    }
    const textos = (contenido.match(/Tj/g) ?? []).length;
    return textos > 0 && textos <= 3;
  }).length;
};

console.log('=== LOS DOCUMENTOS SALEN AL TAMANO DE LO QUE SE PIDE ===');

const sesion = (await entrar(ADMIN.usuario, ADMIN.password)).cookie;

const DOCUMENTOS = [
  ['reporte mensual', '/tickets/mensual/pdf', 8],
  ['reporte de tickets', '/tickets/reporte/pdf', 8],
  ['reporte de inventario', '/inventario/reporte/pdf', 8],
  ['reporte de equipos', '/equipos/reporte/pdf', 8],
  ['reporte de compras', '/compras/reporte/pdf', 8],
  ['reporte de proyectos', '/proyectos/reporte/pdf', 8],
  ['reporte de auditoria', '/auditoria/pdf', 40],
  ['matriz de permisos', '/auditoria/matriz-rbac/pdf', 12]
];

for (const [nombre, ruta, tope] of DOCUMENTOS) {
  const respuesta = await fetch(BASE + ruta, { headers: { Cookie: sesion, Origin: ORIGEN } });
  const buffer = Buffer.from(await respuesta.arrayBuffer());
  const paginas = paginasDe(buffer);
  const blancas = paginasEnBlanco(buffer);

  marca(respuesta.ok && paginas > 0 && paginas <= tope,
    `${nombre.padEnd(24)} ${paginas} paginas (tope ${tope})`);
  marca(blancas === 0, `${nombre.padEnd(24)} sin hojas en blanco`);
}

console.log('\n=== EL FILTRO ACHICA EL DOCUMENTO ===');
const completo = Buffer.from(await (await fetch(BASE + '/tickets/mensual/pdf',
  { headers: { Cookie: sesion, Origin: ORIGEN } })).arrayBuffer());
const filtrado = Buffer.from(await (await fetch(BASE + '/tickets/mensual/pdf?prioridad=Critica',
  { headers: { Cookie: sesion, Origin: ORIGEN } })).arrayBuffer());
marca(filtrado.length <= completo.length,
  `filtrado por prioridad pesa ${filtrado.length} contra ${completo.length} bytes del completo`);

console.log('\n========================================');
console.log(fallos === 0 ? 'DOCUMENTOS: TODAS LAS PRUEBAS PASARON' : `DOCUMENTOS: ${fallos} FALLA(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
