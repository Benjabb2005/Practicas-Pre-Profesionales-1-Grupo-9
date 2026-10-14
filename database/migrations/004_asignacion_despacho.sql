-- Extensiones aditivas. Conserva los valores y filas existentes.
ALTER TABLE usuarios MODIFY rol ENUM('admin', 'operador', 'chofer') DEFAULT 'operador';
ALTER TABLE pedidos MODIFY estado ENUM('pendiente_validacion', 'requiere_revision', 'direccion_validada', 'listo_despacho', 'en_camino', 'entregado', 'fallido', 'cancelado', 'en_preparacion') DEFAULT 'pendiente_validacion';
ALTER TABLE pedidos ADD COLUMN chofer_id INT NULL, ADD INDEX idx_pedidos_chofer_estado (chofer_id, estado), ADD CONSTRAINT fk_pedidos_chofer FOREIGN KEY (chofer_id) REFERENCES usuarios(id) ON DELETE RESTRICT;
