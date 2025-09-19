const { executeQuery } = require('../config/database');

// Obtener asignaciones de control de asistencia para un usuario específico
const obtenerAsignacionesUsuario = async (req, res) => {
  try {
    const id_usuario_sucursal = req.user.id; // ID del usuario autenticado

    const query = `
      SELECT 
        aca.id,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        aca.fecha_creacion,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        uc.latitud,
        uc.longitud,
        uc.radio_metros,
        us.nombre_completo as usuario_nombre,
        s.nombre as sucursal_nombre
      FROM asignaciones_control_asistencia aca
      INNER JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      INNER JOIN sucursales s ON us.id_sucursal = s.id
      WHERE aca.id_usuario_sucursal = ? 
        AND aca.activo = 1 
        AND us.activo = 1 
        AND uc.activa = 1
      ORDER BY aca.fecha_creacion DESC
    `;

    const asignaciones = await executeQuery(query, [id_usuario_sucursal]);

    // Procesar los días de la semana (convertir de JSON string a array)
    const asignacionesProcesadas = asignaciones.map(asignacion => {
      let diasSemana = [];
      try {
        diasSemana = JSON.parse(asignacion.dias_semana);
      } catch (error) {
        console.error('Error al parsear dias_semana:', error);
        diasSemana = [];
      }

      return {
        ...asignacion,
        dias_semana: diasSemana
      };
    });

    res.json({
      success: true,
      message: 'Asignaciones obtenidas exitosamente',
      data: asignacionesProcesadas
    });

  } catch (error) {
    console.error('Error al obtener asignaciones del usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener asignaciones activas para hoy
const obtenerAsignacionesHoy = async (req, res) => {
  try {
    const id_usuario_sucursal = req.user.id;
    const hoy = new Date();
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaHoy = diasSemana[hoy.getDay()];

    const query = `
      SELECT 
        aca.id,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        uc.nombre as ubicacion_nombre,
        uc.descripcion as ubicacion_descripcion,
        uc.latitud,
        uc.longitud,
        uc.radio_metros
      FROM asignaciones_control_asistencia aca
      INNER JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      WHERE aca.id_usuario_sucursal = ? 
        AND aca.activo = 1 
        AND us.activo = 1 
        AND uc.activa = 1
    `;

    const asignaciones = await executeQuery(query, [id_usuario_sucursal]);

    // Filtrar asignaciones que corresponden al día de hoy
    const asignacionesHoy = asignaciones.filter(asignacion => {
      let diasSemana = [];
      try {
        diasSemana = JSON.parse(asignacion.dias_semana);
      } catch (error) {
        console.error('Error al parsear dias_semana:', error);
        return false;
      }
      
      return diasSemana.includes(diaHoy);
    }).map(asignacion => {
      let diasSemana = [];
      try {
        diasSemana = JSON.parse(asignacion.dias_semana);
      } catch (error) {
        diasSemana = [];
      }

      return {
        ...asignacion,
        dias_semana: diasSemana,
        dia_actual: diaHoy
      };
    });

    res.json({
      success: true,
      message: `Asignaciones para hoy (${diaHoy}) obtenidas exitosamente`,
      data: asignacionesHoy,
      dia_actual: diaHoy
    });

  } catch (error) {
    console.error('Error al obtener asignaciones de hoy:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Verificar si el usuario tiene asignaciones pendientes
const verificarAsignacionesPendientes = async (req, res) => {
  try {
    const id_usuario_sucursal = req.user.id;
    const hoy = new Date();
    const fechaHoy = hoy.toISOString().split('T')[0]; // YYYY-MM-DD
    const diasSemana = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
    const diaHoy = diasSemana[hoy.getDay()];

    // Obtener asignaciones activas
    const queryAsignaciones = `
      SELECT 
        aca.id,
        aca.dias_semana,
        aca.hora_inicio,
        aca.hora_fin,
        uc.nombre as ubicacion_nombre
      FROM asignaciones_control_asistencia aca
      INNER JOIN usuarios_sucursal us ON aca.id_usuario_sucursal = us.id
      INNER JOIN ubicaciones_control uc ON aca.id_ubicacion_control = uc.id
      WHERE aca.id_usuario_sucursal = ? 
        AND aca.activo = 1 
        AND us.activo = 1 
        AND uc.activa = 1
    `;

    const asignaciones = await executeQuery(queryAsignaciones, [id_usuario_sucursal]);

    // Filtrar asignaciones para hoy
    const asignacionesHoy = asignaciones.filter(asignacion => {
      let diasSemana = [];
      try {
        diasSemana = JSON.parse(asignacion.dias_semana);
      } catch (error) {
        return false;
      }
      return diasSemana.includes(diaHoy);
    });

    // Verificar confirmaciones ya realizadas hoy
    const queryConfirmaciones = `
      SELECT id_asignacion_control
      FROM confirmaciones_control_asistencia
      WHERE id_usuario_sucursal = ? 
        AND fecha_confirmacion = ?
    `;

    const confirmacionesHoy = await executeQuery(queryConfirmaciones, [id_usuario_sucursal, fechaHoy]);
    const asignacionesConfirmadas = confirmacionesHoy.map(c => c.id_asignacion_control);

    // Filtrar asignaciones pendientes (no confirmadas)
    const asignacionesPendientes = asignacionesHoy.filter(asignacion => 
      !asignacionesConfirmadas.includes(asignacion.id)
    );

    res.json({
      success: true,
      message: 'Verificación de asignaciones pendientes completada',
      data: {
        total_asignaciones_hoy: asignacionesHoy.length,
        confirmadas: confirmacionesHoy.length,
        pendientes: asignacionesPendientes.length,
        asignaciones_pendientes: asignacionesPendientes,
        dia_actual: diaHoy,
        fecha: fechaHoy
      }
    });

  } catch (error) {
    console.error('Error al verificar asignaciones pendientes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  obtenerAsignacionesUsuario,
  obtenerAsignacionesHoy,
  verificarAsignacionesPendientes
};