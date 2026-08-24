import { FileBarChart } from 'lucide-react';
import { EncabezadoPagina } from '../../components/Ui';
import { usarReporteMensual } from './usarReporteMensual';
import { ReporteMensual } from './componentes/ReporteMensual';

export const Reportes = () => {
  const mensual = usarReporteMensual(true);

  return (
    <div className="space-y-5">
      <EncabezadoPagina
        titulo="Reporte mensual"
        descripcion="Movimiento de toda la organizacion en el periodo elegido"
        icono={FileBarChart}
      />

      <ReporteMensual
        reporte={mensual.reporte}
        mes={mensual.mes}
        setMes={mensual.setMes}
        mesTope={mensual.mesVigente}
        filtros={mensual.filtros}
        setFiltros={mensual.setFiltros}
        limpiar={mensual.limpiar}
        hayFiltros={mensual.hayFiltros}
        sucursales={mensual.sucursales}
        categorias={mensual.categorias}
        error={mensual.error}
      />
    </div>
  );
};
