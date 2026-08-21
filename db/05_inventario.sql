CREATE TABLE IF NOT EXISTS inventario_articulos (
    id             SERIAL PRIMARY KEY,
    codigo         VARCHAR(40)  NOT NULL UNIQUE,
    nombre         VARCHAR(150) NOT NULL,
    descripcion    VARCHAR(255),
    tipo           VARCHAR(40)  NOT NULL DEFAULT 'Equipo',
    unidad         VARCHAR(20)  NOT NULL DEFAULT 'Unidad',
    stock_actual   INT          NOT NULL DEFAULT 0,
    stock_minimo   INT          NOT NULL DEFAULT 0,
    ubicacion      VARCHAR(100),
    activo         BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS inventario_movimientos (
    id               SERIAL PRIMARY KEY,
    articulo_id      INT NOT NULL REFERENCES inventario_articulos(id) ON DELETE CASCADE,
    tipo             VARCHAR(20) NOT NULL,
    cantidad         INT NOT NULL,
    stock_anterior   INT NOT NULL,
    stock_resultante INT NOT NULL,
    motivo           VARCHAR(255),
    ticket_id        INT REFERENCES tickets(id) ON DELETE SET NULL,
    usuario_id       INT NOT NULL REFERENCES usuarios(id),
    fecha            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE inventario_articulos DROP CONSTRAINT IF EXISTS chk_articulo_tipo;
ALTER TABLE inventario_articulos ADD  CONSTRAINT chk_articulo_tipo
    CHECK (tipo IN ('Equipo','Consumible','Repuesto','Licencia','Accesorio'));

ALTER TABLE inventario_articulos DROP CONSTRAINT IF EXISTS chk_articulo_stock;
ALTER TABLE inventario_articulos ADD  CONSTRAINT chk_articulo_stock
    CHECK (stock_actual >= 0 AND stock_minimo >= 0);

ALTER TABLE inventario_movimientos DROP CONSTRAINT IF EXISTS chk_movimiento_tipo;
ALTER TABLE inventario_movimientos ADD  CONSTRAINT chk_movimiento_tipo
    CHECK (tipo IN ('Entrada','Salida','Ajuste'));

ALTER TABLE inventario_movimientos DROP CONSTRAINT IF EXISTS chk_movimiento_cantidad;
ALTER TABLE inventario_movimientos ADD  CONSTRAINT chk_movimiento_cantidad
    CHECK (cantidad > 0);

CREATE INDEX IF NOT EXISTS idx_articulos_activo     ON inventario_articulos(activo);
CREATE INDEX IF NOT EXISTS idx_movimientos_articulo ON inventario_movimientos(articulo_id, fecha DESC);
CREATE INDEX IF NOT EXISTS idx_movimientos_fecha    ON inventario_movimientos(fecha DESC);

INSERT INTO permisos (codigo, descripcion, modulo) VALUES
    ('inventario.ver',         'Consultar el catalogo de articulos y el kardex de movimientos.', 'INVENTARIO'),
    ('inventario.articulos',   'Gestion CRUD de los articulos del inventario.',                  'INVENTARIO'),
    ('inventario.movimientos', 'Registrar entradas y salidas de inventario.',                    'INVENTARIO')
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r CROSS JOIN permisos p
WHERE r.nombre = 'admin' AND p.modulo = 'INVENTARIO'
ON CONFLICT DO NOTHING;

INSERT INTO rol_permisos (rol_id, permiso_id)
SELECT r.id, p.id FROM roles r JOIN permisos p ON p.codigo IN ('inventario.ver','inventario.movimientos')
WHERE r.nombre IN ('tecnico_l1','tecnico_l2')
ON CONFLICT DO NOTHING;
