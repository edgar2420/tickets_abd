ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_ticket_tipo;
DROP INDEX IF EXISTS idx_tickets_tipo;
ALTER TABLE tickets DROP COLUMN IF EXISTS tipo;

ALTER TABLE equipos ADD COLUMN IF NOT EXISTS frecuencia_mantenimiento VARCHAR(20);
ALTER TABLE equipos ADD COLUMN IF NOT EXISTS ultimo_mantenimiento     DATE;

ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipo_frecuencia;
ALTER TABLE equipos ADD CONSTRAINT chk_equipo_frecuencia
    CHECK (frecuencia_mantenimiento IS NULL
           OR frecuencia_mantenimiento IN ('Mensual', 'Trimestral', 'Semestral', 'Anual'));

CREATE INDEX IF NOT EXISTS idx_equipos_frecuencia ON equipos (frecuencia_mantenimiento);

CREATE TABLE IF NOT EXISTS mantenimientos (
    id                SERIAL PRIMARY KEY,
    equipo_id         INT NOT NULL REFERENCES equipos(id) ON DELETE CASCADE,
    fecha             DATE NOT NULL DEFAULT CURRENT_DATE,
    realizado_por_id  INT REFERENCES usuarios(id),
    ticket_id         INT REFERENCES tickets(id) ON DELETE SET NULL,
    observaciones     VARCHAR(1000),
    fecha_registro    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mantenimientos_equipo ON mantenimientos (equipo_id, fecha DESC);

INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('mantenimiento.ver',      'Permite consultar el plan de mantenimiento preventivo de los equipos.', 'mantenimiento'),
    ('mantenimiento.gestionar','Permite fijar la frecuencia y registrar el mantenimiento realizado.',   'mantenimiento')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permisos p
 WHERE r.nombre IN ('admin', 'tecnico_l1', 'tecnico_l2')
   AND p.codigo IN ('mantenimiento.ver', 'mantenimiento.gestionar')
ON CONFLICT DO NOTHING;
