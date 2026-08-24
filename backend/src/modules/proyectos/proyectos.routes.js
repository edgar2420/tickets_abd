import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { textoLimpio } from '../../utils/password.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarUsuario, notificarEquipoTecnico } from '../../services/notificaciones.service.js';
import { emitir, salaUsuario, SALA_TECNICOS, SALA_PROYECTOS } from '../../realtime/socket.js';
import { construirFichaProyecto, construirReporteProyectos, codigoProyecto } from '../../services/pdf/documentos.service.js';

export const TIPOS = ['Mejora', 'Software nuevo', 'Automatizacion', 'Integracion', 'Reporte'];
export const FRECUENCIAS = ['Diaria', 'Semanal', 'Mensual', 'Ocasional'];
export const URGENCIAS = ['Baja', 'Media', 'Alta', 'Critica'];
export const ESCALAS = ['Bajo', 'Medio', 'Alto'];
export const ESTADOS = [
  'Recibida', 'En evaluacion', 'Aprobada', 'En desarrollo', 'En pruebas', 'Implementada', 'Rechazada'
];

const peticionSchema = z.object({
  titulo: textoLimpio(10, 200),
  tipo: z.enum(TIPOS),
  problema: textoLimpio(30, 2000),
  situacion_actual: textoLimpio(20, 2000),
  propuesta: textoLimpio(30, 2000),
  beneficio: textoLimpio(20, 2000),
  personas_afectadas: z.number().int().min(1).max(9999),
  frecuencia: z.enum(FRECUENCIAS),
  urgencia: z.enum(URGENCIAS),
  sistemas_actuales: z.string().trim().max(300).optional().nullable()
});

const evaluacionSchema = z.object({
  evaluacion_ti: textoLimpio(20, 1000),
  esfuerzo_estimado: z.enum(ESCALAS),
  valor_estimado: z.enum(ESCALAS)
});

const aprobacionSchema = z.object({
  observacion_aprobacion: z.string().trim().max(500).optional().nullable(),
  responsable_id: z.number().int().positive().optional().nullable()
});

const avanceSchema = z.object({
  estado: z.enum(['En desarrollo', 'En pruebas', 'Implementada']),
  avance: z.number().int().min(0).max(100),
  responsable_id: z.number().int().positive().optional().nullable()
});

const rechazoSchema = z.object({
  motivo_rechazo: textoLimpio(10, 500)
});

const SELECT_PROYECTO = `
  SELECT p.id, p.titulo, p.tipo, p.problema, p.situacion_actual, p.propuesta, p.beneficio,
         p.personas_afectadas, p.frecuencia, p.urgencia, p.sistemas_actuales, p.estado, p.fecha_creacion,
         p.solicitante_id, sol.nombre AS solicitante_nombre,
         p.sucursal_id, COALESCE(suc.nombre, 'Sin sucursal') AS sucursal_nombre,
         p.area_id, COALESCE(ar.nombre, 'Sin area') AS area_nombre,
         p.evaluado_por_id, eva.nombre AS evaluado_por_nombre, p.fecha_evaluacion,
         p.evaluacion_ti, p.esfuerzo_estimado, p.valor_estimado,
         p.aprobado_por_id, apr.nombre AS aprobado_por_nombre, p.fecha_aprobacion, p.observacion_aprobacion,
         p.responsable_id, res.nombre AS responsable_nombre,
         p.fecha_inicio, p.fecha_entrega, p.avance,
         p.rechazado_por_id, rec.nombre AS rechazado_por_nombre, p.fecha_rechazo, p.motivo_rechazo
    FROM solicitudes_proyecto p
    JOIN usuarios sol       ON sol.id = p.solicitante_id
    LEFT JOIN sucursales suc ON suc.id = p.sucursal_id
    LEFT JOIN areas ar       ON ar.id = p.area_id
    LEFT JOIN usuarios eva   ON eva.id = p.evaluado_por_id
    LEFT JOIN usuarios apr   ON apr.id = p.aprobado_por_id
    LEFT JOIN usuarios res   ON res.id = p.responsable_id
    LEFT JOIN usuarios rec   ON rec.id = p.rechazado_por_id`;

const obtener = async (id) => {
  const { rows } = await query(`${SELECT_PROYECTO} WHERE p.id = $1`, [id]);
  if (!rows[0]) throw HttpError.notFound('La peticion indicada no existe');
  return rows[0];
};

const difundir = (proyecto, evento) => {
  emitir([SALA_TECNICOS, SALA_PROYECTOS, salaUsuario(proyecto.solicitante_id)], evento, proyecto);
};

const registrarPaso = async (req, proyecto, accion, detalle = null) => {
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'PROYECTO', entidadId: proyecto.id, accion, detalle, ip: req.ip
  });
};

export const proyectosRouter = Router();
proyectosRouter.use(autenticar);

proyectosRouter.get('/resumen', requierePermiso('proyectos.solicitar', 'proyectos.ver_todas'),
  asyncHandler(async (req, res) => {
    const verTodas = req.usuario.permisos.includes('proyectos.ver_todas');
    const { rows } = await query(
      `SELECT COUNT(*)::int                                                          AS total,
              COUNT(*) FILTER (WHERE estado = 'Recibida')::int                       AS recibidas,
              COUNT(*) FILTER (WHERE estado = 'En evaluacion')::int                  AS en_evaluacion,
              COUNT(*) FILTER (WHERE estado = 'Aprobada')::int                       AS aprobadas,
              COUNT(*) FILTER (WHERE estado IN ('En desarrollo', 'En pruebas'))::int AS en_curso,
              COUNT(*) FILTER (WHERE estado = 'Implementada')::int                   AS implementadas,
              COUNT(*) FILTER (WHERE estado = 'Rechazada')::int                      AS rechazadas
         FROM solicitudes_proyecto
        WHERE ($1::bool = TRUE OR solicitante_id = $2)`,
      [verTodas, req.usuario.id]
    );
    res.json({ ok: true, datos: rows[0] });
  }));

proyectosRouter.get('/reporte/pdf', requierePermiso('proyectos.ver_todas'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_PROYECTO} ORDER BY p.fecha_creacion DESC LIMIT 300`);
  const buffer = await construirReporteProyectos({ filas: rows }).aBuffer();
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_PROYECTOS_PDF', ip: req.ip
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="peticiones-de-proyecto.pdf"');
  res.send(buffer);
}));

proyectosRouter.get('/', requierePermiso('proyectos.solicitar', 'proyectos.ver_todas'),
  asyncHandler(async (req, res) => {
    const { limite, pagina, desplazamiento } = paginacion(req.query);
    const verTodas = req.usuario.permisos.includes('proyectos.ver_todas');
    const condiciones = `
      WHERE ($1::bool = TRUE OR p.solicitante_id = $2)
        AND ($3::varchar IS NULL OR p.estado = $3)
        AND ($4::varchar IS NULL OR p.tipo = $4)
        AND ($5::int IS NULL OR p.sucursal_id = $5)
        AND ($6::text IS NULL OR p.titulo ILIKE '%' || $6 || '%' OR p.problema ILIKE '%' || $6 || '%')`;

    const parametros = [
      verTodas,
      req.usuario.id,
      req.query.estado || null,
      req.query.tipo || null,
      req.query.sucursal_id ? Number(req.query.sucursal_id) : null,
      req.query.busqueda || null
    ];

    const { rows: total } = await query(
      `SELECT COUNT(*)::int AS total FROM solicitudes_proyecto p ${condiciones}`, parametros
    );
    const { rows } = await query(
      `${SELECT_PROYECTO} ${condiciones} ORDER BY p.fecha_creacion DESC LIMIT $7 OFFSET $8`,
      [...parametros, limite, desplazamiento]
    );
    res.json(respuestaPaginada(rows, total[0].total, limite, pagina));
  }));

proyectosRouter.get('/:id', requierePermiso('proyectos.solicitar', 'proyectos.ver_todas'),
  asyncHandler(async (req, res) => {
    const proyecto = await obtener(Number(req.params.id));
    if (!req.usuario.permisos.includes('proyectos.ver_todas') && proyecto.solicitante_id !== req.usuario.id) {
      throw HttpError.forbidden('Solo puede consultar las peticiones que usted registro');
    }
    res.json({ ok: true, datos: proyecto });
  }));

proyectosRouter.get('/:id/pdf', requierePermiso('proyectos.solicitar', 'proyectos.ver_todas'),
  asyncHandler(async (req, res) => {
    const proyecto = await obtener(Number(req.params.id));
    if (!req.usuario.permisos.includes('proyectos.ver_todas') && proyecto.solicitante_id !== req.usuario.id) {
      throw HttpError.forbidden('Solo puede descargar las peticiones que usted registro');
    }
    const buffer = await construirFichaProyecto(proyecto).aBuffer();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${codigoProyecto(proyecto.id)}.pdf"`);
    res.send(buffer);
  }));

proyectosRouter.post('/', requierePermiso('proyectos.solicitar'), validate(peticionSchema),
  asyncHandler(async (req, res) => {
    const c = req.body;
    const { rows } = await query(
      `INSERT INTO solicitudes_proyecto
         (titulo, tipo, problema, situacion_actual, propuesta, beneficio, personas_afectadas,
          frecuencia, urgencia, sistemas_actuales, solicitante_id, sucursal_id, area_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING id`,
      [
        c.titulo, c.tipo, c.problema, c.situacion_actual, c.propuesta, c.beneficio,
        c.personas_afectadas, c.frecuencia, c.urgencia, c.sistemas_actuales || null,
        req.usuario.id, req.usuario.sucursal_id, req.usuario.area_id
      ]
    );

    const proyecto = await obtener(rows[0].id);
    await registrarPaso(req, proyecto, 'CREAR', { titulo: proyecto.titulo, tipo: proyecto.tipo });
    await notificarEquipoTecnico({
      tipo: 'proyecto',
      titulo: `Nueva peticion de proyecto ${codigoProyecto(proyecto.id)}`,
      mensaje: `${req.usuario.nombre} propone: ${proyecto.titulo}`,
      excluirUsuarioId: req.usuario.id
    });
    difundir(proyecto, 'proyecto:creado');

    res.status(201).json({ ok: true, datos: proyecto });
  }));

proyectosRouter.put('/:id/evaluar', requierePermiso('proyectos.evaluar'), validate(evaluacionSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    if (['Implementada', 'Rechazada'].includes(actual.estado)) {
      throw HttpError.conflict('La peticion ya esta cerrada');
    }

    await query(
      `UPDATE solicitudes_proyecto
          SET estado = 'En evaluacion', evaluado_por_id = $1, fecha_evaluacion = CURRENT_TIMESTAMP,
              evaluacion_ti = $2, esfuerzo_estimado = $3, valor_estimado = $4
        WHERE id = $5`,
      [req.usuario.id, req.body.evaluacion_ti, req.body.esfuerzo_estimado, req.body.valor_estimado, id]
    );

    const proyecto = await obtener(id);
    await registrarPaso(req, proyecto, 'EVALUAR', {
      esfuerzo: proyecto.esfuerzo_estimado, valor: proyecto.valor_estimado
    });
    await notificarUsuario({
      usuarioId: proyecto.solicitante_id,
      tipo: 'proyecto',
      titulo: `Su peticion ${codigoProyecto(id)} fue evaluada`,
      mensaje: 'Sistemas registro la evaluacion tecnica de su propuesta.'
    });
    difundir(proyecto, 'proyecto:actualizado');

    res.json({ ok: true, datos: proyecto });
  }));

proyectosRouter.put('/:id/aprobar', requierePermiso('proyectos.gestionar'), validate(aprobacionSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    if (actual.estado !== 'En evaluacion') {
      throw HttpError.conflict('Solo puede aprobarse una peticion que ya fue evaluada tecnicamente');
    }

    await query(
      `UPDATE solicitudes_proyecto
          SET estado = 'Aprobada', aprobado_por_id = $1, fecha_aprobacion = CURRENT_TIMESTAMP,
              observacion_aprobacion = $2, responsable_id = COALESCE($3, responsable_id)
        WHERE id = $4`,
      [req.usuario.id, req.body.observacion_aprobacion || null, req.body.responsable_id || null, id]
    );

    const proyecto = await obtener(id);
    await registrarPaso(req, proyecto, 'APROBAR');
    await notificarUsuario({
      usuarioId: proyecto.solicitante_id,
      tipo: 'proyecto',
      titulo: `Su peticion ${codigoProyecto(id)} fue aprobada`,
      mensaje: 'La propuesta entra en la cartera de proyectos de Sistemas.'
    });
    difundir(proyecto, 'proyecto:actualizado');

    res.json({ ok: true, datos: proyecto });
  }));

proyectosRouter.put('/:id/avance', requierePermiso('proyectos.gestionar'), validate(avanceSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    if (!['Aprobada', 'En desarrollo', 'En pruebas'].includes(actual.estado)) {
      throw HttpError.conflict('Solo puede avanzar una peticion aprobada');
    }

    const inicia = actual.estado === 'Aprobada' && req.body.estado === 'En desarrollo';
    const termina = req.body.estado === 'Implementada';

    await query(
      `UPDATE solicitudes_proyecto
          SET estado = $1,
              avance = $2,
              responsable_id = COALESCE($3, responsable_id),
              fecha_inicio = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE fecha_inicio END,
              fecha_entrega = CASE WHEN $5 THEN CURRENT_TIMESTAMP ELSE fecha_entrega END
        WHERE id = $6`,
      [req.body.estado, termina ? 100 : req.body.avance, req.body.responsable_id || null, inicia, termina, id]
    );

    const proyecto = await obtener(id);
    await registrarPaso(req, proyecto, 'AVANCE', { estado: proyecto.estado, avance: proyecto.avance });
    await notificarUsuario({
      usuarioId: proyecto.solicitante_id,
      tipo: 'proyecto',
      titulo: `Su peticion ${codigoProyecto(id)} avanzo a ${proyecto.estado}`,
      mensaje: termina
        ? 'La mejora ya esta implementada y disponible.'
        : `Avance registrado: ${proyecto.avance}%.`
    });
    difundir(proyecto, 'proyecto:actualizado');

    res.json({ ok: true, datos: proyecto });
  }));

proyectosRouter.put('/:id/rechazar', requierePermiso('proyectos.evaluar', 'proyectos.gestionar'),
  validate(rechazoSchema), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    if (['Implementada', 'Rechazada'].includes(actual.estado)) {
      throw HttpError.conflict('La peticion ya esta cerrada');
    }

    await query(
      `UPDATE solicitudes_proyecto
          SET estado = 'Rechazada', rechazado_por_id = $1, fecha_rechazo = CURRENT_TIMESTAMP,
              motivo_rechazo = $2
        WHERE id = $3`,
      [req.usuario.id, req.body.motivo_rechazo, id]
    );

    const proyecto = await obtener(id);
    await registrarPaso(req, proyecto, 'RECHAZAR', { motivo: proyecto.motivo_rechazo });
    await notificarUsuario({
      usuarioId: proyecto.solicitante_id,
      tipo: 'proyecto',
      titulo: `Su peticion ${codigoProyecto(id)} no fue aprobada`,
      mensaje: proyecto.motivo_rechazo.slice(0, 200)
    });
    difundir(proyecto, 'proyecto:actualizado');

    res.json({ ok: true, datos: proyecto });
  }));
