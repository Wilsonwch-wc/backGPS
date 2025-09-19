const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Configuración de la base de datos
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'bd_instituto',
  port: process.env.DB_PORT || 3306,
  multipleStatements: true
};

async function applySchema() {
  let connection;
  
  try {
    console.log('Conectando a la base de datos...');
    connection = await mysql.createConnection(dbConfig);
    
    console.log('Leyendo archivo schema.sql...');
    const schemaPath = path.join(__dirname, 'database', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('Aplicando schema a la base de datos...');
    
    // Dividir el contenido SQL en comandos individuales
    const sqlCommands = schema
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('/*'));
    
    console.log(`Ejecutando ${sqlCommands.length} comandos SQL...`);
    
    // Ejecutar cada comando por separado
    for (let i = 0; i < sqlCommands.length; i++) {
        const command = sqlCommands[i];
        if (command.toLowerCase().includes('show') || command.toLowerCase().includes('describe')) {
            // Saltar comandos de visualización
            continue;
        }
        
        try {
            await connection.execute(command);
            console.log(`✅ Comando ${i + 1} ejecutado exitosamente`);
        } catch (error) {
            if (error.message.includes('already exists') || error.message.includes('Duplicate entry')) {
                console.log(`⚠️  Comando ${i + 1} omitido (ya existe)`);
            } else {
                console.log(`❌ Error en comando ${i + 1}: ${error.message}`);
            }
        }
    }
    
    console.log('\n✅ Schema aplicado exitosamente');
    
    // Mostrar confirmación
    console.log('\n📋 Verificando tablas creadas:');
    const [tables] = await connection.execute('SHOW TABLES');
    tables.forEach(table => {
        console.log(`  - ${Object.values(table)[0]}`);
    });
    
    // Verificar la relación entre sucursales y rol_sucursal
    console.log('\n🔗 Verificando relación sucursales -> rol_sucursal:');
    const [sucursales] = await connection.execute(`
        SELECT s.id, s.nombre, s.descripcion, rs.nombre as tipo_sucursal 
        FROM sucursales s 
        JOIN rol_sucursal rs ON s.tipo_sucursal_id = rs.id
    `);
    
    if (sucursales.length > 0) {
        console.log('✅ Relación funcionando correctamente:');
        sucursales.forEach(sucursal => {
            console.log(`  - ${sucursal.nombre} (${sucursal.tipo_sucursal})`);
        });
    } else {
        console.log('⚠️  No hay sucursales registradas aún');
    }
    
  } catch (error) {
    console.error('❌ Error al aplicar schema:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar el script
applySchema();