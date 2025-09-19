const db = require('../config/database');

// Función para calcular la distancia entre dos puntos GPS usando la fórmula de Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Radio de la Tierra en metros
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c; // Distancia en metros
}

// Función para obtener el nombre del día en español
function obtenerNombreDia(fecha) {
  const dias = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  return dias[fecha.getDay()];
}

// Obtener asignaciones del día actual para el usuario
const obtenerAsignacionesHoy = async (req, res) => {
  try {
    const userId = req.user.id;
    const hoy = new Date();
    const nombreDiaHoy = obtenerNombreDia(hoy);
    const fechaHoy = hoy.toISOString().split('T')[0];
    const horaActual = hoy.toTimeString().split(' ')[0].substring(0, 5);

    console.log(`Buscando asignaciones para usuario ${userId} el día ${nombreDiaHoy}`);

    const query = `
      SELECT 
        aca.id as asignacion_id,
        aca.hora_inicio,
        aca.hora_fin,
        aca.dias_semana,
        uc.id as ubicacion_id,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        uc.latitud,
        uc.longitud,
        uc.radio_metros,
        cca.id as confirmacion_id,
        cca.hora_marcaje,
        cca.dentro_ubicacion
      FROM asignaciones_control_asistencia aca
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      LEFT JOIN confirmaciones_control_asistencia cca ON (
        cca.id_asignacion_control = aca.id AND 
        cca.fecha_confirmacion = ?
      )
      WHERE aca.id_usuario_sucursal = ? 
        AND aca.activo = 1 
        AND uc.activa = 1
        AND JSON_CONTAINS(aca.dias_semana, JSON_QUOTE(?))
      ORDER BY aca.hora_inicio
    `;

    const [rows] = await db.pool.execute(query, [fechaHoy, userId, nombreDiaHoy]);

    // Procesar las asignaciones para determinar el estado
    const asignaciones = rows.map(row => {
      const horaInicio = row.hora_inicio;
      const horaFin = row.hora_fin;
      const yaConfirmado = row.confirmacion_id !== null;
      
      // Determinar si está en horario de confirmación (5 minutos antes y después del inicio)
      const inicioDate = new Date(`1970-01-01T${horaInicio}`);
      const inicioMenos5 = new Date(inicioDate.getTime() - 5 * 60000);
      const inicioMas5 = new Date(inicioDate.getTime() + 5 * 60000);
      
      const horaActualDate = new Date(`1970-01-01T${horaActual}:00`);
      const puedeConfirmar = horaActualDate >= inicioMenos5 && horaActualDate <= inicioMas5;
      
      let estado = 'pendiente';
      if (yaConfirmado) {
        estado = row.dentro_ubicacion ? 'confirmado' : 'confirmado_fuera_rango';
      } else if (puedeConfirmar) {
        estado = 'disponible_confirmacion';
      } else if (horaActualDate > inicioMas5) {
        estado = 'perdido';
      }

      return {
        asignacion_id: row.asignacion_id,
        ubicacion: {
          id: row.ubicacion_id,
          nombre: row.ubicacion_nombre,
          descripcion: row.ubicacion_descripcion,
          latitud: parseFloat(row.latitud),
          longitud: parseFloat(row.longitud),
          radio_metros: row.radio_metros
        },
        horario: {
          inicio: horaInicio,
          fin: horaFin,
          ventana_confirmacion: {
            desde: inicioMenos5.toTimeString().substring(0, 5),
            hasta: inicioMas5.toTimeString().substring(0, 5)
          }
        },
        estado: estado,
        confirmacion: yaConfirmado ? {
          hora_marcaje: row.hora_marcaje,
          dentro_ubicacion: row.dentro_ubicacion
        } : null,
        puede_confirmar: puedeConfirmar && !yaConfirmado
      };
    });

    res.json({
      success: true,
      data: {
        fecha: fechaHoy,
        dia: nombreDiaHoy,
        hora_actual: horaActual,
        asignaciones: asignaciones
      }
    });

  } catch (error) {
    console.error('Error al obtener asignaciones del día:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Registrar confirmación de asistencia
const registrarConfirmacion = async (req, res) => {
  try {
    const userId = req.user.id;
    const { asignacion_id, latitud, longitud, observaciones } = req.body;

    // Validar datos requeridos
    if (!asignacion_id || latitud === undefined || longitud === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Datos requeridos: asignacion_id, latitud, longitud'
      });
    }

    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0];
    const horaActual = hoy.toTimeString().split(' ')[0];
    const nombreDiaHoy = obtenerNombreDia(hoy);

    // Verificar que la asignación existe y es válida para hoy
    const queryAsignacion = `
      SELECT 
        aca.id,
        aca.hora_inicio,
        aca.hora_fin,
        aca.dias_semana,
        uc.latitud as ubicacion_lat,
        uc.longitud as ubicacion_lon,
        uc.radio_metros,
        uc.nombre as ubicacion_nombre
      FROM asignaciones_control_asistencia aca
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      WHERE aca.id = ? 
        AND aca.id_usuario_sucursal = ?
        AND aca.activo = 1 
        AND uc.activa = 1
        AND JSON_CONTAINS(aca.dias_semana, JSON_QUOTE(?))
    `;

    const [asignacionRows] = await db.pool.execute(queryAsignacion, [asignacion_id, userId, nombreDiaHoy]);

    if (asignacionRows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Asignación no encontrada o no válida para hoy'
      });
    }

    const asignacion = asignacionRows[0];

    // Verificar que no haya confirmado ya hoy
    const queryConfirmacionExistente = `
      SELECT id FROM confirmaciones_control_asistencia 
      WHERE id_asignacion_control = ? AND fecha_confirmacion = ?
    `;

    const [confirmacionExistente] = await db.pool.execute(queryConfirmacionExistente, [asignacion_id, fechaHoy]);

    if (confirmacionExistente.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Ya has confirmado tu asistencia para esta asignación hoy'
      });
    }

    // Verificar que esté en el horario de confirmación (5 minutos antes y después del inicio)
    const horaInicio = asignacion.hora_inicio;
    const inicioDate = new Date(`1970-01-01T${horaInicio}`);
    const inicioMenos5 = new Date(inicioDate.getTime() - 5 * 60000);
    const inicioMas5 = new Date(inicioDate.getTime() + 5 * 60000);
    const horaActualDate = new Date(`1970-01-01T${horaActual}`);

    if (horaActualDate < inicioMenos5 || horaActualDate > inicioMas5) {
      return res.status(400).json({
        success: false,
        message: `Solo puedes confirmar entre ${inicioMenos5.toTimeString().substring(0, 5)} y ${inicioMas5.toTimeString().substring(0, 5)}`,
        horario_permitido: {
          desde: inicioMenos5.toTimeString().substring(0, 5),
          hasta: inicioMas5.toTimeString().substring(0, 5)
        }
      });
    }

    // Calcular distancia desde la ubicación asignada
    const distancia = calcularDistancia(
      parseFloat(asignacion.ubicacion_lat),
      parseFloat(asignacion.ubicacion_lon),
      parseFloat(latitud),
      parseFloat(longitud)
    );

    const dentroUbicacion = distancia <= asignacion.radio_metros;

    // Registrar la confirmación
    const queryInsert = `
      INSERT INTO confirmaciones_control_asistencia (
        id_asignacion_control,
        id_usuario_sucursal,
        fecha_confirmacion,
        hora_marcaje,
        latitud_marcaje,
        longitud_marcaje,
        dentro_ubicacion,
        distancia_metros,
        observaciones
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const [result] = await db.pool.execute(queryInsert, [
      asignacion_id,
      userId,
      fechaHoy,
      horaActual,
      latitud,
      longitud,
      dentroUbicacion,
      Math.round(distancia * 100) / 100, // Redondear a 2 decimales
      observaciones || null
    ]);

    res.json({
      success: true,
      message: dentroUbicacion ? 
        'Asistencia confirmada exitosamente' : 
        'Asistencia registrada pero fuera del rango permitido',
      data: {
        confirmacion_id: result.insertId,
        ubicacion: asignacion.ubicacion_nombre,
        distancia_metros: Math.round(distancia * 100) / 100,
        dentro_ubicacion: dentroUbicacion,
        radio_permitido: asignacion.radio_metros,
        hora_marcaje: horaActual,
        fecha_confirmacion: fechaHoy
      }
    });

  } catch (error) {
    console.error('Error al registrar confirmación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener historial de confirmaciones del usuario
const obtenerHistorialConfirmaciones = async (req, res) => {
  try {
    const userId = req.user.id;
    const { fecha_inicio, fecha_fin, limite = 50 } = req.query;

    let whereClause = 'WHERE cca.id_usuario_sucursal = ?';
    let params = [userId];

    if (fecha_inicio) {
      whereClause += ' AND cca.fecha_confirmacion >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereClause += ' AND cca.fecha_confirmacion <= ?';
      params.push(fecha_fin);
    }

    const query = `
      SELECT 
        cca.id,
        cca.fecha_confirmacion,
        cca.hora_marcaje,
        cca.dentro_ubicacion,
        cca.distancia_metros,
        cca.observaciones,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        aca.hora_inicio,
        aca.hora_fin
      FROM confirmaciones_control_asistencia cca
      INNER JOIN asignaciones_control_asistencia aca ON cca.id_asignacion_control = aca.id
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      ${whereClause}
      ORDER BY cca.fecha_confirmacion DESC, cca.hora_marcaje DESC
      LIMIT ?
    `;

    params.push(parseInt(limite));
    const [rows] = await db.pool.execute(query, params);

    const historial = rows.map(row => ({
      id: row.id,
      fecha: row.fecha_confirmacion,
      hora_marcaje: row.hora_marcaje,
      ubicacion: {
        nombre: row.ubicacion_nombre,
        descripcion: row.ubicacion_descripcion
      },
      horario_asignado: {
        inicio: row.hora_inicio,
        fin: row.hora_fin
      },
      resultado: {
        dentro_ubicacion: row.dentro_ubicacion,
        distancia_metros: row.distancia_metros
      },
      observaciones: row.observaciones
    }));

    res.json({
      success: true,
      data: historial
    });

  } catch (error) {
    console.error('Error al obtener historial:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener reporte de control de asistencia para administradores de sucursal
const obtenerReporteControlAsistencia = async (req, res) => {
  try {
    const sucursalId = req.user.id_sucursal;
    const { fecha_inicio, fecha_fin, usuario_id, limite = 100 } = req.query;

    let whereClause = 'WHERE us.id_sucursal = ?';
    let params = [sucursalId];

    if (fecha_inicio) {
      whereClause += ' AND cca.fecha_confirmacion >= ?';
      params.push(fecha_inicio);
    }

    if (fecha_fin) {
      whereClause += ' AND cca.fecha_confirmacion <= ?';
      params.push(fecha_fin);
    }

    if (usuario_id) {
      whereClause += ' AND cca.id_usuario_sucursal = ?';
      params.push(usuario_id);
    }

    const query = `
      SELECT 
        cca.id,
        cca.fecha_confirmacion,
        cca.hora_marcaje,
        cca.dentro_ubicacion,
        cca.distancia_metros,
        cca.latitud_marcaje,
        cca.longitud_marcaje,
        cca.observaciones,
        us.nombre_completo as usuario_nombre_completo,
        us.correo as usuario_email,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        uc.latitud as ubicacion_latitud,
        uc.longitud as ubicacion_longitud,
        uc.radio_metros,
        aca.hora_inicio,
        aca.hora_fin,
        aca.dias_semana,
        s.nombre as sucursal_nombre
      FROM confirmaciones_control_asistencia cca
      INNER JOIN asignaciones_control_asistencia aca ON cca.id_asignacion_control = aca.id
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      INNER JOIN usuarios_sucursal us ON cca.id_usuario_sucursal = us.id
      INNER JOIN sucursales s ON us.id_sucursal = s.id
      ${whereClause}
      ORDER BY cca.fecha_confirmacion DESC, cca.hora_marcaje DESC
      LIMIT ?
    `;

    params.push(parseInt(limite));
    const [rows] = await db.pool.execute(query, params);

    const reporte = rows.map(row => ({
      id: row.id,
      fecha_confirmacion: row.fecha_confirmacion,
      hora_marcaje: row.hora_marcaje,
      usuario: {
        nombre_completo: row.usuario_nombre_completo,
        email: row.usuario_email
      },
      ubicacion: {
        nombre: row.ubicacion_nombre,
        descripcion: row.ubicacion_descripcion,
        latitud: row.ubicacion_latitud,
        longitud: row.ubicacion_longitud,
        radio_metros: row.radio_metros
      },
      ubicacion_marcaje: {
        latitud: row.latitud_marcaje,
        longitud: row.longitud_marcaje
      },
      horario_asignado: {
        inicio: row.hora_inicio,
        fin: row.hora_fin,
        dias_semana: row.dias_semana
      },
      resultado: {
        dentro_ubicacion: row.dentro_ubicacion,
        distancia_metros: parseFloat(row.distancia_metros || 0),
        estado: row.dentro_ubicacion ? 'Dentro del rango' : 'Fuera del rango'
      },
      observaciones: row.observaciones,
      sucursal: {
        nombre: row.sucursal_nombre
      }
    }));

    res.json({
      success: true,
      data: reporte,
      total: reporte.length,
      filtros: {
        fecha_inicio: fecha_inicio || null,
        fecha_fin: fecha_fin || null,
        usuario_id: usuario_id || null,
        limite: parseInt(limite)
      }
    });

  } catch (error) {
    console.error('Error al obtener reporte de control de asistencia:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de control de asistencia para dashboard
const obtenerEstadisticasControlAsistencia = async (req, res) => {
  try {
    const sucursalId = req.user.id_sucursal;
    const { fecha_inicio, fecha_fin } = req.query;
    
    // Fecha por defecto: últimos 30 días
    const fechaFin = fecha_fin || new Date().toISOString().split('T')[0];
    const fechaInicio = fecha_inicio || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Estadísticas generales
    const queryEstadisticas = `
      SELECT 
        COUNT(*) as total_confirmaciones,
        COUNT(DISTINCT cca.id_usuario_sucursal) as usuarios_activos,
        SUM(CASE WHEN cca.dentro_ubicacion = 1 THEN 1 ELSE 0 END) as confirmaciones_exitosas,
        SUM(CASE WHEN cca.dentro_ubicacion = 0 THEN 1 ELSE 0 END) as confirmaciones_fallidas,
        AVG(CASE WHEN cca.distancia_metros IS NOT NULL AND cca.distancia_metros > 0 THEN cca.distancia_metros ELSE NULL END) as distancia_promedio
      FROM confirmaciones_control_asistencia cca
      INNER JOIN asignaciones_control_asistencia aca ON cca.id_asignacion_control = aca.id
      INNER JOIN usuarios_sucursal us ON cca.id_usuario_sucursal = us.id
      WHERE us.id_sucursal = ? 
        AND cca.fecha_confirmacion BETWEEN ? AND ?
    `;

    const [estadisticas] = await db.pool.execute(queryEstadisticas, [sucursalId, fechaInicio, fechaFin]);

    // Confirmaciones por día
    const queryPorDia = `
      SELECT 
        cca.fecha_confirmacion,
        COUNT(*) as total_dia,
        SUM(CASE WHEN cca.dentro_ubicacion = 1 THEN 1 ELSE 0 END) as exitosas_dia
      FROM confirmaciones_control_asistencia cca
      INNER JOIN asignaciones_control_asistencia aca ON cca.id_asignacion_control = aca.id
      INNER JOIN usuarios_sucursal us ON cca.id_usuario_sucursal = us.id
      WHERE us.id_sucursal = ? 
        AND cca.fecha_confirmacion BETWEEN ? AND ?
      GROUP BY cca.fecha_confirmacion
      ORDER BY cca.fecha_confirmacion DESC
    `;

    const [confirmacionesPorDia] = await db.pool.execute(queryPorDia, [sucursalId, fechaInicio, fechaFin]);

    // Top usuarios más activos
    const queryTopUsuarios = `
      SELECT 
        us.nombre_completo,
        us.correo,
        COUNT(*) as total_confirmaciones,
        SUM(CASE WHEN cca.dentro_ubicacion = 1 THEN 1 ELSE 0 END) as confirmaciones_exitosas
      FROM confirmaciones_control_asistencia cca
      INNER JOIN asignaciones_control_asistencia aca ON cca.id_asignacion_control = aca.id
      INNER JOIN usuarios_sucursal us ON cca.id_usuario_sucursal = us.id
      WHERE us.id_sucursal = ? 
        AND cca.fecha_confirmacion BETWEEN ? AND ?
      GROUP BY us.id, us.nombre_completo, us.correo
      ORDER BY total_confirmaciones DESC
      LIMIT 10
    `;

    const [topUsuarios] = await db.pool.execute(queryTopUsuarios, [sucursalId, fechaInicio, fechaFin]);

    const stats = estadisticas[0];
    const porcentajeExito = stats.total_confirmaciones > 0 
      ? ((stats.confirmaciones_exitosas / stats.total_confirmaciones) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        resumen: {
          total_confirmaciones: stats.total_confirmaciones,
          usuarios_activos: stats.usuarios_activos,
          confirmaciones_exitosas: stats.confirmaciones_exitosas,
          confirmaciones_fallidas: stats.confirmaciones_fallidas,
          porcentaje_exito: parseFloat(porcentajeExito),
          distancia_promedio: parseFloat(stats.distancia_promedio || 0)
        },
        confirmaciones_por_dia: confirmacionesPorDia,
        top_usuarios: topUsuarios.map(user => ({
          nombre_completo: user.nombre_completo,
          email: user.correo,
          total_confirmaciones: user.total_confirmaciones,
          confirmaciones_exitosas: user.confirmaciones_exitosas,
          porcentaje_exito: user.total_confirmaciones > 0 
            ? parseFloat(((user.confirmaciones_exitosas / user.total_confirmaciones) * 100).toFixed(2))
            : 0
        })),
        periodo: {
          fecha_inicio: fechaInicio,
          fecha_fin: fechaFin
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  obtenerAsignacionesHoy,
  registrarConfirmacion,
  obtenerHistorialConfirmaciones,
  obtenerReporteControlAsistencia,
  obtenerEstadisticasControlAsistencia
};