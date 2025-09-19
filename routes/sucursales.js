const express = require('express');
const router = express.Router();
const { verifyToken, checkPermission } = require('../middleware/auth');
const {
    getSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    deleteSucursal,
    getSucursalesActivas
} = require('../controllers/sucursales');

// Rutas públicas (solo requieren autenticación)
router.get('/', verifyToken, checkPermission('sucursales', 'leer'), getSucursales);
router.get('/activas', verifyToken, checkPermission('sucursales', 'leer'), getSucursalesActivas);
router.get('/:id', verifyToken, checkPermission('sucursales', 'leer'), getSucursalById);

// Rutas protegidas (requieren permisos específicos)
router.post('/', verifyToken, checkPermission('sucursales', 'crear'), createSucursal);
router.put('/:id', verifyToken, checkPermission('sucursales', 'actualizar'), updateSucursal);
router.delete('/:id', verifyToken, checkPermission('sucursales', 'eliminar'), deleteSucursal);

module.exports = router;