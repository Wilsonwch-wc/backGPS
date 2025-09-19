const { testConnection } = require('./config/database');

async function testDB() {
  console.log('🔍 Probando conexión a la base de datos...');
  console.log('================================');
  
  try {
    await testConnection();
    console.log('\n✅ ¡Conexión exitosa!');
    console.log('La base de datos está lista para usar.');
    process.exit(0);
  } catch (error) {
    console.log('\n❌ Error de conexión:');
    console.log('Error:', error.message);
    console.log('\n🔧 Verifica:');
    console.log('- Que MySQL esté ejecutándose');
    console.log('- Las credenciales en el archivo .env');
    console.log('- Que la base de datos exista');
    console.log('- Los permisos del usuario');
    process.exit(1);
  }
}

testDB();