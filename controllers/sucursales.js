const { executeQuery, executeQueryWithResult } = require('../config/database');

// Obtener todas las sucursales
const getSucursales = async (req, res) => {
    try {
        const rows = await executeQuery(
            `SELECT s.*, rs.nombre as tipo_sucursal 
             FROM sucursales s 
             LEFT JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id 
             ORDER BY s.nombre ASC`
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener sucursales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener sucursal por ID
const getSucursalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const rows = await executeQuery(
            `SELECT s.*, rs.nombre as tipo_sucursal 
             FROM sucursales s 
             LEFT JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id 
             WHERE s.id = ?`,
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sucursal no encontrada'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error al obtener sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Crear nueva sucursal
const createSucursal = async (req, res) => {
    try {
        const { nombre, descripcion, direccion, telefono, tipo_sucursal_id, activo = true } = req.body;
        
        // Validaciones
        if (!nombre || !descripcion || !tipo_sucursal_id) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, descripción y tipo de sucursal son requeridos'
            });
        }
        
        // Verificar si el tipo de sucursal existe
        const tipoExists = await executeQuery(
            'SELECT id FROM rol_sucursal WHERE id = ?',
            [tipo_sucursal_id]
        );
        
        if (tipoExists.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'El tipo de sucursal especificado no existe'
            });
        }
        
        // Verificar si ya existe una sucursal con el mismo nombre
        const existing = await executeQuery(
            'SELECT id FROM sucursales WHERE nombre = ?',
            [nombre]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una sucursal con ese nombre'
            });
        }
        
        const result = await executeQueryWithResult(
            'INSERT INTO sucursales (nombre, descripcion, direccion, telefono, tipo_sucursal_id, activo) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, descripcion, direccion, telefono, tipo_sucursal_id, activo]
        );
        
        // Obtener la sucursal creada con el tipo
        const newSucursal = await executeQuery(
            `SELECT s.*, rs.nombre as tipo_sucursal 
             FROM sucursales s 
             LEFT JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id 
             WHERE s.id = ?`,
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Sucursal creada exitosamente',
            data: newSucursal[0]
        });
    } catch (error) {
        console.error('Error al crear sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar sucursal
const updateSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, descripcion, direccion, telefono, activo } = req.body;
        
        // Verificar si la sucursal existe
        const existing = await executeQuery(
            'SELECT id FROM sucursales WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sucursal no encontrada'
            });
        }
        
        // Verificar si ya existe otra sucursal con el mismo nombre
        if (nombre) {
            const nameCheck = await executeQuery(
                'SELECT id FROM sucursales WHERE nombre = ? AND id != ?',
                [nombre, id]
            );
            
            if (nameCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otra sucursal con ese nombre'
                });
            }
        }
        
        // Construir la consulta de actualización dinámicamente
        const updates = [];
        const values = [];
        
        if (nombre !== undefined) {
            updates.push('nombre = ?');
            values.push(nombre);
        }
        if (descripcion !== undefined) {
            updates.push('descripcion = ?');
            values.push(descripcion);
        }
        if (direccion !== undefined) {
            updates.push('direccion = ?');
            values.push(direccion);
        }
        if (telefono !== undefined) {
            updates.push('telefono = ?');
            values.push(telefono);
        }
        if (activo !== undefined) {
            updates.push('activo = ?');
            values.push(activo);
        }
        
        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No hay campos para actualizar'
            });
        }
        
        values.push(id);
        
        await executeQuery(
            `UPDATE sucursales SET ${updates.join(', ')} WHERE id = ?`,
            values
        );
        
        // Obtener la sucursal actualizada
        const updatedSucursal = await executeQuery(
            'SELECT * FROM sucursales WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Sucursal actualizada exitosamente',
            data: updatedSucursal[0]
        });
    } catch (error) {
        console.error('Error al actualizar sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar sucursal
const deleteSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si la sucursal existe
        const existing = await executeQuery(
            'SELECT id FROM sucursales WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Sucursal no encontrada'
            });
        }
        
        await executeQuery(
            'DELETE FROM sucursales WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Sucursal eliminada exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener sucursales activas
const getSucursalesActivas = async (req, res) => {
    try {
        const rows = await executeQuery(
            `SELECT s.*, rs.nombre as tipo_sucursal 
             FROM sucursales s 
             LEFT JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id 
             WHERE s.activo = 1 
             ORDER BY s.nombre ASC`
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener sucursales activas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    deleteSucursal,
    getSucursalesActivas
};