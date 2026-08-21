CREATE TABLE IF NOT EXISTS categorias (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(50) NOT NULL UNIQUE,
    descripcion    VARCHAR(255),
    color          VARCHAR(20) NOT NULL DEFAULT 'pizarra',
    icono          VARCHAR(40) NOT NULL DEFAULT 'etiqueta',
    activo         BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_categoria;

INSERT INTO categorias (nombre, descripcion, color, icono) VALUES
    ('Hardware', 'Equipos y componentes fisicos: computadoras, impresoras, monitores, teclados y escaneres que no encienden, fallan o estan danados.', 'ambar',    'monitor'),
    ('Software', 'Programas y sistemas: instalacion de aplicaciones, errores al ejecutarlas, licencias, ofimatica y sistema operativo.',               'violeta',  'codigo'),
    ('Redes',    'Conectividad y comunicaciones: sin internet, wifi intermitente, cableado, telefonia IP y enlaces entre oficinas.',                    'celeste',  'red'),
    ('Accesos',  'Cuentas y permisos: alta o baja de usuarios, restablecimiento de contrasenas y acceso a carpetas compartidas o sistemas.',            'esmeralda','llave')
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO permisos (codigo, descripcion, modulo)
VALUES ('admin.categorias', 'Gestion del catalogo de categorias de tickets.', 'ADMIN')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin' AND p.codigo = 'admin.categorias'
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_tickets_categoria ON tickets(categoria);
