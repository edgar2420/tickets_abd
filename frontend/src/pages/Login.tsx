import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Loader2, LogIn, ShieldCheck, User } from 'lucide-react';
import { usarAuth } from '../context/AuthContext';
import { Alerta } from '../components/Ui';
import { CampoPassword } from '../components/CampoPassword';

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
    <div className="relative flex min-h-screen flex-col">
      {/* Fondo institucional con velo oscuro para asegurar contraste del formulario */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/fondo.jpg)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-institucional-900/75 lg:bg-gradient-to-r lg:from-institucional-900/90 lg:via-institucional-900/60 lg:to-institucional-900/95"
        aria-hidden="true"
      />

      <main className="relative flex flex-1 items-center justify-center p-4 sm:p-8 lg:justify-end lg:px-16">
        <div className="w-full max-w-md">
          <div className="mb-5 text-center lg:text-left">
            <ShieldCheck className="mx-auto h-9 w-9 text-institucional-200 lg:mx-0" />
            <h1 className="mt-3 text-lg font-bold uppercase tracking-wide text-white">
              Mesa de Ayuda TI
            </h1>
            <p className="mt-1 text-sm text-institucional-100">
              Gestion de tickets y control de acceso basado en roles
            </p>
          </div>

          <form onSubmit={enviar} className="rounded-xl bg-white/95 p-6 shadow-2xl backdrop-blur sm:p-8">
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

              <CampoPassword
                valor={credenciales.password}
                alCambiar={(password) => setCredenciales((c) => ({ ...c, password }))}
                requerido
                conIcono
              />

              {error && <Alerta mensaje={error} />}

              <button type="submit" className="boton-primario w-full" disabled={enviando}>
                {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                {enviando ? 'Validando credenciales' : 'Ingresar'}
              </button>
            </div>

            <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-slate-200 pt-4 text-xs text-slate-500">
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Documento</dt>
                <dd>STD-2026-TI - v1.0.0</dd>
              </div>
              <div>
                <dt className="font-semibold uppercase tracking-wide text-slate-400">Responsable</dt>
                <dd>Ing. Edgar Rojas Apaza</dd>
              </div>
            </dl>
          </form>
        </div>
      </main>

      <footer className="relative border-t border-white/10 px-6 py-4 text-center text-xs text-institucional-100">
        <span className="font-semibold text-white">Ing. Edgar Rojas Apaza</span>
        {' | '}Desarrollo de Modulo de Tickets
      </footer>
    </div>
  );
};
