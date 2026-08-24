DO $$
DECLARE
    id_vieja INT;
    id_nueva INT;
BEGIN
    SELECT id INTO id_vieja FROM areas WHERE nombre = 'Tecnologias de la Informacion';
    IF id_vieja IS NULL THEN
        RETURN;
    END IF;

    SELECT id INTO id_nueva FROM areas WHERE nombre = 'Sistemas';

    IF id_nueva IS NULL THEN
        UPDATE areas SET nombre = 'Sistemas' WHERE id = id_vieja;
        RETURN;
    END IF;

    UPDATE usuarios SET area_id = id_nueva WHERE area_id = id_vieja;
    UPDATE equipos  SET area_id = id_nueva WHERE area_id = id_vieja;
    UPDATE solicitudes_compra   SET area_id = id_nueva WHERE area_id = id_vieja;
    UPDATE solicitudes_proyecto SET area_id = id_nueva WHERE area_id = id_vieja;

    DELETE FROM areas WHERE id = id_vieja;
END $$;
