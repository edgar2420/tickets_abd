import { useCallback, useState, type ReactNode } from 'react';
import { AlertTriangle, Loader2, X, type LucideIcon } from 'lucide-react';

interface Solicitud {
  titulo: string;
  mensaje: ReactNode;
  textoConfirmar?: string;
  tono?: 'peligro' | 'normal';
  icono?: LucideIcon;
  alConfirmar: () => Promise<void> | void;
}

/**
 * Dialogo de confirmacion propio del sistema.
 * Reemplaza a window.confirm, que el navegador dibuja con su propio estilo
 * y rompe la identidad visual de la aplicacion.
 */
export const usarConfirmacion = () => {
  const [solicitud, setSolicitud] = useState<Solicitud | null>(null);
  const [procesando, setProcesando] = useState(false);

  const confirmar = useCallback((nueva: Solicitud) => setSolicitud(nueva), []);
  const cerrar = useCallback(() => {
    if (!procesando) setSolicitud(null);
  }, [procesando]);

  const ejecutar = async () => {
    if (!solicitud) return;
    setProcesando(true);
    try {
      await solicitud.alConfirmar();
      setSolicitud(null);
    } finally {
      setProcesando(false);
    }
  };

  const tonoPeligro = solicitud?.tono !== 'normal';
  const Icono = solicitud?.icono ?? AlertTriangle;

  const dialogo = solicitud ? (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-2xl dark:bg-slate-900">
        <header className="flex items-start gap-4 p-6">
          <span className={`shrink-0 rounded-full p-3 ${tonoPeligro ? 'bg-rose-100 text-rose-700' : 'bg-institucional-50 text-institucional-700'}`}>
            <Icono className="h-6 w-6" />
          </span>
          <div className="flex-1">
            <h3 className="text-base font-bold text-institucional-900 dark:text-slate-100">{solicitud.titulo}</h3>
            <div className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{solicitud.mensaje}</div>
          </div>
          <button
            type="button"
            onClick={cerrar}
            className="rounded-md p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-500"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </header>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-6 py-4 dark:bg-slate-800 dark:border-slate-700">
          <button type="button" className="boton-secundario" onClick={cerrar} disabled={procesando}>
            Cancelar
          </button>
          <button
            type="button"
            className={tonoPeligro ? 'boton-peligro' : 'boton-primario'}
            onClick={() => void ejecutar()}
            disabled={procesando}
          >
            {procesando && <Loader2 className="h-4 w-4 animate-spin" />}
            {solicitud.textoConfirmar ?? 'Confirmar'}
          </button>
        </footer>
      </div>
    </div>
  ) : null;

  return { confirmar, dialogo };
};
