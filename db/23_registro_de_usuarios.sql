ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprobado        BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS registrado_solo BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS aprobado_por_id INT REFERENCES usuarios(id);
ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS fecha_aprobacion TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_usuarios_aprobado ON usuarios (aprobado) WHERE aprobado = FALSE;

INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('admin.aprobar_cuentas', 'Permite aprobar o rechazar las cuentas que se registran solas.', 'ADMIN')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permisos p
 WHERE r.nombre = 'admin'
   AND p.codigo = 'admin.aprobar_cuentas'
ON CONFLICT DO NOTHING;
