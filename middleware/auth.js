const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware para verificar token JWT
const verifyToken = async (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que el usuario aún existe y está activo
    const users = await executeQuery(
      'SELECT id, username, rol_id, activo FROM sp_usuarios WHERE id = ? AND activo = 1',
      [decoded.id]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido o usuario inactivo'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      rol_id: decoded.rol_id
    };

    next();

  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    console.error('Error en verificación de token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos específicos
const checkPermission = (resource, action) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Obtener permisos del usuario
      const query = `
        SELECT r.permisos 
        FROM sp_usuarios u 
        INNER JOIN roles r ON u.rol_id = r.id 
        WHERE u.id = ? AND u.activo = 1
      `;
      
      const users = await executeQuery(query, [userId]);
      
      if (users.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado'
        });
      }

      const permisos = JSON.parse(users[0].permisos || '{}');
      
      // Verificar si tiene el permiso específico
      if (!permisos[resource] || !permisos[resource][action]) {
        return res.status(403).json({
          success: false,
          message: `No tienes permisos para ${action} ${resource}`
        });
      }

      next();

    } catch (error) {
      console.error('Error en verificación de permisos:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  };
};

// Middleware para verificar si es administrador
const isAdmin = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT r.nombre 
      FROM sp_usuarios u 
      INNER JOIN roles r ON u.rol_id = r.id 
      WHERE u.id = ? AND u.activo = 1
    `;
    
    const users = await executeQuery(query, [userId]);
    
    if (users.length === 0 || users[0].nombre !== 'Administrador') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Se requieren permisos de administrador'
      });
    }

    next();

  } catch (error) {
    console.error('Error en verificación de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  verifyToken,
  checkPermission,
  isAdmin
};