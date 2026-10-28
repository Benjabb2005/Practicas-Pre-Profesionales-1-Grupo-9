-- Adjuntos privados del pago. No altera pagos ni pedidos existentes.
CREATE TABLE comprobantes_pago (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pago_id INT NOT NULL,
    nombre VARCHAR(180) NOT NULL,
    tipo VARCHAR(40) NOT NULL,
    sha256 CHAR(64) NOT NULL,
    archivo MEDIUMBLOB NOT NULL,
    subido_por INT NOT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_comprobante_contenido UNIQUE(pago_id,sha256),
    CONSTRAINT fk_comprobante_pago FOREIGN KEY(pago_id) REFERENCES pagos(id) ON DELETE CASCADE,
    CONSTRAINT fk_comprobante_usuario FOREIGN KEY(subido_por) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
