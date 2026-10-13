-- Primer corte: identidad y revocación. No modifica tablas ni datos de negocio.
CREATE TABLE IF NOT EXISTS sesiones (
    jti CHAR(36) CHARACTER SET ascii COLLATE ascii_bin PRIMARY KEY,
    usuario_id INT NOT NULL,
    expira_en DATETIME NOT NULL,
    revocada_en DATETIME NULL,
    creada_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_sesiones_usuario (usuario_id),
    INDEX idx_sesiones_expiracion (expira_en),
    CONSTRAINT fk_sesiones_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
