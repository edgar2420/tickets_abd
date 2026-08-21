import { Router } from 'express';
import { z } from 'zod';
import { query } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { requierePermiso } from '../../middleware/rbac.js';
import { validate } from '../../middleware/validate.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { paginacion, respuestaPaginada } from '../../utils/paginacion.js';
import { cifrar, descifrar } from '../../utils/cifrado.js';
import { construirReporteEquipos, construirFichaEquipo } from '../../services/pdf/documentos.service.js';

const TIPOS = ['Escritorio', 'Laptop', 'Servidor', 'Impresora', 'Monitor', 'Red', 'Otro'];
const ESTADOS = ['Operativo', 'En reparacion', 'En resguardo', 'De baja'];

const opcional = (esquema) => esquema.optional().nullable().or(z.literal(''));

const equipoSchema = z.object({
  codigo: z.string().min(2).max(40).regex(/^[A-Za-z0-9._-]+$/, 'Solo letras, numeros, punto, guion y guion bajo'),
  nombre_equipo: z.string().min(2).max(100),
  tipo: z.enum(TIPOS).default('Escritorio'),
  marca: opcional(z.string().max(60)),
  modelo: opcional(z.string().max(80)),
  numero_serie: opcional(z.string().max(80)),
  sistema_operativo: opcional(z.string().max(80)),
  procesador: opcional(z.string().max(100)),
  ram_gb: z.number().int().positive().max(2048).optional().nullable(),
  almacenamiento: opcional(z.string().max(80)),
  direccion_ip: opcional(z.string().ip({ version: 'v4' }).or(z.string().ip({ version: 'v6' }))),
  direccion_mac: opcional(z.string().regex(/^([0-9A-Fa-f]{2}[:-]){5}[0-9A-Fa-f]{2}$/, 'Formato MAC invalido')),
  anydesk_id: opcional(z.string().max(40)),
  anydesk_password: opcional(z.string().max(200)),
  usuario_id: z.number().int().positive().optional().nullable(),
  area_id: z.number().int().positive().optional().nullable(),
  sucursal_id: z.number().int().positive().optional().nullable(),
  ubicacion: opcional(z.string().max(120)),
  estado: z.enum(ESTADOS).default('Operativo'),
  observaciones: opcional(z.string().max(500)),
  fecha_asignacion: opcional(z.string().max(10)),
  activo: z.boolean().optional()
});

const vacioANulo = (valor) => (valor === '' || valor === undefined ? null : valor);

const SELECT_EQUIPO = `
  SELECT e.id, e.codigo, e.nombre_equipo, e.tipo, e.marca, e.modelo, e.numero_serie,
         e.sistema_operativo, e.procesador, e.ram_gb, e.almacenamiento,
         e.direccion_ip, e.direccion_mac, e.anydesk_id,
         (e.anydesk_password IS NOT NULL) AS tiene_password,
         e.usuario_id, u.nombre AS usuario_nombre,
         e.area_id, a.nombre AS area_nombre,
         e.sucursal_id, s.nombre AS sucursal_nombre, s.codigo AS sucursal_codigo,
         e.ubicacion, e.estado, e.observaciones, e.fecha_asignacion, e.activo, e.fecha_creacion
    FROM equipos e
    LEFT JOIN usuarios u ON u.id = e.usuario_id
    LEFT JOIN areas    a ON a.id = e.area_id
    LEFT JOIN sucursales s ON s.id = e.sucursal_id`;

export const equiposRouter = Router();
equiposRouter.use(autenticar);

equiposRouter.get('/resumen', requierePermiso('equipos.ver'), asyncHandler(async (_req, res) => {
  const { rows } = await query(
    `SELECT
        COUNT(*) FILTER (WHERE activo)::int                              AS total,
        COUNT(*) FILTER (WHERE activo AND estado = 'Operativo')::int     AS operativos,
        COUNT(*) FILTER (WHERE activo AND estado = 'En reparacion')::int AS en_reparacion,
        COUNT(*) FILTER (WHERE activo AND usuario_id IS NULL)::int       AS sin_asignar,
        COUNT(*) FILTER (WHERE activo AND anydesk_id IS NOT NULL)::int   AS con_acceso_remoto
       FROM equipos`
  );
  res.json({ ok: true, datos: rows[0] });
}));

equiposRouter.get('/', requierePermiso('equipos.ver'), asyncHandler(async (req, res) => {
  const { limite, pagina, desplazamiento } = paginacion(req.query);
  const { busqueda = null, tipo = null, estado = null, area_id = null, usuario_id = null,
    activo = null, sucursal_id = null } = req.query;

  const condiciones = `
     WHERE ($1::text IS NULL OR e.nombre_equipo ILIKE '%' || $1 || '%' OR e.codigo ILIKE '%' || $1 || '%'
            OR e.direccion_ip ILIKE '%' || $1 || '%' OR u.nombre ILIKE '%' || $1 || '%')
       AND ($2::text IS NULL OR e.tipo = $2)
       AND ($3::text IS NULL OR e.estado = $3)
       AND ($4::int  IS NULL OR e.area_id = $4)
       AND ($5::int  IS NULL OR e.usuario_id = $5)
       AND ($6::bool IS NULL OR e.activo = $6)
       AND ($7::int  IS NULL OR e.sucursal_id = $7)`;
  const parametros = [busqueda, tipo, estado, area_id, usuario_id,
    activo === null ? null : activo === 'true', sucursal_id];

  const { rows: total } = await query(
    `SELECT COUNT(*)::int AS total FROM equipos e LEFT JOIN usuarios u ON u.id = e.usuario_id ${condiciones}`,
    parametros
  );
  const { rows } = await query(
    `${SELECT_EQUIPO} ${condiciones} ORDER BY e.codigo LIMIT $8 OFFSET $9`,
    [...parametros, limite, desplazamiento]
  );
  res.json(respuestaPaginada(rows, total[0].total, limite, pagina));
}));

equiposRouter.get('/:id', requierePermiso('equipos.ver'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_EQUIPO} WHERE e.id = $1`, [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('El equipo indicado no existe');
  res.json({ ok: true, datos: rows[0] });
}));

equiposRouter.get('/:id/credenciales', requierePermiso('equipos.credenciales'), asyncHandler(async (req, res) => {
  const { rows } = await query('SELECT codigo, anydesk_id, anydesk_password FROM equipos WHERE id = $1', [req.params.id]);
  const equipo = rows[0];
  if (!equipo) throw HttpError.notFound('El equipo indicado no existe');
  if (!equipo.anydesk_password) throw HttpError.notFound('El equipo no tiene contrasena de acceso remoto registrada');

  const password = descifrar(equipo.anydesk_password);
  if (password === null) {
    throw new HttpError(500, 'La contrasena almacenada no pudo descifrarse. Registrela nuevamente.');
  }

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'EQUIPO', entidadId: Number(req.params.id),
    accion: 'REVELAR_CREDENCIAL', detalle: { codigo: equipo.codigo }, ip: req.ip
  });

  res.json({ ok: true, datos: { anydesk_id: equipo.anydesk_id, password } });
}));

equiposRouter.post('/', requierePermiso('equipos.gestionar'), validate(equipoSchema), asyncHandler(async (req, res) => {
  const c = req.body;
  const { rows } = await query(
    `INSERT INTO equipos (codigo, nombre_equipo, tipo, marca, modelo, numero_serie,
                          sistema_operativo, procesador, ram_gb, almacenamiento,
                          direccion_ip, direccion_mac, anydesk_id, anydesk_password,
                          usuario_id, area_id, sucursal_id, ubicacion, estado, observaciones, fecha_asignacion)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21)
     RETURNING id`,
    [
      c.codigo.toUpperCase(), c.nombre_equipo, c.tipo, vacioANulo(c.marca), vacioANulo(c.modelo),
      vacioANulo(c.numero_serie), vacioANulo(c.sistema_operativo), vacioANulo(c.procesador),
      c.ram_gb ?? null, vacioANulo(c.almacenamiento), vacioANulo(c.direccion_ip), vacioANulo(c.direccion_mac),
      vacioANulo(c.anydesk_id), cifrar(vacioANulo(c.anydesk_password)),
      c.usuario_id ?? null, c.area_id ?? null, c.sucursal_id ?? null, vacioANulo(c.ubicacion), c.estado,
      vacioANulo(c.observaciones), vacioANulo(c.fecha_asignacion)
    ]
  );
  const { rows: creado } = await query(`${SELECT_EQUIPO} WHERE e.id = $1`, [rows[0].id]);
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'EQUIPO', entidadId: rows[0].id,
    accion: 'CREAR', detalle: { codigo: creado[0].codigo, nombre: creado[0].nombre_equipo }, ip: req.ip
  });
  res.status(201).json({ ok: true, datos: creado[0] });
}));

equiposRouter.put('/:id', requierePermiso('equipos.gestionar'), validate(equipoSchema), asyncHandler(async (req, res) => {
  const id = Number(req.params.id);
  const c = req.body;
  const nueva = vacioANulo(c.anydesk_password);

  const { rowCount } = await query(
    `UPDATE equipos SET
        codigo = $1, nombre_equipo = $2, tipo = $3, marca = $4, modelo = $5, numero_serie = $6,
        sistema_operativo = $7, procesador = $8, ram_gb = $9, almacenamiento = $10,
        direccion_ip = $11, direccion_mac = $12, anydesk_id = $13,
        anydesk_password = COALESCE($14::text, anydesk_password),
        usuario_id = $15, area_id = $16, sucursal_id = $17, ubicacion = $18, estado = $19,
        observaciones = $20, fecha_asignacion = $21, activo = COALESCE($22::boolean, activo)
      WHERE id = $23`,
    [
      c.codigo.toUpperCase(), c.nombre_equipo, c.tipo, vacioANulo(c.marca), vacioANulo(c.modelo),
      vacioANulo(c.numero_serie), vacioANulo(c.sistema_operativo), vacioANulo(c.procesador),
      c.ram_gb ?? null, vacioANulo(c.almacenamiento), vacioANulo(c.direccion_ip), vacioANulo(c.direccion_mac),
      vacioANulo(c.anydesk_id), nueva ? cifrar(nueva) : null,
      c.usuario_id ?? null, c.area_id ?? null, c.sucursal_id ?? null, vacioANulo(c.ubicacion), c.estado,
      vacioANulo(c.observaciones), vacioANulo(c.fecha_asignacion), c.activo ?? null, id
    ]
  );
  if (!rowCount) throw HttpError.notFound('El equipo indicado no existe');

  const { rows } = await query(`${SELECT_EQUIPO} WHERE e.id = $1`, [id]);
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'EQUIPO', entidadId: id, accion: 'ACTUALIZAR',
    detalle: { codigo: rows[0].codigo, password_actualizada: Boolean(nueva) }, ip: req.ip
  });
  res.json({ ok: true, datos: rows[0] });
}));

equiposRouter.delete('/:id', requierePermiso('equipos.gestionar'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE equipos SET activo = FALSE, estado = 'De baja' WHERE id = $1 RETURNING id, codigo`,
    [req.params.id]
  );
  if (!rows[0]) throw HttpError.notFound('El equipo indicado no existe');
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'EQUIPO', entidadId: rows[0].id,
    accion: 'DAR_DE_BAJA', detalle: { codigo: rows[0].codigo }, ip: req.ip
  });
  res.json({ ok: true, mensaje: 'Equipo dado de baja' });
}));

equiposRouter.put('/:id/activar', requierePermiso('equipos.gestionar'), asyncHandler(async (req, res) => {
  const { rows } = await query(
    `UPDATE equipos SET activo = TRUE, estado = 'Operativo' WHERE id = $1 RETURNING id`,
    [req.params.id]
  );
  if (!rows[0]) throw HttpError.notFound('El equipo indicado no existe');
  const { rows: equipo } = await query(`${SELECT_EQUIPO} WHERE e.id = $1`, [rows[0].id]);
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'EQUIPO', entidadId: rows[0].id, accion: 'REACTIVAR', ip: req.ip
  });
  res.json({ ok: true, datos: equipo[0] });
}));

equiposRouter.get('/reporte/pdf', requierePermiso('equipos.ver'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_EQUIPO} WHERE e.activo = TRUE ORDER BY e.codigo`);
  const { rows: resumen } = await query(
    `SELECT COUNT(*) FILTER (WHERE activo)::int AS total,
            COUNT(*) FILTER (WHERE activo AND estado = 'Operativo')::int AS operativos,
            COUNT(*) FILTER (WHERE activo AND estado = 'En reparacion')::int AS en_reparacion,
            COUNT(*) FILTER (WHERE activo AND usuario_id IS NULL)::int AS sin_asignar
       FROM equipos`
  );
  const buffer = await construirReporteEquipos({ filas: rows, resumen: resumen[0] }).aBuffer();
  await registrarAuditoria({ usuarioId: req.usuario.id, entidad: 'REPORTE', accion: 'EXPORTAR_EQUIPOS_PDF', ip: req.ip });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', 'attachment; filename="parque-de-equipos.pdf"');
  res.send(buffer);
}));

equiposRouter.get('/:id/ficha/pdf', requierePermiso('equipos.ver'), asyncHandler(async (req, res) => {
  const { rows } = await query(`${SELECT_EQUIPO} WHERE e.id = $1`, [req.params.id]);
  if (!rows[0]) throw HttpError.notFound('El equipo indicado no existe');
  const buffer = await construirFichaEquipo({ equipo: rows[0] }).aBuffer();
  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'REPORTE', entidadId: Number(req.params.id),
    accion: 'EXPORTAR_FICHA_EQUIPO_PDF', ip: req.ip
  });
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="equipo-${rows[0].codigo}.pdf"`);
  res.send(buffer);
}));
