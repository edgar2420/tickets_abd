import http from 'node:http';
import { crearApp } from './app.js';
import { env } from './config/env.js';
import { pool } from './config/db.js';
import { inicializarSockets } from './realtime/socket.js';

const app = crearApp();
const servidor = http.createServer(app);

inicializarSockets(servidor);

servidor.listen(env.port, () => {
  console.log('--------------------------------------------------------');
  console.log(' Sistema de Gestion de Tickets TI - API v2.1.0');
  console.log(' Autor: ' + env.autor + ' | ' + env.autorRol);
  console.log(' Entorno: ' + env.nodeEnv);
  console.log(' HTTP:    http://localhost:' + env.port + env.apiPrefix);
  console.log(' Sockets: ws://localhost:' + env.port + '/socket.io');
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
