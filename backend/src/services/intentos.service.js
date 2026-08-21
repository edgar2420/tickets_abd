import { HttpError } from '../utils/httpError.js';

const INTENTOS_MAXIMOS = 5;
const BLOQUEO_MS = 15 * 60 * 1000;
const VENTANA_MS = 15 * 60 * 1000;

const registro = new Map();

/**
 * Bloqueo temporal por usuario tras varios intentos fallidos.
 *
 * El limitador por direccion ya frena la fuerza bruta masiva, pero no
 * protege a una cuenta concreta cuando el atacante rota de origen. Este
 * control cuenta los fallos por nombre de usuario y lo bloquea un rato,
 * sin llegar a inhabilitar la cuenta: pasado el plazo vuelve a operar.
 */
export const verificarBloqueo = (usuario) => {
  const clave = String(usuario).toLowerCase();
  const estado = registro.get(clave);
  if (!estado?.bloqueadoHasta) return;

  if (estado.bloqueadoHasta > Date.now()) {
    const minutos = Math.ceil((estado.bloqueadoHasta - Date.now()) / 60000);
    throw HttpError.forbidden(
      `Cuenta bloqueada temporalmente por intentos fallidos. Reintente en ${minutos} minuto(s).`
    );
  }
  registro.delete(clave);
};

export const registrarFallo = (usuario) => {
  const clave = String(usuario).toLowerCase();
  const ahora = Date.now();
  const estado = registro.get(clave);

  if (!estado || ahora - estado.desde > VENTANA_MS) {
    registro.set(clave, { fallos: 1, desde: ahora, bloqueadoHasta: null });
    return;
  }

  estado.fallos += 1;
  if (estado.fallos >= INTENTOS_MAXIMOS) estado.bloqueadoHasta = ahora + BLOQUEO_MS;
  registro.set(clave, estado);
};

export const limpiarIntentos = (usuario) => registro.delete(String(usuario).toLowerCase());

