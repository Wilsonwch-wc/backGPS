const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Generar token JWT
const generateToken = (userId, username, rolId) => {
  return jwt.sign(
    { 
      id: userId, 
      username: username,
      rol_id: rolId 
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// Login de usuario
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar campos requeridos
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username y password son requeridos'
      });
    }

    // Buscar usuario en la base de datos
    const query = `
      SELECT u.*, r.nombre as rol_nombre, r.permisos 
      FROM sp_usuarios u 
      INNER JOIN roles r ON u.rol_id = r.id 
      WHERE u.username = ? AND u.activo = 1
    `;
    
    const users = await executeQuery(query, [username]);
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    const user = users[0];

    // Verificar contraseña (sin hash por ahora)
    if (password !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Actualizar último acceso
    await executeQuery(
      'UPDATE sp_usuarios SET ultimo_acceso = NOW() WHERE id = ?',
      [user.id]
    );

    // Generar token
    const token = generateToken(user.id, user.username, user.rol_id);

    // Respuesta exitosa
    res.json({
      success: true,
      message: 'Login exitoso',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          nombre: user.nombre,
          apellido: user.apellido,
          rol_id: user.rol_id,
          rol_nombre: user.rol_nombre,
          permisos: JSON.parse(user.permisos || '{}')
        }
      }
    });

  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener perfil del usuario autenticado
const getProfile = async (req, res) => {
  try {
    const userId = req.user.id;

    const query = `
      SELECT u.*, r.nombre as rol_nombre, r.permisos 
      FROM sp_usuarios u 
      INNER JOIN roles r ON u.rol_id = r.id 
      WHERE u.id = ? AND u.activo = 1
    `;
    
    const users = await executeQuery(query, [userId]);
    
    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        telefono: user.telefono,
        direccion: user.direccion,
        fecha_nacimiento: user.fecha_nacimiento,
        rol_id: user.rol_id,
        rol_nombre: user.rol_nombre,
        permisos: JSON.parse(user.permisos || '{}'),
        ultimo_acceso: user.ultimo_acceso,
        fecha_creacion: user.fecha_creacion
      }
    });

  } catch (error) {
    console.error('Error al obtener perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Obtener todos los usuarios (solo para administradores)
const getAllUsers = async (req, res) => {
  try {
    const query = `
      SELECT u.id, u.username, u.email, u.nombre, u.apellido, 
             u.telefono, u.activo, u.ultimo_acceso, u.fecha_creacion,
             r.nombre as rol_nombre
      FROM sp_usuarios u 
      INNER JOIN roles r ON u.rol_id = r.id 
      ORDER BY u.fecha_creacion DESC
    `;
    
    const users = await executeQuery(query);

    res.json({
      success: true,
      data: users
    });

  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Crear nuevo usuario
const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      rol_id
    } = req.body;

    // Validar campos requeridos
    if (!username || !email || !password || !nombre || !apellido || !rol_id) {
      return res.status(400).json({
        success: false,
        message: 'Todos los campos requeridos deben ser proporcionados'
      });
    }

    // Verificar si el usuario ya existe
    const existingUser = await executeQuery(
      'SELECT id FROM sp_usuarios WHERE username = ? OR email = ?',
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'El usuario o email ya existe'
      });
    }

    // Crear usuario
    const insertQuery = `
      INSERT INTO sp_usuarios 
      (username, email, password, nombre, apellido, telefono, direccion, fecha_nacimiento, rol_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(insertQuery, [
      username,
      email,
      password, // Sin hash por ahora
      nombre,
      apellido,
      telefono || null,
      direccion || null,
      fecha_nacimiento || null,
      rol_id
    ]);

    res.status(201).json({
      success: true,
      message: 'Usuario creado exitosamente',
      data: {
        id: result.insertId,
        username,
        email,
        nombre,
        apellido
      }
    });

  } catch (error) {
    console.error('Error al crear usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Actualizar usuario
const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      email,
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      rol_id,
      activo
    } = req.body;

    // Verificar si el usuario existe
    const existingUser = await executeQuery(
      'SELECT id FROM sp_usuarios WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Actualizar usuario
    const updateQuery = `
      UPDATE sp_usuarios 
      SET email = ?, nombre = ?, apellido = ?, telefono = ?, 
          direccion = ?, fecha_nacimiento = ?, rol_id = ?, activo = ?
      WHERE id = ?
    `;

    await executeQuery(updateQuery, [
      email,
      nombre,
      apellido,
      telefono,
      direccion,
      fecha_nacimiento,
      rol_id,
      activo,
      id
    ]);

    res.json({
      success: true,
      message: 'Usuario actualizado exitosamente'
    });

  } catch (error) {
    console.error('Error al actualizar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Eliminar usuario (desactivar)
const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar si el usuario existe
    const existingUser = await executeQuery(
      'SELECT id FROM sp_usuarios WHERE id = ?',
      [id]
    );

    if (existingUser.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Desactivar usuario en lugar de eliminarlo
    await executeQuery(
      'UPDATE sp_usuarios SET activo = 0 WHERE id = ?',
      [id]
    );

    res.json({
      success: true,
      message: 'Usuario desactivado exitosamente'
    });

  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }

    // Obtener usuario actual
    const users = await executeQuery(
      'SELECT password FROM sp_usuarios WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    const user = users[0];

    // Verificar contraseña actual
    if (currentPassword !== user.password) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Actualizar contraseña
    await executeQuery(
      'UPDATE sp_usuarios SET password = ? WHERE id = ?',
      [newPassword, userId] // Sin hash por ahora
    );

    res.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });

  } catch (error) {
    console.error('Error al cambiar contraseña:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  login,
  getProfile,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  changePassword
};