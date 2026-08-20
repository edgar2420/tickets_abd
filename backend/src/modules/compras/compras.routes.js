import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarUsuario, notificarEquipoTecnico } from '../../services/notificaciones.service.js';
import { emitir, salaUsuario, SALA_TECNICOS } from '../../realtime/socket.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { construirReporteCompras, construirFichaCompra } from '../../services/pdf/documentos.service.js';

const TIPOS_EQUIPO = ['Escritorio', 'Laptop', 'Servidor', 'Impresora', 'Monitor', 'Red', 'Otro'];
const PRIORIDADES = ['Baja', 'Media', 'Alta', 'Critica'];

export const codigoCompra = (id) => 'SC-' + String(id).padStart(5, '0');

const solicitudSchema = z.object({
  titulo: z.string().min(6).max(200),
  justificacion: z.string().min(15, 'Explique para que se necesita el equipo'),
  tipo_equipo: z.enum(TIPOS_EQUIPO).default('Escritorio'),
  cantidad: z.number().int().positive().max(999).default(1),
  especificaciones: z.string().max(500).optional().nullable(),
  prioridad: z.enum(PRIORIDADES).default('Media')
});

const revisionSchema = z.object({
  observacion_ti: z.string().max(500).optional().nullable(),
  monto_estimado: z.number().nonnegative().optional().nullable(),
  proveedor_sugerido: z.string().max(150).optional().nullable()
});

const gerenciaSchema = z.object({
  observacion_gerencia: z.string().max(500).optional().nullable()
});

const rechazoSchema = z.object({
  motivo_rechazo: z.string().min(10, 'Indique por que se rechaza la solicitud').max(500)
});

const compraSchema = z.object({
  numero_orden: z.string().max(60).optional().nullable(),
  monto_final: z.number().nonnegative().optional().nullable()
});

const entregaSchema = z.object({
  equipo_id: z.number().int().positive().optional().nullable()
});

const SELECT_SOLICITUD = `
  SELECT c.id, c.titulo, c.justificacion, c.tipo_equipo, c.cantidad, c.especificaciones,
         c.prioridad, c.estado, c.fecha_creacion,
         c.solicitante_id, sol.nombre AS solicitante_nombre,
         c.sucursal_id, suc.nombre AS sucursal_nombre,
         c.area_id, a.nombre AS area_nombre,
         c.revisado_por_id, rev.nombre AS revisado_por_nombre, c.fecha_revision,
         c.observacion_ti, c.monto_estimado, c.proveedor_sugerido,
         c.aprobado_por_id, apr.nombre AS aprobado_por_nombre, c.fecha_aprobacion, c.observacion_gerencia,
         c.rechazado_por_id, rec.nombre AS rechazado_por_nombre, c.fecha_rechazo, c.motivo_rechazo,
         c.comprado_por_id, com.nombre AS comprado_por_nombre, c.fecha_compra, c.numero_orden, c.monto_final,
         c.entregado_por_id, ent.nombre AS entregado_por_nombre, c.fecha_entrega,
         c.equipo_id, eq.codigo AS equipo_codigo
    FROM solicitudes_compra c
    JOIN usuarios sol       ON sol.id = c.solicitante_id
    LEFT JOIN sucursales suc ON suc.id = c.sucursal_id
    LEFT JOIN areas a        ON a.id = c.area_id
    LEFT JOIN usuarios rev   ON rev.id = c.revisado_por_id
    LEFT JOIN usuarios apr   ON apr.id = c.aprobado_por_id
    LEFT JOIN usuarios rec   ON rec.id = c.rechazado_por_id
    LEFT JOIN usuarios com   ON com.id = c.comprado_por_id
    LEFT JOIN usuarios ent   ON ent.id = c.entregado_por_id
    LEFT JOIN equipos eq     ON eq.id = c.equipo_id`;

const obtener = async (id) => {
  const { rows } = await query(`${SELECT_SOLICITUD} WHERE c.id = $1`, [id]);
  if (!rows[0]) throw HttpError.notFound('La solicitud indicada no existe');
  return rows[0];
};

/** Solo el solicitante y quienes ven el conjunto acceden a una solicitud. */
const visible = (solicitud, usuario) => {
  if (usuario.permisos.includes('compras.ver_todas')) return true;
  return solicitud.solicitante_id === usuario.id;
};

/** Verifica que la solicitud este en alguno de los estados admitidos para la accion. */
const exigirEstado = (solicitud, estados) => {
  if (!estados.includes(solicitud.estado)) {
    throw HttpError.conflict(
      `La solicitud esta en estado "${solicitud.estado}" y esta accion requiere: ${estados.join(' o ')}`
    );
  }
};

export const comprasRouter = Router();
comprasRouter.use(autenticar);

/** Indicadores del modulo. */
comprasRouter.get('/resumen', requierePermiso('compras.ver_todas', 'compras.solicitar'),
  asyncHandler(async (req, res) => {
    const verTodas = req.usuario.permisos.includes('compras.ver_todas');
    const { rows } = await query(
      `SELECT
          COUNT(*)::int                                                  AS total,
          COUNT(*) FILTER (WHERE estado = 'Solicitada')::int             AS solicitadas,
          COUNT(*) FILTER (WHERE estado = 'En revision')::int            AS en_revision,
          COUNT(*) FILTER (WHERE estado = 'Aprobada por TI')::int        AS esperando_gerencia,
          COUNT(*) FILTER (WHERE estado = 'Aprobada por Gerencia')::int  AS aprobadas,
          COUNT(*) FILTER (WHERE estado = 'Comprada')::int               AS compradas,
          COUNT(*) FILTER (WHERE estado = 'Entregada')::int              AS entregadas,
          COUNT(*) FILTER (WHERE estado = 'Rechazada')::int              AS rechazadas,
          COALESCE(SUM(monto_final) FILTER (WHERE estado IN ('Comprada','Entregada')), 0)::float AS monto_ejecutado
         FROM solicitudes_compra c
        WHERE ($1::bool = TRUE OR c.solicitante_id = $2)`,
      [verTodas, req.usuario.id]
    );
    res.json({ ok: true, datos: rows[0] });
  }));

/** Listado con alcance segun permiso: propias o todas. */
comprasRouter.get('/', requierePermiso('compras.ver_todas', 'compras.solicitar'),
  asyncHandler(async (req, res) => {
    const { limite, pagina, desplazamiento } = paginacion(req.query);
    const verTodas = req.usuario.permisos.includes('compras.ver_todas');
    const { estado = null, sucursal_id = null, busqueda = null } = req.query;

    const condiciones = `
       WHERE ($1::bool = TRUE OR c.solicitante_id = $2)
         AND ($3::text IS NULL OR c.estado = $3)
         AND ($4::int  IS NULL OR c.sucursal_id = $4)
         AND ($5::text IS NULL OR c.titulo ILIKE '%' || $5 || '%' OR c.justificacion ILIKE '%' || $5 || '%')`;
    const parametros = [verTodas, req.usuario.id, estado, sucursal_id, busqueda];

    const { rows: total } = await query(
      `SELECT COUNT(*)::int AS total FROM solicitudes_compra c ${condiciones}`, parametros
    );
    const { rows } = await query(
      `${SELECT_SOLICITUD} ${condiciones}
        ORDER BY CASE c.prioridad WHEN 'Critica' THEN 1 WHEN 'Alta' THEN 2 WHEN 'Media' THEN 3 ELSE 4 END,
                 c.fecha_creacion DESC
        LIMIT $6 OFFSET $7`,
      [...parametros, limite, desplazamiento]
    );
    res.json(respuestaPaginada(rows, total[0].total, limite, pagina));
  }));

comprasRouter.get('/:id', requierePermiso('compras.ver_todas', 'compras.solicitar'),
  asyncHandler(async (req, res) => {
    const solicitud = await obtener(req.params.id);
    if (!visible(solicitud, req.usuario)) {
      throw HttpError.forbidden('Solo puede consultar las solicitudes que usted registro');
    }
    res.json({ ok: true, datos: solicitud });
  }));

/** El solicitante registra el pedido; su sucursal y area salen de su perfil. */
comprasRouter.post('/', requierePermiso('compras.solicitar'), validate(solicitudSchema),
  asyncHandler(async (req, res) => {
    const { titulo, justificacion, tipo_equipo, cantidad, especificaciones, prioridad } = req.body;
    const { rows } = await query(
      `INSERT INTO solicitudes_compra
         (titulo, justificacion, tipo_equipo, cantidad, especificaciones, prioridad,
          solicitante_id, sucursal_id, area_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      [titulo, justificacion, tipo_equipo, cantidad, especificaciones ?? null, prioridad,
        req.usuario.id, req.usuario.sucursal_id, req.usuario.area_id]
    );
    const solicitud = await obtener(rows[0].id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: solicitud.id, accion: 'SOLICITAR',
      detalle: { titulo, tipo_equipo, cantidad }, ip: req.ip
    });
    await notificarEquipoTecnico({
      tipo: 'COMPRA_NUEVA',
      titulo: 'Nueva solicitud de compra ' + codigoCompra(solicitud.id),
      mensaje: `${req.usuario.nombre} (${solicitud.sucursal_nombre ?? 'sin sucursal'}) solicita: ${titulo}`,
      excluirUsuarioId: req.usuario.id
    });
    emitir(SALA_TECNICOS, 'compra:creada', solicitud);

    res.status(201).json({ ok: true, datos: solicitud });
  }));

/** Paso 1: TI revisa la viabilidad tecnica y cotiza. */
comprasRouter.put('/:id/revisar', requierePermiso('compras.revisar'), validate(revisionSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    exigirEstado(actual, ['Solicitada', 'En revision']);

    const { observacion_ti, monto_estimado, proveedor_sugerido } = req.body;
    await query(
      `UPDATE solicitudes_compra
          SET estado = 'En revision', revisado_por_id = $1, fecha_revision = CURRENT_TIMESTAMP,
              observacion_ti = $2, monto_estimado = $3, proveedor_sugerido = $4
        WHERE id = $5`,
      [req.usuario.id, observacion_ti ?? null, monto_estimado ?? null, proveedor_sugerido ?? null, id]
    );
    const solicitud = await obtener(id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: id, accion: 'REVISAR',
      detalle: { monto_estimado, proveedor_sugerido }, ip: req.ip
    });
    await notificarUsuario({
      usuarioId: solicitud.solicitante_id, tipo: 'COMPRA_EN_REVISION',
      titulo: 'Su solicitud ' + codigoCompra(id) + ' esta en revision',
      mensaje: `${req.usuario.nombre} tomo la revision tecnica de su pedido.`
    });
    emitir([SALA_TECNICOS, salaUsuario(solicitud.solicitante_id)], 'compra:actualizada', solicitud);

    res.json({ ok: true, datos: solicitud });
  }));

/** Paso 2: TI da el visto bueno tecnico y la eleva a Gerencia. */
comprasRouter.put('/:id/aprobar-ti', requierePermiso('compras.revisar'), validate(revisionSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    exigirEstado(actual, ['Solicitada', 'En revision']);

    const { observacion_ti, monto_estimado, proveedor_sugerido } = req.body;
    await query(
      `UPDATE solicitudes_compra
          SET estado = 'Aprobada por TI',
              revisado_por_id = COALESCE(revisado_por_id, $1),
              fecha_revision = COALESCE(fecha_revision, CURRENT_TIMESTAMP),
              observacion_ti = COALESCE($2, observacion_ti),
              monto_estimado = COALESCE($3, monto_estimado),
              proveedor_sugerido = COALESCE($4, proveedor_sugerido)
        WHERE id = $5`,
      [req.usuario.id, observacion_ti ?? null, monto_estimado ?? null, proveedor_sugerido ?? null, id]
    );
    const solicitud = await obtener(id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: id, accion: 'APROBAR_TI', ip: req.ip
    });

    // El aviso viaja a quienes deben aprobar el presupuesto
    const { rows: aprobadores } = await query(
      `SELECT DISTINCT u.id FROM usuarios u
         JOIN rol_permisos rp ON rp.rol_id = u.rol_id
         JOIN permisos p      ON p.id = rp.permiso_id
        WHERE p.codigo = 'compras.aprobar' AND u.activo = TRUE`
    );
    for (const { id: destinatario } of aprobadores) {
      await notificarUsuario({
        usuarioId: destinatario, tipo: 'COMPRA_ESPERA_GERENCIA',
        titulo: 'Solicitud ' + codigoCompra(id) + ' pendiente de aprobacion',
        mensaje: `TI aprobo tecnicamente: ${solicitud.titulo}. Monto estimado: ${solicitud.monto_estimado ?? 'sin cotizar'}.`
      });
    }
    await notificarUsuario({
      usuarioId: solicitud.solicitante_id, tipo: 'COMPRA_APROBADA_TI',
      titulo: 'Su solicitud ' + codigoCompra(id) + ' paso a Gerencia',
      mensaje: 'TI aprobo la viabilidad tecnica. Queda pendiente la aprobacion presupuestaria.'
    });
    emitir([SALA_TECNICOS, salaUsuario(solicitud.solicitante_id)], 'compra:actualizada', solicitud);

    res.json({ ok: true, datos: solicitud });
  }));

/** Paso 3: Gerencia aprueba el presupuesto. */
comprasRouter.put('/:id/aprobar-gerencia', requierePermiso('compras.aprobar'), validate(gerenciaSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    exigirEstado(actual, ['Aprobada por TI']);

    await query(
      `UPDATE solicitudes_compra
          SET estado = 'Aprobada por Gerencia', aprobado_por_id = $1,
              fecha_aprobacion = CURRENT_TIMESTAMP, observacion_gerencia = $2
        WHERE id = $3`,
      [req.usuario.id, req.body.observacion_gerencia ?? null, id]
    );
    const solicitud = await obtener(id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: id, accion: 'APROBAR_GERENCIA', ip: req.ip
    });
    await notificarUsuario({
      usuarioId: solicitud.solicitante_id, tipo: 'COMPRA_APROBADA',
      titulo: 'Su solicitud ' + codigoCompra(id) + ' fue aprobada',
      mensaje: `${req.usuario.nombre} aprobo la compra. TI procedera con la adquisicion.`
    });
    await notificarEquipoTecnico({
      tipo: 'COMPRA_APROBADA',
      titulo: 'Compra aprobada ' + codigoCompra(id),
      mensaje: `Gerencia aprobo: ${solicitud.titulo}. Corresponde ejecutar la compra.`,
      excluirUsuarioId: req.usuario.id
    });
    emitir([SALA_TECNICOS, salaUsuario(solicitud.solicitante_id)], 'compra:actualizada', solicitud);

    res.json({ ok: true, datos: solicitud });
  }));

/** Rechazo, admitido en cualquier instancia previa a la compra. */
comprasRouter.put('/:id/rechazar', requierePermiso('compras.revisar', 'compras.aprobar'),
  validate(rechazoSchema), asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    exigirEstado(actual, ['Solicitada', 'En revision', 'Aprobada por TI']);

    await query(
      `UPDATE solicitudes_compra
          SET estado = 'Rechazada', rechazado_por_id = $1,
              fecha_rechazo = CURRENT_TIMESTAMP, motivo_rechazo = $2
        WHERE id = $3`,
      [req.usuario.id, req.body.motivo_rechazo, id]
    );
    const solicitud = await obtener(id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: id, accion: 'RECHAZAR',
      detalle: { motivo: req.body.motivo_rechazo.slice(0, 300) }, ip: req.ip
    });
    await notificarUsuario({
      usuarioId: solicitud.solicitante_id, tipo: 'COMPRA_RECHAZADA',
      titulo: 'Su solicitud ' + codigoCompra(id) + ' fue rechazada',
      mensaje: req.body.motivo_rechazo.slice(0, 200)
    });
    emitir([SALA_TECNICOS, salaUsuario(solicitud.solicitante_id)], 'compra:actualizada', solicitud);

    res.json({ ok: true, datos: solicitud });
  }));

/** Paso 4: se registra la compra ejecutada. */
comprasRouter.put('/:id/comprar', requierePermiso('compras.gestionar'), validate(compraSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    exigirEstado(actual, ['Aprobada por Gerencia']);

    await query(
      `UPDATE solicitudes_compra
          SET estado = 'Comprada', comprado_por_id = $1, fecha_compra = CURRENT_TIMESTAMP,
              numero_orden = $2, monto_final = $3
        WHERE id = $4`,
      [req.usuario.id, req.body.numero_orden ?? null, req.body.monto_final ?? null, id]
    );
    const solicitud = await obtener(id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: id, accion: 'REGISTRAR_COMPRA',
      detalle: { numero_orden: req.body.numero_orden, monto_final: req.body.monto_final }, ip: req.ip
    });
    await notificarUsuario({
      usuarioId: solicitud.solicitante_id, tipo: 'COMPRA_EJECUTADA',
      titulo: 'Se compro el equipo de la solicitud ' + codigoCompra(id),
      mensaje: 'El equipo fue adquirido y sera entregado en breve.'
    });
    emitir([SALA_TECNICOS, salaUsuario(solicitud.solicitante_id)], 'compra:actualizada', solicitud);

    res.json({ ok: true, datos: solicitud });
  }));

/** Paso 5: entrega al solicitante, con vinculo opcional al equipo dado de alta. */
comprasRouter.put('/:id/entregar', requierePermiso('compras.gestionar'), validate(entregaSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const actual = await obtener(id);
    exigirEstado(actual, ['Comprada']);

    const { equipo_id } = req.body;
    if (equipo_id) {
      const { rows } = await query('SELECT id FROM equipos WHERE id = $1', [equipo_id]);
      if (!rows[0]) throw HttpError.badRequest('El equipo indicado no existe en el parque');
    }

    await query(
      `UPDATE solicitudes_compra
          SET estado = 'Entregada', entregado_por_id = $1, fecha_entrega = CURRENT_TIMESTAMP, equipo_id = $2
        WHERE id = $3`,
      [req.usuario.id, equipo_id ?? null, id]
    );
    const solicitud = await obtener(id);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: id, accion: 'ENTREGAR',
      detalle: { equipo_id: equipo_id ?? null }, ip: req.ip
    });
    await notificarUsuario({
      usuarioId: solicitud.solicitante_id, tipo: 'COMPRA_ENTREGADA',
      titulo: 'Equipo entregado - solicitud ' + codigoCompra(id),
      mensaje: 'Su equipo fue entregado. La solicitud queda cerrada.'
    });
    emitir([SALA_TECNICOS, salaUsuario(solicitud.solicitante_id)], 'compra:actualizada', solicitud);

    res.json({ ok: true, datos: solicitud });
  }));

/** Reporte consolidado del modulo. */
comprasRouter.get('/reporte/pdf', requierePermiso('compras.ver_todas'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_SOLICITUD} ORDER BY c.fecha_creacion DESC LIMIT 2000`);
  const { rows: resumen } = await query(
    `SELECT COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE estado = 'Solicitada')::int AS solicitadas,
            COUNT(*) FILTER (WHERE estado = 'Aprobada por TI')::int AS esperando_gerencia,
            COUNT(*) FILTER (WHERE estado = 'Entregada')::int AS entregadas,
            COUNT(*) FILTER (WHERE estado = 'Rechazada')::int AS rechazadas,
            COALESCE(SUM(monto_final) FILTER (WHERE estado IN ('Comprada','Entregada')), 0)::float AS monto_ejecutado
       FROM solicitudes_compra`
  );
  const buffer = await construirReporteCompras({ filas: rows, resumen: resumen[0] }).aBuffer();
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_COMPRAS_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="solicitudes-de-compra.pdf"');
  res.send(buffer);
}));

/** Ficha individual con toda la trazabilidad del flujo. */
comprasRouter.get('/:id/pdf', requierePermiso('compras.ver_todas', 'compras.solicitar'),
  asyncHandler(async (req, res) => {
    const solicitud = await obtener(req.params.id);
    if (!visible(solicitud, req.usuario)) {
      throw HttpError.forbidden('Solo puede descargar las solicitudes que usted registro');
    }
    const buffer = await construirFichaCompra({ solicitud }).aBuffer();
    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'COMPRA', entidadId: solicitud.id,
      accion: 'DESCARGAR_FICHA_PDF', ip: req.ip
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${codigoCompra(solicitud.id)}.pdf"`);
    res.send(buffer);
  }));
