const express = require('express');
const router = express.Router();
const {
    getUsuariosSucursal,
    getUsuarioSucursalById,
    createUsuarioSucursal,
    updateUsuarioSucursal,
    deleteUsuarioSucursal
} = require('../controllers/usuarios_sucursal');
const { verifyAdminSucursalToken } = require('../middleware/auth_sucursales');

// Aplicar middleware de autenticación a todas las rutas
router.use(verifyAdminSucursalToken);

// GET /api/usuarios-sucursal - Obtener todos los usuarios de sucursal
router.get('/', getUsuariosSucursal);

// GET /api/usuarios-sucursal/:id - Obtener usuario por ID
router.get('/:id', getUsuarioSucursalById);

// POST /api/usuarios-sucursal - Crear nuevo usuario
router.post('/', createUsuarioSucursal);

// PUT /api/usuarios-sucursal/:id - Actualizar usuario
router.put('/:id', updateUsuarioSucursal);

// DELETE /api/usuarios-sucursal/:id - Eliminar usuario
router.delete('/:id', deleteUsuarioSucursal);

module.exports = router;