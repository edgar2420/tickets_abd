import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { autenticarSocket } from '../middleware/auth.js';

let io = null;

export const SALA_TECNICOS = 'sala:tecnicos';
export const salaUsuario = (usuarioId) => `usuario:${usuarioId}`;
export const salaTicket = (ticketId) => `ticket:${ticketId}`;

/** Inicializa el servidor de WebSockets sobre el servidor HTTP existente. */
export const inicializarSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: { origin: env.cors.origins, credentials: true },
    path: '/socket.io'
  });

  io.use(autenticarSocket);

  io.on('connection', (socket) => {
    const { usuario } = socket.data;
    socket.join(salaUsuario(usuario.id));
    if (usuario.permisos.includes('tickets.ver_todos')) socket.join(SALA_TECNICOS);

    socket.emit('conexion:establecida', {
      usuario: usuario.usuario,
      rol: usuario.rol,
      salas: [...socket.rooms].filter((s) => s !== socket.id)
    });

    socket.on('ticket:suscribir', (ticketId) => socket.join(salaTicket(Number(ticketId))));
    socket.on('ticket:desuscribir', (ticketId) => socket.leave(salaTicket(Number(ticketId))));

    socket.on('disconnect', () => {
      // La limpieza de salas la realiza socket.io automaticamente.
    });
  });

  return io;
};

export const obtenerIO = () => {
  if (!io) throw new Error('El servidor de sockets no ha sido inicializado');
  return io;
};

/** Emite un evento a una lista de salas. */
export const emitir = (salas, evento, payload) => {
  if (!io) return;
  const destinos = Array.isArray(salas) ? salas : [salas];
  destinos.forEach((sala) => io.to(sala).emit(evento, payload));
};
