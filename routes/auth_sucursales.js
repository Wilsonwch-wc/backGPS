const express = require('express');
const router = express.Router();
const {
  loginAdminSucursal,
  getProfileAdminSucursal
} = require('../controllers/auth_sucursales');
const { verifyAdminSucursalToken } = require('../middleware/auth_sucursales');

// Rutas públicas (sin autenticación)
router.post('/login', loginAdminSucursal);

// Rutas protegidas (requieren autenticación de admin sucursal)
router.get('/profile', verifyAdminSucursalToken, getProfileAdminSucursal);

module.exports = router;