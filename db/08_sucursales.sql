CREATE TABLE IF NOT EXISTS sucursales (
    id             SERIAL PRIMARY KEY,
    codigo         VARCHAR(10)  NOT NULL UNIQUE,
    nombre         VARCHAR(100) NOT NULL UNIQUE,
    ciudad         VARCHAR(80),
    tipo           VARCHAR(30) NOT NULL DEFAULT 'Sucursal',
    direccion      VARCHAR(200),
    activo         BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE sucursales DROP CONSTRAINT IF EXISTS chk_sucursal_tipo;
ALTER TABLE sucursales ADD  CONSTRAINT chk_sucursal_tipo
    CHECK (tipo IN ('Fabrica','Casa Central','Sucursal','Planta','Oficina','Deposito'));

INSERT INTO sucursales (codigo, nombre, ciudad, tipo) VALUES
    ('SCZ',  'Fabrica Santa Cruz',           'Santa Cruz',  'Fabrica'),
    ('SILO', 'Silos Central de Insumos',     'Santa Cruz',  'Planta'),
    ('LP',   'Sucursal La Paz',              'La Paz',      'Sucursal'),
    ('CBBA', 'Sucursal Cochabamba',          'Cochabamba',  'Sucursal'),
    ('SRE',  'Sucursal Sucre',               'Sucre',       'Sucursal'),
    ('ORU',  'Sucursal Oruro',               'Oruro',       'Sucursal')
ON CONFLICT (codigo) DO NOTHING;

ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS sucursal_id INT REFERENCES sucursales(id);
ALTER TABLE tickets  ADD COLUMN IF NOT EXISTS sucursal_id INT REFERENCES sucursales(id);
ALTER TABLE equipos  ADD COLUMN IF NOT EXISTS sucursal_id INT REFERENCES sucursales(id);

UPDATE usuarios SET sucursal_id = (SELECT id FROM sucursales WHERE codigo = 'SCZ')
 WHERE sucursal_id IS NULL;
UPDATE equipos  SET sucursal_id = (SELECT id FROM sucursales WHERE codigo = 'SCZ')
 WHERE sucursal_id IS NULL;

UPDATE tickets t SET sucursal_id = u.sucursal_id
  FROM usuarios u
 WHERE u.id = t.solicitante_id AND t.sucursal_id IS NULL;

ALTER TABLE usuarios ALTER COLUMN sucursal_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_usuarios_sucursal ON usuarios(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_tickets_sucursal  ON tickets(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_equipos_sucursal  ON equipos(sucursal_id);

INSERT INTO permisos (codigo, descripcion, modulo)
VALUES ('admin.sucursales', 'Gestion del catalogo de sucursales de la empresa.', 'ADMIN')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin' AND p.codigo = 'admin.sucursales'
ON CONFLICT DO NOTHING;
