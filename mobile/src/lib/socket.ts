import { io, type Socket } from 'socket.io-client';
import { SOCKET_URL } from './config';

let socket: Socket | null = null;

export const conectarSocket = (token: string) => {
  if (socket?.connected) return socket;
  socket = io(SOCKET_URL, {
    auth: { token },
    transports: ['websocket'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });
  return socket;
};

export const obtenerSocket = () => socket;

export const desconectarSocket = () => {
  socket?.disconnect();
  socket = null;
};
