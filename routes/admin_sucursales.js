const express = require('express');
const router = express.Router();
const { verifyToken, checkPermission } = require('../middleware/auth');
const {
    getAdminSucursales,
    getAdminSucursalById,
    createAdminSucursal,
    updateAdminSucursal,
    deleteAdminSucursal,
    getAdminSucursalesActivos,
    getAdminBySucursal
} = require('../controllers/admin_sucursales');

// Rutas públicas (solo requieren autenticación)
router.get('/', verifyToken, checkPermission('admin_sucursales', 'leer'), getAdminSucursales);
router.get('/activos', verifyToken, checkPermission('admin_sucursales', 'leer'), getAdminSucursalesActivos);
router.get('/sucursal/:id_sucursal', verifyToken, checkPermission('admin_sucursales', 'leer'), getAdminBySucursal);
router.get('/:id', verifyToken, checkPermission('admin_sucursales', 'leer'), getAdminSucursalById);

// Rutas protegidas (requieren permisos específicos)
router.post('/', verifyToken, checkPermission('admin_sucursales', 'crear'), createAdminSucursal);
router.put('/:id', verifyToken, checkPermission('admin_sucursales', 'actualizar'), updateAdminSucursal);
router.delete('/:id', verifyToken, checkPermission('admin_sucursales', 'eliminar'), deleteAdminSucursal);

module.exports = router;