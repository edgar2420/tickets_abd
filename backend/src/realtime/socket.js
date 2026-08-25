import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { autenticarSocket } from '../middleware/auth.js';

let io = null;

export const SALA_TECNICOS = 'sala:tecnicos';
export const SALA_COMPRAS = 'sala:compras';
export const SALA_PROYECTOS = 'sala:proyectos';
export const salaUsuario = (usuarioId) => `usuario:${usuarioId}`;
export const salaTicket = (ticketId) => `ticket:${ticketId}`;

export const inicializarSockets = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: (origen, responder) => responder(null, !origen || env.cors.origins.includes(origen)),
      credentials: true
    },
    path: '/socket.io'
  });

  io.use(autenticarSocket);

  io.on('connection', (socket) => {
    const { usuario } = socket.data;
    socket.join(salaUsuario(usuario.id));
    if (usuario.permisos.includes('tickets.ver_todos')) socket.join(SALA_TECNICOS);
    if (usuario.permisos.includes('compras.ver_todas')) socket.join(SALA_COMPRAS);
    if (usuario.permisos.includes('proyectos.ver_todas')) socket.join(SALA_PROYECTOS);

    socket.emit('conexion:establecida', {
      usuario: usuario.usuario,
      rol: usuario.rol,
      salas: [...socket.rooms].filter((s) => s !== socket.id)
    });

    socket.on('ticket:suscribir', (ticketId) => socket.join(salaTicket(Number(ticketId))));
    socket.on('ticket:desuscribir', (ticketId) => socket.leave(salaTicket(Number(ticketId))));
  });

  return io;
};

export const emitir = (salas, evento, payload) => {
  if (!io) return;
  const destinos = Array.isArray(salas) ? salas : [salas];
  destinos.forEach((sala) => io.to(sala).emit(evento, payload));
};
