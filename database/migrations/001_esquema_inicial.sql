-- Migración 001 · Esquema reconciliado del MVP1 (modelo de referencia D05)
-- No reescribe database/init.sql: ese archivo es el DDL inicial histórico y no migra
-- una base existente. Esta migración crea el esquema objetivo en una base nueva y
-- conserva los códigos/textos de origen para la importación histórica.
--
-- Nota: MySQL confirma implícitamente cada DDL; el runner no promete rollback de DDL.

CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('ADMINISTRADOR', 'OPERADOR', 'CHOFER') NOT NULL DEFAULT 'OPERADOR',
    activo TINYINT(1) NOT NULL DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_origen VARCHAR(50) NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    dni VARCHAR(20) NULL UNIQUE,
    telefono VARCHAR(50),
    email VARCHAR(150),
    tipo VARCHAR(30) DEFAULT 'particular',
    domicilio VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(50) NULL UNIQUE,
    cliente_id INT NOT NULL,
    canal_origen VARCHAR(30),
    estado ENUM('EN STOCK', 'EN PREPARACIÓN', 'EN ENVÍO', 'ENTREGADO', 'PAGADO') NOT NULL DEFAULT 'EN STOCK',
    direccion_validada TINYINT(1) NOT NULL DEFAULT 0,
    chofer_id INT NULL,
    observaciones TEXT,
    creado_por INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    KEY idx_pedidos_cliente (cliente_id),
    KEY idx_pedidos_estado (estado),
    KEY idx_pedidos_chofer (chofer_id),
    CONSTRAINT fk_pedidos_cliente FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    CONSTRAINT fk_pedidos_chofer FOREIGN KEY (chofer_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    CONSTRAINT fk_pedidos_creador FOREIGN KEY (creado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS direcciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    direccion_original VARCHAR(255) NULL,
    calle VARCHAR(150),
    altura VARCHAR(20),
    piso_depto VARCHAR(30),
    entre_calles VARCHAR(150),
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(10),
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    nivel_confianza ENUM('ALTO', 'MEDIO', 'BAJO') NULL,
    estado_validacion ENUM('PENDIENTE', 'CON_ADVERTENCIAS', 'VALIDA', 'CONFIRMADA') NOT NULL DEFAULT 'PENDIENTE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT uq_direccion_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_direcciones_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_geolocalizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    direccion_id INT NOT NULL,
    usuario_id INT NULL,
    direccion_enviada TEXT NOT NULL,
    resultado ENUM('OK', 'ZERO_RESULTS', 'APPROXIMATE', 'ERROR') NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    nivel_confianza ENUM('ALTO', 'MEDIO', 'BAJO') NULL,
    accion_operador ENUM('CONFIRMO', 'CORRIGIO', 'RECHAZO') NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_hist_geo_direccion (direccion_id),
    CONSTRAINT fk_hist_geo_direccion FOREIGN KEY (direccion_id) REFERENCES direcciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_geo_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    metodo ENUM('EFECTIVO', 'TRANSFERENCIA') NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    registrado_por INT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_pago_pedido UNIQUE (pedido_id),
    CONSTRAINT fk_pagos_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_pagos_usuario FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE IF NOT EXISTS historial_estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    estado_anterior VARCHAR(30) NULL,
    estado_nuevo VARCHAR(30) NOT NULL,
    observaciones TEXT,
    usuario_id INT NULL,
    fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    KEY idx_hist_estados_pedido (pedido_id),
    CONSTRAINT fk_hist_estados_pedido FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_estados_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
