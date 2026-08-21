import { query } from '../../config/db.js';

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
];

export const mesValido = (mes) => /^\d{4}-(0[1-9]|1[0-2])$/.test(String(mes ?? ''));

export const mesVigente = () => new Date().toISOString().slice(0, 7);

export const nombreDelMes = (mes) => {
  const [anio, numero] = mes.split('-');
  return `${MESES[Number(numero) - 1]} de ${anio}`;
};

const mesAnterior = (mes) => {
  const [anio, numero] = mes.split('-').map(Number);
  const fecha = new Date(Date.UTC(anio, numero - 2, 1));
  return fecha.toISOString().slice(0, 7);
};

const rango = (mes) => {
  const desde = `${mes}-01`;
  const [anio, numero] = mes.split('-').map(Number);
  const siguiente = new Date(Date.UTC(anio, numero, 1)).toISOString().slice(0, 10);
  return [desde, siguiente];
};

const totales = async (mes) => {
  const [desde, hasta] = rango(mes);
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE fecha_creacion >= $1 AND fecha_creacion < $2)::int      AS creados,
       COUNT(*) FILTER (WHERE fecha_asignacion >= $1 AND fecha_asignacion < $2)::int  AS atendidos,
       COUNT(*) FILTER (WHERE fecha_resolucion >= $1 AND fecha_resolucion < $2)::int  AS resueltos,
       COUNT(*) FILTER (WHERE fecha_cierre >= $1 AND fecha_cierre < $2)::int          AS cerrados,
       COUNT(*) FILTER (WHERE fecha_creacion < $2
                          AND estado IN ('Abierto', 'En Proceso'))::int               AS pendientes,
       COUNT(*) FILTER (WHERE fecha_creacion >= $1 AND fecha_creacion < $2
                          AND prioridad = 'Critica')::int                             AS criticos
      FROM tickets`,
    [desde, hasta]
  );
  return rows[0];
};

const promedios = async (mes) => {
  const [desde, hasta] = rango(mes);
  const { rows } = await query(
    `SELECT
       COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (fecha_asignacion - fecha_creacion)) / 3600)::numeric, 1), 0)  AS horas_hasta_atender,
       COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (fecha_resolucion - fecha_creacion)) / 3600)::numeric, 1), 0)  AS horas_hasta_resolver
      FROM tickets
     WHERE fecha_resolucion >= $1 AND fecha_resolucion < $2`,
    [desde, hasta]
  );
  return rows[0];
};

const desglose = async (mes, columna, etiqueta, union = '') => {
  const [desde, hasta] = rango(mes);
  const { rows } = await query(
    `SELECT ${etiqueta} AS etiqueta,
            COUNT(*)::int AS creados,
            COUNT(*) FILTER (WHERE t.estado IN ('Resuelto', 'Cerrado'))::int AS resueltos
       FROM tickets t
       ${union}
      WHERE t.fecha_creacion >= $1 AND t.fecha_creacion < $2
      GROUP BY ${columna}
      ORDER BY creados DESC
      LIMIT 15`,
    [desde, hasta]
  );
  return rows;
};

const porTecnico = async (mes) => {
  const [desde, hasta] = rango(mes);
  const { rows } = await query(
    `SELECT u.nombre AS etiqueta,
            COUNT(*)::int AS resueltos,
            COALESCE(ROUND(AVG(EXTRACT(EPOCH FROM (t.fecha_resolucion - t.fecha_creacion)) / 3600)::numeric, 1), 0) AS horas_promedio
       FROM tickets t
       JOIN usuarios u ON u.id = t.resuelto_por_id
      WHERE t.fecha_resolucion >= $1 AND t.fecha_resolucion < $2
      GROUP BY u.nombre
      ORDER BY resueltos DESC
      LIMIT 15`,
    [desde, hasta]
  );
  return rows;
};

const diario = async (mes) => {
  const [desde, hasta] = rango(mes);
  const { rows } = await query(
    `SELECT to_char(dia, 'DD') AS etiqueta,
            COALESCE(c.creados, 0)::int   AS creados,
            COALESCE(r.resueltos, 0)::int AS resueltos
       FROM generate_series($1::date, ($2::date - INTERVAL '1 day'), INTERVAL '1 day') AS dia
       LEFT JOIN (
         SELECT date_trunc('day', fecha_creacion) AS d, COUNT(*) AS creados
           FROM tickets WHERE fecha_creacion >= $1 AND fecha_creacion < $2
          GROUP BY 1
       ) c ON c.d = dia
       LEFT JOIN (
         SELECT date_trunc('day', fecha_resolucion) AS d, COUNT(*) AS resueltos
           FROM tickets WHERE fecha_resolucion >= $1 AND fecha_resolucion < $2
          GROUP BY 1
       ) r ON r.d = dia
      ORDER BY dia`,
    [desde, hasta]
  );
  return rows;
};

export const reporteMensual = async (mes) => {
  const anterior = mesAnterior(mes);

  const [actuales, previos, tiempos, categorias, sucursales, areas, tecnicos, porDia] = await Promise.all([
    totales(mes),
    totales(anterior),
    promedios(mes),
    desglose(mes, 't.categoria', 't.categoria'),
    desglose(mes, 's.nombre', "COALESCE(s.nombre, 'Sin sucursal')", 'LEFT JOIN sucursales s ON s.id = t.sucursal_id'),
    desglose(mes, 'a.nombre', 'a.nombre', 'JOIN usuarios u ON u.id = t.solicitante_id JOIN areas a ON a.id = u.area_id'),
    porTecnico(mes),
    diario(mes)
  ]);

  const variacion = (clave) => {
    const hoy = Number(actuales[clave]);
    const antes = Number(previos[clave]);
    if (antes === 0) return hoy === 0 ? 0 : null;
    return Math.round(((hoy - antes) / antes) * 100);
  };

  return {
    mes,
    nombre: nombreDelMes(mes),
    totales: actuales,
    anterior: { mes: anterior, nombre: nombreDelMes(anterior), totales: previos },
    variacion: {
      creados: variacion('creados'),
      atendidos: variacion('atendidos'),
      resueltos: variacion('resueltos'),
      cerrados: variacion('cerrados')
    },
    tiempos,
    categorias,
    sucursales,
    areas,
    tecnicos,
    porDia
  };
};
