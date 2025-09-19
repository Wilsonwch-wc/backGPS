const { executeQuery } = require('../config/database');

// Función para calcular la distancia entre dos puntos GPS usando la fórmula de Haversine
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180; // φ, λ en radianes
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distancia = R * c; // en metros
    return distancia;
}

// Crear nueva ubicación de control GPS
const crearUbicacion = async (req, res) => {
  try {
        
        const {
            nombre,
            descripcion,
            latitud,
            longitud,
            radio_metros,
            sucursal_id
        } = req.body;

        // Validaciones
    if (!nombre || !latitud || !longitud || !sucursal_id) {
            return res.status(400).json({
                success: false,
                message: 'Nombre, latitud, longitud y sucursal_id son requeridos'
            });
        }

        // Validar coordenadas GPS
        if (latitud < -90 || latitud > 90) {
            return res.status(400).json({
                success: false,
                message: 'La latitud debe estar entre -90 y 90 grados'
            });
        }

        if (longitud < -180 || longitud > 180) {
            return res.status(400).json({
                success: false,
                message: 'La longitud debe estar entre -180 y 180 grados'
            });
        }

        // Validar radio
        const radio = radio_metros || 50;
        if (radio < 10 || radio > 5000) {
            return res.status(400).json({
                success: false,
                message: 'El radio debe estar entre 10 y 5000 metros'
            });
        }

        // Obtener ID del admin desde el token
        const admin_creador_id = req.user.id;

        const query = `
            INSERT INTO ubicaciones_control 
            (nombre, descripcion, latitud, longitud, radio_metros, sucursal_id, admin_creador_id)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `;

        const result = await executeQuery(query, [
      nombre,
      descripcion || null,
      latitud,
      longitud,
      radio,
      sucursal_id,
      admin_creador_id
    ]);

        res.status(201).json({
            success: true,
            message: 'Ubicación de control creada exitosamente',
            data: {
                id: result.insertId,
                nombre,
                descripcion,
                latitud,
                longitud,
                radio_metros: radio,
                sucursal_id,
                admin_creador_id
            }
        });

    } catch (error) {
        console.error('=== ERROR AL CREAR UBICACION ===');
        console.error('Error completo:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error sqlState:', error.sqlState);
        console.error('Error sqlMessage:', error.sqlMessage);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
};

// Obtener todas las ubicaciones de una sucursal
const obtenerUbicacionesPorSucursal = async (req, res) => {
  try {
    const sucursal_id = req.params.sucursal_id;

        const query = `
            SELECT 
                uc.*,
                ads.usuario as admin_creador_nombre
            FROM ubicaciones_control uc
            LEFT JOIN admin_sucursales ads ON uc.admin_creador_id = ads.id
            WHERE uc.sucursal_id = ?
            ORDER BY uc.fecha_creacion DESC
        `;
        
        const ubicaciones = await executeQuery(query, [sucursal_id]);

        res.json({
            success: true,
            data: ubicaciones
        });

    } catch (error) {
        console.error('=== ERROR AL OBTENER UBICACIONES ===');
        console.error('Error completo:', error);
        console.error('Error message:', error.message);
        console.error('Error code:', error.code);
        console.error('Error sqlState:', error.sqlState);
        console.error('Error sqlMessage:', error.sqlMessage);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor: ' + error.message
        });
    }
};

// Obtener una ubicación específica
const obtenerUbicacionPorId = async (req, res) => {
    try {
        const { id } = req.params;

        const query = `
            SELECT 
                uc.*,
                ads.nombre as admin_creador_nombre,
                s.nombre as sucursal_nombre
            FROM ubicaciones_control uc
            LEFT JOIN admin_sucursales ads ON uc.admin_creador_id = ads.id
            LEFT JOIN sucursales s ON uc.sucursal_id = s.id
            WHERE uc.id = ?
        `;

        const ubicaciones = await executeQuery(query, [id]);

        if (ubicaciones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        res.json({
            success: true,
            data: ubicaciones[0]
        });

    } catch (error) {
        console.error('Error al obtener ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Actualizar ubicación
const actualizarUbicacion = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            nombre,
            descripcion,
            latitud,
            longitud,
            radio_metros,
            activa
        } = req.body;

        // Verificar que la ubicación existe
        const ubicacionExistente = await executeQuery(
            'SELECT id FROM ubicaciones_control WHERE id = ?',
            [id]
        );

        if (ubicacionExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        // Validar coordenadas si se proporcionan
        if (latitud !== undefined && (latitud < -90 || latitud > 90)) {
            return res.status(400).json({
                success: false,
                message: 'La latitud debe estar entre -90 y 90 grados'
            });
        }

        if (longitud !== undefined && (longitud < -180 || longitud > 180)) {
            return res.status(400).json({
                success: false,
                message: 'La longitud debe estar entre -180 y 180 grados'
            });
        }

        // Validar radio si se proporciona
        if (radio_metros !== undefined && (radio_metros < 10 || radio_metros > 1000)) {
            return res.status(400).json({
                success: false,
                message: 'El radio debe estar entre 10 y 1000 metros'
            });
        }

        // Construir query dinámicamente
        const campos = [];
        const valores = [];

        if (nombre !== undefined) {
            campos.push('nombre = ?');
            valores.push(nombre);
        }
        if (descripcion !== undefined) {
            campos.push('descripcion = ?');
            valores.push(descripcion);
        }
        if (latitud !== undefined) {
            campos.push('latitud = ?');
            valores.push(latitud);
        }
        if (longitud !== undefined) {
            campos.push('longitud = ?');
            valores.push(longitud);
        }
        if (radio_metros !== undefined) {
            campos.push('radio_metros = ?');
            valores.push(radio_metros);
        }
        if (activa !== undefined) {
            campos.push('activa = ?');
            valores.push(activa);
        }

        if (campos.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No se proporcionaron campos para actualizar'
            });
        }

        valores.push(id);

        const query = `
            UPDATE ubicaciones_control 
            SET ${campos.join(', ')}, fecha_actualizacion = CURRENT_TIMESTAMP
            WHERE id = ?
        `;

        await executeQuery(query, valores);

        res.json({
            success: true,
            message: 'Ubicación actualizada exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Eliminar ubicación
const eliminarUbicacion = async (req, res) => {
    try {
        const { id } = req.params;

        // Verificar que la ubicación existe
        const ubicacionExistente = await executeQuery(
            'SELECT id FROM ubicaciones_control WHERE id = ?',
            [id]
        );

        if (ubicacionExistente.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada'
            });
        }

        await executeQuery('DELETE FROM ubicaciones_control WHERE id = ?', [id]);

        res.json({
            success: true,
            message: 'Ubicación eliminada exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Validar si un usuario está dentro del rango de una ubicación
const validarUbicacionUsuario = async (req, res) => {
    try {
        const { ubicacion_id } = req.params;
        const { latitud_usuario, longitud_usuario } = req.body;

        if (!latitud_usuario || !longitud_usuario) {
            return res.status(400).json({
                success: false,
                message: 'Latitud y longitud del usuario son requeridas'
            });
        }

        // Obtener datos de la ubicación
        const ubicaciones = await executeQuery(
            'SELECT * FROM ubicaciones_control WHERE id = ? AND activa = TRUE',
            [ubicacion_id]
        );

        if (ubicaciones.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Ubicación no encontrada o inactiva'
            });
        }

        const ubicacion = ubicaciones[0];

        // Calcular distancia
        const distancia = calcularDistancia(
            ubicacion.latitud,
            ubicacion.longitud,
            latitud_usuario,
            longitud_usuario
        );

        const dentroDelRango = distancia <= ubicacion.radio_metros;

        res.json({
            success: true,
            data: {
                ubicacion_id: ubicacion.id,
                nombre_ubicacion: ubicacion.nombre,
                distancia_metros: Math.round(distancia * 100) / 100, // Redondear a 2 decimales
                radio_permitido: ubicacion.radio_metros,
                dentro_del_rango: dentroDelRango,
                mensaje: dentroDelRango 
                    ? 'Usuario dentro del rango permitido'
                    : `Usuario fuera del rango. Distancia: ${Math.round(distancia)}m, Máximo permitido: ${ubicacion.radio_metros}m`
            }
        });

    } catch (error) {
        console.error('Error al validar ubicación:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

// Obtener ubicaciones cercanas a una coordenada
const obtenerUbicacionesCercanas = async (req, res) => {
    try {
        const { latitud, longitud, radio_busqueda = 1000 } = req.query;
        const { sucursal_id } = req.params;

        if (!latitud || !longitud) {
            return res.status(400).json({
                success: false,
                message: 'Latitud y longitud son requeridas'
            });
        }

        // Obtener todas las ubicaciones activas de la sucursal
        const ubicaciones = await executeQuery(
            'SELECT * FROM ubicaciones_control WHERE sucursal_id = ? AND activa = TRUE',
            [sucursal_id]
        );

        // Calcular distancias y filtrar
        const ubicacionesCercanas = ubicaciones
            .map(ubicacion => {
                const distancia = calcularDistancia(
                    parseFloat(latitud),
                    parseFloat(longitud),
                    ubicacion.latitud,
                    ubicacion.longitud
                );

                return {
                    ...ubicacion,
                    distancia_metros: Math.round(distancia * 100) / 100,
                    dentro_del_rango: distancia <= ubicacion.radio_metros
                };
            })
            .filter(ubicacion => ubicacion.distancia_metros <= parseFloat(radio_busqueda))
            .sort((a, b) => a.distancia_metros - b.distancia_metros);

        res.json({
            success: true,
            data: ubicacionesCercanas,
            total: ubicacionesCercanas.length
        });

    } catch (error) {
        console.error('Error al obtener ubicaciones cercanas:', error);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor'
        });
    }
};

module.exports = {
    crearUbicacion,
    obtenerUbicacionesPorSucursal,
    obtenerUbicacionPorId,
    actualizarUbicacion,
    eliminarUbicacion,
    validarUbicacionUsuario,
    obtenerUbicacionesCercanas,
    calcularDistancia
};