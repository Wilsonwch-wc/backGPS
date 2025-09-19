// Eliminado bcrypt - usando texto plano
const jwt = require('jsonwebtoken');
const { pool } = require('../config/database');

// Login para usuarios de sucursal
const loginUsuarioSucursal = async (req, res) => {
  try {
    const { usuario, password } = req.body;

    // Validar campos requeridos
    if (!usuario || !password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    // Buscar usuario con sucursal y rol (sin filtrar por id_sucursal)
    const query = `
      SELECT 
        u.id,
        u.usuario,
        u.password,
        u.correo,
        u.nombre_completo,
        u.id_sucursal,
        u.id_rol,
        u.activo,
        s.nombre as sucursal_nombre,
        s.descripcion as sucursal_descripcion,
        s.activo as sucursal_activa,
        r.nombre_rol,
        r.descripcion as rol_descripcion
      FROM usuarios_sucursal u
      JOIN sucursales s ON u.id_sucursal = s.id
      JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
      WHERE u.usuario = ? AND u.activo = 1 AND s.activo = 1 AND r.activo = 1
    `;

    const [rows] = await pool.execute(query, [usuario]);

    if (rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas o usuario inactivo'
      });
    }

    const user = rows[0];

    // Verificar contraseña
    const isValidPassword = password === user.password;
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        usuario: user.usuario,
        id_sucursal: user.id_sucursal,
        id_rol: user.id_rol,
        tipo: 'usuario_sucursal'
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      token,
      user: {
        id: user.id,
        usuario: user.usuario,
        correo: user.correo,
        nombre_completo: user.nombre_completo,
        activo: user.activo,
        sucursal: {
          id: user.id_sucursal,
          nombre: user.sucursal_nombre,
          descripcion: user.sucursal_descripcion
        },
        rol: {
          id: user.id_rol,
          nombre: user.nombre_rol,
          descripcion: user.rol_descripcion
        }
      }
    });

  } catch (error) {
    console.error('Error en login usuario sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario de sucursal
const getProfileUsuarioSucursal = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT 
        u.id,
        u.usuario,
        u.correo,
        u.nombre_completo,
        u.id_sucursal,
        u.id_rol,
        u.activo,
        s.nombre as sucursal_nombre,
        s.descripcion as sucursal_descripcion,
        s.activo as sucursal_activa,
        r.nombre_rol,
        r.descripcion as rol_descripcion
      FROM usuarios_sucursal u
      JOIN sucursales s ON u.id_sucursal = s.id
      JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
      WHERE u.id = ? AND u.activo = 1 AND s.activo = 1 AND r.activo = 1
    `;

    const [rows] = await pool.execute(query, [userId]);

    if (rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado o inactivo'
      });
    }

    const user = rows[0];

    res.json({
      success: true,
      user: {
        id: user.id,
        usuario: user.usuario,
        correo: user.correo,
        nombre_completo: user.nombre_completo,
        activo: user.activo,
        sucursal: {
          id: user.id_sucursal,
          nombre: user.sucursal_nombre,
          descripcion: user.sucursal_descripcion
        },
        rol: {
          id: user.id_rol,
          nombre: user.nombre_rol,
          descripcion: user.rol_descripcion
        }
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil usuario sucursal:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Logout
const logoutUsuarioSucursal = (req, res) => {
  res.json({
    success: true,
    message: 'Logout exitoso'
  });
};

module.exports = {
  loginUsuarioSucursal,
  getProfileUsuarioSucursal,
  logoutUsuarioSucursal
};