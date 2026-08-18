-- =====================================================================
-- CATALOGO ADMINISTRABLE DE CATEGORIAS DE TICKET
-- Convierte la categoria en un catalogo mantenible desde el panel de
-- administracion, en lugar de una lista fija en el codigo.
-- =====================================================================

CREATE TABLE IF NOT EXISTS categorias (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(50) NOT NULL UNIQUE,
    descripcion    VARCHAR(255),
    color          VARCHAR(20) NOT NULL DEFAULT 'pizarra',
    icono          VARCHAR(40) NOT NULL DEFAULT 'etiqueta',
    activo         BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- La categoria del ticket deja de validarse contra una lista fija:
-- ahora el backend la contrasta contra este catalogo.
ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_categoria;

INSERT INTO categorias (nombre, descripcion, color, icono) VALUES
    ('Hardware', 'Equipos, perifericos, impresoras y componentes fisicos.', 'ambar',    'monitor'),
    ('Software', 'Aplicaciones, sistemas operativos y licencias.',          'violeta',  'codigo'),
    ('Redes',    'Conectividad, cableado, wifi y enlaces de datos.',        'celeste',  'red'),
    ('Accesos',  'Altas, bajas y permisos sobre sistemas y carpetas.',      'esmeralda','llave')
ON CONFLICT (nombre) DO NOTHING;

-- Permiso atomico para administrar el catalogo
INSERT INTO permisos (codigo, descripcion, modulo)
VALUES ('admin.categorias', 'Gestion del catalogo de categorias de tickets.', 'ADMIN')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin' AND p.codigo = 'admin.categorias'
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tickets_categoria ON tickets(categoria);
