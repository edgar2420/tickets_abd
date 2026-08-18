-- =====================================================================
-- SEED DATA - Sistema de Gestion de Tickets TI (STD-2026-TI)
-- Autor: Ing. Edgar Rojas Apaza - Desarrollo de Modulo de Tickets
-- Credencial inicial: usuario "admin" / password "Admin123*"
-- =====================================================================

-- AREAS EMPRESARIALES
INSERT INTO areas (nombre) VALUES
    ('Tecnologias de la Informacion'),
    ('Recursos Humanos'),
    ('Contabilidad'),
    ('Operaciones'),
    ('Comercial'),
    ('Gerencia')
ON CONFLICT (nombre) DO NOTHING;

-- ROLES
INSERT INTO roles (nombre, descripcion) VALUES
    ('admin',      'Administrador del sistema con acceso total a mantenimiento y tickets'),
    ('tecnico_l1', 'Tecnico de soporte nivel 1: atiende y resuelve tickets'),
    ('tecnico_l2', 'Tecnico de soporte nivel 2: escalamiento y resolucion'),
    ('cliente',    'Usuario solicitante: crea y consulta sus propios tickets')
ON CONFLICT (nombre) DO NOTHING;

-- DICCIONARIO DE PERMISOS ATOMICOS
INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('tickets.crear',       'Permite crear nuevas solicitudes de soporte.',                 'TICKETS'),
    ('tickets.ver_propios', 'Permite visualizar los tickets creados por el propio usuario.', 'TICKETS'),
    ('tickets.ver_todos',   'Permite visualizar el listado completo de tickets del sistema.','TICKETS'),
    ('tickets.responder',   'Permite asignarse un ticket y cambiar su estado a En Proceso.', 'TICKETS'),
    ('tickets.resolver',    'Permite cerrar/resolver un ticket e ingresar la solucion tecnica.','TICKETS'),
    ('admin.usuarios',      'Gestion CRUD de usuarios (Crear, editar, activar/desactivar).', 'ADMIN'),
    ('admin.roles',         'Gestion CRUD de roles y matriz de permisos.',                   'ADMIN'),
    ('admin.areas',         'Gestion de catalogo de areas de la empresa.',                   'ADMIN'),
    ('reportes.ver',        'Permite consultar el tablero de indicadores y reportes.',       'REPORTES'),
    ('reportes.exportar',   'Permite exportar reportes y documentacion en formato PDF.',     'REPORTES')
ON CONFLICT (codigo) DO NOTHING;

-- MATRIZ ROL-PERMISO: admin => todos los permisos
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin'
ON CONFLICT DO NOTHING;

-- MATRIZ ROL-PERMISO: tecnico_l1 y tecnico_l2
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo IN
    ('tickets.crear','tickets.ver_propios','tickets.ver_todos','tickets.responder',
     'tickets.resolver','reportes.ver','reportes.exportar')
WHERE r.nombre IN ('tecnico_l1','tecnico_l2')
ON CONFLICT DO NOTHING;

-- MATRIZ ROL-PERMISO: cliente
INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo IN
    ('tickets.crear','tickets.ver_propios')
WHERE r.nombre = 'cliente'
ON CONFLICT DO NOTHING;

-- USUARIO ADMINISTRADOR INICIAL
INSERT INTO usuarios (nombre, usuario, email, password_hash, area_id, rol_id)
SELECT 'Ing. Edgar Rojas Apaza', 'admin', 'admin@empresa.local',
       '$2a$10$7DtpEtEY/IhC4J0N2fXBMOtuWcci28SZ9orB8oRhZeNT9aHnuGx12',
       (SELECT id FROM areas WHERE nombre = 'Tecnologias de la Informacion'),
       (SELECT id FROM roles WHERE nombre = 'admin')
WHERE NOT EXISTS (SELECT 1 FROM usuarios WHERE usuario = 'admin');
