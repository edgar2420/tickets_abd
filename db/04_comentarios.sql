-- =====================================================================
-- CONVERSACION Y ADJUNTOS DEL TICKET
-- Permite que solicitante y tecnico intercambien mensajes sobre el
-- requerimiento y acompanen capturas de pantalla del error.
-- =====================================================================

CREATE TABLE IF NOT EXISTS comentarios (
    id         SERIAL PRIMARY KEY,
    ticket_id  INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    mensaje    TEXT NOT NULL,
    fecha      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS adjuntos (
    id              SERIAL PRIMARY KEY,
    ticket_id       INT NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comentario_id   INT REFERENCES comentarios(id) ON DELETE CASCADE,
    usuario_id      INT NOT NULL REFERENCES usuarios(id),
    nombre_original VARCHAR(255) NOT NULL,
    nombre_archivo  VARCHAR(255) NOT NULL UNIQUE,
    tipo_mime       VARCHAR(100) NOT NULL,
    tamano          INT NOT NULL,
    fecha           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_comentarios_ticket ON comentarios(ticket_id, fecha);
CREATE INDEX IF NOT EXISTS idx_adjuntos_ticket    ON adjuntos(ticket_id);
CREATE INDEX IF NOT EXISTS idx_adjuntos_comentario ON adjuntos(comentario_id);
