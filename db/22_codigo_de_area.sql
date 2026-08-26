ALTER TABLE areas ADD COLUMN IF NOT EXISTS codigo VARCHAR(10);

UPDATE areas SET codigo = 'SIS'  WHERE nombre = 'Sistemas'          AND codigo IS NULL;
UPDATE areas SET codigo = 'RRHH' WHERE nombre = 'Recursos Humanos'  AND codigo IS NULL;
UPDATE areas SET codigo = 'CONT' WHERE nombre = 'Contabilidad'      AND codigo IS NULL;
UPDATE areas SET codigo = 'OPE'  WHERE nombre = 'Operaciones'       AND codigo IS NULL;
UPDATE areas SET codigo = 'COM'  WHERE nombre = 'Comercial'         AND codigo IS NULL;
UPDATE areas SET codigo = 'GER'  WHERE nombre = 'Gerencia'          AND codigo IS NULL;

UPDATE areas
   SET codigo = UPPER(REGEXP_REPLACE(SUBSTRING(nombre FROM 1 FOR 4), '[^A-Za-z0-9]', '', 'g'))
 WHERE codigo IS NULL;

UPDATE areas a
   SET codigo = a.codigo || a.id::text
 WHERE EXISTS (
   SELECT 1 FROM areas o WHERE o.codigo = a.codigo AND o.id < a.id
 );

ALTER TABLE areas ALTER COLUMN codigo SET NOT NULL;

ALTER TABLE areas DROP CONSTRAINT IF EXISTS chk_area_codigo;
ALTER TABLE areas ADD CONSTRAINT chk_area_codigo
    CHECK (codigo ~ '^[A-Z0-9]{2,10}$');

CREATE UNIQUE INDEX IF NOT EXISTS idx_areas_codigo ON areas (codigo);
