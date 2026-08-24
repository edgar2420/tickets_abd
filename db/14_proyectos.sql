CREATE TABLE IF NOT EXISTS solicitudes_proyecto (
    id                  SERIAL PRIMARY KEY,
    titulo              VARCHAR(200) NOT NULL,
    tipo                VARCHAR(40)  NOT NULL DEFAULT 'Mejora',

    problema            TEXT NOT NULL,
    situacion_actual    TEXT NOT NULL,
    propuesta           TEXT NOT NULL,
    beneficio           TEXT NOT NULL,

    personas_afectadas  INT NOT NULL DEFAULT 1,
    frecuencia          VARCHAR(30) NOT NULL DEFAULT 'Semanal',
    urgencia            VARCHAR(20) NOT NULL DEFAULT 'Media',
    sistemas_actuales   VARCHAR(300),

    estado              VARCHAR(30) NOT NULL DEFAULT 'Recibida',

    solicitante_id      INT NOT NULL REFERENCES usuarios(id),
    sucursal_id         INT REFERENCES sucursales(id),
    area_id             INT REFERENCES areas(id),

    evaluado_por_id     INT REFERENCES usuarios(id),
    fecha_evaluacion    TIMESTAMP,
    evaluacion_ti       VARCHAR(1000),
    esfuerzo_estimado   VARCHAR(20),
    valor_estimado      VARCHAR(20),

    aprobado_por_id     INT REFERENCES usuarios(id),
    fecha_aprobacion    TIMESTAMP,
    observacion_aprobacion VARCHAR(500),

    responsable_id      INT REFERENCES usuarios(id),
    fecha_inicio        TIMESTAMP,
    fecha_entrega       TIMESTAMP,
    avance              INT NOT NULL DEFAULT 0,

    rechazado_por_id    INT REFERENCES usuarios(id),
    fecha_rechazo       TIMESTAMP,
    motivo_rechazo      VARCHAR(500),

    fecha_creacion      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_proyectos_estado ON solicitudes_proyecto (estado);
CREATE INDEX IF NOT EXISTS idx_proyectos_solicitante ON solicitudes_proyecto (solicitante_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_fecha ON solicitudes_proyecto (fecha_creacion);

INSERT INTO permisos (codigo, modulo, descripcion) VALUES
    ('proyectos.solicitar', 'Proyectos', 'Registrar peticiones de mejora o software nuevo'),
    ('proyectos.ver_todas', 'Proyectos', 'Consultar todas las peticiones de proyecto'),
    ('proyectos.evaluar',   'Proyectos', 'Evaluar la viabilidad tecnica de una peticion'),
    ('proyectos.gestionar', 'Proyectos', 'Aprobar, asignar y dar seguimiento a los proyectos')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r CROSS JOIN permisos p
 WHERE p.codigo = 'proyectos.solicitar'
   AND r.nombre IN ('admin', 'gerencia', 'cliente', 'tecnico_l1', 'tecnico_l2')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r CROSS JOIN permisos p
 WHERE p.codigo IN ('proyectos.ver_todas', 'proyectos.evaluar')
   AND r.nombre IN ('admin', 'tecnico_l2')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r CROSS JOIN permisos p
 WHERE p.codigo = 'proyectos.gestionar'
   AND r.nombre = 'admin'
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r CROSS JOIN permisos p
 WHERE p.codigo = 'proyectos.ver_todas'
   AND r.nombre = 'gerencia'
ON CONFLICT DO NOTHING;
