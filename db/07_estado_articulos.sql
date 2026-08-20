-- =====================================================================
-- SITUACION DEL ARTICULO DE INVENTARIO
-- El saldo indica cuanto hay; el estado indica en que condicion se
-- encuentra el articulo (disponible, en reparacion, resguardado o de baja).
-- =====================================================================

ALTER TABLE inventario_articulos
    ADD COLUMN IF NOT EXISTS estado VARCHAR(30) NOT NULL DEFAULT 'Disponible';

ALTER TABLE inventario_articulos DROP CONSTRAINT IF EXISTS chk_articulo_estado;
ALTER TABLE inventario_articulos ADD  CONSTRAINT chk_articulo_estado
    CHECK (estado IN ('Disponible','En reparacion','En resguardo','De baja'));

CREATE INDEX IF NOT EXISTS idx_articulos_estado ON inventario_articulos(estado);

-- Los articulos ya desactivados quedan reflejados como dados de baja
UPDATE inventario_articulos SET estado = 'De baja' WHERE activo = FALSE AND estado = 'Disponible';
