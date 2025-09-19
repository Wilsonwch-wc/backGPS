const express = require('express');
const router = express.Router();
const { verifyUsuarioSucursalToken } = require('../middleware/authUsuarioSucursal');
const {
  obtenerAsignacionesUsuario,
  obtenerAsignacionesHoy,
  verificarAsignacionesPendientes
} = require('../controllers/ControlAsistencia');

// Middleware de autenticación para todas las rutas
router.use(verifyUsuarioSucursalToken);

// Rutas para usuarios sucursal (solo lectura)

// GET /api/control-asistencia/mis-asignaciones
// Obtener todas las asignaciones del usuario autenticado
router.get('/mis-asignaciones', obtenerAsignacionesUsuario);

// GET /api/control-asistencia/asignaciones-hoy
// Obtener asignaciones del usuario para el día actual
router.get('/asignaciones-hoy', obtenerAsignacionesHoy);

// GET /api/control-asistencia/pendientes
// Verificar asignaciones pendientes de confirmación para hoy
router.get('/pendientes', verificarAsignacionesPendientes);

module.exports = router;