import { FileDown, KeyRound, PencilLine } from 'lucide-react';
import { Dato, Etiqueta } from '../../../components/Ui';
import { descargarPdf } from '../../../lib/api';
import { ESTILO_ESTADO } from '../constantes';
import type { Equipo } from '../../../lib/tipos';

const detalles = (equipo: Equipo) => [
  { etiqueta: 'Asignado a', valor: equipo.usuario_nombre ?? 'Sin asignar' },
  { etiqueta: 'Area', valor: equipo.area_nombre },
  { etiqueta: 'Sucursal', valor: equipo.sucursal_nombre },
  { etiqueta: 'Ubicacion', valor: equipo.ubicacion },
  { etiqueta: 'Fecha de asignacion', valor: equipo.fecha_asignacion?.slice(0, 10) },
  { etiqueta: 'Sistema operativo', valor: equipo.sistema_operativo },
  { etiqueta: 'Procesador', valor: equipo.procesador },
  { etiqueta: 'Memoria RAM', valor: equipo.ram_gb ? `${equipo.ram_gb} GB` : null },
  { etiqueta: 'Almacenamiento', valor: equipo.almacenamiento },
  { etiqueta: 'Direccion IP', valor: equipo.direccion_ip },
  { etiqueta: 'Direccion MAC', valor: equipo.direccion_mac },
  { etiqueta: 'Numero de serie', valor: equipo.numero_serie },
  { etiqueta: 'Identificador AnyDesk', valor: equipo.anydesk_id }
];

export const Ficha = ({ ficha, puede, alRevelar, alEditar }: {
  ficha: Equipo;
  puede: (...codigos: string[]) => boolean;
  alRevelar: (equipo: Equipo) => void;
  alEditar: (equipo: Equipo) => void;
}) => (
  <div className="space-y-5">
    <div className="superficie flex flex-wrap items-center justify-between gap-3 p-4">
      <div>
        <p className="font-mono text-xs font-semibold text-institucional-700 dark:text-institucional-300">{ficha.codigo}</p>
        <p className="text-lg font-bold text-institucional-900 dark:text-slate-100">{ficha.nombre_equipo}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {[ficha.marca, ficha.modelo].filter(Boolean).join(' ') || ficha.tipo}
        </p>
      </div>
      <Etiqueta texto={ficha.estado} clase={ESTILO_ESTADO[ficha.estado]} />
    </div>

    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {detalles(ficha).map(({ etiqueta, valor }) => (
        <Dato key={etiqueta} etiqueta={etiqueta} valor={valor} />
      ))}
    </div>

    {ficha.observaciones && (
      <div>
        <p className="etiqueta">Observaciones</p>
        <p className="text-sm text-slate-600 dark:text-slate-200">{ficha.observaciones}</p>
      </div>
    )}

    <div className="flex flex-wrap justify-end gap-2 border-t border-slate-200 pt-4 dark:border-noche-700">
      {puede('equipos.credenciales') && ficha.tiene_password && (
        <button type="button" className="boton-secundario" onClick={() => alRevelar(ficha)}>
          <KeyRound className="h-4 w-4" />
          Ver acceso remoto
        </button>
      )}
      <button
        type="button"
        className="boton-secundario"
        onClick={() => void descargarPdf(`/equipos/${ficha.id}/ficha/pdf`, {}, `equipo-${ficha.codigo}.pdf`)}
      >
        <FileDown className="h-4 w-4" />
        Ficha en PDF
      </button>
      {puede('equipos.gestionar') && (
        <button type="button" className="boton-primario" onClick={() => alEditar(ficha)}>
          <PencilLine className="h-4 w-4" />
          Editar equipo
        </button>
      )}
    </div>
  </div>
);
