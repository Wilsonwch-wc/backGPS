const express = require('express');
const router = express.Router();
const { verifyUsuarioSucursalToken } = require('../middleware/authUsuarioSucursal');
const { verifyAdminSucursalToken } = require('../middleware/auth_sucursales');
const {
  obtenerAsignacionesHoy,
  registrarConfirmacion,
  obtenerHistorialConfirmaciones,
  obtenerReporteControlAsistencia,
  obtenerEstadisticasControlAsistencia
} = require('../controllers/ConfirmacionAsistencia');

// Middleware de autenticación se aplicará individualmente a cada ruta

// ===== RUTAS PARA CONFIRMACIÓN DE ASISTENCIA =====

/**
 * @route GET /api/confirmacion-asistencia/hoy
 * @desc Obtener asignaciones del día actual para el usuario autenticado
 * @access Private (Usuario de Sucursal)
 * @returns {
 *   success: boolean,
 *   data: {
 *     fecha: string,
 *     dia: string,
 *     hora_actual: string,
 *     asignaciones: [{
 *       asignacion_id: number,
 *       ubicacion: {
 *         id: number,
 *         nombre: string,
 *         descripcion: string,
 *         latitud: number,
 *         longitud: number,
 *         radio_metros: number
 *       },
 *       horario: {
 *         inicio: string,
 *         fin: string,
 *         ventana_confirmacion: {
 *           desde: string,
 *           hasta: string
 *         }
 *       },
 *       estado: string, // 'pendiente', 'disponible_confirmacion', 'confirmado', 'confirmado_fuera_rango', 'perdido'
 *       confirmacion: object|null,
 *       puede_confirmar: boolean
 *     }]
 *   }
 * }
 */
router.get('/hoy', verifyUsuarioSucursalToken, obtenerAsignacionesHoy);

/**
 * @route POST /api/confirmacion-asistencia/confirmar
 * @desc Registrar confirmación de asistencia con validación de ubicación
 * @access Private (Usuario de Sucursal)
 * @body {
 *   asignacion_id: number,
 *   latitud: number,
 *   longitud: number,
 *   observaciones?: string
 * }
 * @returns {
 *   success: boolean,
 *   message: string,
 *   data: {
 *     confirmacion_id: number,
 *     ubicacion: string,
 *     distancia_metros: number,
 *     dentro_ubicacion: boolean,
 *     radio_permitido: number,
 *     hora_marcaje: string,
 *     fecha_confirmacion: string
 *   }
 * }
 */
router.post('/confirmar', verifyUsuarioSucursalToken, registrarConfirmacion);

/**
 * @route GET /api/confirmacion-asistencia/historial
 * @desc Obtener historial de confirmaciones del usuario
 * @access Private (Usuario de Sucursal)
 * @query {
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD),
 *   limite?: number (default: 50)
 * }
 * @returns {
 *   success: boolean,
 *   data: [{
 *     id: number,
 *     fecha: string,
 *     hora_marcaje: string,
 *     ubicacion: {
 *       nombre: string,
 *       descripcion: string
 *     },
 *     horario_asignado: {
 *       inicio: string,
 *       fin: string
 *     },
 *     resultado: {
 *       dentro_ubicacion: boolean,
 *       distancia_metros: number
 *     },
 *     observaciones: string|null
 *   }]
 * }
 */
router.get('/historial', verifyUsuarioSucursalToken, obtenerHistorialConfirmaciones);

// ===== RUTAS PARA ADMINISTRADORES DE SUCURSAL =====

/**
 * @route GET /api/confirmacion-asistencia/reporte
 * @desc Obtener reporte de control de asistencia para administradores de sucursal
 * @access Private (Administrador de Sucursal)
 * @query {
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD),
 *   usuario_id?: number,
 *   limite?: number (default: 100)
 * }
 * @returns {
 *   success: boolean,
 *   data: [{
 *     id: number,
 *     fecha_confirmacion: string,
 *     hora_marcaje: string,
 *     usuario: {
 *       nombre: string,
 *       apellido: string,
 *       email: string,
 *       nombre_completo: string
 *     },
 *     ubicacion: {
 *       nombre: string,
 *       descripcion: string,
 *       latitud: number,
 *       longitud: number,
 *       radio_metros: number
 *     },
 *     ubicacion_marcaje: {
 *       latitud: number,
 *       longitud: number
 *     },
 *     resultado: {
 *       dentro_ubicacion: boolean,
 *       distancia_metros: number,
 *       estado: string
 *     },
 *     observaciones: string
 *   }],
 *   total: number,
 *   filtros: object
 * }
 */
router.get('/reporte', verifyAdminSucursalToken, obtenerReporteControlAsistencia);

/**
 * @route GET /api/confirmacion-asistencia/estadisticas
 * @desc Obtener estadísticas de control de asistencia para dashboard de administradores
 * @access Private (Administrador de Sucursal)
 * @query {
 *   fecha_inicio?: string (YYYY-MM-DD),
 *   fecha_fin?: string (YYYY-MM-DD)
 * }
 * @returns {
 *   success: boolean,
 *   data: {
 *     resumen: {
 *       total_confirmaciones: number,
 *       usuarios_activos: number,
 *       confirmaciones_exitosas: number,
 *       confirmaciones_fallidas: number,
 *       porcentaje_exito: number,
 *       distancia_promedio: string
 *     },
 *     confirmaciones_por_dia: array,
 *     top_usuarios: array,
 *     periodo: {
 *       fecha_inicio: string,
 *       fecha_fin: string
 *     }
 *   }
 * }
 */
router.get('/estadisticas', verifyAdminSucursalToken, obtenerEstadisticasControlAsistencia);

// ===== RUTAS DE INFORMACIÓN =====

/**
 * @route GET /api/confirmacion-asistencia/info
 * @desc Obtener información general sobre el sistema de confirmación
 * @access Private (Usuario de Sucursal)
 */
router.get('/info', (req, res) => {
  res.json({
    success: true,
    data: {
      sistema: 'Confirmación de Asistencia GPS',
      version: '1.0.0',
      descripcion: 'Sistema para confirmar asistencia mediante geolocalización',
      ventana_confirmacion: '5 minutos antes y después del horario de inicio',
      usuario: {
        id: req.user.id,
        usuario: req.user.usuario,
        sucursal: req.user.id_sucursal,
        rol: req.user.id_rol
      }
    }
  });
});

module.exports = router;