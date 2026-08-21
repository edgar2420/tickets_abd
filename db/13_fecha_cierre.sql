ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_cierre TIMESTAMP;

UPDATE tickets t
   SET fecha_cierre = a.fecha
  FROM (
    SELECT entidad_id, MAX(fecha) AS fecha
      FROM auditoria
     WHERE entidad = 'TICKET' AND accion = 'CERRAR'
     GROUP BY entidad_id
  ) a
 WHERE t.id = a.entidad_id
   AND t.fecha_cierre IS NULL;

UPDATE tickets
   SET fecha_cierre = COALESCE(fecha_resolucion, fecha_creacion)
 WHERE estado = 'Cerrado'
   AND fecha_cierre IS NULL;

CREATE INDEX IF NOT EXISTS idx_tickets_fecha_creacion ON tickets (fecha_creacion);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_resolucion ON tickets (fecha_resolucion);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha_cierre ON tickets (fecha_cierre);
