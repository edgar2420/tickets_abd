import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, almacenToken } from '../lib/api';
import { conectarSocket, desconectarSocket } from '../lib/socket';
import type { Usuario } from '../lib/tipos';

interface EstadoAuth {
  usuario: Usuario | null;
  cargando: boolean;
  iniciarSesion: (usuario: string, password: string) => Promise<void>;
  cerrarSesion: () => Promise<void>;
  puede: (...codigos: string[]) => boolean;
}

const Contexto = createContext<EstadoAuth | null>(null);

export const ProveedorAuth = ({ children }: { children: React.ReactNode }) => {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  // Restaura la sesion almacenada en el dispositivo.
  useEffect(() => {
    const restaurar = async () => {
      const token = await almacenToken.obtener();
      if (!token) {
        setCargando(false);
        return;
      }
      try {
        const { usuario: perfil } = await api<{ usuario: Usuario }>('/auth/perfil');
        setUsuario(perfil);
        conectarSocket(token);
      } catch {
        await almacenToken.limpiar();
      } finally {
        setCargando(false);
      }
    };
    void restaurar();
  }, []);

  const iniciarSesion = useCallback(async (nombreUsuario: string, password: string) => {
    const respuesta = await api<{ token: string; usuario: Usuario }>('/auth/login', {
      metodo: 'POST',
      cuerpo: { usuario: nombreUsuario, password }
    });
    await almacenToken.guardar(respuesta.token);
    setUsuario(respuesta.usuario);
    conectarSocket(respuesta.token);
  }, []);

  const cerrarSesion = useCallback(async () => {
    await almacenToken.limpiar();
    desconectarSocket();
    setUsuario(null);
  }, []);

  const puede = useCallback(
    (...codigos: string[]) => codigos.some((codigo) => usuario?.permisos.includes(codigo)),
    [usuario]
  );

  const valor = useMemo(
    () => ({ usuario, cargando, iniciarSesion, cerrarSesion, puede }),
    [usuario, cargando, iniciarSesion, cerrarSesion, puede]
  );

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const usarAuth = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usarAuth debe utilizarse dentro de ProveedorAuth');
  return contexto;
};
