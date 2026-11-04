-- Conserva los pedidos existentes: importe desconocido no equivale a cero.
ALTER TABLE pedidos
    ADD COLUMN importe_base DECIMAL(12,2) NULL,
    ADD COLUMN recargo_total DECIMAL(12,2) NOT NULL DEFAULT 0,
    ADD COLUMN intentos_fallidos INT UNSIGNED NOT NULL DEFAULT 0,
    ADD COLUMN proxima_visita DATE NULL,
    ADD COLUMN importe_total DECIMAL(12,2) GENERATED ALWAYS AS (importe_base + recargo_total) STORED;

CREATE TABLE tarifas_envio (
    id TINYINT PRIMARY KEY,
    precio_km DECIMAL(12,2) NULL,
    actualizado_por INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_tarifa_usuario FOREIGN KEY (actualizado_por) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT ck_tarifa_unica CHECK (id=1),
    CONSTRAINT ck_tarifa_positiva CHECK (precio_km IS NULL OR precio_km>0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
INSERT INTO tarifas_envio (id,precio_km) VALUES (1,NULL);
