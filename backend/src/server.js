import http from 'node:http';
import { crearApp } from './app.js';
import { env, direccionesLocales } from './config/env.js';
import { pool } from './config/db.js';
import { inicializarSockets } from './realtime/socket.js';

const app = crearApp();
const servidor = http.createServer(app);

inicializarSockets(servidor);

servidor.listen(env.port, () => {
  console.log('--------------------------------------------------------');
  console.log(' Sistema de Gestion de Tickets TI - API v2.6.1');
  console.log(' Autor: ' + env.autor + ' | ' + env.autorRol);
  console.log(' Entorno: ' + env.nodeEnv);
  console.log(' HTTP:    http://localhost:' + env.port + env.apiPrefix);
  console.log(' Sockets: ws://localhost:' + env.port + '/socket.io');

  if (env.redLocal) {
    const direcciones = direccionesLocales();
    console.log('--------------------------------------------------------');
    console.log(' Acceso desde la red local habilitado. Comparta:');
    direcciones.forEach((direccion) => console.log('   http://' + direccion + ':5173'));
    if (direcciones.length === 0) console.log('   Sin direcciones de red disponibles');
  }
  console.log('--------------------------------------------------------');
});

const apagar = async (senal) => {
  console.log('[servidor] Senal recibida: ' + senal + '. Cerrando de forma ordenada.');
  servidor.close(async () => {
    await pool.end();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => apagar('SIGTERM'));
process.on('SIGINT', () => apagar('SIGINT'));
