# API de Ubicaciones GPS - Documentación

## Descripción General

Esta API permite gestionar ubicaciones de control GPS para el sistema de asistencia. Los administradores de sucursal pueden crear y gestionar ubicaciones, mientras que los usuarios pueden validar su presencia en dichas ubicaciones.

## Características Principales

- ✅ **Gestión CRUD** de ubicaciones GPS
- ✅ **Validación de distancia** usando fórmula de Haversine
- ✅ **Radio personalizable** por ubicación (10-1000 metros)
- ✅ **Búsqueda de ubicaciones cercanas**
- ✅ **Autenticación por roles** (Admin Sucursal / Usuario Sucursal)
- ✅ **Validaciones de coordenadas GPS**
- ✅ **Auditoría completa** con timestamps

## Base URL
```
http://localhost:3001/api/ubicaciones-gps
```

## Autenticación

Todas las rutas requieren autenticación mediante JWT token en el header:
```
Authorization: Bearer <token>
```

## Endpoints

### 1. Crear Ubicación GPS
**POST** `/`

**Permisos:** Admin de Sucursal

**Body:**
```json
{
  "nombre": "Sede Principal - Entrada",
  "descripcion": "Entrada principal del edificio administrativo",
  "latitud": -12.0464,
  "longitud": -77.0428,
  "radio_metros": 100,
  "sucursal_id": 1
}
```

**Respuesta exitosa (201):**
```json
{
  "success": true,
  "message": "Ubicación de control creada exitosamente",
  "data": {
    "id": 1,
    "nombre": "Sede Principal - Entrada",
    "descripcion": "Entrada principal del edificio administrativo",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "radio_metros": 100,
    "sucursal_id": 1,
    "admin_creador_id": 5
  }
}
```

### 2. Obtener Ubicaciones por Sucursal
**GET** `/sucursal/:sucursal_id`

**Permisos:** Admin de Sucursal

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sede Principal - Entrada",
      "descripcion": "Entrada principal del edificio",
      "latitud": -12.0464,
      "longitud": -77.0428,
      "radio_metros": 100,
      "sucursal_id": 1,
      "admin_creador_id": 5,
      "activa": true,
      "fecha_creacion": "2024-01-15T10:30:00.000Z",
      "fecha_actualizacion": "2024-01-15T10:30:00.000Z",
      "admin_creador_nombre": "Juan Pérez"
    }
  ]
}
```

### 3. Obtener Ubicación por ID
**GET** `/:id`

**Permisos:** Admin de Sucursal

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "nombre": "Sede Principal - Entrada",
    "descripcion": "Entrada principal del edificio",
    "latitud": -12.0464,
    "longitud": -77.0428,
    "radio_metros": 100,
    "sucursal_id": 1,
    "admin_creador_id": 5,
    "activa": true,
    "fecha_creacion": "2024-01-15T10:30:00.000Z",
    "fecha_actualizacion": "2024-01-15T10:30:00.000Z",
    "admin_creador_nombre": "Juan Pérez",
    "sucursal_nombre": "Sucursal Centro"
  }
}
```

### 4. Actualizar Ubicación
**PUT** `/:id`

**Permisos:** Admin de Sucursal

**Body (campos opcionales):**
```json
{
  "nombre": "Nuevo nombre",
  "descripcion": "Nueva descripción",
  "latitud": -12.0465,
  "longitud": -77.0429,
  "radio_metros": 150,
  "activa": false
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Ubicación actualizada exitosamente"
}
```

### 5. Eliminar Ubicación
**DELETE** `/:id`

**Permisos:** Admin de Sucursal

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "Ubicación eliminada exitosamente"
}
```

### 6. Validar Ubicación de Usuario
**POST** `/:ubicacion_id/validar`

**Permisos:** Usuario de Sucursal

**Body:**
```json
{
  "latitud_usuario": -12.0465,
  "longitud_usuario": -77.0429
}
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": {
    "ubicacion_id": 1,
    "nombre_ubicacion": "Sede Principal - Entrada",
    "distancia_metros": 15.67,
    "radio_permitido": 100,
    "dentro_del_rango": true,
    "mensaje": "Usuario dentro del rango permitido"
  }
}
```

**Respuesta fuera de rango (200):**
```json
{
  "success": true,
  "data": {
    "ubicacion_id": 1,
    "nombre_ubicacion": "Sede Principal - Entrada",
    "distancia_metros": 150.23,
    "radio_permitido": 100,
    "dentro_del_rango": false,
    "mensaje": "Usuario fuera del rango. Distancia: 150m, Máximo permitido: 100m"
  }
}
```

### 7. Buscar Ubicaciones Cercanas
**GET** `/sucursal/:sucursal_id/cercanas`

**Permisos:** Usuario de Sucursal

**Query Parameters:**
- `latitud` (requerido): Latitud del usuario
- `longitud` (requerido): Longitud del usuario
- `radio_busqueda` (opcional): Radio de búsqueda en metros (default: 1000)

**Ejemplo:**
```
GET /sucursal/1/cercanas?latitud=-12.0464&longitud=-77.0428&radio_busqueda=500
```

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sede Principal - Entrada",
      "descripcion": "Entrada principal del edificio",
      "latitud": -12.0464,
      "longitud": -77.0428,
      "radio_metros": 100,
      "sucursal_id": 1,
      "admin_creador_id": 5,
      "activa": true,
      "distancia_metros": 15.67,
      "dentro_del_rango": true
    }
  ],
  "total": 1
}
```

### 8. Obtener Ubicaciones Activas (Público)
**GET** `/sucursal/:sucursal_id/activas`

**Permisos:** Sin autenticación estricta

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Sede Principal - Entrada",
      "descripcion": "Entrada principal del edificio",
      "latitud": -12.0464,
      "longitud": -77.0428,
      "radio_metros": 100
    }
  ]
}
```

### 9. Test de Conectividad
**GET** `/test`

**Permisos:** Sin autenticación

**Respuesta exitosa (200):**
```json
{
  "success": true,
  "message": "API de ubicaciones GPS funcionando correctamente",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## Códigos de Error

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Nombre, latitud, longitud y sucursal_id son requeridos"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Token de acceso requerido"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "Ubicación no encontrada"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Error interno del servidor"
}
```

## Validaciones

### Coordenadas GPS
- **Latitud:** Entre -90 y 90 grados
- **Longitud:** Entre -180 y 180 grados

### Radio de Ubicación
- **Mínimo:** 10 metros
- **Máximo:** 1000 metros
- **Default:** 50 metros

### Campos Requeridos
- **Crear ubicación:** nombre, latitud, longitud, sucursal_id
- **Validar ubicación:** latitud_usuario, longitud_usuario
- **Buscar cercanas:** latitud, longitud

## Algoritmo de Distancia

Se utiliza la **fórmula de Haversine** para calcular la distancia entre dos puntos GPS:

```javascript
function calcularDistancia(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Radio de la Tierra en metros
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distancia en metros
}
```

## Ejemplos de Implementación

### Frontend - Obtener ubicación del usuario
```javascript
// Obtener coordenadas GPS del navegador
navigator.geolocation.getCurrentPosition(
  (position) => {
    const latitud = position.coords.latitude;
    const longitud = position.coords.longitude;
    
    // Validar ubicación
    validarUbicacion(ubicacionId, latitud, longitud);
  },
  (error) => {
    console.error('Error al obtener ubicación:', error);
  },
  {
    enableHighAccuracy: true,
    timeout: 10000,
    maximumAge: 60000
  }
);
```

### Frontend - Validar ubicación
```javascript
async function validarUbicacion(ubicacionId, latitud, longitud) {
  try {
    const response = await fetch(`/api/ubicaciones-gps/${ubicacionId}/validar`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        latitud_usuario: latitud,
        longitud_usuario: longitud
      })
    });
    
    const result = await response.json();
    
    if (result.success && result.data.dentro_del_rango) {
      console.log('✅ Usuario dentro del rango permitido');
      // Proceder con marcación de asistencia
    } else {
      console.log('❌ Usuario fuera del rango:', result.data.mensaje);
    }
  } catch (error) {
    console.error('Error al validar ubicación:', error);
  }
}
```

## Notas Importantes

1. **Precisión GPS:** La precisión puede variar entre 3-5 metros en condiciones ideales
2. **Seguridad:** Todas las rutas están protegidas con autenticación JWT
3. **Performance:** Los cálculos de distancia son optimizados para respuesta rápida
4. **Escalabilidad:** El sistema soporta múltiples ubicaciones por sucursal
5. **Auditoría:** Todas las operaciones quedan registradas con timestamps

## Próximas Funcionalidades

- [ ] Logs de intentos de marcación
- [ ] Configuración de horarios por ubicación
- [ ] Notificaciones push para ubicaciones cercanas
- [ ] Dashboard de analytics de ubicaciones
- [ ] Exportación de reportes de asistencia GPS