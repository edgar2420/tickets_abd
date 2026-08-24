ALTER TABLE tickets ADD COLUMN IF NOT EXISTS anio                INT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS numero              INT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS tipo                VARCHAR(30)  NOT NULL DEFAULT 'Incidente';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS servicio            VARCHAR(40)  NOT NULL DEFAULT 'Soporte informatico';
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS ubicacion           VARCHAR(120);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS equipo_id           INT REFERENCES equipos(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS minutos_empleados   INT;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS observaciones       VARCHAR(1000);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_objetivo      TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_inicio        TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_espera        TIMESTAMP;
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS motivo_espera       VARCHAR(300);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS prioridad_por_id    INT REFERENCES usuarios(id);
ALTER TABLE tickets ADD COLUMN IF NOT EXISTS fecha_prioridad     TIMESTAMP;

UPDATE tickets SET anio = EXTRACT(YEAR FROM fecha_creacion)::int WHERE anio IS NULL;

WITH numerados AS (
  SELECT id, ROW_NUMBER() OVER (PARTITION BY anio ORDER BY fecha_creacion, id) AS orden
    FROM tickets
   WHERE numero IS NULL
)
UPDATE tickets t SET numero = n.orden FROM numerados n WHERE t.id = n.id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_tickets_anio_numero ON tickets (anio, numero);

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_ticket_estado;
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_estado;
UPDATE tickets SET estado = 'Nuevo' WHERE estado = 'Abierto';
ALTER TABLE tickets ADD CONSTRAINT chk_ticket_estado
    CHECK (estado IN ('Nuevo', 'Asignado', 'En Proceso', 'En Espera', 'Resuelto', 'Cerrado'));
ALTER TABLE tickets ALTER COLUMN estado SET DEFAULT 'Nuevo';

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_ticket_tipo;
ALTER TABLE tickets ADD CONSTRAINT chk_ticket_tipo
    CHECK (tipo IN ('Incidente', 'Requerimiento', 'Mantenimiento', 'Desarrollo'));

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_ticket_servicio;
ALTER TABLE tickets ADD CONSTRAINT chk_ticket_servicio
    CHECK (servicio IN (
        'Soporte informatico', 'Redes', 'Telefonia', 'CCTV', 'Servidores',
        'IBS', 'Desarrollo', 'Mantenimiento', 'Proyectos', 'Gestion tecnologica'
    ));

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_ticket_minutos;
ALTER TABLE tickets ADD CONSTRAINT chk_ticket_minutos
    CHECK (minutos_empleados IS NULL OR (minutos_empleados >= 0 AND minutos_empleados <= 100000));

CREATE INDEX IF NOT EXISTS idx_tickets_tipo ON tickets (tipo);
CREATE INDEX IF NOT EXISTS idx_tickets_servicio ON tickets (servicio);
CREATE INDEX IF NOT EXISTS idx_tickets_objetivo ON tickets (fecha_objetivo);
CREATE INDEX IF NOT EXISTS idx_tickets_equipo ON tickets (equipo_id);

INSERT INTO categorias (nombre, descripcion, color, icono, activo) VALUES
    ('PC',           'Computadoras de escritorio, laptops, perifericos e impresoras', 'celeste',  'monitor',   TRUE),
    ('Red',          'Internet, LAN, Wi-Fi, switches, cableado y puntos de red',      'violeta',  'red',       TRUE),
    ('Camara',       'Camaras, NVR, DVR, grabacion y cableado de CCTV',               'esmeralda','camara',    TRUE),
    ('Telefonia',    'Telefonos, extensiones, central y puntos telefonicos',          'ambar',    'telefono',  TRUE),
    ('IBS',          'Incidentes, consultas, reportes y modulos del sistema IBS',     'rosa',     'engranaje', TRUE),
    ('Servidores',   'Servidores, Oracle, Windows Server, hardware y respaldos',      'pizarra',  'servidor',  TRUE),
    ('Software',     'Sistemas de escritorio, licencias y aplicaciones',              'celeste',  'documento', TRUE),
    ('Accesos',      'Altas, bajas y permisos de usuario',                            'violeta',  'escudo',    TRUE)
ON CONFLICT (nombre) DO NOTHING;

UPDATE categorias SET activo = FALSE
 WHERE nombre IN ('Hardware', 'Redes')
   AND NOT EXISTS (SELECT 1 FROM tickets t WHERE t.categoria = categorias.nombre);
