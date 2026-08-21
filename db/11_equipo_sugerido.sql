-- =====================================================================
-- La revision tecnica sugiere un equipo, no un proveedor
--
-- Elegir a quien se le compra es una decision comercial, no tecnica.
-- El campo que TI completa pasa a describir que maquina recomienda, que es
-- lo que si le corresponde evaluar. Se conserva el mismo espacio en la
-- tabla para no dejar una columna muerta.
--
-- Autor: Ing. Edgar Rojas Apaza - Desarrollo de Modulo de Tickets
-- =====================================================================

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

        -- Lo que habia guardado eran nombres de proveedor: no describen un
        -- equipo y mostrarlos bajo el rotulo nuevo seria enganoso.
        UPDATE solicitudes_compra SET equipo_sugerido = NULL;
    END IF;
END $$;

ALTER TABLE solicitudes_compra ADD COLUMN IF NOT EXISTS equipo_sugerido VARCHAR(200);
