-- =====================================================================
-- LA SEDE DE SANTA CRUZ ES LA FABRICA
-- La casa central del grupo es la planta industrial donde opera el
-- sistema, de modo que se nombra y clasifica como tal.
-- =====================================================================

ALTER TABLE sucursales DROP CONSTRAINT IF EXISTS chk_sucursal_tipo;
ALTER TABLE sucursales ADD  CONSTRAINT chk_sucursal_tipo
    CHECK (tipo IN ('Fabrica','Casa Central','Sucursal','Planta','Oficina','Deposito'));

UPDATE sucursales
   SET nombre = 'Fabrica Santa Cruz',
       tipo   = 'Fabrica',
       ciudad = COALESCE(ciudad, 'Santa Cruz')
 WHERE codigo = 'SCZ';
