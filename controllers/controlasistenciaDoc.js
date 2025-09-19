const { executeQuery } = require('../config/database');

// Obtener todas las asignaciones de control de asistencia
const obtenerAsignaciones = async (req, res) => {
  try {
    const query = `
      SELECT 
        aca.id,
        aca.id_usuario_sucursal,
        us.usuario,
        us.nombre_completo,
        aca.id_ubicacion_control,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        aca.id_admin_creador,
        ads.usuario as admin_creador,
        aca.activo,
        aca.fecha_creacion,
        aca.fecha_actualizacion
      FROM asignaciones_control_asistencia aca
      LEFT JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      LEFT JOIN admin_sucursales ads ON aca.id_admin_creador = ads.id
      WHERE aca.activo = 1
      ORDER BY aca.fecha_creacion DESC
    `;
    
    const asignaciones = await executeQuery(query);
    
    // Parsear dias_semana de JSON string a array
    const asignacionesParsed = asignaciones.map(asignacion => {
      let diasSemana = asignacion.dias_semana;
      if (typeof diasSemana === 'string') {
        try {
          diasSemana = JSON.parse(diasSemana);
        } catch (error) {
          console.error('Error parsing dias_semana:', error);
          diasSemana = [];
        }
      }
      return {
        ...asignacion,
        dias_semana: diasSemana
      };
    });
    
    res.json({
      success: true,
      data: asignacionesParsed
    });
  } catch (error) {
    console.error('Error al obtener asignaciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener asignaciones por sucursal
const obtenerAsignacionesPorSucursal = async (req, res) => {
  try {
    const id_sucursal = req.user.id_sucursal;
    
    const query = `
      SELECT 
        aca.id,
        aca.id_usuario_sucursal,
        us.usuario,
        us.nombre_completo,
        aca.id_ubicacion_control,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        aca.id_admin_creador,
        ads.usuario as admin_creador,
        aca.activo,
        aca.fecha_creacion,
        aca.fecha_actualizacion
      FROM asignaciones_control_asistencia aca
      LEFT JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      LEFT JOIN admin_sucursales ads ON aca.id_admin_creador = ads.id
      WHERE aca.activo = 1 AND us.id_sucursal = ?
      ORDER BY aca.fecha_creacion DESC
    `;
    
    const asignaciones = await executeQuery(query, [id_sucursal]);
    
    // Parsear dias_semana de JSON string a array
    const asignacionesParsed = asignaciones.map(asignacion => {
      let diasSemana = asignacion.dias_semana;
      if (typeof diasSemana === 'string') {
        try {
          diasSemana = JSON.parse(diasSemana);
        } catch (error) {
          console.error('Error parsing dias_semana:', error);
          diasSemana = [];
        }
      }
      return {
        ...asignacion,
        dias_semana: diasSemana
      };
    });
    
    res.json({
      success: true,
      data: asignacionesParsed
    });
  } catch (error) {
    console.error('Error al obtener asignaciones por sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear nueva asignación de control de asistencia
const crearAsignacion = async (req, res) => {
  try {
    
    const {
      id_usuario_sucursal,
      id_ubicacion_control,
      dias_semana,
      hora_inicio,
      hora_fin
    } = req.body;

    const id_admin_creador = req.user.id;

    // Verificar que el admin existe
    const adminExiste = await executeQuery(
      'SELECT id FROM admin_sucursales WHERE id = ? AND activo = 1',
      [id_admin_creador]
    );

    if (adminExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Admin creador no encontrado'
      });
    }

    // Validaciones
    if (!id_usuario_sucursal || !id_ubicacion_control || !dias_semana || !hora_inicio || !hora_fin) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos son obligatorios'
      });
    }

    // Validar que el usuario existe
    const usuarioExiste = await executeQuery(
      'SELECT id FROM usuarios_sucursal WHERE id = ? AND activo = 1',
      [id_usuario_sucursal]
    );

    if (usuarioExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar que la ubicación existe
    const ubicacionExiste = await executeQuery(
      'SELECT id FROM ubicaciones_control WHERE id = ? AND activa = 1',
      [id_ubicacion_control]
    );

    if (ubicacionExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ubicación de control no encontrada'
      });
    }

    // Verificar si existe una asignación (activa o inactiva)
    const asignacionExistente = await executeQuery(
      'SELECT id, activo FROM asignaciones_control_asistencia WHERE id_usuario_sucursal = ? AND id_ubicacion_control = ?',
      [id_usuario_sucursal, id_ubicacion_control]
    );

    if (asignacionExistente.length > 0) {
      const asignacion = asignacionExistente[0];
      
      if (asignacion.activo === 1) {
        return res.status(409).json({
          success: false,
          message: 'Ya existe una asignación activa para este usuario en esta ubicación'
        });
      } else {
        // Si existe pero está inactiva, la reactivamos y actualizamos
        
        await executeQuery(
          'UPDATE asignaciones_control_asistencia SET dias_semana = ?, hora_inicio = ?, hora_fin = ?, id_admin_creador = ?, activo = 1, fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
          [JSON.stringify(dias_semana), hora_inicio, hora_fin, id_admin_creador, asignacion.id]
        );

        // Obtener la asignación actualizada
        const asignacionActualizada = await executeQuery(`
          SELECT 
            aca.id,
            aca.id_usuario_sucursal,
            us.usuario,
            us.nombre_completo,
            aca.id_ubicacion_control,
            uc.nombre as ubicacion_nombre,
            uc.descripcion as ubicacion_descripcion,
            aca.dias_semana,
            aca.hora_inicio,
            aca.hora_fin,
            aca.id_admin_creador,
            ads.usuario as admin_creador,
            aca.activo,
            aca.fecha_creacion,
            aca.fecha_actualizacion
          FROM asignaciones_control_asistencia aca
          LEFT JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
          LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
          LEFT JOIN admin_sucursales ads ON aca.id_admin_creador = ads.id
          WHERE aca.id = ?
        `, [asignacion.id]);

        return res.status(200).json({
          success: true,
          message: 'Asignación reactivada y actualizada exitosamente',
          data: asignacionActualizada[0]
        });
      }
    }

    // Validar formato de días de la semana
    if (!Array.isArray(dias_semana) || dias_semana.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Los días de la semana deben ser un array no vacío'
      });
    }

    const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
    const diasInvalidos = dias_semana.filter(dia => !diasValidos.includes(dia.toLowerCase()));
    
    if (diasInvalidos.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Días inválidos: ${diasInvalidos.join(', ')}`
      });
    }

    // Crear la asignación
    const result = await executeQuery(
      'INSERT INTO asignaciones_control_asistencia (id_usuario_sucursal, id_ubicacion_control, dias_semana, hora_inicio, hora_fin, id_admin_creador) VALUES (?, ?, ?, ?, ?, ?)',
      [id_usuario_sucursal, id_ubicacion_control, JSON.stringify(dias_semana), hora_inicio, hora_fin, id_admin_creador]
    );

    // Obtener la asignación creada con todos los datos
    const asignacionCreada = await executeQuery(`
      SELECT 
        aca.id,
        aca.id_usuario_sucursal,
        us.usuario,
        us.nombre_completo,
        aca.id_ubicacion_control,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        aca.id_admin_creador,
        ads.usuario as admin_creador,
        aca.activo,
        aca.fecha_creacion,
        aca.fecha_actualizacion
      FROM asignaciones_control_asistencia aca
      LEFT JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      LEFT JOIN admin_sucursales ads ON aca.id_admin_creador = ads.id
      WHERE aca.id = ?
    `, [result.insertId]);

    res.status(201).json({
      success: true,
      message: 'Asignación creada exitosamente',
      data: asignacionCreada[0]
    });
  } catch (error) {
    console.error('Error al crear asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Actualizar asignación existente
const actualizarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_usuario_sucursal,
      id_ubicacion_control,
      dias_semana,
      hora_inicio,
      hora_fin
    } = req.body;

    // Verificar que la asignación existe
    const asignacionExiste = await executeQuery(
      'SELECT id FROM asignaciones_control_asistencia WHERE id = ? AND activo = 1',
      [id]
    );

    if (asignacionExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    // Construir query de actualización dinámicamente
    const updateFields = [];
    const updateValues = [];

    if (id_usuario_sucursal !== undefined) {
      // Validar que el usuario existe
      const usuarioExiste = await executeQuery(
        'SELECT id FROM usuarios_sucursal WHERE id = ? AND activo = 1',
        [id_usuario_sucursal]
      );
      if (usuarioExiste.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      updateFields.push('id_usuario_sucursal = ?');
      updateValues.push(id_usuario_sucursal);
    }

    if (id_ubicacion_control !== undefined) {
      // Validar que la ubicación existe
      const ubicacionExiste = await executeQuery(
        'SELECT id FROM ubicaciones_control WHERE id = ? AND activa = 1',
        [id_ubicacion_control]
      );
      if (ubicacionExiste.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Ubicación de control no encontrada'
        });
      }
      updateFields.push('id_ubicacion_control = ?');
      updateValues.push(id_ubicacion_control);
    }

    if (dias_semana !== undefined) {
      if (!Array.isArray(dias_semana) || dias_semana.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Los días de la semana deben ser un array no vacío'
        });
      }
      const diasValidos = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado', 'domingo'];
      const diasInvalidos = dias_semana.filter(dia => !diasValidos.includes(dia.toLowerCase()));
      
      if (diasInvalidos.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Días inválidos: ${diasInvalidos.join(', ')}`
        });
      }
      updateFields.push('dias_semana = ?');
      updateValues.push(JSON.stringify(dias_semana));
    }

    if (hora_inicio !== undefined) {
      updateFields.push('hora_inicio = ?');
      updateValues.push(hora_inicio);
    }

    if (hora_fin !== undefined) {
      updateFields.push('hora_fin = ?');
      updateValues.push(hora_fin);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No se proporcionaron campos para actualizar'
      });
    }

    updateValues.push(id);

    await executeQuery(
      `UPDATE asignaciones_control_asistencia SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );

    // Obtener la asignación actualizada
    const asignacionActualizada = await executeQuery(`
      SELECT 
        aca.id,
        aca.id_usuario_sucursal,
        us.usuario,
        us.nombre_completo,
        aca.id_ubicacion_control,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        aca.id_admin_creador,
        ads.usuario as admin_creador,
        aca.activo,
        aca.fecha_creacion,
        aca.fecha_actualizacion
      FROM asignaciones_control_asistencia aca
      LEFT JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      LEFT JOIN admin_sucursales ads ON aca.id_admin_creador = ads.id
      WHERE aca.id = ?
    `, [id]);

    res.json({
      success: true,
      message: 'Asignación actualizada exitosamente',
      data: asignacionActualizada[0]
    });
  } catch (error) {
    console.error('Error al actualizar asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Eliminar asignación (soft delete)
const eliminarAsignacion = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que la asignación existe
    const asignacionExiste = await executeQuery(
      'SELECT id FROM asignaciones_control_asistencia WHERE id = ? AND activo = 1',
      [id]
    );

    if (asignacionExiste.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada'
      });
    }

    await executeQuery('UPDATE asignaciones_control_asistencia SET activo = 0 WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Asignación eliminada exitosamente'
    });
  } catch (error) {
    console.error('Error al eliminar asignación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener asignaciones de un usuario específico
const obtenerAsignacionesPorUsuario = async (req, res) => {
  try {
    const { id_usuario_sucursal } = req.params;
    
    const query = `
      SELECT 
        aca.id,
        aca.id_usuario_sucursal,
        us.usuario,
        us.nombre_completo,
        aca.id_ubicacion_control,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        aca.id_admin_creador,
        ads.usuario as admin_creador,
        aca.activo,
        aca.fecha_creacion,
        aca.fecha_actualizacion
      FROM asignaciones_control_asistencia aca
      LEFT JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      LEFT JOIN admin_sucursales ads ON aca.id_admin_creador = ads.id
      WHERE aca.activo = 1 AND aca.id_usuario_sucursal = ?
      ORDER BY aca.fecha_creacion DESC
    `;
    
    const asignaciones = await executeQuery(query, [id_usuario_sucursal]);
    res.json({
      success: true,
      data: asignaciones
    });
  } catch (error) {
    console.error('Error al obtener asignaciones por usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Verificar si un usuario puede marcar asistencia en una ubicación y horario específico
const verificarAsistenciaPermitida = async (req, res) => {
  try {
    const { id_usuario_sucursal, id_ubicacion_control } = req.params;
    const { dia_semana, hora_actual } = req.query;

    if (!dia_semana || !hora_actual) {
      return res.status(400).json({
        success: false,
        message: 'Día de la semana y hora actual son requeridos'
      });
    }

    const query = `
      SELECT 
        aca.id,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        uc.nombre as ubicacion_nombre
      FROM asignaciones_control_asistencia aca
      LEFT JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      WHERE aca.activo = 1 
        AND aca.id_usuario_sucursal = ? 
        AND aca.id_ubicacion_control = ?
        AND JSON_CONTAINS(aca.dias_semana, JSON_QUOTE(?))
        AND TIME(?) BETWEEN aca.hora_inicio AND aca.hora_fin
    `;
    
    const asignacion = await executeQuery(query, [id_usuario_sucursal, id_ubicacion_control, dia_semana.toLowerCase(), hora_actual]);
    
    if (asignacion.length > 0) {
      res.json({
        success: true,
        permitido: true,
        message: 'Asistencia permitida',
        data: asignacion[0]
      });
    } else {
      res.json({
        success: true,
        permitido: false,
        message: 'No tiene asignación para marcar asistencia en esta ubicación, día u horario'
      });
    }
  } catch (error) {
    console.error('Error al verificar asistencia permitida:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  obtenerAsignaciones,
  obtenerAsignacionesPorSucursal,
  crearAsignacion,
  actualizarAsignacion,
  eliminarAsignacion,
  obtenerAsignacionesPorUsuario,
  verificarAsistenciaPermitida
};