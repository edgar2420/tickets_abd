import { useEffect, useRef, useState } from 'react';
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const partes = (mes: string) => {
  const [anio, numero] = mes.split('-').map(Number);
  return { anio, numero };
};

const armar = (anio: number, numero: number) => `${anio}-${String(numero).padStart(2, '0')}`;

const desplazar = (mes: string, pasos: number) => {
  const { anio, numero } = partes(mes);
  const total = anio * 12 + (numero - 1) + pasos;
  return armar(Math.floor(total / 12), (total % 12) + 1);
};

export const SelectorPeriodo = ({ mes, setMes, tope }: {
  mes: string;
  setMes: (mes: string) => void;
  tope: string;
}) => {
  const { anio, numero } = partes(mes);
  const [abierto, setAbierto] = useState(false);
  const [anioVisible, setAnioVisible] = useState(anio);
  const contenedor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    setAnioVisible(anio);
  }, [abierto, anio]);

  useEffect(() => {
    if (!abierto) return;

    const alPulsarFuera = (evento: MouseEvent) => {
      if (!contenedor.current?.contains(evento.target as Node)) setAbierto(false);
    };
    const alPresionar = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setAbierto(false);
    };

    document.addEventListener('mousedown', alPulsarFuera);
    document.addEventListener('keydown', alPresionar);
    return () => {
      document.removeEventListener('mousedown', alPulsarFuera);
      document.removeEventListener('keydown', alPresionar);
    };
  }, [abierto]);

  const anterior = desplazar(mes, -1);
  const siguiente = desplazar(mes, 1);
  const haySiguiente = siguiente <= tope;
  const anioTope = partes(tope).anio;

  const elegir = (indice: number) => {
    const candidato = armar(anioVisible, indice + 1);
    if (candidato > tope) return;
    setMes(candidato);
    setAbierto(false);
  };

  return (
    <div className="relative" ref={contenedor}>
      <label className="etiqueta">Periodo</label>
      <div className="flex items-stretch gap-1.5">
        <button
          type="button"
          className="shrink-0 rounded-lg border border-slate-300 px-2 text-slate-500 transition
                     hover:bg-slate-100 hover:text-institucional-700
                     dark:border-noche-700 dark:text-slate-300 dark:hover:bg-noche-700"
          onClick={() => setMes(anterior)}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <button
          type="button"
          className="campo flex flex-1 items-center justify-between gap-2 text-left font-medium"
          onClick={() => setAbierto((previo) => !previo)}
        >
          <span className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-institucional-700 dark:text-institucional-300" />
            {MESES[numero - 1]} {anio}
          </span>
        </button>

        <button
          type="button"
          className="shrink-0 rounded-lg border border-slate-300 px-2 text-slate-500 transition
                     hover:bg-slate-100 hover:text-institucional-700 disabled:cursor-not-allowed disabled:opacity-40
                     dark:border-noche-700 dark:text-slate-300 dark:hover:bg-noche-700"
          onClick={() => haySiguiente && setMes(siguiente)}
          disabled={!haySiguiente}
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {abierto && (
        <div className="absolute left-0 top-full z-30 mt-2 w-72 rounded-xl border border-slate-200 bg-white p-3
                        shadow-2xl dark:border-noche-700 dark:bg-noche-850">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100
                         dark:text-slate-300 dark:hover:bg-noche-700"
              onClick={() => setAnioVisible((previo) => previo - 1)}
              aria-label="Ano anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-bold text-institucional-900 dark:text-slate-100">{anioVisible}</span>
            <button
              type="button"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-slate-100
                         disabled:cursor-not-allowed disabled:opacity-30
                         dark:text-slate-300 dark:hover:bg-noche-700"
              onClick={() => setAnioVisible((previo) => previo + 1)}
              disabled={anioVisible >= anioTope}
              aria-label="Ano siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            {CORTOS.map((corto, indice) => {
              const valor = armar(anioVisible, indice + 1);
              const elegido = valor === mes;
              const futuro = valor > tope;

              return (
                <button
                  key={corto}
                  type="button"
                  onClick={() => elegir(indice)}
                  disabled={futuro}
                  className={`rounded-lg py-2 text-sm font-semibold transition
                    ${elegido
                      ? 'bg-institucional-700 text-white shadow'
                      : futuro
                        ? 'cursor-not-allowed text-slate-300 dark:text-slate-600'
                        : 'text-slate-700 hover:bg-institucional-50 dark:text-slate-200 dark:hover:bg-noche-700'}`}
                >
                  {corto}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
