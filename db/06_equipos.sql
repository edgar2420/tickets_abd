-- =====================================================================
-- MODULO DE EQUIPOS DE LA EMPRESA
-- Parque informatico con su asignacion, caracteristicas tecnicas y
-- datos de acceso remoto. La contrasena de AnyDesk se guarda cifrada.
-- =====================================================================

CREATE TABLE IF NOT EXISTS equipos (
    id                  SERIAL PRIMARY KEY,
    codigo              VARCHAR(40)  NOT NULL UNIQUE,
    nombre_equipo       VARCHAR(100) NOT NULL,
    tipo                VARCHAR(30)  NOT NULL DEFAULT 'Escritorio',
    marca               VARCHAR(60),
    modelo              VARCHAR(80),
    numero_serie        VARCHAR(80),

    -- Caracteristicas tecnicas
    sistema_operativo   VARCHAR(80),
    procesador          VARCHAR(100),
    ram_gb              INT,
    almacenamiento      VARCHAR(80),

    -- Conectividad
    direccion_ip        VARCHAR(45),
    direccion_mac       VARCHAR(17),

    -- Acceso remoto (la contrasena se almacena cifrada, nunca en claro)
    anydesk_id          VARCHAR(40),
    anydesk_password    TEXT,

    -- Asignacion y situacion
    usuario_id          INT REFERENCES usuarios(id) ON DELETE SET NULL,
    area_id             INT REFERENCES areas(id),
    ubicacion           VARCHAR(120),
    estado              VARCHAR(30) NOT NULL DEFAULT 'Operativo',
    observaciones       VARCHAR(500),

    fecha_asignacion    DATE,
    activo              BOOLEAN DEFAULT TRUE,
    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipo_tipo;
ALTER TABLE equipos ADD  CONSTRAINT chk_equipo_tipo
    CHECK (tipo IN ('Escritorio','Laptop','Servidor','Impresora','Monitor','Red','Otro'));

ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipo_estado;
ALTER TABLE equipos ADD  CONSTRAINT chk_equipo_estado
    CHECK (estado IN ('Operativo','En reparacion','En resguardo','De baja'));

ALTER TABLE equipos DROP CONSTRAINT IF EXISTS chk_equipo_ram;
ALTER TABLE equipos ADD  CONSTRAINT chk_equipo_ram
    CHECK (ram_gb IS NULL OR (ram_gb > 0 AND ram_gb <= 2048));

CREATE INDEX IF NOT EXISTS idx_equipos_usuario ON equipos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_equipos_area    ON equipos(area_id);
CREATE INDEX IF NOT EXISTS idx_equipos_estado  ON equipos(estado);

-- PERMISOS ATOMICOS DEL MODULO
INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('equipos.ver',          'Consultar el parque de equipos y sus caracteristicas.',        'EQUIPOS'),
    ('equipos.gestionar',    'Alta, edicion y baja de equipos y su asignacion.',             'EQUIPOS'),
    ('equipos.credenciales', 'Revelar la contrasena de acceso remoto de un equipo.',         'EQUIPOS')
ON CONFLICT (codigo) DO NOTHING;

-- El administrador recibe el modulo completo
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin' AND p.modulo = 'EQUIPOS'
ON CONFLICT DO NOTHING;

-- Los tecnicos consultan y usan el acceso remoto para dar soporte
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo IN ('equipos.ver','equipos.credenciales')
WHERE r.nombre IN ('tecnico_l1','tecnico_l2')
ON CONFLICT DO NOTHING;

-- El tecnico de segundo nivel ademas administra el parque
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo = 'equipos.gestionar'
WHERE r.nombre = 'tecnico_l2'
ON CONFLICT DO NOTHING;
