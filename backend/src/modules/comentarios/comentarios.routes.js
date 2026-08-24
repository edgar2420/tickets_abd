import { Router } from 'express';
import multer from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { existsSync, mkdirSync, createReadStream } from 'node:fs';
import { unlink } from 'node:fs/promises';
import { query, withTransaction } from '../../config/db.js';
import { autenticar } from '../../middleware/auth.js';
import { sinCache } from '../../middleware/cache.js';
import { asyncHandler, HttpError } from '../../utils/httpError.js';
import { registrarAuditoria } from '../../services/auditoria.service.js';
import { notificarUsuario } from '../../services/notificaciones.service.js';
import { emitir, salaTicket, salaUsuario, SALA_TECNICOS } from '../../realtime/socket.js';
import { obtenerTicket } from '../tickets/tickets.service.js';
import { codigoTicket } from '../../services/pdf/documentos.service.js';

const DIRECTORIO = path.resolve(process.cwd(), 'storage/adjuntos');
const TIPOS_PERMITIDOS = ['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'application/pdf'];
const TAMANO_MAXIMO = 5 * 1024 * 1024;
const MAXIMO_ARCHIVOS = 5;

if (!existsSync(DIRECTORIO)) mkdirSync(DIRECTORIO, { recursive: true });

const almacenamiento = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, DIRECTORIO),
  filename: (_req, file, cb) => cb(null, `${randomUUID()}${path.extname(file.originalname).toLowerCase()}`)
});

const subida = multer({
  storage: almacenamiento,
  limits: { fileSize: TAMANO_MAXIMO, files: MAXIMO_ARCHIVOS },
  fileFilter: (_req, file, cb) => {
    if (!TIPOS_PERMITIDOS.includes(file.mimetype)) {
      return cb(new HttpError(400, `Tipo de archivo no permitido: ${file.mimetype}. Se aceptan imagenes y PDF.`));
    }
    return cb(null, true);
  }
});

const recibirArchivos = (req, res, next) => subida.array('archivos', MAXIMO_ARCHIVOS)(req, res, (error) => {
  if (!error) return next();
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return next(HttpError.badRequest('Cada archivo debe pesar como maximo 5 MB'));
    if (error.code === 'LIMIT_FILE_COUNT') return next(HttpError.badRequest(`Se permiten hasta ${MAXIMO_ARCHIVOS} archivos por mensaje`));
    return next(HttpError.badRequest(`No fue posible recibir el archivo: ${error.message}`));
  }
  return next(error);
});

const ticketVisible = async (ticketId, usuario) => {
  const ticket = await obtenerTicket(ticketId);
  const esPropio = ticket.solicitante_id === usuario.id;
  if (!usuario.permisos.includes('tickets.ver_todos') && !esPropio) {
    throw HttpError.forbidden('Solo puede participar en la conversacion de sus propios tickets');
  }
  return ticket;
};

const SELECT_COMENTARIOS = `
  SELECT c.id, c.mensaje, c.fecha,
         c.usuario_id, u.nombre AS usuario_nombre, r.nombre AS usuario_rol,
         COALESCE(json_agg(json_build_object(
           'id', a.id, 'nombre', a.nombre_original, 'tipo', a.tipo_mime, 'tamano', a.tamano
         ) ORDER BY a.id) FILTER (WHERE a.id IS NOT NULL), '[]') AS adjuntos
    FROM comentarios c
    JOIN usuarios u ON u.id = c.usuario_id
    JOIN roles r    ON r.id = u.rol_id
    LEFT JOIN adjuntos a ON a.comentario_id = c.id
   WHERE c.ticket_id = $1
   GROUP BY c.id, u.nombre, r.nombre
   ORDER BY c.fecha ASC`;

export const comentariosRouter = Router({ mergeParams: true });
comentariosRouter.use(autenticar);

comentariosRouter.get('/', asyncHandler(async (req, res) => {
  await ticketVisible(req.params.id, req.usuario);
  const { rows } = await query(SELECT_COMENTARIOS, [req.params.id]);
  res.json({ ok: true, datos: rows });
}));

comentariosRouter.post('/', recibirArchivos, asyncHandler(async (req, res) => {
  const ticketId = Number(req.params.id);
  const ticket = await ticketVisible(ticketId, req.usuario);
  const mensaje = (req.body.mensaje ?? '').trim();
  const archivos = req.files ?? [];

  if (!mensaje && archivos.length === 0) {
    await Promise.all(archivos.map((a) => unlink(a.path).catch(() => undefined)));
    throw HttpError.badRequest('Escriba un mensaje o adjunte al menos un archivo');
  }

  const comentario = await withTransaction(async (client) => {
    const { rows } = await client.query(
      'INSERT INTO comentarios (ticket_id, usuario_id, mensaje) VALUES ($1,$2,$3) RETURNING id',
      [ticketId, req.usuario.id, mensaje || '(archivo adjunto)']
    );
    const comentarioId = rows[0].id;
    for (const archivo of archivos) {
      await client.query(
        `INSERT INTO adjuntos (ticket_id, comentario_id, usuario_id, nombre_original, nombre_archivo, tipo_mime, tamano)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [ticketId, comentarioId, req.usuario.id, archivo.originalname, archivo.filename, archivo.mimetype, archivo.size]
      );
    }
    return comentarioId;
  });

  const { rows } = await query(`${SELECT_COMENTARIOS.replace('WHERE c.ticket_id = $1', 'WHERE c.id = $1')}`, [comentario]);
  const creado = rows[0];

  await registrarAuditoria({
    usuarioId: req.usuario.id, entidad: 'TICKET', entidadId: ticketId, accion: 'COMENTAR',
    detalle: { adjuntos: archivos.length }, ip: req.ip
  });

  const destinatarios = new Set();
  if (ticket.solicitante_id !== req.usuario.id) destinatarios.add(ticket.solicitante_id);
  if (ticket.asignado_id && ticket.asignado_id !== req.usuario.id) destinatarios.add(ticket.asignado_id);

  for (const destinatario of destinatarios) {
    await notificarUsuario({
      usuarioId: destinatario, ticketId, tipo: 'TICKET_COMENTARIO',
      titulo: `Nuevo mensaje en ${codigoTicket(ticket)}`,
      mensaje: `${req.usuario.nombre}: ${(mensaje || 'Adjunto un archivo').slice(0, 120)}`
    });
  }

  emitir([salaTicket(ticketId), SALA_TECNICOS, salaUsuario(ticket.solicitante_id)],
    'comentario:nuevo', { ticket_id: ticketId, comentario: creado });

  res.status(201).json({ ok: true, datos: creado });
}));

export const adjuntosRouter = Router();
adjuntosRouter.use(autenticar);

adjuntosRouter.get('/:id', sinCache, asyncHandler(async (req, res) => {
  const { rows } = await query(
    'SELECT ticket_id, nombre_original, nombre_archivo, tipo_mime FROM adjuntos WHERE id = $1',
    [req.params.id]
  );
  const adjunto = rows[0];
  if (!adjunto) throw HttpError.notFound('El archivo indicado no existe');

  await ticketVisible(adjunto.ticket_id, req.usuario);

  const ruta = path.join(DIRECTORIO, adjunto.nombre_archivo);
  if (!existsSync(ruta)) throw HttpError.notFound('El archivo ya no se encuentra en el repositorio');

  res.setHeader('Content-Type', adjunto.tipo_mime);
  res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(adjunto.nombre_original)}"`);
  res.setHeader('Cache-Control', 'private, max-age=3600');
  createReadStream(ruta).pipe(res);
}));
