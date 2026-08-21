-- =====================================================================
-- SOLICITUDES DE COMPRA DE EQUIPOS
-- Flujo propio con doble aprobacion: primero la viabilidad tecnica de
-- TI y luego la aprobacion presupuestaria de Gerencia.
-- =====================================================================

CREATE TABLE IF NOT EXISTS solicitudes_compra (
    id              SERIAL PRIMARY KEY,
    titulo          VARCHAR(200) NOT NULL,
    justificacion   TEXT NOT NULL,
    tipo_equipo     VARCHAR(40)  NOT NULL DEFAULT 'Escritorio',
    cantidad        INT NOT NULL DEFAULT 1,
    especificaciones VARCHAR(500),
    prioridad       VARCHAR(20) NOT NULL DEFAULT 'Media',
    estado          VARCHAR(30) NOT NULL DEFAULT 'Solicitada',

    -- Quien pide
    solicitante_id  INT NOT NULL REFERENCES usuarios(id),
    sucursal_id     INT REFERENCES sucursales(id),
    area_id         INT REFERENCES areas(id),

    -- Revision tecnica de TI
    revisado_por_id     INT REFERENCES usuarios(id),
    fecha_revision      TIMESTAMP,
    observacion_ti      VARCHAR(500),
    monto_estimado      NUMERIC(12,2),
    equipo_sugerido     VARCHAR(200),

    -- Aprobacion presupuestaria de Gerencia
    aprobado_por_id       INT REFERENCES usuarios(id),
    fecha_aprobacion      TIMESTAMP,
    observacion_gerencia  VARCHAR(500),

    -- Rechazo, posible en cualquier instancia previa a la compra
    rechazado_por_id INT REFERENCES usuarios(id),
    fecha_rechazo    TIMESTAMP,
    motivo_rechazo   VARCHAR(500),

    -- Ejecucion y entrega
    comprado_por_id  INT REFERENCES usuarios(id),
    fecha_compra     TIMESTAMP,
    numero_orden     VARCHAR(60),
    monto_final      NUMERIC(12,2),
    entregado_por_id INT REFERENCES usuarios(id),
    fecha_entrega    TIMESTAMP,
    equipo_id        INT REFERENCES equipos(id) ON DELETE SET NULL,

    fecha_creacion   TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE solicitudes_compra DROP CONSTRAINT IF EXISTS chk_compra_estado;
ALTER TABLE solicitudes_compra ADD  CONSTRAINT chk_compra_estado
    CHECK (estado IN ('Solicitada','En revision','Aprobada por TI','Aprobada por Gerencia',
                      'Comprada','Entregada','Rechazada'));

ALTER TABLE solicitudes_compra DROP CONSTRAINT IF EXISTS chk_compra_cantidad;
ALTER TABLE solicitudes_compra ADD  CONSTRAINT chk_compra_cantidad CHECK (cantidad > 0);

ALTER TABLE solicitudes_compra DROP CONSTRAINT IF EXISTS chk_compra_prioridad;
ALTER TABLE solicitudes_compra ADD  CONSTRAINT chk_compra_prioridad
    CHECK (prioridad IN ('Baja','Media','Alta','Critica'));

CREATE INDEX IF NOT EXISTS idx_compras_estado      ON solicitudes_compra(estado);
CREATE INDEX IF NOT EXISTS idx_compras_solicitante ON solicitudes_compra(solicitante_id);
CREATE INDEX IF NOT EXISTS idx_compras_sucursal    ON solicitudes_compra(sucursal_id);
CREATE INDEX IF NOT EXISTS idx_compras_fecha       ON solicitudes_compra(fecha_creacion DESC);

-- PERMISOS ATOMICOS DEL MODULO
INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('compras.solicitar', 'Registrar solicitudes de compra de equipos.',                    'COMPRAS'),
    ('compras.ver_todas', 'Consultar todas las solicitudes de compra del sistema.',         'COMPRAS'),
    ('compras.revisar',   'Revisar la viabilidad tecnica y cotizar la solicitud.',          'COMPRAS'),
    ('compras.aprobar',   'Aprobar o rechazar la solicitud desde Gerencia.',                'COMPRAS'),
    ('compras.gestionar', 'Registrar la compra ejecutada y la entrega al solicitante.',     'COMPRAS')
ON CONFLICT (codigo) DO NOTHING;

-- Rol de Gerencia: aprueba presupuesto y consulta indicadores
INSERT INTO roles (nombre, descripcion)
VALUES ('gerencia', 'Gerencia: aprueba presupuestariamente las compras y consulta indicadores')
ON CONFLICT (nombre) DO NOTHING;

-- El administrador recibe el modulo completo
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin' AND p.modulo = 'COMPRAS'
ON CONFLICT DO NOTHING;

-- El solicitante puede pedir equipos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo = 'compras.solicitar'
WHERE r.nombre = 'cliente'
ON CONFLICT DO NOTHING;

-- TI revisa, cotiza, compra y entrega
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
  ON p.codigo IN ('compras.solicitar','compras.ver_todas','compras.revisar','compras.gestionar')
WHERE r.nombre IN ('tecnico_l1','tecnico_l2')
ON CONFLICT DO NOTHING;

-- Gerencia aprueba el presupuesto y ve el conjunto
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p
  ON p.codigo IN ('compras.solicitar','compras.ver_todas','compras.aprobar','reportes.ver')
WHERE r.nombre = 'gerencia'
ON CONFLICT DO NOTHING;
