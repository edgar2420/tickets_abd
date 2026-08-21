import { Router } from 'express';
import { z } from 'zod';
import { query, withTransaction } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarEquipoTecnico } from '../../services/notificaciones.service.js';
import { emitir, SALA_TECNICOS } from '../../realtime/socket.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { construirReporteInventario, construirKardex } from '../../services/pdf/documentos.service.js';

const TIPOS = ['Equipo', 'Consumible', 'Repuesto', 'Licencia', 'Accesorio'];
const ESTADOS = ['Disponible', 'En reparacion', 'En resguardo', 'De baja'];
const TIPOS_MOVIMIENTO = ['Entrada', 'Salida', 'Ajuste'];

const articuloSchema = z.object({
  codigo: z.string().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/, 'Solo letras, numeros, punto, guion y guion bajo'),
  nombre: z.string().min(3).max(150),
  descripcion: z.string().max(255).optional().nullable(),
  tipo: z.enum(TIPOS).default('Equipo'),
  unidad: z.string().min(1).max(20).default('Unidad'),
  stock_minimo: z.number().int().min(0).default(0),
  ubicacion: z.string().max(100).optional().nullable(),
  estado: z.enum(ESTADOS).default('Disponible'),
  activo: z.boolean().optional()
});

const estadoSchema = z.object({
  estado: z.enum(ESTADOS),
  motivo: z.string().max(255).optional().nullable()
});

const movimientoSchema = z.object({
  tipo: z.enum(TIPOS_MOVIMIENTO),
  cantidad: z.number().int().positive('La cantidad debe ser mayor a cero'),
  motivo: z.string().max(255).optional().nullable(),
  ticket_id: z.number().int().positive().optional().nullable()
});

const SELECT_ARTICULO = `
  SELECT a.id, a.codigo, a.nombre, a.descripcion, a.tipo, a.unidad,
         a.stock_actual, a.stock_minimo, a.ubicacion, a.estado, a.activo, a.fecha_creacion,
         (a.stock_actual <= a.stock_minimo) AS bajo_minimo,
         (SELECT MAX(m.fecha) FROM inventario_movimientos m WHERE m.articulo_id = a.id) AS ultimo_movimiento
    FROM inventario_articulos a`;

export const inventarioRouter = Router();
inventarioRouter.use(autenticar);

inventarioRouter.get('/resumen', requierePermiso('inventario.ver'), asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT
        COUNT(*) FILTER (WHERE activo)::int                                   AS articulos,
        COALESCE(SUM(stock_actual) FILTER (WHERE activo), 0)::int             AS unidades,
        COUNT(*) FILTER (WHERE activo AND stock_actual <= stock_minimo)::int  AS bajo_minimo,
        COUNT(*) FILTER (WHERE activo AND stock_actual = 0)::int              AS agotados
       FROM inventario_articulos`
  );
  const { rows: movimientos } = await query(
    `SELECT
        COUNT(*) FILTER (WHERE tipo = 'Entrada' AND fecha >= CURRENT_DATE - INTERVAL '30 days')::int AS entradas_mes,
        COUNT(*) FILTER (WHERE tipo = 'Salida'  AND fecha >= CURRENT_DATE - INTERVAL '30 days')::int AS salidas_mes
       FROM inventario_movimientos`
  );
  res.json({ ok: true, datos: { ...rows[0], ...movimientos[0] } });
}));

inventarioRouter.get('/articulos', requierePermiso('inventario.ver'), asyncHandler(async (req, res) => {
  const { limite, pagina, desplazamiento } = paginacion(req.query);
  const { busqueda = null, tipo = null, estado = null, activo = null, solo_criticos = null } = req.query;
  const criticos = solo_criticos === 'true';

  const condiciones = `
     WHERE ($1::text IS NULL OR a.nombre ILIKE '%' || $1 || '%' OR a.codigo ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR a.tipo = $2)
       AND ($3::bool IS NULL OR a.activo = $3)
       AND ($4 = FALSE OR a.stock_actual <= a.stock_minimo)
       AND ($5::text IS NULL OR a.estado = $5)`;
  const parametros = [busqueda, tipo, activo === null ? null : activo === 'true', criticos, estado];

  const { rows: total } = await query(
    `SELECT COUNT(*)::int AS total FROM inventario_articulos a ${condiciones}`, parametros
  );
  const { rows } = await query(
    `${SELECT_ARTICULO} ${condiciones}
      ORDER BY (a.stock_actual <= a.stock_minimo) DESC, a.nombre
      LIMIT $6 OFFSET $7`,
    [...parametros, limite, desplazamiento]
  );
  res.json(respuestaPaginada(rows, total[0].total, limite, pagina));
}));

inventarioRouter.get('/articulos/:id', requierePermiso('inventario.ver'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('El articulo indicado no existe');
  res.json({ ok: true, datos: rows[0] });
}));

inventarioRouter.post('/articulos', requierePermiso('inventario.articulos'), validate(articuloSchema),
  asyncHandler(async (req, res) => {
    const { codigo, nombre, descripcion, tipo, unidad, stock_minimo, ubicacion, estado } = req.body;
    const { rows } = await query(
      `INSERT INTO inventario_articulos (codigo, nombre, descripcion, tipo, unidad, stock_minimo, ubicacion, estado)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      [codigo.toUpperCase(), nombre, descripcion ?? null, tipo, unidad, stock_minimo, ubicacion ?? null, estado]
    );
    const { rows: creado } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [rows[0].id]);
    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'INVENTARIO', entidadId: rows[0].id,
      accion: 'CREAR_ARTICULO', detalle: creado[0], ip: req.ip
    });
    res.status(201).json({ ok: true, datos: creado[0] });
  }));

inventarioRouter.put('/articulos/:id', requierePermiso('inventario.articulos'), validate(articuloSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { codigo, nombre, descripcion, tipo, unidad, stock_minimo, ubicacion, estado, activo } = req.body;
    const { rowCount } = await query(
      `UPDATE inventario_articulos
          SET codigo = $1, nombre = $2, descripcion = $3, tipo = $4, unidad = $5,
              stock_minimo = $6, ubicacion = $7, estado = $8, activo = COALESCE($9::boolean, activo)
        WHERE id = $10`,
      [codigo.toUpperCase(), nombre, descripcion ?? null, tipo, unidad, stock_minimo,
        ubicacion ?? null, estado, activo ?? null, id]
    );
    if (!rowCount) throw HttpError.notFound('El articulo indicado no existe');
    const { rows } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [id]);
    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'INVENTARIO', entidadId: id,
      accion: 'ACTUALIZAR_ARTICULO', detalle: rows[0], ip: req.ip
    });
    res.json({ ok: true, datos: rows[0] });
  }));

inventarioRouter.delete('/articulos/:id', requierePermiso('inventario.articulos'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE inventario_articulos SET activo = FALSE, estado = 'De baja' WHERE id = $1 RETURNING id, nombre`,
    [req.params.id]
  );
  if (!rows[0]) throw HttpError.notFound('El articulo indicado no existe');
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'INVENTARIO', entidadId: rows[0].id,
    accion: 'DESACTIVAR_ARTICULO', ip: req.ip
  });
  res.json({ ok: true, mensaje: 'Articulo desactivado' });
}));

inventarioRouter.put('/articulos/:id/activar', requierePermiso('inventario.articulos'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    'UPDATE inventario_articulos SET activo = TRUE WHERE id = $1 RETURNING id', [req.params.id]
  );
  if (!rows[0]) throw HttpError.notFound('El articulo indicado no existe');
  const { rows: articulo } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [rows[0].id]);
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'INVENTARIO', entidadId: rows[0].id, accion: 'ACTIVAR_ARTICULO', ip: req.ip
  });
  res.json({ ok: true, datos: articulo[0] });
}));

inventarioRouter.put('/articulos/:id/estado', requierePermiso('inventario.articulos'), validate(estadoSchema),
  asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    const { estado, motivo } = req.body;
    const { rows: previa } = await query('SELECT estado, nombre FROM inventario_articulos WHERE id = $1', [id]);
    if (!previa[0]) throw HttpError.notFound('El articulo indicado no existe');

    await query(
      `UPDATE inventario_articulos
          SET estado = $1::varchar,
              activo = ($1::varchar <> 'De baja')
        WHERE id = $2`,
      [estado, id]
    );
    const { rows } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [id]);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'INVENTARIO', entidadId: id, accion: 'CAMBIAR_ESTADO',
      detalle: { anterior: previa[0].estado, nuevo: estado, motivo: motivo ?? null }, ip: req.ip
    });
    res.json({ ok: true, datos: rows[0] });
  }));

const SELECT_MOVIMIENTO = `
  SELECT m.id, m.tipo, m.cantidad, m.stock_anterior, m.stock_resultante, m.motivo,
         m.ticket_id, m.fecha,
         m.articulo_id, a.codigo AS articulo_codigo, a.nombre AS articulo_nombre, a.unidad,
         u.nombre AS usuario_nombre
    FROM inventario_movimientos m
    JOIN inventario_articulos a ON a.id = m.articulo_id
    JOIN usuarios u             ON u.id = m.usuario_id`;

inventarioRouter.get('/movimientos', requierePermiso('inventario.ver'), asyncHandler(async (req, res) => {
  const { limite, pagina, desplazamiento } = paginacion(req.query);
  const { articulo_id = null, tipo = null, desde = null, hasta = null } = req.query;

  const condiciones = `
     WHERE ($1::int IS NULL OR m.articulo_id = $1)
       AND ($2::text IS NULL OR m.tipo = $2)
       AND ($3::timestamp IS NULL OR m.fecha >= $3)
       AND ($4::timestamp IS NULL OR m.fecha <= $4)`;
  const parametros = [articulo_id, tipo, desde, hasta];

  const { rows: total } = await query(
    `SELECT COUNT(*)::int AS total FROM inventario_movimientos m ${condiciones}`, parametros
  );
  const { rows } = await query(
    `${SELECT_MOVIMIENTO} ${condiciones} ORDER BY m.fecha DESC, m.id DESC LIMIT $5 OFFSET $6`,
    [...parametros, limite, desplazamiento]
  );
  res.json(respuestaPaginada(rows, total[0].total, limite, pagina));
}));

inventarioRouter.post('/articulos/:id/movimientos', requierePermiso('inventario.movimientos'),
  validate(movimientoSchema), asyncHandler(async (req, res) => {
    const articuloId = Number(req.params.id);
    const { tipo, cantidad, motivo, ticket_id } = req.body;

    const resultado = await withTransaction(async (client) => {
      const { rows: articulos } = await client.query(
        'SELECT id, nombre, stock_actual, stock_minimo, activo FROM inventario_articulos WHERE id = $1 FOR UPDATE',
        [articuloId]
      );
      const articulo = articulos[0];
      if (!articulo) throw HttpError.notFound('El articulo indicado no existe');
      if (!articulo.activo) throw HttpError.conflict('El articulo esta desactivado: no admite movimientos');

      const anterior = articulo.stock_actual;
      const resultanteBruto = tipo === 'Salida' ? anterior - cantidad
        : tipo === 'Entrada' ? anterior + cantidad
          : cantidad;

      if (resultanteBruto < 0) {
        throw HttpError.conflict(
          `Stock insuficiente: hay ${anterior} unidades y se intentan retirar ${cantidad}`
        );
      }

      if (ticket_id) {
        const { rows: ticket } = await client.query('SELECT id FROM tickets WHERE id = $1', [ticket_id]);
        if (!ticket[0]) throw HttpError.badRequest('El ticket referenciado no existe');
      }

      await client.query('UPDATE inventario_articulos SET stock_actual = $1 WHERE id = $2', [resultanteBruto, articuloId]);
      const { rows } = await client.query(
        `INSERT INTO inventario_movimientos
           (articulo_id, tipo, cantidad, stock_anterior, stock_resultante, motivo, ticket_id, usuario_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
        [articuloId, tipo, cantidad, anterior, resultanteBruto, motivo ?? null, ticket_id ?? null, req.usuario.id]
      );
      return { movimientoId: rows[0].id, articulo, anterior, resultante: resultanteBruto };
    });

    const { rows } = await query(`${SELECT_MOVIMIENTO} WHERE m.id = $1`, [resultado.movimientoId]);
    const { rows: articuloActualizado } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [articuloId]);

    await registrarAuditoria({
      usuarioId: req.usuario.id, entidad: 'INVENTARIO', entidadId: articuloId,
      accion: `MOVIMIENTO_${tipo.toUpperCase()}`,
      detalle: { cantidad, anterior: resultado.anterior, resultante: resultado.resultante, motivo }, ip: req.ip
    });

    emitir(SALA_TECNICOS, 'inventario:movimiento', {
      articulo: articuloActualizado[0], movimiento: rows[0]
    });

    if (articuloActualizado[0].bajo_minimo && resultado.anterior > resultado.articulo.stock_minimo) {
      await notificarEquipoTecnico({
        tipo: 'INVENTARIO_MINIMO',
        titulo: 'Stock bajo minimo: ' + resultado.articulo.nombre,
        mensaje: `Quedan ${resultado.resultante} unidades (minimo ${resultado.articulo.stock_minimo}).`,
        excluirUsuarioId: null
      });
    }

    res.status(201).json({ ok: true, datos: { movimiento: rows[0], articulo: articuloActualizado[0] } });
  }));

inventarioRouter.get('/reporte/pdf', requierePermiso('inventario.ver'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_ARTICULO} WHERE a.activo = TRUE ORDER BY a.nombre`);
  const { rows: resumen } = await query(
    `SELECT COUNT(*) FILTER (WHERE activo)::int AS articulos,
            COALESCE(SUM(stock_actual) FILTER (WHERE activo), 0)::int AS unidades,
            COUNT(*) FILTER (WHERE activo AND stock_actual <= stock_minimo)::int AS bajo_minimo,
            COUNT(*) FILTER (WHERE activo AND stock_actual = 0)::int AS agotados
       FROM inventario_articulos`
  );
  const buffer = await construirReporteInventario({ filas: rows, resumen: resumen[0] }).aBuffer();
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_INVENTARIO_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="inventario.pdf"');
  res.send(buffer);
}));

inventarioRouter.get('/articulos/:id/kardex/pdf', requierePermiso('inventario.ver'), asyncHandler(async (req, res) => {
  const { rows: articulo } = await query(`${SELECT_ARTICULO} WHERE a.id = $1`, [req.params.id]);
  if (!articulo[0]) throw HttpError.notFound('El articulo indicado no existe');
  const { rows: movimientos } = await query(
    `${SELECT_MOVIMIENTO} WHERE m.articulo_id = $1 ORDER BY m.fecha DESC LIMIT 500`, [req.params.id]
  );
  const buffer = await construirKardex({ articulo: articulo[0], movimientos }).aBuffer();
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'REPORTE', entidadId: Number(req.params.id),
    accion: 'EXPORTAR_KARDEX_PDF', ip: req.ip
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="kardex-${articulo[0].codigo}.pdf"`);
  res.send(buffer);
}));
