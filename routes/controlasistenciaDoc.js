const express = require('express');
const router = express.Router();
const {
    obtenerAsignaciones,
    obtenerAsignacionesPorSucursal,
    crearAsignacion,
    actualizarAsignacion,
    eliminarAsignacion,
    obtenerAsignacionesPorUsuario,
    verificarAsistenciaPermitida
} = require('../controllers/controlasistenciaDoc');
const { verifyAdminSucursalToken } = require('../middleware/auth_sucursales');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyAdminSucursalToken);

// GET /api/control-asistencia - Obtener todas las asignaciones
router.get('/', obtenerAsignaciones);

// GET /api/control-asistencia/sucursal - Obtener asignaciones por sucursal del admin autenticado
router.get('/sucursal', obtenerAsignacionesPorSucursal);

// GET /api/control-asistencia/usuario/:id - Obtener asignaciones por usuario
router.get('/usuario/:id', obtenerAsignacionesPorUsuario);

// POST /api/control-asistencia/verificar - Verificar si se puede marcar asistencia
router.post('/verificar', verificarAsistenciaPermitida);

// POST /api/control-asistencia - Crear nueva asignación
router.post('/', crearAsignacion);

// PUT /api/control-asistencia/:id - Actualizar asignación
router.put('/:id', actualizarAsignacion);

// DELETE /api/control-asistencia/:id - Eliminar asignación
router.delete('/:id', eliminarAsignacion);

module.exports = router;