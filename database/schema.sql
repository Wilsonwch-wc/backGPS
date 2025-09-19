-- Crear base de datos si no existe
CREATE DATABASE IF NOT EXISTS bd_instituto;
USE bd_instituto;

-- Tabla de roles
CREATE TABLE IF NOT EXISTS roles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL UNIQUE,
    descripcion TEXT,
    permisos JSON,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Tabla de usuarios
CREATE TABLE IF NOT EXISTS sp_usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    direccion TEXT,
    fecha_nacimiento DATE,
    rol_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    ultimo_acceso TIMESTAMP NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea hacia la tabla roles
    FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices para mejorar rendimiento
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_rol_id (rol_id),
    INDEX idx_activo (activo)
);

-- Insertar roles por defecto
INSERT INTO roles (nombre, descripcion, permisos) VALUES 
('Administrador', 'Acceso completo al sistema', JSON_OBJECT(
    'usuarios', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', true),
    'roles', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', true),
    'configuracion', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', true),
    'sucursales', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', true),
    'admin_sucursales', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', true)
)),
('Usuario', 'Acceso básico al sistema', JSON_OBJECT(
    'usuarios', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', false, 'eliminar', false),
    'roles', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', false, 'eliminar', false),
    'configuracion', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', false, 'eliminar', false),
    'sucursales', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', false, 'eliminar', false),
    'admin_sucursales', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', false, 'eliminar', false)
)),
('Moderador', 'Acceso intermedio al sistema', JSON_OBJECT(
    'usuarios', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', false),
    'roles', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', false, 'eliminar', false),
    'configuracion', JSON_OBJECT('crear', false, 'leer', true, 'actualizar', true, 'eliminar', false),
    'sucursales', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', false),
    'admin_sucursales', JSON_OBJECT('crear', true, 'leer', true, 'actualizar', true, 'eliminar', false)
));

-- Tabla de tipos de sucursales
CREATE TABLE IF NOT EXISTS rol_sucursal (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE,
    activo BOOLEAN DEFAULT TRUE,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar tipos de sucursales por defecto
INSERT INTO rol_sucursal (nombre) VALUES 
('Tienda'),
('Almacén'),
('Instituto'),
('Oficina'),
('Centro de Distribución');

-- Tabla de sucursales
CREATE TABLE IF NOT EXISTS sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    direccion TEXT,
    telefono VARCHAR(20),
    tipo_sucursal_id INT NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea hacia la tabla rol_sucursal
    FOREIGN KEY (tipo_sucursal_id) REFERENCES rol_sucursal(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices para mejorar rendimiento
    INDEX idx_activo (activo),
    INDEX idx_nombre (nombre),
    INDEX idx_descripcion (descripcion),
    INDEX idx_tipo_sucursal_id (tipo_sucursal_id)
);

-- Insertar usuario administrador por defecto
INSERT INTO sp_usuarios (username, email, password, nombre, apellido, rol_id) VALUES 
('admin', 'admin@instituto.com', 'password', 'Administrador', 'Sistema', 1);
-- Nota: La contraseña se maneja en texto plano

-- Insertar sucursales por defecto
INSERT INTO sucursales (nombre, descripcion, direccion, telefono, tipo_sucursal_id) VALUES 
('Sucursal Central', 'Oficina principal del instituto', 'Av. Principal 123, Centro', '555-0001', 3),
('Sucursal Norte', 'Sucursal ubicada en la zona norte', 'Calle Norte 456, Zona Norte', '555-0002', 1),
('Sucursal Sur', 'Sucursal ubicada en la zona sur', 'Av. Sur 789, Zona Sur', '555-0003', 2);

-- Tabla de administradores de sucursales
CREATE TABLE IF NOT EXISTS admin_sucursales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario VARCHAR(50) NOT NULL UNIQUE,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    id_sucursal INT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Clave foránea hacia la tabla sucursales
    FOREIGN KEY (id_sucursal) REFERENCES sucursales(id) ON DELETE RESTRICT ON UPDATE CASCADE,
    
    -- Índices para mejorar rendimiento
    INDEX idx_usuario (usuario),
    INDEX idx_correo (correo),
    INDEX idx_id_sucursal (id_sucursal),
    INDEX idx_activo (activo)
);

-- Mostrar estructura de las tablas creadas
SHOW TABLES;
DESCRIBE roles;
DESCRIBE sp_usuarios;
DESCRIBE sucursales;
DESCRIBE admin_sucursales;