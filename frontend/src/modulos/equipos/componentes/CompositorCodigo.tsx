import { useEffect, useRef, useState } from 'react';
import { Check, PencilLine, RefreshCw, TriangleAlert } from 'lucide-react';
import { api } from '../../../lib/api';
import { FORMATO_CODIGO, PREFIJOS, partesDelCodigo } from '../constantes';
import type { Area, TipoEquipo } from '../../../lib/tipos';

export const CompositorCodigo = ({ codigo, tipo, areaId, areas, alCambiar, esNuevo }: {
  codigo: string;
  tipo: TipoEquipo;
  areaId: string;
  areas: Area[];
  alCambiar: (codigo: string) => void;
  esNuevo: boolean;
}) => {
  const prefijo = PREFIJOS[tipo];
  const area = areas.find((a) => String(a.id) === String(areaId)) ?? null;
  const { correlativo } = partesDelCodigo(codigo);

  const [manual, setManual] = useState(false);
  const [consultando, setConsultando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ultimaConsulta = useRef('');

  const proponer = async (zona: string) => {
    setError(null);
    setConsultando(true);
    try {
      const { datos } = await api<{ datos: { codigo: string } }>('/equipos/siguiente-codigo', {
        parametros: { tipo, ubicacion: zona }
      });
      alCambiar(datos.codigo);
    } catch {
      setError('No fue posible consultar el correlativo; se propone el primero');
      alCambiar(`${prefijo}-${zona}-001`);
    } finally {
      setConsultando(false);
    }
  };

  useEffect(() => {
    if (!esNuevo || manual || !area) return;
    const clave = `${tipo}|${area.codigo}`;
    if (ultimaConsulta.current === clave) return;
    ultimaConsulta.current = clave;
    void proponer(area.codigo);
  }, [tipo, area?.codigo, esNuevo, manual]);

  const valido = FORMATO_CODIGO.test(codigo.toUpperCase());

  return (
    <div className="sm:col-span-3">
      <label className="etiqueta">Codigo del equipo</label>

      {!manual ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className={`flex items-center gap-2 rounded-lg border px-3 py-2 font-mono text-base font-bold ${valido
            ? 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-500/30 dark:bg-emerald-500/10 dark:text-emerald-300'
            : 'border-slate-300 bg-slate-50 text-slate-400 dark:border-noche-700 dark:bg-noche-800 dark:text-slate-500'}`}>
            {valido ? <Check className="h-4 w-4" /> : <TriangleAlert className="h-4 w-4" />}
            {codigo.toUpperCase() || `${prefijo}-...-...`}
          </span>

          <button
            type="button"
            className="boton-secundario"
            disabled={consultando || !area}
            onClick={() => area && void proponer(area.codigo)}
          >
            <RefreshCw className={`h-4 w-4 ${consultando ? 'animate-spin' : ''}`} />
            Recalcular
          </button>

          <button type="button" className="boton-secundario" onClick={() => setManual(true)}>
            <PencilLine className="h-4 w-4" />
            Escribirlo a mano
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-stretch gap-2">
          <span className="flex items-center rounded-lg border border-slate-300 bg-slate-100 px-3 font-mono text-sm
                           font-bold text-institucional-800 dark:border-noche-700 dark:bg-noche-700 dark:text-institucional-200">
            {prefijo}
          </span>
          <span className="flex items-center text-slate-400">-</span>
          <input
            className="campo w-32 font-mono uppercase"
            maxLength={10}
            placeholder="RACK01"
            value={partesDelCodigo(codigo).ubicacion}
            onChange={(evento) => {
              const zona = evento.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10);
              alCambiar(`${prefijo}-${zona}-${correlativo}`);
            }}
          />
          <span className="flex items-center text-slate-400">-</span>
          <input
            className="campo w-24 font-mono"
            maxLength={3}
            placeholder="001"
            value={correlativo}
            onChange={(evento) => {
              const numero = evento.target.value.replace(/\D/g, '').slice(0, 3);
              alCambiar(`${prefijo}-${partesDelCodigo(codigo).ubicacion}-${numero}`);
            }}
          />
          <button
            type="button"
            className="boton-secundario"
            onClick={() => {
              setManual(false);
              ultimaConsulta.current = '';
              if (area) void proponer(area.codigo);
            }}
          >
            Volver al automatico
          </button>
        </div>
      )}

      <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
        {manual
          ? 'Escriba el codigo a mano solo para casos que no encajan con un area, como un rack o una sala de servidores.'
          : area
            ? `Se arma solo: ${prefijo} por el tipo, ${area.codigo} por el area ${area.nombre}, y el correlativo siguiente.`
            : 'Elija el area del equipo y el codigo se arma solo.'}
      </p>

      {error && <p className="mt-1 text-xs font-medium text-amber-600 dark:text-amber-400">{error}</p>}

      <input type="hidden" name="codigo" value={codigo} required />
    </div>
  );
};
