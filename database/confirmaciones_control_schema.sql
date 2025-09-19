-- Tabla para registrar las confirmaciones de control de asistencia
-- Esta tabla almacena cuando los usuarios marcan su asistencia en las ubicaciones asignadas

CREATE TABLE confirmaciones_control_asistencia (
  id INT PRIMARY KEY AUTO_INCREMENT,
  id_asignacion_control INT NOT NULL,
  id_usuario_sucursal INT NOT NULL,
  fecha_confirmacion DATE NOT NULL,
  hora_marcaje TIME NOT NULL,
  latitud_marcaje DECIMAL(10, 8),
  longitud_marcaje DECIMAL(11, 8),
  dentro_ubicacion BOOLEAN NOT NULL DEFAULT FALSE,
  distancia_metros DECIMAL(8, 2),
  observaciones TEXT,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (id_asignacion_control) REFERENCES asignaciones_control_asistencia(id),
  FOREIGN KEY (id_usuario_sucursal) REFERENCES usuarios_sucursal(id),
  
  UNIQUE KEY unique_asignacion_fecha (id_asignacion_control, fecha_confirmacion),
  INDEX idx_usuario_fecha (id_usuario_sucursal, fecha_confirmacion),
  INDEX idx_dentro_ubicacion (dentro_ubicacion)
);

-- Comentarios sobre los campos:
-- id_asignacion_control: Referencia a la asignación específica (usuario + ubicación + horarios)
-- fecha_confirmacion y hora_marcaje: Cuándo exactamente marcó el usuario
-- latitud_marcaje/longitud_marcaje: Coordenadas GPS donde marcó
-- dentro_ubicacion: Si estaba dentro del radio permitido de la ubicación
-- distancia_metros: Distancia exacta desde el centro de la ubicación asignada
-- observaciones: Para casos especiales o notas adicionales