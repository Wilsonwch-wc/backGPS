const express = require('express');
const router = express.Router();
const {
    crearUbicacion,
    obtenerUbicacionesPorSucursal,
    obtenerUbicacionPorId,
    actualizarUbicacion,
    eliminarUbicacion,
    validarUbicacionUsuario,
    obtenerUbicacionesCercanas
} = require('../controllers/ubiGps');

// Middleware de autenticación (ajustar según tu sistema)
const authMiddleware = require('../middleware/auth'); // Para admins generales
const { verifyAdminSucursalToken } = require('../middleware/auth_sucursales'); // Para admins de sucursal
const { verifyUsuarioSucursalToken } = require('../middleware/authUsuarioSucursal'); // Para usuarios de sucursal

// =====================================================
// RUTAS DE PRUEBA SIN AUTENTICACIÓN
// =====================================================

// Ruta simple para probar conectividad sin token
// GET /api/ubicaciones-gps/ping
router.get('/ping', (req, res) => {
    res.json({
        success: true,
        message: 'API de ubicaciones GPS conectada correctamente',
        timestamp: new Date().toISOString(),
        status: 'OK',
        endpoint: '/api/ubicaciones-gps'
    });
});

// Ruta de prueba para verificar conectividad
// GET /api/ubicaciones-gps/test
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: 'API de ubicaciones GPS funcionando correctamente',
        timestamp: new Date().toISOString()
    });
});

// =====================================================
// RUTAS PARA ADMINISTRADORES DE SUCURSAL
// =====================================================

// Crear nueva ubicación de control GPS
// POST /api/ubicaciones-gps
router.post('/', verifyAdminSucursalToken, crearUbicacion);

// Obtener todas las ubicaciones de una sucursal
// GET /api/ubicaciones-gps/sucursal/:sucursal_id
router.get('/sucursal/:sucursal_id', verifyAdminSucursalToken, obtenerUbicacionesPorSucursal);

// Obtener una ubicación específica por ID
// GET /api/ubicaciones-gps/:id
router.get('/:id', verifyAdminSucursalToken, obtenerUbicacionPorId);

// Actualizar ubicación existente
// PUT /api/ubicaciones-gps/:id
router.put('/:id', verifyAdminSucursalToken, actualizarUbicacion);

// Eliminar ubicación
// DELETE /api/ubicaciones-gps/:id
router.delete('/:id', verifyAdminSucursalToken, eliminarUbicacion);

// =====================================================
// RUTAS PARA USUARIOS DE SUCURSAL (VALIDACIÓN DE ASISTENCIA)
// =====================================================

// Validar si un usuario está dentro del rango de una ubicación
// POST /api/ubicaciones-gps/:ubicacion_id/validar
router.post('/:ubicacion_id/validar', verifyUsuarioSucursalToken, validarUbicacionUsuario);

// Obtener ubicaciones cercanas a la posición del usuario
// GET /api/ubicaciones-gps/sucursal/:sucursal_id/cercanas?latitud=X&longitud=Y&radio_busqueda=Z
router.get('/sucursal/:sucursal_id/cercanas', verifyUsuarioSucursalToken, obtenerUbicacionesCercanas);

// =====================================================
// RUTAS ADICIONALES (OPCIONALES)
// =====================================================

// Ruta para obtener ubicaciones activas de una sucursal (sin autenticación estricta)
// Útil para mostrar ubicaciones disponibles en interfaces públicas
// GET /api/ubicaciones-gps/sucursal/:sucursal_id/activas
router.get('/sucursal/:sucursal_id/activas', async (req, res) => {
    try {
        const { sucursal_id } = req.params;
        const db = require('../config/database');
        
        const query = `
            SELECT 
                id,
                nombre,
                descripcion,
                latitud,
                longitud,
                radio_metros
            FROM ubicaciones_control 
            WHERE sucursal_id = ? AND activa = TRUE
            ORDER BY nombre ASC
        `;
        
        const [ubicaciones] = await db.pool.execute(query, [sucursal_id]);
        
        res.json({
            success: true,
            data: ubicaciones
        });
        
    } catch (error) {
        console.error('Error al obtener ubicaciones activas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
});

module.exports = router;

// =====================================================
// DOCUMENTACIÓN DE USO:
// =====================================================

/*
EJEMPLOS DE USO:

1. CREAR UBICACIÓN (Admin de sucursal):
POST /api/ubicaciones-gps
Headers: { Authorization: "Bearer <token_admin_sucursal>" }
Body: {
    "nombre": "Sede Principal - Entrada",
    "descripcion": "Entrada principal del edificio",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "radio_metros": 100,
    "sucursal_id": 1
}

2. OBTENER UBICACIONES DE SUCURSAL:
GET /api/ubicaciones-gps/sucursal/1
Headers: { Authorization: "Bearer <token_admin_sucursal>" }

3. VALIDAR UBICACIÓN DE USUARIO:
POST /api/ubicaciones-gps/5/validar
Headers: { Authorization: "Bearer <token_usuario_sucursal>" }
Body: {
    "latitud_usuario": -12.0465,
    "longitud_usuario": -77.0429
}

4. BUSCAR UBICACIONES CERCANAS:
GET /api/ubicaciones-gps/sucursal/1/cercanas?latitud=-12.0464&longitud=-77.0428&radio_busqueda=500
Headers: { Authorization: "Bearer <token_usuario_sucursal>" }

5. ACTUALIZAR UBICACIÓN:
PUT /api/ubicaciones-gps/5
Headers: { Authorization: "Bearer <token_admin_sucursal>" }
Body: {
    "nombre": "Nuevo nombre",
    "radio_metros": 150,
    "activa": false
}

6. ELIMINAR UBICACIÓN:
DELETE /api/ubicaciones-gps/5
Headers: { Authorization: "Bearer <token_admin_sucursal>" }

NOTAS IMPORTANTES:
- Todas las rutas requieren autenticación apropiada
- Las coordenadas deben estar en formato decimal (ej: -12.0464)
- El radio debe estar entre 10 y 1000 metros
- Las respuestas incluyen validaciones y mensajes descriptivos
- Los errores se manejan con códigos HTTP apropiados
*/