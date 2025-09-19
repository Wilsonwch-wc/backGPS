const { executeQuery, executeQueryWithResult } = require('../config/database');

// Obtener todos los roles de usuarios de sucursal
const getRolesUsuariosSucursal = async (req, res) => {
    try {
        const { id_sucursal } = req.query;
        
        let query = `
            SELECT r.*, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM rol_usuarios_sucursal r
            LEFT JOIN admin_sucursales a ON r.id_admin_creador = a.id
            LEFT JOIN sucursales s ON r.id_sucursal = s.id
            WHERE r.activo = 1
        `;
        let params = [];
        
        if (id_sucursal) {
            query += ' AND r.id_sucursal = ?';
            params.push(id_sucursal);
        }
        
        query += ' ORDER BY r.nombre_rol ASC';
        
        const rows = await executeQuery(query, params);
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener roles de usuarios:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener rol de usuario por ID
const getRolUsuarioSucursalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const rows = await executeQuery(`
            SELECT r.*, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM rol_usuarios_sucursal r
            LEFT JOIN admin_sucursales a ON r.id_admin_creador = a.id
            LEFT JOIN sucursales s ON r.id_sucursal = s.id
            WHERE r.id = ? AND r.activo = 1
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rol de usuario no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error al obtener rol de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Crear nuevo rol de usuario
const createRolUsuarioSucursal = async (req, res) => {
    try {
        const { nombre_rol, descripcion, id_sucursal } = req.body;
        const id_admin_creador = req.user.id; // Del middleware de autenticación
        
        // Validaciones
        if (!nombre_rol || !id_sucursal) {
            return res.status(400).json({
                success: false,
                message: 'El nombre del rol y la sucursal son requeridos'
            });
        }
        
        // Verificar si ya existe un rol con el mismo nombre en la misma sucursal
        const existing = await executeQuery(
            'SELECT id FROM rol_usuarios_sucursal WHERE nombre_rol = ? AND id_sucursal = ? AND activo = 1',
            [nombre_rol, id_sucursal]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un rol con ese nombre en esta sucursal'
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
                message: 'No tienes permisos para crear roles en esta sucursal'
            });
        }
        
        const result = await executeQueryWithResult(
            'INSERT INTO rol_usuarios_sucursal (nombre_rol, descripcion, id_admin_creador, id_sucursal) VALUES (?, ?, ?, ?)',
            [nombre_rol, descripcion, id_admin_creador, id_sucursal]
        );
        
        // Obtener el rol creado
        const newRol = await executeQuery(`
            SELECT r.*, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM rol_usuarios_sucursal r
            LEFT JOIN admin_sucursales a ON r.id_admin_creador = a.id
            LEFT JOIN sucursales s ON r.id_sucursal = s.id
            WHERE r.id = ?
        `, [result.insertId]);
        
        res.status(201).json({
            success: true,
            message: 'Rol de usuario creado exitosamente',
            data: newRol[0]
        });
    } catch (error) {
        console.error('Error al crear rol de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar rol de usuario
const updateRolUsuarioSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre_rol, descripcion } = req.body;
        const id_admin = req.user.id;
        
        // Verificar si el rol existe y pertenece a la sucursal del admin
        const existing = await executeQuery(`
            SELECT r.*, a.id_sucursal as admin_sucursal
            FROM rol_usuarios_sucursal r
            LEFT JOIN admin_sucursales a ON a.id = ?
            WHERE r.id = ? AND r.activo = 1
        `, [id_admin, id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rol de usuario no encontrado'
            });
        }
        
        const rol = existing[0];
        
        // Verificar que el admin puede modificar este rol (misma sucursal)
        if (rol.id_sucursal !== rol.admin_sucursal) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para modificar este rol'
            });
        }
        
        // Verificar si ya existe otro rol con el mismo nombre en la misma sucursal
        if (nombre_rol) {
            const nameCheck = await executeQuery(
                'SELECT id FROM rol_usuarios_sucursal WHERE nombre_rol = ? AND id_sucursal = ? AND id != ? AND activo = 1',
                [nombre_rol, rol.id_sucursal, id]
            );
            
            if (nameCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro rol con ese nombre en esta sucursal'
                });
            }
        }
        
        // Construir query de actualización dinámicamente
        let updateFields = [];
        let updateValues = [];
        
        if (nombre_rol) {
            updateFields.push('nombre_rol = ?');
            updateValues.push(nombre_rol);
        }
        
        if (descripcion !== undefined) {
            updateFields.push('descripcion = ?');
            updateValues.push(descripcion);
        }
        
        if (updateFields.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }
        
        updateValues.push(id);
        
        await executeQuery(
            `UPDATE rol_usuarios_sucursal SET ${updateFields.join(', ')} WHERE id = ?`,
            updateValues
        );
        
        // Obtener el rol actualizado
        const updatedRol = await executeQuery(`
            SELECT r.*, a.usuario as admin_creador, s.nombre as nombre_sucursal
            FROM rol_usuarios_sucursal r
            LEFT JOIN admin_sucursales a ON r.id_admin_creador = a.id
            LEFT JOIN sucursales s ON r.id_sucursal = s.id
            WHERE r.id = ?
        `, [id]);
        
        res.json({
            success: true,
            message: 'Rol de usuario actualizado exitosamente',
            data: updatedRol[0]
        });
    } catch (error) {
        console.error('Error al actualizar rol de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar rol de usuario (soft delete)
const deleteRolUsuarioSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const id_admin = req.user.id;
        
        // Verificar si el rol existe y pertenece a la sucursal del admin
        const existing = await executeQuery(`
            SELECT r.*, a.id_sucursal as admin_sucursal
            FROM rol_usuarios_sucursal r
            LEFT JOIN admin_sucursales a ON a.id = ?
            WHERE r.id = ? AND r.activo = 1
        `, [id_admin, id]);
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Rol de usuario no encontrado'
            });
        }
        
        const rol = existing[0];
        
        // Verificar que el admin puede eliminar este rol (misma sucursal)
        if (rol.id_sucursal !== rol.admin_sucursal) {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar este rol'
            });
        }
        
        // Verificar si hay usuarios usando este rol
        const usuariosUsing = await executeQuery(
            'SELECT id FROM usuarios_sucursal WHERE id_rol = ? AND activo = 1',
            [id]
        );
        
        if (usuariosUsing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el rol porque hay usuarios que lo están usando'
            });
        }
        
        // Soft delete
        await executeQuery(
            'UPDATE rol_usuarios_sucursal SET activo = 0 WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Rol de usuario eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar rol de usuario:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getRolesUsuariosSucursal,
    getRolUsuarioSucursalById,
    createRolUsuarioSucursal,
    updateRolUsuarioSucursal,
    deleteRolUsuarioSucursal
};