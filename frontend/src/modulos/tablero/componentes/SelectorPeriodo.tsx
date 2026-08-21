import { ChevronLeft, ChevronRight } from 'lucide-react';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

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
  const anioTope = partes(tope).anio;
  const anios = Array.from({ length: 6 }, (_, i) => anioTope - i);

  const siguiente = desplazar(mes, 1);
  const haySiguiente = siguiente <= tope;

  const elegirMes = (nuevoMes: number) => {
    const candidato = armar(anio, nuevoMes);
    setMes(candidato > tope ? tope : candidato);
  };

  const elegirAnio = (nuevoAnio: number) => {
    const candidato = armar(nuevoAnio, numero);
    setMes(candidato > tope ? tope : candidato);
  };

  return (
    <div>
      <label className="etiqueta">Periodo</label>
      <div className="flex items-stretch gap-1.5">
        <button
          type="button"
          className="shrink-0 rounded-lg border border-slate-300 px-2 text-slate-500 transition
                     hover:bg-slate-100 hover:text-institucional-700
                     dark:border-noche-700 dark:text-slate-300 dark:hover:bg-noche-700"
          onClick={() => setMes(desplazar(mes, -1))}
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>

        <select className="campo" value={numero} onChange={(evento) => elegirMes(Number(evento.target.value))}>
          {MESES.map((nombre, indice) => (
            <option key={nombre} value={indice + 1} disabled={armar(anio, indice + 1) > tope}>
              {nombre}
            </option>
          ))}
        </select>

        <select className="campo w-28 shrink-0" value={anio} onChange={(evento) => elegirAnio(Number(evento.target.value))}>
          {anios.map((valor) => <option key={valor} value={valor}>{valor}</option>)}
        </select>

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
    </div>
  );
};
