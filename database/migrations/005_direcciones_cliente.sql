-- KAN-54: tabla adicional; no modifica pedidos, direcciones ni su historial.
-- Las direcciones históricas se consultan en lectura, sin backfill destructivo.
CREATE TABLE IF NOT EXISTS direcciones_cliente (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    clave CHAR(64) CHARACTER SET ascii COLLATE ascii_bin NOT NULL,
    direccion_original VARCHAR(255) NULL,
    calle VARCHAR(150) NULL,
    altura VARCHAR(20) NULL,
    piso_depto VARCHAR(30) NULL,
    entre_calles VARCHAR(150) NULL,
    localidad VARCHAR(100) NULL,
    provincia VARCHAR(100) NULL,
    codigo_postal VARCHAR(10) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_direccion_cliente UNIQUE (cliente_id, clave),
    CONSTRAINT fk_direccion_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
