DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'solicitudes_compra' AND column_name = 'proveedor_sugerido'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
         WHERE table_name = 'solicitudes_compra' AND column_name = 'equipo_sugerido'
    ) THEN
        ALTER TABLE solicitudes_compra RENAME COLUMN proveedor_sugerido TO equipo_sugerido;
        ALTER TABLE solicitudes_compra ALTER COLUMN equipo_sugerido TYPE VARCHAR(200);

        UPDATE solicitudes_compra SET equipo_sugerido = NULL;
    END IF;
END $$;

ALTER TABLE solicitudes_compra ADD COLUMN IF NOT EXISTS equipo_sugerido VARCHAR(200);
