import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

type Tema = 'claro' | 'oscuro';
const CLAVE = 'tickets_ti_tema';

interface EstadoTema {
  tema: Tema;
  alternar: () => void;
}

const Contexto = createContext<EstadoTema | null>(null);

/** Aplica la clase que activa las variantes oscuras de Tailwind. */
const aplicar = (tema: Tema) => {
  document.documentElement.classList.toggle('dark', tema === 'oscuro');
  document.documentElement.style.colorScheme = tema === 'oscuro' ? 'dark' : 'light';
};

export const ProveedorTema = ({ children }: { children: ReactNode }) => {
  const [tema, setTema] = useState<Tema>(() => {
    const guardado = localStorage.getItem(CLAVE) as Tema | null;
    if (guardado === 'claro' || guardado === 'oscuro') return guardado;
    // Sin preferencia guardada se respeta la del sistema operativo
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'oscuro' : 'claro';
  });

  useEffect(() => {
    aplicar(tema);
    localStorage.setItem(CLAVE, tema);
  }, [tema]);

  const alternar = useCallback(() => setTema((actual) => (actual === 'claro' ? 'oscuro' : 'claro')), []);
  const valor = useMemo(() => ({ tema, alternar }), [tema, alternar]);

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
};

export const usarTema = () => {
  const contexto = useContext(Contexto);
  if (!contexto) throw new Error('usarTema debe utilizarse dentro de ProveedorTema');
  return contexto;
};
