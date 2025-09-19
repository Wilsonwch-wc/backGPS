-- =====================================================
-- TABLA ASIGNACIONES_CONTROL_ASISTENCIA
-- =====================================================

-- Tabla para almacenar las asignaciones de control de asistencia
CREATE TABLE IF NOT EXISTS asignaciones_control_asistencia (
    id INT PRIMARY KEY AUTO_INCREMENT,
    id_usuario_sucursal INT NOT NULL COMMENT 'ID del usuario de sucursal asignado',
    id_ubicacion_control INT NOT NULL COMMENT 'ID de la ubicación de control GPS',
    dias_semana JSON NOT NULL COMMENT 'Array JSON con los días de la semana (lunes, martes, etc.)',
    hora_inicio TIME NOT NULL COMMENT 'Hora de inicio del control',
    hora_fin TIME NOT NULL COMMENT 'Hora de fin del control',
    id_admin_creador INT NOT NULL COMMENT 'ID del admin que creó la asignación',
    activo BOOLEAN DEFAULT TRUE COMMENT 'Si la asignación está activa',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Índices para mejorar rendimiento
    INDEX idx_usuario_sucursal (id_usuario_sucursal),
    INDEX idx_ubicacion_control (id_ubicacion_control),
    INDEX idx_admin_creador (id_admin_creador),
    INDEX idx_activo (activo),
    INDEX idx_fecha_creacion (fecha_creacion),
    
    -- Claves foráneas
    FOREIGN KEY (id_usuario_sucursal) REFERENCES usuarios_sucursal(id) ON DELETE CASCADE,
    FOREIGN KEY (id_ubicacion_control) REFERENCES ubicaciones_control(id) ON DELETE CASCADE,
    FOREIGN KEY (id_admin_creador) REFERENCES admin_sucursales(id) ON DELETE RESTRICT,
    
    -- Restricción única para evitar duplicados
    UNIQUE KEY unique_usuario_ubicacion (id_usuario_sucursal, id_ubicacion_control)
);

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL)
-- =====================================================

/*
-- Ejemplo de asignación de control de asistencia
INSERT INTO asignaciones_control_asistencia (
    id_usuario_sucursal, id_ubicacion_control, dias_semana, 
    hora_inicio, hora_fin, id_admin_creador
) VALUES (
    1,  -- ID del usuario de sucursal
    1,  -- ID de la ubicación de control
    JSON_ARRAY('lunes', 'martes', 'miercoles', 'jueves', 'viernes'),  -- Días de la semana
    '08:00:00',  -- Hora de inicio
    '17:00:00',  -- Hora de fin
    1   -- ID del admin creador
);
*/