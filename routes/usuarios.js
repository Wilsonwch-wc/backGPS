const express = require('express');
const router = express.Router();
const {
  login,
  getProfile,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword
} = require('../controllers/usuarios');
const { verifyToken, checkPermission, isAdmin } = require('../middleware/auth');

// Rutas públicas (sin autenticación)
router.post('/login', login);

// Rutas protegidas (requieren autenticación)
router.get('/profile', verifyToken, getProfile);
router.put('/change-password', verifyToken, changePassword);

// Rutas de administración de usuarios (requieren permisos específicos)
router.get('/', verifyToken, checkPermission('usuarios', 'leer'), getAllUsers);
router.post('/', verifyToken, checkPermission('usuarios', 'crear'), createUser);
router.put('/:id', verifyToken, checkPermission('usuarios', 'actualizar'), updateUser);
router.delete('/:id', verifyToken, checkPermission('usuarios', 'eliminar'), deleteUser);

module.exports = router;