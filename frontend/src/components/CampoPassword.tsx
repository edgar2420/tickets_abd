import { useState, type KeyboardEvent, type MouseEvent } from 'react';
import { ArrowBigUp, Eye, EyeOff, KeyRound } from 'lucide-react';

interface Propiedades {
  id?: string;
  etiqueta?: string;
  valor: string;
  alCambiar: (valor: string) => void;
  requerido?: boolean;
  minimo?: number;
  autoComplete?: string;
  marcador?: string;
  conIcono?: boolean;
}

/**
 * Campo de contrasena con dos ayudas para el usuario:
 * el boton de ojo alterna entre texto oculto y visible, y se avisa cuando
 * el teclado tiene activado el bloqueo de mayusculas.
 */
export const CampoPassword = ({
  id = 'password',
  etiqueta = 'Contrasena',
  valor,
  alCambiar,
  requerido = false,
  minimo,
  autoComplete = 'current-password',
  marcador,
  conIcono = false
}: Propiedades) => {
  const [visible, setVisible] = useState(false);
  const [mayusculas, setMayusculas] = useState(false);

  // getModifierState informa el estado real de la tecla de bloqueo de mayusculas
  const revisarMayusculas = (evento: KeyboardEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>) => {
    const estado = evento.getModifierState?.('CapsLock');
    if (typeof estado === 'boolean') setMayusculas(estado);
  };

  return (
    <div>
      <label className="etiqueta" htmlFor={id}>{etiqueta}</label>
      <div className="relative">
        {conIcono && <KeyRound className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />}
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          className={`campo pr-10 ${conIcono ? 'pl-9' : ''}`}
          value={valor}
          required={requerido}
          minLength={minimo}
          autoComplete={autoComplete}
          placeholder={marcador}
          onChange={(e) => alCambiar(e.target.value)}
          onKeyUp={revisarMayusculas}
          onKeyDown={revisarMayusculas}
          onClick={revisarMayusculas}
          onBlur={() => setMayusculas(false)}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          className="absolute right-2 top-1.5 rounded-md p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-institucional-700 dark:text-slate-500"
          title={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          aria-label={visible ? 'Ocultar contrasena' : 'Mostrar contrasena'}
          tabIndex={-1}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      {mayusculas && (
        <p className="mt-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700" role="status">
          <ArrowBigUp className="h-3.5 w-3.5" />
          Bloqueo de mayusculas activado
        </p>
      )}
    </div>
  );
};
