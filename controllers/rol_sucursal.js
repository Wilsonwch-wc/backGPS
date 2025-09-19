const { executeQuery, executeQueryWithResult } = require('../config/database');

// Obtener todos los tipos de sucursales
const getRolesSucursal = async (req, res) => {
    try {
        const rows = await executeQuery(
            'SELECT * FROM rol_sucursal ORDER BY nombre ASC'
        );
        
        res.json({
            success: true,
            data: rows
        });
    } catch (error) {
        console.error('Error al obtener tipos de sucursales:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener tipo de sucursal por ID
const getRolSucursalById = async (req, res) => {
    try {
        const { id } = req.params;
        
        const rows = await executeQuery(
            'SELECT * FROM rol_sucursal WHERE id = ?',
            [id]
        );
        
        if (rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de sucursal no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: rows[0]
        });
    } catch (error) {
        console.error('Error al obtener tipo de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Crear nuevo tipo de sucursal
const createRolSucursal = async (req, res) => {
    try {
        const { nombre } = req.body;
        
        // Validaciones
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        // Verificar si ya existe un tipo con el mismo nombre
        const existing = await executeQuery(
            'SELECT id FROM rol_sucursal WHERE nombre = ?',
            [nombre]
        );
        
        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe un tipo de sucursal con ese nombre'
            });
        }
        
        const result = await executeQueryWithResult(
            'INSERT INTO rol_sucursal (nombre) VALUES (?)',
            [nombre]
        );
        
        // Obtener el tipo creado
        const newRol = await executeQuery(
            'SELECT * FROM rol_sucursal WHERE id = ?',
            [result.insertId]
        );
        
        res.status(201).json({
            success: true,
            message: 'Tipo de sucursal creado exitosamente',
            data: newRol[0]
        });
    } catch (error) {
        console.error('Error al crear tipo de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar tipo de sucursal
const updateRolSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre } = req.body;
        
        // Verificar si el tipo existe
        const existing = await executeQuery(
            'SELECT id FROM rol_sucursal WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de sucursal no encontrado'
            });
        }
        
        // Verificar si ya existe otro tipo con el mismo nombre
        if (nombre) {
            const nameCheck = await executeQuery(
                'SELECT id FROM rol_sucursal WHERE nombre = ? AND id != ?',
                [nombre, id]
            );
            
            if (nameCheck.length > 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Ya existe otro tipo de sucursal con ese nombre'
                });
            }
        }
        
        if (!nombre) {
            return res.status(400).json({
                success: false,
                message: 'El nombre es requerido'
            });
        }
        
        await executeQuery(
            'UPDATE rol_sucursal SET nombre = ? WHERE id = ?',
            [nombre, id]
        );
        
        // Obtener el tipo actualizado
        const updatedRol = await executeQuery(
            'SELECT * FROM rol_sucursal WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Tipo de sucursal actualizado exitosamente',
            data: updatedRol[0]
        });
    } catch (error) {
        console.error('Error al actualizar tipo de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar tipo de sucursal
const deleteRolSucursal = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Verificar si el tipo existe
        const existing = await executeQuery(
            'SELECT id FROM rol_sucursal WHERE id = ?',
            [id]
        );
        
        if (existing.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tipo de sucursal no encontrado'
            });
        }
        
        // Verificar si hay sucursales usando este tipo
        const sucursalesUsing = await executeQuery(
            'SELECT id FROM sucursales WHERE tipo_sucursal_id = ?',
            [id]
        );
        
        if (sucursalesUsing.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'No se puede eliminar el tipo porque hay sucursales que lo están usando'
            });
        }
        
        await executeQuery(
            'DELETE FROM rol_sucursal WHERE id = ?',
            [id]
        );
        
        res.json({
            success: true,
            message: 'Tipo de sucursal eliminado exitosamente'
        });
    } catch (error) {
        console.error('Error al eliminar tipo de sucursal:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    getRolesSucursal,
    getRolSucursalById,
    createRolSucursal,
    updateRolSucursal,
    deleteRolSucursal
};