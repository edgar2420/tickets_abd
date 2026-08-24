import { useState, type FormEvent } from 'react';
import { Check, KeyRound, X } from 'lucide-react';
import { api } from '../lib/api';
import { Alerta, Modal } from './Ui';
import { CampoPassword } from './CampoPassword';

export const LARGO_MINIMO = 10;

export const reglasDe = (password: string, usuario = '') => [
  { texto: `Al menos ${LARGO_MINIMO} caracteres`, cumple: password.length >= LARGO_MINIMO },
  { texto: 'Sin espacios en blanco', cumple: password.length > 0 && !/\s/.test(password) },
  { texto: 'Al menos una letra', cumple: /[A-Za-zÀ-ÿ]/.test(password) },
  { texto: 'Al menos un numero', cumple: /\d/.test(password) },
  {
    texto: 'Distinta del nombre de usuario',
    cumple: password.length > 0 && password.toLowerCase() !== usuario.toLowerCase()
  }
];

export const Reglas = ({ password, usuario = '' }: { password: string; usuario?: string }) => (
  <ul className="grid gap-1 sm:grid-cols-2">
    {reglasDe(password, usuario).map(({ texto, cumple }) => (
      <li
        key={texto}
        className={`flex items-center gap-1.5 text-xs ${cumple
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-400 dark:text-slate-500'}`}
      >
        {cumple ? <Check className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
        {texto}
      </li>
    ))}
  </ul>
);

export const CambioPassword = ({ abierto, usuario, alCerrar }: {
  abierto: boolean;
  usuario: string;
  alCerrar: () => void;
}) => {
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [listo, setListo] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cumpleTodo = reglasDe(nueva, usuario).every((regla) => regla.cumple);
  const coinciden = nueva.length > 0 && nueva === repetida;

  const cerrar = () => {
    setActual('');
    setNueva('');
    setRepetida('');
    setError(null);
    setListo(false);
    alCerrar();
  };

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    setGuardando(true);
    setError(null);
    try {
      await api('/auth/cambiar-password', {
        metodo: 'POST',
        cuerpo: { passwordActual: actual, passwordNueva: nueva }
      });
      setListo(true);
      setActual('');
      setNueva('');
      setRepetida('');
    } catch (fallo) {
      setError(fallo instanceof Error ? fallo.message : 'No fue posible cambiar la contrasena');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Modal titulo="Cambiar mi contrasena" icono={KeyRound} abierto={abierto} alCerrar={cerrar} ancho="max-w-lg">
      {listo ? (
        <div className="space-y-4">
          <p className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm
                        text-emerald-800 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300">
            <Check className="mt-0.5 h-4 w-4 shrink-0" />
            Su contrasena fue cambiada. La proxima vez que inicie sesion use la nueva.
          </p>
          <div className="flex justify-end">
            <button type="button" className="boton-primario" onClick={cerrar}>Entendido</button>
          </div>
        </div>
      ) : (
        <form onSubmit={enviar} className="space-y-4">
          {error && <Alerta mensaje={error} />}

          <CampoPassword
            etiqueta="Contrasena actual"
            valor={actual}
            alCambiar={setActual}
            requerido
            autoComplete="current-password"
          />

          <div>
            <CampoPassword
              etiqueta="Contrasena nueva"
              valor={nueva}
              alCambiar={setNueva}
              requerido
              autoComplete="new-password"
            />
            <div className="mt-2">
              <Reglas password={nueva} usuario={usuario} />
            </div>
          </div>

          <div>
            <CampoPassword
              etiqueta="Repita la contrasena nueva"
              valor={repetida}
              alCambiar={setRepetida}
              requerido
              autoComplete="new-password"
            />
            {repetida.length > 0 && !coinciden && (
              <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">
                Las dos contrasenas no coinciden
              </p>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
            <button type="button" className="boton-secundario" onClick={cerrar}>Cancelar</button>
            <button
              type="submit"
              className="boton-primario"
              disabled={guardando || !cumpleTodo || !coinciden || actual.length === 0}
            >
              Cambiar contrasena
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};
