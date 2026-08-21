CREATE TABLE IF NOT EXISTS areas (
    id              SERIAL PRIMARY KEY,
    nombre          VARCHAR(100) NOT NULL UNIQUE,
    activo          BOOLEAN DEFAULT TRUE,
    fecha_creacion  TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS roles (
    id          SERIAL PRIMARY KEY,
    nombre      VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    activo      BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS permisos (
    id          SERIAL PRIMARY KEY,
    codigo      VARCHAR(100) NOT NULL UNIQUE,
    descripcion VARCHAR(255) NOT NULL,
    modulo      VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS rol_permisos (
    rol_id     INT REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id INT REFERENCES permisos(id) ON DELETE CASCADE,
    PRIMARY KEY (rol_id, permiso_id)
);

CREATE TABLE IF NOT EXISTS usuarios (
    id             SERIAL PRIMARY KEY,
    nombre         VARCHAR(150) NOT NULL,
    usuario        VARCHAR(80) NOT NULL UNIQUE,
    email          VARCHAR(150) UNIQUE,
    password_hash  VARCHAR(255) NOT NULL,
    area_id        INT NOT NULL REFERENCES areas(id),
    rol_id         INT NOT NULL REFERENCES roles(id),
    activo         BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS tickets (
    id               SERIAL PRIMARY KEY,
    titulo           VARCHAR(200) NOT NULL,
    descripcion      TEXT NOT NULL,
    categoria        VARCHAR(50) NOT NULL,
    prioridad        VARCHAR(20) DEFAULT 'Media',
    estado           VARCHAR(20) DEFAULT 'Abierto',

    solicitante_id   INT NOT NULL REFERENCES usuarios(id),
    asignado_id      INT REFERENCES usuarios(id),
    resuelto_por_id  INT REFERENCES usuarios(id),

    solucion_detalle TEXT,
    fecha_creacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_asignacion TIMESTAMP,
    fecha_resolucion TIMESTAMP
);

CREATE TABLE IF NOT EXISTS auditoria (
    id          SERIAL PRIMARY KEY,
    usuario_id  INT REFERENCES usuarios(id),
    entidad     VARCHAR(50)  NOT NULL,
    entidad_id  INT,
    accion      VARCHAR(60)  NOT NULL,
    detalle     JSONB,
    ip          VARCHAR(64),
    fecha       TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS notificaciones (
    id           SERIAL PRIMARY KEY,
    usuario_id   INT NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    ticket_id    INT REFERENCES tickets(id) ON DELETE CASCADE,
    tipo         VARCHAR(50) NOT NULL,
    titulo       VARCHAR(150) NOT NULL,
    mensaje      TEXT NOT NULL,
    leida        BOOLEAN DEFAULT FALSE,
    fecha        TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tickets_estado        ON tickets(estado);
CREATE INDEX IF NOT EXISTS idx_tickets_solicitante   ON tickets(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_tickets_asignado      ON tickets(asignado_id);
CREATE INDEX IF NOT EXISTS idx_tickets_fecha         ON tickets(fecha_creacion DESC);
CREATE INDEX IF NOT EXISTS idx_usuarios_area         ON usuarios(area_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha       ON auditoria(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_notif_usuario_leida   ON notificaciones(usuario_id, leida);

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_estado;
ALTER TABLE tickets ADD  CONSTRAINT chk_tickets_estado
    CHECK (estado IN ('Abierto','En Proceso','Resuelto','Cerrado'));

ALTER TABLE tickets DROP CONSTRAINT IF EXISTS chk_tickets_prioridad;
ALTER TABLE tickets ADD  CONSTRAINT chk_tickets_prioridad
    CHECK (prioridad IN ('Baja','Media','Alta','Critica'));
