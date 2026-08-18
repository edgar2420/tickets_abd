import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { KeyRound, Loader2, LogIn, ShieldCheck, User } from 'lucide-react';
import { usarAuth } from '../context/AuthContext';
import { Alerta } from '../components/Ui';

export const Login = () => {
  const { usuario, iniciarSesion, cargando } = usarAuth();
  const [credenciales, setCredenciales] = useState({ usuario: '', password: '' });
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const navegar = useNavigate();

  if (!cargando && usuario) return <Navigate to="/tablero" replace />;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await iniciarSesion(credenciales.usuario.trim(), credenciales.password);
      navegar('/tablero', { replace: true });
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible iniciar sesion');
    } finally {
      setEnviando(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-institucional-900">
      <div className="flex flex-1 items-center justify-center p-4">
        <div className="w-full max-w-4xl overflow-hidden rounded-xl bg-white shadow-2xl lg:grid lg:grid-cols-2">
          <div className="hidden flex-col justify-between bg-institucional-800 p-10 text-white lg:flex">
            <div>
              <ShieldCheck className="h-10 w-10 text-institucional-200" />
              <h1 className="mt-6 text-2xl font-bold leading-tight">
                Sistema de Gestion de Tickets TI
              </h1>
              <p className="mt-3 text-sm text-institucional-100">
                Mesa de ayuda centralizada con trazabilidad completa de solicitantes, responsables de
                atencion y responsables de resolucion, bajo un modelo de control de acceso basado en roles.
              </p>
            </div>
            <dl className="space-y-3 text-xs text-institucional-100">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-institucional-200">Documento</dt>
                <dd>STD-2026-TI - Version 1.0.0</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-institucional-200">Responsable</dt>
                <dd>Ing. Edgar Rojas Apaza - Desarrollo de Modulo de Tickets</dd>
              </div>
            </dl>
          </div>

          <form onSubmit={enviar} className="p-8 sm:p-10">
            <h2 className="text-xl font-bold text-institucional-900">Iniciar sesion</h2>
            <p className="mt-1 text-sm text-slate-500">Ingrese sus credenciales institucionales.</p>

            <div className="mt-6 space-y-4">
              <div>
                <label className="etiqueta" htmlFor="usuario">Usuario</label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="usuario"
                    className="campo pl-9"
                    autoComplete="username"
                    value={credenciales.usuario}
                    onChange={(e) => setCredenciales((c) => ({ ...c, usuario: e.target.value }))}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="etiqueta" htmlFor="password">Contrasena</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    id="password"
                    type="password"
                    className="campo pl-9"
                    autoComplete="current-password"
                    value={credenciales.password}
                    onChange={(e) => setCredenciales((c) => ({ ...c, password: e.target.value }))}
                    required
                  />
                </div>
              </div>

              {error && <Alerta mensaje={error} />}

              <button type="submit" className="boton-primario w-full" disabled={enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {enviando ? 'Validando credenciales' : 'Ingresar'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <footer className="border-t border-white/10 px-6 py-4 text-center text-xs text-institucional-200">
        <span className="font-semibold text-white">Ing. Edgar Rojas Apaza</span>
        {' | '}Desarrollo de Modulo de Tickets
      </footer>
    </div>
  );
};
