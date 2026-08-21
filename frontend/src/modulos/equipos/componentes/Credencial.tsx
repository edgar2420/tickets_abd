import { ShieldAlert } from 'lucide-react';
import type { Credencial as DatosCredencial } from '../usarEquipos';

export const Credencial = ({ credencial, alCerrar }: { credencial: DatosCredencial; alCerrar: () => void }) => (
  <div className="space-y-4">
    <div className="superficie p-4">
      <p className="font-semibold text-institucional-900 dark:text-slate-100">
        {credencial.equipo.codigo} - {credencial.equipo.nombre_equipo}
      </p>
      <p className="text-xs text-slate-500 dark:text-slate-300">
        {credencial.equipo.usuario_nombre ?? 'Sin asignar'} - {credencial.equipo.direccion_ip ?? 'sin IP'}
      </p>
    </div>

    <div>
      <p className="etiqueta">Identificador AnyDesk</p>
      <p className="font-mono text-lg font-bold text-institucional-900 dark:text-slate-100">
        {credencial.anydesk_id ?? 'No registrado'}
      </p>
    </div>

    <div>
      <p className="etiqueta">Contrasena</p>
      <p className="select-all font-mono text-lg font-bold text-institucional-900 dark:text-slate-100">
        {credencial.password}
      </p>
    </div>

    <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800
                  dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-300">
      <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
      Esta consulta quedo registrada en la bitacora de auditoria con su usuario y la fecha.
    </p>

    <div className="flex justify-end">
      <button type="button" className="boton-secundario" onClick={alCerrar}>Cerrar</button>
    </div>
  </div>
);
