const express = require('express');
const router = express.Router();
const {
  loginUsuarioSucursal,
  getProfileUsuarioSucursal,
  logoutUsuarioSucursal
} = require('../controllers/auth_usuarios_sucursal');
const { verifyUsuarioSucursalToken } = require('../middleware/authUsuarioSucursal');

// Rutas públicas
router.post('/login', loginUsuarioSucursal);

// Rutas protegidas
router.get('/profile', verifyUsuarioSucursalToken, getProfileUsuarioSucursal);
router.post('/logout', verifyUsuarioSucursalToken, logoutUsuarioSucursal);

module.exports = router;