import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { api, haySesion } from '../lib/api';
import { conectarSocket, desconectarSocket } from '../lib/socket';
import type { Usuario } from '../lib/tipos';

interface EstadoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (usuario: string, password: string) => Promise<void>;
  cerrarSesion: () => void;
  puede: (...codigos: string[]) => boolean;
}

const ContextoAuth = createContext<EstadoAuth | null>(null);

export const ProveedorAuth = ({ children }: { children: ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  const cerrarSesion = useCallback(() => {
    void api('/auth/logout', { metodo: 'POST' }).catch(() => undefined);
    desconectarSocket();
    setUsuario(null);
  }, []);

  useEffect(() => {
    if (!haySesion()) {
      setCargando(false);
      return;
    }
    api<{ usuario: Usuario }>('/auth/perfil')
      .then(({ usuario: perfil }) => {
        setUsuario(perfil);
        conectarSocket();
      })
      .catch(() => undefined)
      .finally(() => setCargando(false));
  }, []);

  useEffect(() => {
    const manejador = () => cerrarSesion();
    window.addEventListener('sesion:expirada', manejador);
    return () => window.removeEventListener('sesion:expirada', manejador);
  }, [cerrarSesion]);

  const iniciarSesion = useCallback(async (nombreUsuario: string, password: string) => {
    const respuesta = await api<{ usuario: Usuario }>('/auth/login', {
      metodo: 'POST',
      cuerpo: { usuario: nombreUsuario, password }
    });
    setUsuario(respuesta.usuario);
    conectarSocket();
  }, []);

  const puede = useCallback(
    (...codigos: string[]) => codigos.some((codigo) => usuario?.permisos.includes(codigo)),
    [usuario]
  );

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion, puede }),
    [usuario, cargando, iniciarSesion, cerrarSesion, puede]
  );

  return <ContextoAuth.Provider value={valor}>{children}</ContextoAuth.Provider>;
};

export const usarAuth = () => {
  const contexto = useContext(ContextoAuth);
  if (!contexto) throw new Error('usarAuth debe utilizarse dentro de ProveedorAuth');
  return contexto;
};
