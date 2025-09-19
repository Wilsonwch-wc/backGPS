const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Middleware para verificar token de administrador de sucursal
const verifyAdminSucursalToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7); // Remover 'Bearer '
    
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'tu_clave_secreta');
    
    // Verificar que sea un token de admin_sucursal
    if (decoded.tipo !== 'admin_sucursal') {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Token inválido para administrador de sucursal'
      });
    }

    // Verificar que el administrador siga activo
    const query = `
      SELECT 
        a.id,
        a.usuario,
        a.activo,
        a.id_sucursal,
        s.activo as sucursal_activa
      FROM admin_sucursales a
      INNER JOIN sucursales s ON a.id_sucursal = s.id
      WHERE a.id = ?
    `;
    
    const admins = await executeQuery(query, [decoded.id]);
    
    if (admins.length === 0 || !admins[0].activo || !admins[0].sucursal_activa) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Usuario o sucursal inactivos'
      });
    }

    // Agregar información del usuario a la request
    req.user = {
      id: decoded.id,
      usuario: decoded.usuario,
      tipo: decoded.tipo,
      id_sucursal: decoded.id_sucursal
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

    console.error('Error en verificación de token admin sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar que el admin solo acceda a datos de su sucursal
const checkSucursalAccess = (req, res, next) => {
  try {
    const userSucursalId = req.user.id_sucursal;
    const requestedSucursalId = req.params.id_sucursal || req.body.id_sucursal || req.query.id_sucursal;
    
    // Si se especifica una sucursal en la request, verificar que coincida
    if (requestedSucursalId && parseInt(requestedSucursalId) !== parseInt(userSucursalId)) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado. Solo puede acceder a datos de su sucursal'
      });
    }
    
    // Agregar el id de sucursal del usuario a la request para filtrar datos
    req.sucursal_id = userSucursalId;
    
    next();
    
  } catch (error) {
    console.error('Error en verificación de acceso a sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  verifyAdminSucursalToken,
  checkSucursalAccess
};