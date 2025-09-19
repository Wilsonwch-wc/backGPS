# Configuración de Variables de Entorno en Railway - SOLUCIÓN URGENTE

## 🚨 PROBLEMA CRÍTICO IDENTIFICADO
El backend está fallando con el error `ECONNREFUSED ::1:3306` porque las variables de entorno en Railway tienen **PLACEHOLDERS** en lugar de los valores reales.

### Variables con Problemas Detectados:
- ❌ `DB_PASSWORD`: Tiene `your_railway_mysql_password` (placeholder)
- ❌ `JWT_SECRET`: Tiene `your_jwt_secret_key_here` (placeholder)

## ✅ SOLUCIÓN INMEDIATA

### 1. CORREGIR Variables de Entorno en Railway Dashboard

**IMPORTANTE**: Reemplaza los placeholders con estos valores EXACTOS:

```
NODE_ENV=production
PORT=3002
DB_HOST=interchange.proxy.rlwy.net
DB_USER=root
DB_PASSWORD=oONbxfQtqzDbxNiiZPVTeBUKPnAuKpRC
DB_NAME=railway
DB_PORT=28989
JWT_SECRET=sgt_jwt_secret_key_2024_secure_token_iasitel_net_production
JWT_EXPIRES_IN=24h
```

### 2. PASOS DETALLADOS PARA CORREGIR EN RAILWAY

**PASO 1**: Acceder al Dashboard
- Ve a https://railway.app/dashboard
- Selecciona tu proyecto "backGPS"
- Haz clic en el servicio backend

**PASO 2**: Configurar Variables
- Ve a la pestaña "Variables"
- Busca las variables `DB_PASSWORD` y `JWT_SECRET`
- **CRÍTICO**: Reemplaza los valores placeholder:
  - `DB_PASSWORD`: Cambia `your_railway_mysql_password` por `oONbxfQtqzDbxNiiZPVTeBUKPnAuKpRC`
  - `JWT_SECRET`: Cambia `your_jwt_secret_key_here` por `sgt_jwt_secret_key_2024_secure_token_iasitel_net_production`

**PASO 3**: Verificar Otras Variables
- Asegúrate de que estas variables estén configuradas correctamente:
  - ✅ `NODE_ENV=production`
  - ✅ `PORT=3002`
  - ✅ `DB_HOST=interchange.proxy.rlwy.net`
  - ✅ `DB_USER=root`
  - ✅ `DB_NAME=railway`
  - ✅ `DB_PORT=28989`
  - ✅ `JWT_EXPIRES_IN=24h`

**PASO 4**: Guardar y Redesplegar
- Haz clic en "Save" después de cada cambio
- Ve a la pestaña "Deployments"
- Haz clic en "Redeploy" o espera el redeploy automático

### 3. VERIFICACIÓN DEL ÉXITO

**Después de corregir las variables**, verifica que el deployment sea exitoso:

**En los logs de Railway deberías ver**:
```
✅ Conexión a MySQL establecida correctamente
📊 Base de datos: railway
🏠 Host: interchange.proxy.rlwy.net:28989
👤 Usuario: root
🚀 Servidor corriendo en puerto 3002
```

**Si aún ves errores**:
- ❌ `ECONNREFUSED ::1:3306` = Variables aún tienen placeholders
- ❌ `Access denied` = Credenciales incorrectas
- ✅ `Conexión establecida` = ¡Problema resuelto!

**URL del servicio**: Debería estar disponible en la URL que Railway te proporciona

### 4. Variables de Railway Automáticas

Railway también proporciona variables automáticas que puedes usar:
- `MYSQLHOST`
- `MYSQLUSER` 
- `MYSQLPASSWORD`
- `MYSQLDATABASE`
- `MYSQLPORT`

Estas están configuradas en el archivo `railway.json` como respaldo.