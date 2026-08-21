INSERT INTO permisos (codigo, modulo, descripcion) VALUES
    ('auditoria.ver', 'Auditoria', 'Consultar la bitacora de acciones del sistema')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permisos p
 WHERE p.codigo = 'auditoria.ver'
   AND r.nombre IN ('admin', 'tecnico_l1', 'tecnico_l2')
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permisos p
 WHERE r.nombre = 'gerencia'
   AND p.codigo IN ('tickets.crear', 'tickets.ver_propios')
ON CONFLICT DO NOTHING;

DELETE FROM rol_permisos rp
 USING roles r, permisos p
 WHERE rp.rol_id = r.id
   AND rp.permiso_id = p.id
   AND r.nombre = 'gerencia'
   AND p.codigo = 'auditoria.ver';
