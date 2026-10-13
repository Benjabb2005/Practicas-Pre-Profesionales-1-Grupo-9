-- Conserva direcciones e historial. Una edición y su reversión son versiones distintas.
ALTER TABLE direcciones ADD COLUMN revision BIGINT UNSIGNED NOT NULL DEFAULT 1;

CREATE TRIGGER direcciones_revision BEFORE UPDATE ON direcciones FOR EACH ROW
SET NEW.revision = IF(
    NOT (NEW.direccion_original <=> OLD.direccion_original)
    OR NOT (NEW.calle <=> OLD.calle)
    OR NOT (NEW.altura <=> OLD.altura)
    OR NOT (NEW.piso_depto <=> OLD.piso_depto)
    OR NOT (NEW.localidad <=> OLD.localidad)
    OR NOT (NEW.provincia <=> OLD.provincia)
    OR NOT (NEW.codigo_postal <=> OLD.codigo_postal),
    OLD.revision + 1, OLD.revision
);
