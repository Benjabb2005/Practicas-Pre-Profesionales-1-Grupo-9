ALTER TABLE tarifas_envio
    ADD COLUMN sucursal_calle VARCHAR(150) NULL,
    ADD COLUMN sucursal_altura VARCHAR(20) NULL,
    ADD COLUMN sucursal_localidad VARCHAR(100) NULL,
    ADD COLUMN sucursal_provincia VARCHAR(100) NULL,
    ADD COLUMN sucursal_direccion TEXT NULL,
    ADD COLUMN sucursal_latitud DECIMAL(10, 8) NULL,
    ADD COLUMN sucursal_longitud DECIMAL(11, 8) NULL;
