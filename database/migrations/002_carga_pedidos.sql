-- Datos nuevos obligatorios por API; columnas nullable conservan histórico sin inventar datos.
ALTER TABLE clientes ADD COLUMN apellido VARCHAR(100) NULL, ADD COLUMN dni VARCHAR(20) NULL;
CREATE INDEX idx_clientes_dni ON clientes(dni);
ALTER TABLE direcciones ADD COLUMN piso_depto VARCHAR(100) NULL;
-- La clave se comparte por todas las repeticiones del mismo envío HTTP.
ALTER TABLE pedidos ADD COLUMN clave_creacion CHAR(36) CHARACTER SET ascii COLLATE ascii_bin NULL,
    ADD COLUMN hash_creacion CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NULL,
    ADD UNIQUE INDEX idx_pedidos_clave_creacion (clave_creacion);
