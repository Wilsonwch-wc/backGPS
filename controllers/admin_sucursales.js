const { executeQuery, executeQueryWithResult } = require('../config/database');

// Obtener todos los administradores de sucursales
const getAdminSucursales = async (req, res) => {
    try {
        const rows = await executeQuery(`
            SELECT 
                a.id,
                a.usuario,
                a.correo,
                a.activo,
                a.id_sucursal,
                a.fecha_creacion,
                a.fecha_actualizacion,
                s.nombre as sucursal_nombre
            FROM admin_sucursales a
            LEFT JOIN sucursales s ON a.id_sucursal = s.id
            ORDER BY a.usuario ASC
        `);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener administradores de sucursales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener administrador de sucursal por ID
const getAdminSucursalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const rows = await executeQuery(`
            SELECT 
                a.id,
                a.usuario,
                a.correo,
                a.activo,
                a.id_sucursal,
                a.fecha_creacion,
                a.fecha_actualizacion,
                s.nombre as sucursal_nombre
            FROM admin_sucursales a
            LEFT JOIN sucursales s ON a.id_sucursal = s.id
            WHERE a.id = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrador de sucursal no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error al obtener administrador de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Crear nuevo administrador de sucursal
const createAdminSucursal = async (req, res) => {
    try {
        const { usuario, correo, password, id_sucursal, activo = true } = req.body;
        
        // Validaciones básicas
        if (!usuario || !correo || !password || !id_sucursal) {
            return res.status(400).json({
                success: false,
                message: 'Todos los campos son obligatorios: usuario, correo, password, id_sucursal'
            });
        }
        
        // Validar formato de email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(correo)) {
            return res.status(400).json({
                success: false,
                message: 'El formato del correo electrónico no es válido'
            });
        }
        
        // Verificar que la sucursal existe
        const sucursalExists = await executeQuery(
            'SELECT id FROM sucursales WHERE id = ?',
            [id_sucursal]
        );
        
        if (sucursalExists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'La sucursal especificada no existe'
            });
        }
        
        // Verificar que el usuario no existe
        const usuarioExists = await executeQuery(
            'SELECT id FROM admin_sucursales WHERE usuario = ?',
            [usuario]
        );
        
        if (usuarioExists.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El nombre de usuario ya existe'
            });
        }
        
        // Verificar que el correo no existe
        const correoExists = await executeQuery(
            'SELECT id FROM admin_sucursales WHERE correo = ?',
            [correo]
        );
        
        if (correoExists.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'El correo electrónico ya está registrado'
            });
        }
        
        // Insertar nuevo administrador (contraseña en texto plano)
        const result = await executeQueryWithResult(
            'INSERT INTO admin_sucursales (usuario, correo, password, activo, id_sucursal) VALUES (?, ?, ?, ?, ?)',
            [usuario, correo, password, activo, id_sucursal]
        );
        
        res.status(201).json({
            success: true,
            message: 'Administrador de sucursal creado exitosamente',
            data: {
                id: result.insertId,
                usuario,
                correo,
                activo,
                id_sucursal
            }
        });
    } catch (error) {
        console.error('Error al crear administrador de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar administrador de sucursal
const updateAdminSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const { usuario, correo, password, id_sucursal, activo } = req.body;
        
        // Verificar que el administrador existe
        const adminExists = await executeQuery(
            'SELECT * FROM admin_sucursales WHERE id = ?',
            [id]
        );
        
        if (adminExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrador de sucursal no encontrado'
            });
        }
        
        const currentAdmin = adminExists[0];
        
        // Preparar campos a actualizar
        const fieldsToUpdate = [];
        const values = [];
        
        if (usuario !== undefined && usuario !== currentAdmin.usuario) {
            // Verificar que el nuevo usuario no existe
            const usuarioExists = await executeQuery(
                'SELECT id FROM admin_sucursales WHERE usuario = ? AND id != ?',
                [usuario, id]
            );
            
            if (usuarioExists.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El nombre de usuario ya existe'
                });
            }
            
            fieldsToUpdate.push('usuario = ?');
            values.push(usuario);
        }
        
        if (correo !== undefined && correo !== currentAdmin.correo) {
            // Validar formato de email
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(correo)) {
                return res.status(400).json({
                    success: false,
                    message: 'El formato del correo electrónico no es válido'
                });
            }
            
            // Verificar que el nuevo correo no existe
            const correoExists = await executeQuery(
                'SELECT id FROM admin_sucursales WHERE correo = ? AND id != ?',
                [correo, id]
            );
            
            if (correoExists.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'El correo electrónico ya está registrado'
                });
            }
            
            fieldsToUpdate.push('correo = ?');
            values.push(correo);
        }
        
        if (password !== undefined && password.trim() !== '') {
            // Guardar nueva contraseña en texto plano
            fieldsToUpdate.push('password = ?');
            values.push(password);
        }
        
        if (id_sucursal !== undefined && id_sucursal !== currentAdmin.id_sucursal) {
            // Verificar que la sucursal existe
            const sucursalExists = await executeQuery(
                'SELECT id FROM sucursales WHERE id = ?',
                [id_sucursal]
            );
            
            if (sucursalExists.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'La sucursal especificada no existe'
                });
            }
            
            fieldsToUpdate.push('id_sucursal = ?');
            values.push(id_sucursal);
        }
        
        if (activo !== undefined) {
            fieldsToUpdate.push('activo = ?');
            values.push(activo);
        }
        
        if (fieldsToUpdate.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }
        
        // Agregar timestamp de actualización
        fieldsToUpdate.push('fecha_actualizacion = CURRENT_TIMESTAMP');
        values.push(id);
        
        const query = `UPDATE admin_sucursales SET ${fieldsToUpdate.join(', ')} WHERE id = ?`;
        await executeQuery(query, values);
        
        res.json({
            success: true,
            message: 'Administrador de sucursal actualizado exitosamente'
        });
    } catch (error) {
        console.error('Error al actualizar administrador de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar administrador de sucursal
const deleteAdminSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar que el administrador existe
        const adminExists = await executeQuery(
            'SELECT id FROM admin_sucursales WHERE id = ?',
            [id]
        );
        
        if (adminExists.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Administrador de sucursal no encontrado'
            });
        }
        
        await executeQuery(
            'DELETE FROM admin_sucursales WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Administrador de sucursal eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar administrador de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener administradores activos
const getAdminSucursalesActivos = async (req, res) => {
    try {
        const rows = await executeQuery(`
            SELECT 
                a.id,
                a.usuario,
                a.correo,
                a.id_sucursal,
                s.nombre as sucursal_nombre
            FROM admin_sucursales a
            LEFT JOIN sucursales s ON a.id_sucursal = s.id
            WHERE a.activo = true
            ORDER BY a.usuario ASC
        `);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener administradores activos:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener administradores por sucursal
const getAdminBySucursal = async (req, res) => {
    try {
        const { id_sucursal } = req.params;
        
        const rows = await executeQuery(`
            SELECT 
                a.id,
                a.usuario,
                a.correo,
                a.activo,
                a.fecha_creacion,
                s.nombre as sucursal_nombre
            FROM admin_sucursales a
            LEFT JOIN sucursales s ON a.id_sucursal = s.id
            WHERE a.id_sucursal = ?
            ORDER BY a.usuario ASC
        `, [id_sucursal]);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener administradores por sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getAdminSucursales,
    getAdminSucursalById,
    createAdminSucursal,
    updateAdminSucursal,
    deleteAdminSucursal,
    getAdminSucursalesActivos,
    getAdminBySucursal
};