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
  return new Date(Date.UTC(anio, numero - 2, 1)).toISOString().slice(0, 7);
};

const rango = (mes) => {
  const [anio, numero] = mes.split('-').map(Number);
  return [`${mes}-01`, new Date(Date.UTC(anio, numero, 1)).toISOString().slice(0, 10)];
};

const CONDICION = `
  AND ($3::int IS NULL OR t.sucursal_id = $3)
  AND ($4::varchar IS NULL OR t.categoria = $4)
  AND ($5::varchar IS NULL OR t.prioridad = $5)`;

const parametros = (mes, filtros) => {
  const [desde, hasta] = rango(mes);
  return [
    desde,
    hasta,
    filtros.sucursal_id ? Number(filtros.sucursal_id) : null,
    filtros.categoria || null,
    filtros.prioridad || null
  ];
};

const totales = async (mes, filtros) => {
  const { rows } = await query(
    `SELECT
       COUNT(*) FILTER (WHERE t.fecha_creacion >= $1 AND t.fecha_creacion < $2)::int     AS creados,
       COUNT(*) FILTER (WHERE t.fecha_asignacion >= $1 AND t.fecha_asignacion < $2)::int AS atendidos,
       COUNT(*) FILTER (WHERE t.fecha_resolucion >= $1 AND t.fecha_resolucion < $2)::int AS resueltos,
       COUNT(*) FILTER (WHERE t.fecha_cierre >= $1 AND t.fecha_cierre < $2)::int         AS cerrados,
       COUNT(*) FILTER (WHERE t.fecha_creacion < $2
                          AND t.estado IN ('Nuevo', 'Asignado', 'En Proceso', 'En Espera'))::int AS pendientes,
       COUNT(*) FILTER (WHERE t.fecha_creacion >= $1 AND t.fecha_creacion < $2
                          AND t.prioridad = 'Critica')::int                              AS criticos
      FROM tickets t
     WHERE TRUE ${CONDICION}`,
    parametros(mes, filtros)
  );
  return rows[0];
};

const desglose = async (mes, filtros, agrupacion, etiqueta, union = '') => {
  const { rows } = await query(
    `SELECT ${etiqueta} AS etiqueta,
            COUNT(*)::int                                                        AS creados,
            COUNT(*) FILTER (WHERE t.estado IN ('Nuevo', 'Asignado'))::int       AS abiertos,
            COUNT(*) FILTER (WHERE t.estado IN ('En Proceso', 'En Espera'))::int  AS en_proceso,
            COUNT(*) FILTER (WHERE t.estado = 'Resuelto')::int                    AS resueltos,
            COUNT(*) FILTER (WHERE t.estado = 'Cerrado')::int                     AS cerrados
       FROM tickets t
       ${union}
      WHERE t.fecha_creacion >= $1 AND t.fecha_creacion < $2 ${CONDICION}
      GROUP BY ${agrupacion}
      ORDER BY creados DESC
      LIMIT 20`,
    parametros(mes, filtros)
  );
  return rows;
};

const porTecnico = async (mes, filtros) => {
  const { rows } = await query(
    `SELECT u.nombre AS etiqueta,
            COUNT(*) FILTER (WHERE t.fecha_asignacion >= $1 AND t.fecha_asignacion < $2)::int AS atendidos,
            COUNT(*) FILTER (WHERE t.fecha_resolucion >= $1 AND t.fecha_resolucion < $2)::int AS resueltos,
            COUNT(*) FILTER (WHERE t.fecha_cierre >= $1 AND t.fecha_cierre < $2)::int         AS cerrados
       FROM tickets t
       JOIN usuarios u ON u.id = COALESCE(t.resuelto_por_id, t.asignado_id)
      WHERE (t.fecha_asignacion >= $1 AND t.fecha_asignacion < $2
             OR t.fecha_resolucion >= $1 AND t.fecha_resolucion < $2) ${CONDICION}
      GROUP BY u.nombre
      ORDER BY resueltos DESC, atendidos DESC
      LIMIT 20`,
    parametros(mes, filtros)
  );
  return rows;
};

const detalle = async (mes, filtros) => {
  const { rows } = await query(
    `SELECT t.id, t.titulo, t.categoria, t.prioridad, t.estado,
            sol.nombre AS solicitante_nombre,
            COALESCE(s.nombre, 'Sin sucursal') AS sucursal_nombre,
            asi.nombre AS atendido_por,
            t.fecha_creacion, t.fecha_resolucion, t.fecha_cierre
       FROM tickets t
       JOIN usuarios sol ON sol.id = t.solicitante_id
       LEFT JOIN usuarios asi ON asi.id = COALESCE(t.resuelto_por_id, t.asignado_id)
       LEFT JOIN sucursales s ON s.id = t.sucursal_id
      WHERE t.fecha_creacion >= $1 AND t.fecha_creacion < $2 ${CONDICION}
      ORDER BY t.fecha_creacion
      LIMIT 500`,
    parametros(mes, filtros)
  );
  return rows;
};

const diario = async (mes, filtros) => {
  const { rows } = await query(
    `SELECT to_char(dia, 'DD') AS etiqueta,
            COALESCE(c.creados, 0)::int   AS creados,
            COALESCE(r.resueltos, 0)::int AS resueltos
       FROM generate_series($1::date, ($2::date - INTERVAL '1 day'), INTERVAL '1 day') AS dia
       LEFT JOIN (
         SELECT date_trunc('day', t.fecha_creacion) AS d, COUNT(*) AS creados
           FROM tickets t
          WHERE t.fecha_creacion >= $1 AND t.fecha_creacion < $2 ${CONDICION}
          GROUP BY 1
       ) c ON c.d = dia
       LEFT JOIN (
         SELECT date_trunc('day', t.fecha_resolucion) AS d, COUNT(*) AS resueltos
           FROM tickets t
          WHERE t.fecha_resolucion >= $1 AND t.fecha_resolucion < $2 ${CONDICION}
          GROUP BY 1
       ) r ON r.d = dia
      ORDER BY dia`,
    parametros(mes, filtros)
  );
  return rows;
};

const nombreSucursal = async (id) => {
  if (!id) return null;
  const { rows } = await query('SELECT nombre FROM sucursales WHERE id = $1', [Number(id)]);
  return rows[0]?.nombre ?? null;
};

export const reporteMensual = async (mes, filtros = {}) => {
  const anterior = mesAnterior(mes);

  const [actuales, previos, categorias, sucursales, areas, solicitantes, tecnicos, porDia, tickets] =
    await Promise.all([
      totales(mes, filtros),
      totales(anterior, filtros),
      desglose(mes, filtros, 't.categoria', 't.categoria'),
      desglose(mes, filtros, 's.nombre', "COALESCE(s.nombre, 'Sin sucursal')",
        'LEFT JOIN sucursales s ON s.id = t.sucursal_id'),
      desglose(mes, filtros, 'a.nombre', 'a.nombre',
        'JOIN usuarios u ON u.id = t.solicitante_id JOIN areas a ON a.id = u.area_id'),
      desglose(mes, filtros, 'u.nombre', 'u.nombre', 'JOIN usuarios u ON u.id = t.solicitante_id'),
      porTecnico(mes, filtros),
      diario(mes, filtros),
      detalle(mes, filtros)
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
    filtros: {
      sucursal_id: filtros.sucursal_id ?? '',
      categoria: filtros.categoria ?? '',
      prioridad: filtros.prioridad ?? ''
    },
    filtroSucursal: await nombreSucursal(filtros.sucursal_id),
    totales: actuales,
    anterior: { mes: anterior, nombre: nombreDelMes(anterior), totales: previos },
    variacion: {
      creados: variacion('creados'),
      atendidos: variacion('atendidos'),
      resueltos: variacion('resueltos'),
      cerrados: variacion('cerrados')
    },
    categorias,
    sucursales,
    areas,
    solicitantes,
    tecnicos,
    porDia,
    tickets
  };
};
