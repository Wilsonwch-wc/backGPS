const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Middleware para verificar token de usuario de sucursal
const verifyUsuarioSucursalToken = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Verificar que sea un token de usuario de sucursal
    if (decoded.tipo !== 'usuario_sucursal') {
      return res.status(403).json({
        success: false,
        message: 'Token no válido para este tipo de usuario'
      });
    }

    // Verificar que el usuario siga activo
    const query = `
      SELECT 
        u.id,
        u.usuario,
        u.id_sucursal,
        u.id_rol,
        u.activo,
        s.activo as sucursal_activa,
        r.activo as rol_activo
      FROM usuarios_sucursal u
      JOIN sucursales s ON u.id_sucursal = s.id
      JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
      WHERE u.id = ?
    `;

    const [rows] = await db.pool.execute(query, [decoded.id]);

    if (rows.length === 0 || !rows[0].activo || !rows[0].sucursal_activa || !rows[0].rol_activo) {
      return res.status(401).json({
        success: false,
        message: 'Usuario, sucursal o rol inactivo'
      });
    }

    // Agregar información del usuario al request
    req.user = {
      id: decoded.id,
      usuario: decoded.usuario,
      id_sucursal: decoded.id_sucursal,
      id_rol: decoded.id_rol,
      tipo: 'usuario_sucursal'
    };

    next();

  } catch (error) {
    console.error('Error en verificación de token usuario sucursal:', error);
    
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

    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Middleware para verificar permisos de rol específico
const verifyRolePermission = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const query = `
        SELECT r.nombre_rol
        FROM usuarios_sucursal u
        JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
        WHERE u.id = ? AND u.activo = 1 AND r.activo = 1
      `;

      const [rows] = await db.pool.execute(query, [userId]);

      if (rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'Usuario o rol no encontrado'
        });
      }

      const userRole = rows[0].nombre_rol;

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: 'No tienes permisos para acceder a este recurso'
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

// Middleware para filtrar datos por sucursal del usuario
const filterBySucursal = (req, res, next) => {
  // Agregar el id_sucursal del usuario a los filtros de la consulta
  req.sucursalFilter = req.user.id_sucursal;
  next();
};

module.exports = {
  verifyUsuarioSucursalToken,
  verifyRolePermission,
  filterBySucursal
};