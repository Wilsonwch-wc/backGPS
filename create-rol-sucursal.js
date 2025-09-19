const mysql = require('mysql2/promise');
require('dotenv').config();

async function createRolSucursalTable() {
  let connection;
  
  try {
    // Configuración de la base de datos
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || 'root',
      database: process.env.DB_NAME || 'bd_instituto',
      port: process.env.DB_PORT || 3306
    };

    console.log('Conectando a la base de datos bd_instituto...');
    connection = await mysql.createConnection(dbConfig);
    console.log('Conexión exitosa a la base de datos.');

    // SQL para crear la tabla rol_sucursal
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS rol_sucursal (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(100) NOT NULL UNIQUE,
        activo BOOLEAN DEFAULT TRUE,
        fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    console.log('Creando tabla rol_sucursal...');
    await connection.execute(createTableSQL);
    console.log('Tabla rol_sucursal creada exitosamente.');

    // Verificar si ya existen datos
    const [existingRows] = await connection.execute('SELECT COUNT(*) as count FROM rol_sucursal');
    
    if (existingRows[0].count === 0) {
      // Insertar datos iniciales
      const insertDataSQL = `
        INSERT INTO rol_sucursal (nombre) VALUES
        ('Tienda'),
        ('Almacén'),
        ('Instituto'),
        ('Oficina'),
        ('Centro de Distribución');
      `;

      console.log('Insertando datos iniciales...');
      await connection.execute(insertDataSQL);
      console.log('Datos iniciales insertados exitosamente.');
    } else {
      console.log('La tabla ya contiene datos, omitiendo inserción inicial.');
    }

    // Verificar los datos insertados
    const [rows] = await connection.execute('SELECT * FROM rol_sucursal ORDER BY id');
    console.log('\nDatos en la tabla rol_sucursal:');
    console.table(rows);

    console.log('\n✅ Tabla rol_sucursal creada y configurada exitosamente.');

  } catch (error) {
    console.error('❌ Error al crear la tabla rol_sucursal:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión a la base de datos cerrada.');
    }
  }
}

// Ejecutar la función
createRolSucursalTable();