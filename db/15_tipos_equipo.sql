ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipo_tipo;

UPDATE equipos SET tipo = 'PC' WHERE tipo = 'Escritorio';
UPDATE equipos SET tipo = 'Switch' WHERE tipo = 'Red';

ALTER TABLE equipos ADD CONSTRAINT chk_equipo_tipo
    CHECK (tipo IN (
        'Servidor', 'PC', 'Laptop', 'Switch', 'Router', 'Telefonia',
        'Camara', 'Impresora', 'Monitor', 'UPS', 'Otro'
    ));

ALTER TABLE equipos ALTER COLUMN tipo SET DEFAULT 'PC';

ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipo_codigo;
ALTER TABLE equipos ADD CONSTRAINT chk_equipo_codigo
    CHECK (codigo ~ '^[A-Z]{2,4}-[A-Z0-9]{2,10}-[0-9]{3}$');

ALTER TABLE equipos ADD COLUMN IF NOT EXISTS ubicacion_codigo VARCHAR(10);

UPDATE equipos
   SET ubicacion_codigo = split_part(codigo, '-', 2)
 WHERE ubicacion_codigo IS NULL AND codigo LIKE '%-%-%';

CREATE INDEX IF NOT EXISTS idx_equipos_tipo ON equipos (tipo);
CREATE INDEX IF NOT EXISTS idx_equipos_ubicacion_codigo ON equipos (ubicacion_codigo);
