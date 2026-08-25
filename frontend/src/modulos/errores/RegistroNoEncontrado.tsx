import { ArrowLeft, FileQuestion } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PaginaEstado } from '../../components/PaginaEstado';

export const RegistroNoEncontrado = ({ titulo, mensaje, detalle, volverA }: {
  titulo: string;
  mensaje: string;
  detalle?: string | null;
  volverA: string;
}) => {
  const navegar = useNavigate();

  return (
    <PaginaEstado
      codigo="404"
      icono={FileQuestion}
      titulo={titulo}
      mensaje={mensaje}
      detalle={detalle}
    >
      <button type="button" className="boton-primario" onClick={() => navegar(volverA, { replace: true })}>
        <ArrowLeft className="h-4 w-4" />
        Volver al listado
      </button>
    </PaginaEstado>
  );
};
