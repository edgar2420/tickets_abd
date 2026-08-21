import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

/**
 * Rastrea credenciales escritas en el codigo y en el historial de git.
 *
 * Una clave publicada en un repositorio queda comprometida aunque se borre
 * despues: el commit anterior sigue ahi. Por eso se revisan las dos cosas,
 * el arbol de trabajo y todo lo que alguna vez se versiono.
 */

const RAIZ = new URL('../..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1');

let fallos = 0;
const marca = (ok, detalle) => {
  if (!ok) fallos += 1;
  console.log(`${ok ? 'OK  ' : 'FALLA'} ${detalle}`);
};

const git = (...argumentos) =>
  execFileSync('git', argumentos, { cwd: RAIZ, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });

const PATRONES = [
  [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, 'clave privada'],
  [/postgres(?:ql)?:\/\/[^\s:]+:[^\s@]+@/, 'cadena de conexion con clave'],
  [/\bAKIA[0-9A-Z]{16}\b/, 'credencial de Amazon'],
  [/\bgh[pousr]_[A-Za-z0-9]{30,}\b/, 'credencial de GitHub'],
  [/\bsk-[A-Za-z0-9]{32,}\b/, 'credencial de servicio externo'],
  [/\bey[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/, 'token de sesion emitido']
];

console.log('=== 1. ARCHIVOS DE CONFIGURACION FUERA DEL CONTROL DE VERSIONES ===');
const ignorados = readFileSync(`${RAIZ}/.gitignore`, 'utf8');
for (const regla of ['.env', 'node_modules/', 'backend/storage/']) {
  marca(ignorados.includes(regla), `.gitignore excluye ${regla}`);
}

const seguidos = git('ls-files').split('\n').filter(Boolean);
const configuracion = seguidos.filter((r) => /(^|\/)\.env($|\.[^e])/.test(r));
marca(configuracion.length === 0,
  configuracion.length ? `hay configuracion versionada: ${configuracion.join(', ')}` : 'ningun archivo .env esta versionado');

console.log('\n=== 2. HISTORIAL COMPLETO DEL REPOSITORIO ===');
const historicos = new Set(git('log', '--all', '--pretty=format:', '--name-only').split('\n').filter(Boolean));
const sensibles = [...historicos].filter((r) => /(^|\/)\.env($|\.[^e])|\.pem$|\.key$|\.pfx$|id_rsa/.test(r));
marca(sensibles.length === 0,
  sensibles.length ? `archivos sensibles en el historial: ${sensibles.join(', ')}` : `ningun archivo sensible entre los ${historicos.size} versionados alguna vez`);

console.log('\n=== 3. CREDENCIALES ESCRITAS EN EL CODIGO ===');
const EXTENSIONES = /\.(js|jsx|ts|tsx|sql|json|yml|yaml|md|html|css|env\.example)$/;
const hallazgos = [];
for (const ruta of seguidos.filter((r) => EXTENSIONES.test(r))) {
  let contenido;
  try {
    contenido = readFileSync(`${RAIZ}/${ruta}`, 'utf8');
  } catch {
    continue;
  }
  for (const [patron, descripcion] of PATRONES) {
    const encontrado = patron.exec(contenido);
    if (encontrado) hallazgos.push(`${ruta}: ${descripcion}`);
  }
}
marca(hallazgos.length === 0,
  hallazgos.length ? `credenciales incrustadas: ${hallazgos.join(' | ')}` : 'ninguna credencial incrustada en los archivos versionados');

console.log('\n=== 4. LAS CLAVES DE EJEMPLO SIGUEN SIENDO DE EJEMPLO ===');
const ejemplo = readFileSync(`${RAIZ}/backend/.env.example`, 'utf8');
const reales = ejemplo
  .split('\n')
  .filter((linea) => /^(JWT_SECRET|CLAVE_CIFRADO|DB_PASSWORD|DB_APP_PASSWORD)=/.test(linea))
  .filter((linea) => {
    const valor = linea.split('=').slice(1).join('=').trim();
    return valor.length >= 24 && !valor.startsWith('cambie-');
  });
marca(reales.length === 0,
  reales.length ? `el archivo de ejemplo trae valores que parecen reales: ${reales.length}` : 'el archivo de ejemplo solo trae valores de muestra');

console.log('\n========================================');
console.log(fallos === 0 ? 'SECRETOS: NADA EXPUESTO' : `SECRETOS: ${fallos} HALLAZGO(S)`);
console.log('========================================');
process.exit(fallos === 0 ? 0 : 1);
