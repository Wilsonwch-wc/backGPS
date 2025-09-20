const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar configuración de base de datos
const { pool, dbConfig, testConnection, executeQuery, closePool } = require('./config/database');

// Importar rutas
const usuariosRoutes = require('./routes/usuarios');
const sucursalesRoutes = require('./routes/sucursales');
const adminSucursalesRoutes = require('./routes/admin_sucursales');
const authSucursalesRoutes = require('./routes/auth_sucursales');
const authUsuariosSucursalRoutes = require('./routes/auth_usuarios_sucursal');
const rolSucursalRoutes = require('./routes/rol_sucursal');
const rolUsuariosSucursalRoutes = require('./routes/rol_usuarios_sucursal');
const usuariosSucursalRoutes = require('./routes/usuarios_sucursal');
const ubiGpsRoutes = require('./routes/ubiGps');
const controlAsistenciaRoutes = require('./routes/controlasistenciaDoc');
const controlAsistenciaViewRoutes = require('./routes/controlAsistencia');
const confirmacionAsistenciaRoutes = require('./routes/confirmacionAsistencia');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
// Configuración específica de CORS para producción
app.use(cors({
  origin: function (origin, callback) {
    const allowedOrigins = ['https://iasitel.net', 'http://localhost:3000', 'http://localhost:3002', 'http://localhost:5173', 'https://front-gps.vercel.app'];
    console.log('🔍 CORS Origin check:', origin);
    
    // Permitir requests sin origin (como Postman) o desde orígenes permitidos
    if (!origin || allowedOrigins.includes(origin)) {
      console.log('✅ CORS Origin permitido:', origin);
      callback(null, true);
    } else {
      console.log('❌ CORS Origin rechazado:', origin);
      callback(new Error('No permitido por CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Middleware adicional para debugging CORS
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - Origin: ${req.headers.origin}`);
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Middleware para hacer disponible la conexión en todas las rutas
app.use((req, res, next) => {
  req.db = pool;
  next();
});

// Ruta de prueba
app.get('/', (req, res) => {
  res.json({
    message: 'Servidor del Sistema de Gestión Técnica',
    status: 'Activo',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: '/api/usuarios/login',
      profile: '/api/usuarios/profile',
      users: '/api/usuarios',
      sucursales: '/api/sucursales',
      adminSucursales: '/api/admin-sucursales',
      authSucursales: '/api/auth-sucursales',
      authUsuariosSucursal: '/api/auth-usuarios-sucursal',
      rolesSucursal: '/api/roles-sucursal',
      rolesUsuariosSucursal: '/api/rol-usuarios-sucursal',
      usuariosSucursal: '/api/usuarios-sucursal',
      ubicacionesGps: '/api/ubicaciones-gps',
      controlAsistencia: '/api/control-asistencia',
      controlAsistenciaView: '/api/control-asistencia-view',
      confirmacionAsistencia: '/api/confirmacion-asistencia',
      testDb: '/api/test-db'
    }
  });
});

// Rutas de API
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/sucursales', sucursalesRoutes);
app.use('/api/admin-sucursales', adminSucursalesRoutes);
app.use('/api/auth-sucursales', authSucursalesRoutes);
app.use('/api/auth-usuarios-sucursal', authUsuariosSucursalRoutes);
app.use('/api/roles-sucursal', rolSucursalRoutes);
app.use('/api/rol-usuarios-sucursal', rolUsuariosSucursalRoutes);
app.use('/api/usuarios-sucursal', usuariosSucursalRoutes);
app.use('/api/ubicaciones-gps', ubiGpsRoutes);
app.use('/api/control-asistencia', controlAsistenciaRoutes);
app.use('/api/control-asistencia-view', controlAsistenciaViewRoutes);
app.use('/api/confirmacion-asistencia', confirmacionAsistenciaRoutes);

// Ruta simple para probar la conexión de la API (sin autenticación)
app.get('/api/test-connection', (req, res) => {
  res.json({
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    status: 'OK',
    port: process.env.PORT || 3001
  });
});

// Ruta para probar la conexión a la base de datos
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await executeQuery('SELECT 1 as test');
    res.json({
      message: 'Conexión a base de datos exitosa',
      data: result
    });
  } catch (error) {
    res.status(500).json({
      message: 'Error de conexión a base de datos',
      error: error.message
    });
  }
});

// Manejo de errores 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Ruta no encontrada',
    path: req.originalUrl,
    method: req.method
  });
});

// Manejo de errores globales
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: error.message
  });
});

// Iniciar el servidor
async function startServer() {
  try {
    await testConnection();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Servidor ejecutándose en http://0.0.0.0:${PORT}`);
      console.log(`📅 Iniciado: ${new Date().toLocaleString()}`);
      console.log('\n📋 Rutas disponibles:');
      console.log(`   GET  http://0.0.0.0:${PORT}/`);
      console.log(`   GET  http://0.0.0.0:${PORT}/api/test-db`);
    });
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Manejo de cierre graceful
process.on('SIGINT', async () => {
  console.log('\n🔄 Cerrando servidor...');
  await closePool();
  process.exit(0);
});

// Iniciar la aplicación
startServer();

module.exports = app;