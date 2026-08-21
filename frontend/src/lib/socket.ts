import { io, type Socket } from 'socket.io-client';

const URL_SOCKET = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;

let socket: Socket | null = null;

/**
 * Abre (o reutiliza) la conexion de tiempo real. El servidor autentica el
 * handshake con la misma cookie de sesion del resto de la aplicacion, de
 * modo que aqui no circula ninguna credencial.
 */
export const conectarSocket = (): Socket => {
  if (socket?.connected) return socket;
  socket = io(URL_SOCKET, {
    withCredentials: true,
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    reconnectionAttempts: 10,
    reconnectionDelay: 2000
  });
  return socket;
};

export const desconectarSocket = () => {
  socket?.disconnect();
  socket = null;
};

export const obtenerSocket = () => socket;
