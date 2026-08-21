import { ClipboardCheck, PackageCheck, ShoppingCart, ThumbsUp, Wallet } from 'lucide-react';
import { Indicador } from '../../../components/Ui';
import { montoBs } from '../../../lib/formato';
import type { ResumenCompras } from '../../../lib/tipos';

export const Indicadores = ({ resumen, soloAprueba }: { resumen: ResumenCompras; soloAprueba: boolean }) => {
  const ejecutado = montoBs(resumen.monto_ejecutado ?? 0) ?? 'Bs 0.00';
  const porRevisar = resumen.solicitadas + resumen.en_revision;

  if (soloAprueba) {
    return (
      <div className="grid gap-4 sm:grid-cols-3">
        <Indicador
          etiqueta="Esperan su aprobacion"
          valor={resumen.esperando_gerencia}
          icono={ThumbsUp}
          tono={resumen.esperando_gerencia > 0 ? 'advertencia' : 'exito'}
          pie={resumen.esperando_gerencia > 0 ? 'Requieren su decision' : 'Nada pendiente'}
        />
        <Indicador
          etiqueta="En revision de TI"
          valor={porRevisar}
          icono={ClipboardCheck}
          tono="info"
          pie="Aun no llegan a Gerencia"
        />
        <Indicador etiqueta="Monto ejecutado" valor={ejecutado} icono={Wallet} tono="neutro" pie="Compras ya concretadas" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <Indicador etiqueta="Solicitudes" valor={resumen.total} icono={ShoppingCart} />
      <Indicador etiqueta="Por revisar" valor={porRevisar} icono={ClipboardCheck} tono="info" />
      <Indicador etiqueta="En Gerencia" valor={resumen.esperando_gerencia} icono={ThumbsUp} tono="advertencia" />
      <Indicador
        etiqueta="Entregadas"
        valor={resumen.entregadas}
        icono={PackageCheck}
        tono="exito"
        pie={`${ejecutado} ejecutado`}
      />
    </div>
  );
};
