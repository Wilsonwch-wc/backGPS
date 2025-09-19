const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Login para administradores de sucursales
const loginAdminSucursal = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar el administrador de sucursal con información de la sucursal
    const query = `
      SELECT 
        a.id,
        a.usuario,
        a.correo,
        a.password,
        a.activo,
        a.id_sucursal,
        s.nombre as sucursal_nombre,
        s.descripcion as sucursal_descripcion,
        s.direccion as sucursal_direccion,
        s.telefono as sucursal_telefono,
        rs.nombre as tipo_sucursal
      FROM admin_sucursales a
      INNER JOIN sucursales s ON a.id_sucursal = s.id
      LEFT JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id
      WHERE a.usuario = ? AND a.activo = 1 AND s.activo = 1
    `;
    
    const admins = await executeQuery(query, [usuario]);
    
    if (admins.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const admin = admins[0];

    // Verificar contraseña (comparación directa sin hash)
    const isValidPassword = password === admin.password;
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      { 
        id: admin.id, 
        usuario: admin.usuario,
        tipo: 'admin_sucursal',
        id_sucursal: admin.id_sucursal
      },
      process.env.JWT_SECRET || 'tu_clave_secreta',
      { expiresIn: '24h' }
    );

    // Actualizar último acceso
    await executeQuery(
      'UPDATE admin_sucursales SET fecha_actualizacion = CURRENT_TIMESTAMP WHERE id = ?',
      [admin.id]
    );

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        admin: {
          id: admin.id,
          usuario: admin.usuario,
          correo: admin.correo,
          activo: admin.activo,
          sucursal: {
            id: admin.id_sucursal,
            nombre: admin.sucursal_nombre,
            descripcion: admin.sucursal_descripcion,
            direccion: admin.sucursal_direccion,
            telefono: admin.sucursal_telefono,
            tipo: admin.tipo_sucursal
          }
        }
      }
    });

  } catch (error) {
    console.error('Error en login admin sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del administrador de sucursal
const getProfileAdminSucursal = async (req, res) => {
  try {
    const adminId = req.user.id;

    const query = `
      SELECT 
        a.id,
        a.usuario,
        a.correo,
        a.activo,
        a.id_sucursal,
        s.nombre as sucursal_nombre,
        s.descripcion as sucursal_descripcion,
        s.direccion as sucursal_direccion,
        s.telefono as sucursal_telefono,
        rs.nombre as tipo_sucursal
      FROM admin_sucursales a
      INNER JOIN sucursales s ON a.id_sucursal = s.id
      LEFT JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id
      WHERE a.id = ? AND a.activo = 1
    `;
    
    const admins = await executeQuery(query, [adminId]);
    
    if (admins.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Administrador no encontrado'
      });
    }

    const admin = admins[0];

    res.json({
      success: true,
      data: {
        admin: {
          id: admin.id,
          usuario: admin.usuario,
          correo: admin.correo,
          activo: admin.activo,
          sucursal: {
            id: admin.id_sucursal,
            nombre: admin.sucursal_nombre,
            descripcion: admin.sucursal_descripcion,
            direccion: admin.sucursal_direccion,
            telefono: admin.sucursal_telefono,
            tipo: admin.tipo_sucursal
          }
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil admin sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  loginAdminSucursal,
  getProfileAdminSucursal
};