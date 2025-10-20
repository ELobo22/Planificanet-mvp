// Script para probar la conexión a MySQL
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Cargar variables de entorno
dotenv.config();

async function testConnection() {
  console.log('🔍 Iniciando prueba de conexión a MySQL...\n');
  
  // Mostrar configuración que se está usando
  console.log('📝 Configuración de conexión:');
  console.log('   Host:', process.env.DB_HOST || 'localhost');
  console.log('   Usuario:', process.env.DB_USER || 'root');
  console.log('   Base de datos:', process.env.DB_NAME || 'planificanet');
  console.log('   ¿Password configurado?', process.env.DB_PASSWORD ? 'SÍ' : 'NO');
  console.log('');

  try {
    // Intentar conectar a MySQL
    console.log('🔄 Conectando a MySQL...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT || 3306
    });

    console.log('✅ Conexión a MySQL exitosa!\n');
    
    // Verificar tablas existentes
    console.log('📊 Verificando tablas...');
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('   Tablas encontradas:', tables.length);
    
    tables.forEach(table => {
      console.log('   -', table.Tables_in_planificanet);
    });
    console.log('');
    
    // Verificar datos de usuarios
    console.log('👥 Verificando usuarios...');
    const [users] = await connection.execute('SELECT id, email, nombre, tipo FROM usuarios');
    console.log('   Usuarios en el sistema:', users.length);
    
    users.forEach(user => {
      console.log('   -', user.nombre, `(${user.email}) - ${user.tipo}`);
    });
    console.log('');
    
    // Verificar turnos
    console.log('📅 Verificando turnos...');
    const [turns] = await connection.execute('SELECT COUNT(*) as total FROM turnos');
    console.log('   Turnos en el sistema:', turns[0].total);
    
    // Cerrar conexión
    await connection.end();
    console.log('🔌 Conexión cerrada correctamente.');
    console.log('\n🎉 ¡Todas las pruebas pasaron! La base de datos está lista.');

  } catch (error) {
    console.error('\n❌ ERROR de conexión a MySQL:\n');
    console.error('   Mensaje:', error.message);
    console.error('   Código:', error.code);
    console.error('\n🔧 SOLUCIÓN:');
    
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('   - Verifica usuario y password en backend/.env');
      console.log('   - Asegúrate que MySQL esté ejecutándose');
      console.log('   - Prueba conectar manualmente: mysql -u root -p');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('   - La base de datos no existe. Ejecuta:');
      console.log('     mysql -u root -proot < backend/database/setup.sql');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('   - MySQL no está ejecutándose o el puerto es incorrecto');
      console.log('   - Inicia MySQL Service');
    } else {
      console.log('   - Error desconocido. Verifica la configuración');
    }
    
    console.log('\n📝 Configuración actual:');
    console.log('   DB_HOST:', process.env.DB_HOST);
    console.log('   DB_USER:', process.env.DB_USER);
    console.log('   DB_PASSWORD:', process.env.DB_PASSWORD ? '***' : '(vacío)');
    console.log('   DB_NAME:', process.env.DB_NAME);
  }
}

// Ejecutar la prueba
testConnection();