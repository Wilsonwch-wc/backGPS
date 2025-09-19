const express = require('express');
const router = express.Router();
const {
    getRolesUsuariosSucursal,
    getRolUsuarioSucursalById,
    createRolUsuarioSucursal,
    updateRolUsuarioSucursal,
    deleteRolUsuarioSucursal
} = require('../controllers/rol_usuarios_sucursal');
const { verifyAdminSucursalToken } = require('../middleware/auth_sucursales');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyAdminSucursalToken);

// GET /api/rol-usuarios-sucursal - Obtener todos los roles de usuarios
router.get('/', getRolesUsuariosSucursal);

// GET /api/rol-usuarios-sucursal/:id - Obtener rol por ID
router.get('/:id', getRolUsuarioSucursalById);

// POST /api/rol-usuarios-sucursal - Crear nuevo rol
router.post('/', createRolUsuarioSucursal);

// PUT /api/rol-usuarios-sucursal/:id - Actualizar rol
router.put('/:id', updateRolUsuarioSucursal);

// DELETE /api/rol-usuarios-sucursal/:id - Eliminar rol
router.delete('/:id', deleteRolUsuarioSucursal);

module.exports = router;