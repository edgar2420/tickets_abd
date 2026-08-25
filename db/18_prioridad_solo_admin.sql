INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('tickets.priorizar', 'Permite definir la prioridad y el objetivo de atencion de un ticket.', 'tickets'),
    ('compras.priorizar', 'Permite definir la prioridad de una solicitud de compra.', 'compras')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id
  FROM roles r
  CROSS JOIN permisos p
 WHERE r.nombre = 'admin'
   AND p.codigo IN ('tickets.priorizar', 'compras.priorizar')
ON CONFLICT DO NOTHING;

DELETE FROM rol_permisos
 WHERE permiso_id IN (SELECT id FROM permisos WHERE codigo IN ('tickets.priorizar', 'compras.priorizar'))
   AND rol_id NOT IN (SELECT id FROM roles WHERE nombre = 'admin');

UPDATE solicitudes_compra SET prioridad = 'Media'
 WHERE estado IN ('Solicitada', 'En revision')
   AND prioridad <> 'Media';
