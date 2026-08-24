import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import {
  BellRing, FileText, Loader2, LockKeyhole, LogIn, ShieldCheck, TicketCheck, User
} from 'lucide-react';
import { usarAuth } from '../../context/AuthContext';
import { Alerta } from '../../components/Ui';
import { CampoPassword } from '../../components/CampoPassword';

const CARACTERISTICAS = [
  { icono: TicketCheck, titulo: 'Trazabilidad completa', detalle: 'Quien solicito, quien atendio y quien resolvio cada requerimiento.' },
  { icono: ShieldCheck, titulo: 'Acceso por roles', detalle: 'Permisos atomicos configurables desde el panel de administracion.' },
  { icono: BellRing, titulo: 'Avisos en tiempo real', detalle: 'Notificaciones inmediatas ante cada cambio de estado del ticket.' },
  { icono: FileText, titulo: 'Respaldo documental', detalle: 'Actas y reportes en PDF generados de forma automatica.' }
];

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
    <div className="relative min-h-screen overflow-hidden bg-institucional-900">
      {}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: 'url(/fondo.jpg)' }}
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-institucional-900/70 lg:bg-gradient-to-r lg:from-institucional-900/40 lg:via-institucional-900/50 lg:to-institucional-900/95"
        aria-hidden="true"
      />

      <div className="relative flex min-h-screen flex-col">
        <main className="flex flex-1 items-center justify-center px-4 py-10 sm:px-8">
          <div className="grid w-full max-w-6xl items-center gap-10 lg:grid-cols-[1.1fr_minmax(380px,420px)] lg:gap-16">

            {}
            <section className="hidden lg:block">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-institucional-100 backdrop-blur">
                <ShieldCheck className="h-3.5 w-3.5" />
                Control de acceso basado en roles
              </span>

              <h1 className="mt-6 text-4xl font-bold leading-tight tracking-tight text-white xl:text-5xl">
                Mesa de Ayuda
                <span className="block text-institucional-200">Sistemas</span>
              </h1>

              <p className="mt-4 max-w-xl text-base leading-relaxed text-institucional-100">
                Plataforma centralizada para el registro, atencion y resolucion de incidencias
                y requerimientos, con control de acceso basado en roles.
              </p>

              <ul className="mt-9 grid gap-4 sm:grid-cols-2">
                {CARACTERISTICAS.map(({ icono: Icono, titulo, detalle }) => (
                  <li
                    key={titulo}
                    className="rounded-xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm transition hover:border-white/30 hover:bg-white/15"
                  >
                    <Icono className="h-5 w-5 text-institucional-200" />
                    <p className="mt-2.5 text-sm font-semibold text-white">{titulo}</p>
                    <p className="mt-1 text-xs leading-relaxed text-institucional-100">{detalle}</p>
                  </li>
                ))}
              </ul>
            </section>

            {}
            <section className="mx-auto w-full max-w-md">
              <div className="mb-6 text-center lg:hidden">
                <ShieldCheck className="mx-auto h-10 w-10 text-institucional-200" />
                <h1 className="mt-3 text-xl font-bold uppercase tracking-wide text-white">Mesa de Ayuda TI</h1>
                <p className="mt-1 text-sm text-institucional-100">Gestion de tickets y control de acceso</p>
              </div>

              <form
                onSubmit={enviar}
                className="animar-entrada rounded-2xl border border-white/60 bg-white/95 p-7 shadow-2xl backdrop-blur-md sm:p-8"
              >
                <span className="inline-flex rounded-xl bg-institucional-900 p-3 text-white shadow-sm">
                  <LockKeyhole className="h-5 w-5" />
                </span>
                <h2 className="mt-4 text-2xl font-bold tracking-tight text-institucional-900">Iniciar sesion</h2>
                <p className="mt-1 text-sm text-slate-500">Ingrese sus credenciales institucionales.</p>

                <div className="mt-7 space-y-4">
                  <div>
                    <label className="etiqueta" htmlFor="usuario">Usuario</label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-slate-400" />
                      <input
                        id="usuario"
                        className="campo pl-9"
                        autoComplete="username"
                        placeholder="usuario institucional"
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
                    marcador="contrasena"
                  />

                  {error && <Alerta mensaje={error} />}

                  <button type="submit" className="boton-primario w-full py-3" disabled={enviando}>
                    {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogIn className="h-4 w-4" />}
                    {enviando ? 'Validando credenciales' : 'Ingresar al sistema'}
                  </button>
                </div>

                <p className="mt-7 border-t border-slate-200 pt-5 text-xs text-slate-500">
                  <span className="font-semibold uppercase tracking-wide text-slate-400">Responsable</span>
                  <span className="mt-0.5 block font-medium text-slate-600">Ing. Edgar Rojas Apaza</span>
                </p>
              </form>
            </section>
          </div>
        </main>

        <footer className="border-t border-white/10 bg-institucional-900/50 px-6 py-4 text-center text-xs text-institucional-100 backdrop-blur-sm">
          <ShieldCheck className="mr-1.5 inline h-3.5 w-3.5 text-institucional-200" />
          <span className="font-semibold text-white">Ing. Edgar Rojas Apaza</span>
          {' | '}Desarrollo de Modulo de Tickets
        </footer>
      </div>
    </div>
  );
};
