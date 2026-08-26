UPDATE categorias
   SET descripcion = REPLACE(descripcion, 'contrasenas', 'contraseñas')
 WHERE descripcion LIKE '%contrasenas%';

UPDATE categorias
   SET descripcion = REPLACE(descripcion, 'contrasena', 'contraseña')
 WHERE descripcion LIKE '%contrasena%';

UPDATE permisos
   SET descripcion = REPLACE(descripcion, 'contrasena', 'contraseña')
 WHERE descripcion LIKE '%contrasena%';

UPDATE permisos
   SET descripcion = REPLACE(descripcion, 'Contrasena', 'Contraseña')
 WHERE descripcion LIKE '%Contrasena%';
