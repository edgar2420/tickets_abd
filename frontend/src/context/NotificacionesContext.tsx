import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api } from '../lib/api';
import { obtenerSocket } from '../lib/socket';
import { usarAuth } from './AuthContext';
import type { Notificacion, Ticket } from '../lib/tipos';

interface EstadoNotificaciones {
  notificaciones: Notificacion[];
  noLeidas: number;
  marcarLeida: (id: number) => Promise<void>;
  marcarTodas: () => Promise<void>;
  recargar: () => Promise<void>;
  ultimoEventoTicket: number;
  ultimoEventoCompra: number;
}

const Contexto = createContext<EstadoNotificaciones | null>(null);

export const ProveedorNotificaciones = ({ children }: { children: ReactNode }) => {
  const { usuario } = usarAuth();
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [ultimoEventoTicket, setUltimoEventoTicket] = useState(0);
  const [ultimoEventoCompra, setUltimoEventoCompra] = useState(0);

  const recargar = useCallback(async () => {
    if (!usuario) return;
    const { datos } = await api<{ datos: Notificacion[] }>('/notificaciones');
    setNotificaciones(datos);
  }, [usuario]);

  useEffect(() => {
    void recargar();
  }, [recargar]);

  useEffect(() => {
    const socket = obtenerSocket();
    if (!socket || !usuario) return;

    const alNotificar = (notificacion: Notificacion) => {
      setNotificaciones((previas) => [{ ...notificacion, leida: false }, ...previas].slice(0, 100));
    };
    const alCambiarTicket = (_ticket: Ticket) => setUltimoEventoTicket(Date.now());
    const alCambiarCompra = () => setUltimoEventoCompra(Date.now());

    socket.on('notificacion:nueva', alNotificar);
    socket.on('ticket:creado', alCambiarTicket);
    socket.on('ticket:actualizado', alCambiarTicket);
    socket.on('ticket:resuelto', alCambiarTicket);
    socket.on('compra:creada', alCambiarCompra);
    socket.on('compra:actualizada', alCambiarCompra);

    return () => {
      socket.off('notificacion:nueva', alNotificar);
      socket.off('ticket:creado', alCambiarTicket);
      socket.off('ticket:actualizado', alCambiarTicket);
      socket.off('ticket:resuelto', alCambiarTicket);
      socket.off('compra:creada', alCambiarCompra);
      socket.off('compra:actualizada', alCambiarCompra);
    };
  }, [usuario]);

  const marcarLeida = useCallback(async (id: number) => {
    await api(`/notificaciones/${id}/leida`, { metodo: 'PUT' });
    setNotificaciones((previas) => previas.map((n) => (n.id === id ? { ...n, leida: true } : n)));
  }, []);

  const marcarTodas = useCallback(async () => {
    await api('/notificaciones/leidas', { metodo: 'PUT' });
    setNotificaciones((previas) => previas.map((n) => ({ ...n, leida: true })));
  }, []);

  const valor = useMemo(
    () => ({
      notificaciones,
      noLeidas: notificaciones.filter((n) => !n.leida).length,
      marcarLeida,
      marcarTodas,
      recargar,
      ultimoEventoTicket,
      ultimoEventoCompra
    }),
    [notificaciones, marcarLeida, marcarTodas, recargar, ultimoEventoTicket, ultimoEventoCompra]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const usarNotificaciones = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usarNotificaciones debe utilizarse dentro de ProveedorNotificaciones');
  return contexto;
};
