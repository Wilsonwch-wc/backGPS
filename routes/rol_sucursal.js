const express = require('express');
const router = express.Router();
const { verifyToken, checkPermission } = require('../middleware/auth');
const {
    getRolesSucursal,
    getRolSucursalById,
    createRolSucursal,
    updateRolSucursal,
    deleteRolSucursal
} = require('../controllers/rol_sucursal');

// Rutas públicas (solo requieren autenticación)
router.get('/', verifyToken, checkPermission('sucursales', 'leer'), getRolesSucursal);
router.get('/:id', verifyToken, checkPermission('sucursales', 'leer'), getRolSucursalById);

// Rutas protegidas (requieren permisos específicos)
router.post('/', verifyToken, checkPermission('sucursales', 'crear'), createRolSucursal);
router.put('/:id', verifyToken, checkPermission('sucursales', 'actualizar'), updateRolSucursal);
router.delete('/:id', verifyToken, checkPermission('sucursales', 'eliminar'), deleteRolSucursal);

module.exports = router;