import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Loader2, UserPlus } from 'lucide-react';
import { api } from '../../lib/api';
import { Alerta } from '../../components/Ui';
import { CampoPassword } from '../../components/CampoPassword';
import { LARGO_MINIMO, Reglas } from '../../components/CambioPassword';

interface CatalogoRegistro {
  areas: { id: number; nombre: string }[];
  sucursales: { id: number; nombre: string; codigo: string }[];
}

const VACIO = {
  nombre: '',
  usuario: '',
  email: '',
  password: '',
  repetida: '',
  area_id: '',
  sucursal_id: ''
};

export const Registro = () => {
  const navegar = useNavigate();
  const [catalogo, setCatalogo] = useState<CatalogoRegistro | null>(null);
  const [formulario, setFormulario] = useState(VACIO);
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    void api<{ datos: CatalogoRegistro }>('/auth/catalogo-registro')
      .then(({ datos }) => setCatalogo(datos))
      .catch(() => setError('No fue posible cargar las areas y sucursales'));
  }, []);

  const cambiar = (campo: keyof typeof VACIO, valor: string) =>
    setFormulario((f) => ({ ...f, [campo]: valor }));

  const coinciden = formulario.password.length > 0 && formulario.password === formulario.repetida;
  const completo = formulario.nombre.trim().length >= 6
    && formulario.usuario.trim().length >= 3
    && formulario.area_id !== ''
    && formulario.sucursal_id !== ''
    && coinciden;

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setError(null);
    setEnviando(true);
    try {
      await api('/auth/registro', {
        metodo: 'POST',
        cuerpo: {
          nombre: formulario.nombre.trim(),
          usuario: formulario.usuario.trim(),
          email: formulario.email.trim() || null,
          password: formulario.password,
          area_id: Number(formulario.area_id),
          sucursal_id: Number(formulario.sucursal_id)
        }
      });
      setListo(true);
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible registrar la cuenta');
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-institucional-900 p-4">
        <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-2xl dark:bg-noche-850">
          <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-600" />
          <h1 className="mt-4 text-lg font-bold text-institucional-900 dark:text-slate-100">
            Su cuenta quedo registrada
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-200">
            Sistemas debe habilitarla antes de que pueda entrar. Le llegara un aviso dentro del
            sistema en cuanto la aprueben.
          </p>
          <button type="button" className="boton-primario mt-6 w-full justify-center"
            onClick={() => navegar('/login', { replace: true })}>
            Volver al inicio de sesion
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-institucional-900 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-2xl dark:bg-noche-850">
        <header className="mb-6">
          <span className="inline-flex rounded-xl bg-institucional-900 p-2.5 text-white">
            <UserPlus className="h-5 w-5" />
          </span>
          <h1 className="mt-3 text-xl font-bold text-institucional-900 dark:text-slate-100">
            Crear una cuenta
          </h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
            Complete sus datos. Sistemas revisara la solicitud y le habilitara el acceso.
          </p>
        </header>

        {error && <div className="mb-4"><Alerta mensaje={error} /></div>}

        <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="etiqueta" htmlFor="nombre">Nombre completo</label>
            <input id="nombre" className="campo" required minLength={6} maxLength={120}
              placeholder="Maria Fernanda Quispe"
              value={formulario.nombre} onChange={(e) => cambiar('nombre', e.target.value)} />
          </div>

          <div>
            <label className="etiqueta" htmlFor="usuario">Usuario</label>
            <input id="usuario" className="campo" required minLength={3} maxLength={40}
              autoComplete="username" placeholder="maria.quispe"
              value={formulario.usuario}
              onChange={(e) => cambiar('usuario', e.target.value.toLowerCase().replace(/[^a-z0-9._-]/g, ''))} />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">
              Con este nombre entrara. Solo letras, numeros, punto, guion y guion bajo.
            </p>
          </div>

          <div>
            <label className="etiqueta" htmlFor="email">Correo (opcional)</label>
            <input id="email" type="email" className="campo" maxLength={120}
              placeholder="maria@empresa.bo"
              value={formulario.email} onChange={(e) => cambiar('email', e.target.value)} />
          </div>

          <div>
            <label className="etiqueta" htmlFor="area">Area donde trabaja</label>
            <select id="area" className="campo" required
              value={formulario.area_id} onChange={(e) => cambiar('area_id', e.target.value)}>
              <option value="">Seleccione</option>
              {(catalogo?.areas ?? []).map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}
            </select>
          </div>

          <div>
            <label className="etiqueta" htmlFor="sucursal">Sucursal</label>
            <select id="sucursal" className="campo" required
              value={formulario.sucursal_id} onChange={(e) => cambiar('sucursal_id', e.target.value)}>
              <option value="">Seleccione</option>
              {(catalogo?.sucursales ?? []).map((s) => (
                <option key={s.id} value={s.id}>{s.codigo} - {s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-2">
            <CampoPassword
              id="password-registro"
              etiqueta="Contraseña"
              valor={formulario.password}
              alCambiar={(password) => cambiar('password', password)}
              requerido
              minimo={LARGO_MINIMO}
              autoComplete="new-password"
              marcador={`Minimo ${LARGO_MINIMO} caracteres`}
            />
            {formulario.password && (
              <div className="mt-2">
                <Reglas password={formulario.password} usuario={formulario.usuario} />
              </div>
            )}
          </div>

          <div className="sm:col-span-2">
            <CampoPassword
              id="password-repetida"
              etiqueta="Repita la contraseña"
              valor={formulario.repetida}
              alCambiar={(repetida) => cambiar('repetida', repetida)}
              requerido
              autoComplete="new-password"
            />
            {formulario.repetida.length > 0 && !coinciden && (
              <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                Las dos contraseñas no coinciden
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 sm:col-span-2">
            <Link to="/login" className="inline-flex items-center gap-1.5 text-sm font-semibold text-institucional-700 dark:text-institucional-300">
              <ArrowLeft className="h-4 w-4" />
              Ya tengo cuenta
            </Link>
            <button type="submit" className="boton-primario" disabled={enviando || !completo}>
              {enviando ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Enviar la solicitud
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
