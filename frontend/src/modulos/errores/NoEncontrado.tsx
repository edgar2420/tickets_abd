import { ArrowLeft, Compass, LayoutGrid } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { PaginaEstado } from '../../components/PaginaEstado';
import { RUTA_INICIAL } from '../../rutas';

export const NoEncontrado = () => {
  const navegar = useNavigate();
  const ubicacion = useLocation();

  return (
    <PaginaEstado
      codigo="404"
      icono={Compass}
      titulo="Esta pagina no existe"
      mensaje="La direccion que abrio no corresponde a ninguna seccion del sistema. Puede que el enlace este mal escrito o que la seccion se haya movido."
      detalle={ubicacion.pathname}
    >
      <button type="button" className="boton-secundario" onClick={() => navegar(-1)}>
        <ArrowLeft className="h-4 w-4" />
        Volver
      </button>
      <button type="button" className="boton-primario" onClick={() => navegar(RUTA_INICIAL, { replace: true })}>
        <LayoutGrid className="h-4 w-4" />
        Ir al tablero
      </button>
    </PaginaEstado>
  );
};
