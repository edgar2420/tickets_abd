UPDATE tickets SET servicio = 'Gestion tecnologica'
 WHERE servicio = 'Proyectos';

UPDATE tickets SET servicio = 'Soporte informatico'
 WHERE servicio = 'Gestion tecnologica';

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_ticket_servicio;
ALTER TABLE tickets ADD CONSTRAINT chk_ticket_servicio
    CHECK (servicio IN (
        'Soporte informatico', 'Redes', 'Telefonia', 'CCTV', 'Servidores',
        'IBS', 'Desarrollo', 'Mantenimiento'
    ));
