# Deployment en Railway - Backend SGT

## Pasos para deployar en Railway:

### 1. Conectar el repositorio
- Ve a [Railway.app](https://railway.app)
- Crea un nuevo proyecto
- Conecta tu repositorio de GitHub: `https://github.com/Wilsonwch-wc/backGPS.git`

### 2. Variables de entorno requeridas
Configura estas variables en Railway:

```
NODE_ENV=production
PORT=3001
DB_HOST=tu_host_railway_mysql
DB_USER=tu_usuario_mysql
DB_PASSWORD=tu_password_mysql
DB_NAME=tu_nombre_base_datos
DB_PORT=3306
JWT_SECRET=tu_jwt_secret_seguro
```

### 3. Configuración de la base de datos
- Si ya tienes MySQL en Railway, usa esas credenciales
- Si no, crea un nuevo servicio MySQL en Railway
- Ejecuta los scripts SQL de la carpeta `database/` para crear las tablas

### 4. Configuración del dominio
- Railway te proporcionará un dominio automático
- Anota la URL para configurar el frontend

### 5. Verificación
- Una vez deployado, visita: `https://tu-app.railway.app/`
- Deberías ver el mensaje de bienvenida del API

## Comandos útiles:
- `npm start` - Inicia el servidor en producción
- `npm run dev` - Desarrollo con nodemon
- `npm test` - Prueba la conexión a la base de datos

## Estructura del proyecto:
- `index.js` - Archivo principal del servidor
- `config/database.js` - Configuración de MySQL
- `routes/` - Rutas del API
- `controllers/` - Lógica de negocio
- `middleware/` - Middlewares de autenticación
- `database/` - Scripts SQL para la base de datos