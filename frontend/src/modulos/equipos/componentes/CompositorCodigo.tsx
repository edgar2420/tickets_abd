import { useEffect, useState } from 'react';
import { Check, RefreshCw, TriangleAlert } from 'lucide-react';
import { api } from '../../../lib/api';
import { FORMATO_CODIGO, PREFIJOS, partesDelCodigo } from '../constantes';
import type { TipoEquipo } from '../../../lib/tipos';

const EJEMPLOS: Partial<Record<TipoEquipo, string>> = {
  PC: 'ADM para Administracion',
  Camara: 'ALM para Almacen',
  Telefonia: 'ADM para Administracion',
  Switch: 'RACK01 para el rack principal',
  Servidor: 'IBS para la sala de servidores'
};

export const CompositorCodigo = ({ codigo, tipo, alCambiar, esNuevo }: {
  codigo: string;
  tipo: TipoEquipo;
  alCambiar: (codigo: string) => void;
  esNuevo: boolean;
}) => {
  const prefijo = PREFIJOS[tipo];
  const { ubicacion, correlativo } = partesDelCodigo(codigo);
  const [zona, setZona] = useState(ubicacion);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setZona(partesDelCodigo(codigo).ubicacion);
  }, [codigo]);

  const proponer = async (destino: string) => {
    const limpia = destino.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
    setZona(limpia);
    if (limpia.length < 2) {
      setError('La ubicacion necesita al menos dos caracteres');
      return;
    }
    setError(null);
    setConsultando(true);
    try {
      const { datos } = await api<{ datos: { codigo: string } }>('/equipos/siguiente-codigo', {
        parametros: { tipo, ubicacion: limpia }
      });
      alCambiar(datos.codigo);
    } catch {
      alCambiar(`${prefijo}-${limpia}-001`);
    } finally {
      setConsultando(false);
    }
  };

  useEffect(() => {
    if (!esNuevo) return;
    const actual = partesDelCodigo(codigo);
    if (actual.ubicacion.length >= 2 && actual.prefijo !== prefijo) void proponer(actual.ubicacion);
  }, [tipo]);

  const valido = FORMATO_CODIGO.test(codigo.toUpperCase());

  return (
    <div className="sm:col-span-3">
      <label className="etiqueta">Codigo del equipo</label>
      <div className="flex flex-wrap items-stretch gap-2">
        <span className="flex items-center rounded-lg border border-slate-300 bg-slate-100 px-3 font-mono text-sm
                         font-bold text-institucional-800 dark:border-noche-700 dark:bg-noche-700 dark:text-institucional-200">
          {prefijo}
        </span>
        <span className="flex items-center text-slate-400">-</span>
        <input
          className="campo w-32 font-mono uppercase"
          maxLength={10}
          placeholder="ADM"
          value={zona}
          onChange={(evento) => void proponer(evento.target.value)}
        />
        <span className="flex items-center text-slate-400">-</span>
        <input
          className="campo w-24 font-mono"
          maxLength={3}
          placeholder="001"
          value={correlativo}
          onChange={(evento) => {
            const numero = evento.target.value.replace(/\D/g, '').slice(0, 3);
            alCambiar(`${prefijo}-${zona}-${numero}`);
          }}
        />
        <button
          type="button"
          className="boton-secundario"
          disabled={consultando || zona.length < 2}
          onClick={() => void proponer(zona)}
        >
          <RefreshCw className={`h-4 w-4 ${consultando ? 'animate-spin' : ''}`} />
          Sugerir el siguiente
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        <span className={`flex items-center gap-1.5 font-mono text-sm font-bold ${valido
          ? 'text-emerald-600 dark:text-emerald-400'
          : 'text-slate-400 dark:text-slate-500'}`}>
          {valido ? <Check className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
          {codigo.toUpperCase() || `${prefijo}-...-...`}
        </span>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          El prefijo lo define el tipo. La ubicacion la elige usted: {EJEMPLOS[tipo] ?? 'ADM, ALM, RACK01, VTA'}.
        </span>
      </div>

      {error && <p className="mt-1 text-xs font-medium text-rose-600 dark:text-rose-400">{error}</p>}

      <input type="hidden" name="codigo" value={codigo} required />
    </div>
  );
};
