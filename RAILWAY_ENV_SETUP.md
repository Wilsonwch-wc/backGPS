# Configuración de Variables de Entorno en Railway

## Problema Identificado
El backend está fallando con el error `ECONNREFUSED ::1:3306` porque Railway no está leyendo las variables de entorno correctamente y está intentando conectarse a localhost en lugar de la base de datos de Railway.

## Solución

### 1. Configurar Variables de Entorno en Railway Dashboard

Debes configurar las siguientes variables de entorno en el dashboard de Railway:

```
NODE_ENV=production
PORT=3003
DB_HOST=interchange.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=oONbxfQtqzDbxNiiZPVTeBUKPnAuKpRC
DB_NAME=railway
DB_PORT=28989
JWT_SECRET=sgt_jwt_secret_key_2024_secure_token_iasitel_net_production
JWT_EXPIRES_IN=24h
```

### 2. Pasos para Configurar en Railway

1. Ve a tu proyecto en Railway Dashboard
2. Selecciona tu servicio backend
3. Ve a la pestaña "Variables"
4. Agrega cada variable de entorno una por una
5. Haz redeploy del servicio

### 3. Verificación

Después de configurar las variables de entorno, el backend debería conectarse correctamente a la base de datos de Railway y mostrar:

```
✅ Conexión a MySQL establecida correctamente
📊 Base de datos: railway
🏠 Host: interchange.proxy.rlwy.net:28989
👤 Usuario: root
```

### 4. Variables de Railway Automáticas

Railway también proporciona variables automáticas que puedes usar:
- `MYSQLHOST`
- `MYSQLUSER` 
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

Estas están configuradas en el archivo `railway.json` como respaldo.