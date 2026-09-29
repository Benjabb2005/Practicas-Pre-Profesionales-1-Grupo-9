-- MandáTodo Logística - Schema inicial
-- Base de datos: Sistema de Normalización y Geolocalización de Direcciones de Envío

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

-- ============================================================
-- TABLA: clientes
-- Almacena la información de los clientes que realizan pedidos.
-- Se guarda tanto el código original (del Excel) como los datos
-- normalizados para poder detectar duplicados después.
-- ============================================================
CREATE TABLE IF NOT EXISTS clientes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    nombre VARCHAR(150) NOT NULL,
    email VARCHAR(150),
    telefono VARCHAR(50),
    tipo VARCHAR(30) DEFAULT 'particular',
    direccion VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLA: direcciones
-- Almacena la dirección original tal cual llegó del cliente,
-- y los campos normalizados que el sistema interpreta.
-- ============================================================
CREATE TABLE IF NOT EXISTS direcciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    direccion_original TEXT NOT NULL,
    calle VARCHAR(150),
    altura VARCHAR(20),
    piso VARCHAR(10),
    departamento VARCHAR(20),
    localidad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(10),
    lat DECIMAL(10, 8),
    lng DECIMAL(11, 8),
    normalizada TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLA: pedidos
-- Cada registro representa un envío recibido por cualquier canal
-- (WhatsApp, Instagram, correo, sistema externo).
-- Los estados están estandarizados para evitar inconsistencias.
-- ============================================================
CREATE TABLE IF NOT EXISTS pedidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    cliente_id INT NOT NULL,
    direccion_id INT,
    estado ENUM(
        'pendiente_validacion',
        'requiere_revision',
        'direccion_validada',
        'listo_despacho',
        'en_camino',
        'entregado',
        'fallido',
        'cancelado'
    ) DEFAULT 'pendiente_validacion',
    canal_origen VARCHAR(30),
    observaciones TEXT,
    posible_duplicado TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE RESTRICT,
    FOREIGN KEY (direccion_id) REFERENCES direcciones(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLA: historial_geolocalizacion
-- Registra cada consulta realizada al servicio de geolocalización.
-- Permite auditar qué se envió, qué se recibió y si el operador
-- confirmó o corrigió el resultado.
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_geolocalizacion (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    direccion_enviada TEXT NOT NULL,
    resultado ENUM('OK', 'ZERO_RESULTS', 'APPROXIMATE', 'ERROR') NOT NULL,
    coordenadas_lat DECIMAL(10, 8),
    coordenadas_lng DECIMAL(11, 8),
    confianza DECIMAL(3, 2),
    proveedor VARCHAR(30) DEFAULT 'georef',
    operador VARCHAR(50),
    confirmado_por_operador TINYINT(1) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLA: historial_estados
-- Registra cada cambio de estado de un pedido con fecha y
-- responsable. Permite saber el recorrido completo de un envío.
-- ============================================================
CREATE TABLE IF NOT EXISTS historial_estados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    pedido_id INT NOT NULL,
    estado_anterior VARCHAR(30),
    estado_nuevo VARCHAR(30) NOT NULL,
    observaciones TEXT,
    usuario VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- TABLA: usuarios
-- Personas que operan el sistema. Se usará para login y
-- para registrar quién hizo cada acción.
-- ============================================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol ENUM('admin', 'operador') DEFAULT 'operador',
    activo TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;


-- ============================================================
-- ÍNDICES para mejorar performance en búsquedas frecuentes
-- ============================================================
CREATE INDEX idx_pedidos_cliente ON pedidos(cliente_id);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_codigo ON pedidos(codigo);
CREATE INDEX idx_geolocalizacion_pedido ON historial_geolocalizacion(pedido_id);
CREATE INDEX idx_estados_pedido ON historial_estados(pedido_id);
CREATE INDEX idx_clientes_codigo ON clientes(codigo);
