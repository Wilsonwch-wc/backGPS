const { executeQuery, executeQueryWithResult } = require('../config/database');

// Obtener todos los usuarios de sucursal
const getUsuariosSucursal = async (req, res) => {
    try {
        const id_sucursal = req.user.id_sucursal;
        
        const query = `
            SELECT u.*, r.nombre_rol, r.descripcion, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM usuarios_sucursal u
            LEFT JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
            LEFT JOIN admin_sucursales a ON u.id_admin_creador = a.id
            LEFT JOIN sucursales s ON u.id_sucursal = s.id
            WHERE u.activo = 1 AND u.id_sucursal = ?
            ORDER BY u.nombre_completo ASC
        `;
        
        const rows = await executeQuery(query, [id_sucursal]);
        
        // Remover password de la respuesta
        const usuarios = rows.map(user => {
            const { password, ...userWithoutPassword } = user;
            return userWithoutPassword;
        });
        
        res.json({
            success: true,
            data: usuarios
        });
    } catch (error) {
        console.error('Error al obtener usuarios de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener usuario de sucursal por ID
const getUsuarioSucursalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const rows = await executeQuery(`
            SELECT u.*, r.nombre_rol, r.descripcion, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM usuarios_sucursal u
            LEFT JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
            LEFT JOIN admin_sucursales a ON u.id_admin_creador = a.id
            LEFT JOIN sucursales s ON u.id_sucursal = s.id
            WHERE u.id = ? AND u.activo = 1
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        // Remover password de la respuesta
        const { password, ...userWithoutPassword } = rows[0];
        
        res.json({
            success: true,
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error al obtener usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Crear nuevo usuario de sucursal
const createUsuarioSucursal = async (req, res) => {
    try {
        const { usuario, password, correo, nombre_completo, id_sucursal, id_rol } = req.body;
        const id_admin_creador = req.user.id; // Del middleware de autenticación
        
        // Validaciones
        if (!usuario || !password || !correo || !nombre_completo || !id_sucursal || !id_rol) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son requeridos'
            });
        }
        
        // Verificar que el admin pertenece a la sucursal
        const adminCheck = await executeQuery(
            'SELECT id FROM admin_sucursales WHERE id = ? AND id_sucursal = ?',
            [id_admin_creador, id_sucursal]
        );
        
        if (adminCheck.length === 0) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para crear usuarios en esta sucursal'
            });
        }
        
        // Verificar que el rol pertenece a la misma sucursal
        const rolCheck = await executeQuery(
            'SELECT id FROM rol_usuarios_sucursal WHERE id = ? AND id_sucursal = ? AND activo = 1',
            [id_rol, id_sucursal]
        );
        
        if (rolCheck.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El rol seleccionado no es válido para esta sucursal'
            });
        }
        
        // Verificar si ya existe un usuario con el mismo nombre en la misma sucursal
        const existingUser = await executeQuery(
            'SELECT id FROM usuarios_sucursal WHERE usuario = ? AND id_sucursal = ? AND activo = 1',
            [usuario, id_sucursal]
        );
        
        if (existingUser.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con ese nombre en esta sucursal'
            });
        }
        
        // Verificar si ya existe un usuario con el mismo correo
        const existingEmail = await executeQuery(
            'SELECT id FROM usuarios_sucursal WHERE correo = ? AND activo = 1',
            [correo]
        );
        
        if (existingEmail.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un usuario con ese correo electrónico'
            });
        }
        
        const result = await executeQueryWithResult(
            'INSERT INTO usuarios_sucursal (usuario, password, correo, nombre_completo, id_sucursal, id_admin_creador, id_rol) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [usuario, password, correo, nombre_completo, id_sucursal, id_admin_creador, id_rol]
        );
        
        // Obtener el usuario creado
        const newUser = await executeQuery(`
            SELECT u.*, r.nombre_rol, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM usuarios_sucursal u
            LEFT JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
            LEFT JOIN admin_sucursales a ON u.id_admin_creador = a.id
            LEFT JOIN sucursales s ON u.id_sucursal = s.id
            WHERE u.id = ?
        `, [result.insertId]);
        
        // Remover password de la respuesta
        const { password: _, ...userWithoutPassword } = newUser[0];
        
        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error al crear usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar usuario de sucursal
const updateUsuarioSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, correo, nombre_completo, id_rol, password } = req.body;
        const id_admin = req.user.id;
        
        // Verificar si el usuario existe y pertenece a la sucursal del admin
        const existing = await executeQuery(`
            SELECT u.*, a.id_sucursal as admin_sucursal
            FROM usuarios_sucursal u
            LEFT JOIN admin_sucursales a ON a.id = ?
            WHERE u.id = ? AND u.activo = 1
        `, [id_admin, id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const user = existing[0];
        
        // Verificar que el admin puede modificar este usuario (misma sucursal)
        if (user.id_sucursal !== user.admin_sucursal) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar este usuario'
            });
        }
        
        // Verificar si ya existe otro usuario con el mismo nombre en la misma sucursal
        if (usuario) {
            const userCheck = await executeQuery(
                'SELECT id FROM usuarios_sucursal WHERE usuario = ? AND id_sucursal = ? AND id != ? AND activo = 1',
                [usuario, user.id_sucursal, id]
            );
            
            if (userCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro usuario con ese nombre en esta sucursal'
                });
            }
        }
        
        // Verificar si ya existe otro usuario con el mismo correo
        if (correo) {
            const emailCheck = await executeQuery(
                'SELECT id FROM usuarios_sucursal WHERE correo = ? AND id != ? AND activo = 1',
                [correo, id]
            );
            
            if (emailCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro usuario con ese correo electrónico'
                });
            }
        }
        
        // Verificar que el rol pertenece a la misma sucursal
        if (id_rol) {
            const rolCheck = await executeQuery(
                'SELECT id FROM rol_usuarios_sucursal WHERE id = ? AND id_sucursal = ? AND activo = 1',
                [id_rol, user.id_sucursal]
            );
            
            if (rolCheck.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El rol seleccionado no es válido para esta sucursal'
                });
            }
        }
        
        // Construir query de actualización dinámicamente
        let updateFields = [];
        let updateValues = [];
        
        if (usuario) {
            updateFields.push('usuario = ?');
            updateValues.push(usuario);
        }
        
        if (correo) {
            updateFields.push('correo = ?');
            updateValues.push(correo);
        }
        
        if (nombre_completo) {
            updateFields.push('nombre_completo = ?');
            updateValues.push(nombre_completo);
        }
        
        if (id_rol) {
            updateFields.push('id_rol = ?');
            updateValues.push(id_rol);
        }
        
        if (password) {
            updateFields.push('password = ?');
            updateValues.push(password);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }
        
        updateValues.push(id);
        
        await executeQuery(
            `UPDATE usuarios_sucursal SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        // Obtener el usuario actualizado
        const updatedUser = await executeQuery(`
            SELECT u.*, r.nombre_rol, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM usuarios_sucursal u
            LEFT JOIN rol_usuarios_sucursal r ON u.id_rol = r.id
            LEFT JOIN admin_sucursales a ON u.id_admin_creador = a.id
            LEFT JOIN sucursales s ON u.id_sucursal = s.id
            WHERE u.id = ?
        `, [id]);
        
        // Remover password de la respuesta
        const { password: _, ...userWithoutPassword } = updatedUser[0];
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            data: userWithoutPassword
        });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar usuario de sucursal (soft delete)
const deleteUsuarioSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const id_admin = req.user.id;
        
        // Verificar si el usuario existe y pertenece a la sucursal del admin
        const existing = await executeQuery(`
            SELECT u.*, a.id_sucursal as admin_sucursal
            FROM usuarios_sucursal u
            LEFT JOIN admin_sucursales a ON a.id = ?
            WHERE u.id = ? AND u.activo = 1
        `, [id_admin, id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Usuario no encontrado'
            });
        }
        
        const user = existing[0];
        
        // Verificar que el admin puede eliminar este usuario (misma sucursal)
        if (user.id_sucursal !== user.admin_sucursal) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este usuario'
            });
        }
        
        // Soft delete
        await executeQuery(
            'UPDATE usuarios_sucursal SET activo = 0 WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getUsuariosSucursal,
    getUsuarioSucursalById,
    createUsuarioSucursal,
    updateUsuarioSucursal,
    deleteUsuarioSucursal
};