require('dotenv').config();
const mysql = require('mysql2/promise');

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'bd_instituto',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Conexión a MySQL establecida correctamente');
    console.log(`📊 Base de datos: ${dbConfig.database}`);
    console.log(`🏠 Host: ${dbConfig.host}:${dbConfig.port}`);
    console.log(`👤 Usuario: ${dbConfig.user}`);
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    throw error;
  }
}

// Función para ejecutar consultas
async function executeQuery(query, params = []) {
  try {
    const [rows] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error ejecutando consulta:', error.message);
    throw error;
  }
}

// Función para ejecutar consultas que necesitan el resultado completo (INSERT, UPDATE, DELETE)
async function executeQueryWithResult(query, params = []) {
  try {
    const [rows, fields] = await pool.execute(query, params);
    return rows;
  } catch (error) {
    console.error('Error ejecutando consulta:', error.message);
    throw error;
  }
}

// Función para cerrar todas las conexiones
async function closePool() {
  try {
    await pool.end();
    console.log('✅ Pool de conexiones cerrado correctamente');
  } catch (error) {
    console.error('Error cerrando pool de conexiones:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  dbConfig,
  testConnection,
  executeQuery,
  executeQueryWithResult,
  closePool
};