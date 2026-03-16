/**
 * Script para resetear el usuario administrador
 * Elimina el admin existente y crea uno nuevo con la contraseña correcta
 */

const path = require('path');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Usuario = require('./src/models/usuario');

dotenv.config({
  path: path.join(__dirname, '.env'),
  override: true
});

const ADMIN_CREDENTIALS = {
  email: 'admin@rentacar.com',
  contraseña: 'admin123',
  nombre: 'Admin User',
  telefono: '',
  rol: 'admin'
};

async function resetAdmin() {
  try {
    // Conectar a MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Conectado a MongoDB');

    // Eliminar el admin existente si existe
    const deletedAdmin = await Usuario.findOneAndDelete({ email: ADMIN_CREDENTIALS.email });
    
    if (deletedAdmin) {
      console.log('✓ Usuario administrador anterior eliminado');
    } else {
      console.log('ℹ No se encontró usuario administrador anterior');
    }

    // Obtener el siguiente ID de usuario
    const lastUser = await Usuario.findOne().sort({ idUser: -1 });
    const idUser = lastUser ? lastUser.idUser + 1 : 1;
    
    // Crear el nuevo usuario administrador
    console.log('Creando nuevo usuario administrador...');
    
    const admin = new Usuario({
      ...ADMIN_CREDENTIALS,
      idUser
    });
    
    // Guardar (esto activará el middleware pre('save') que hashea la contraseña)
    await admin.save();
    
    console.log('✓ Usuario administrador creado exitosamente');
    console.log('ID de usuario:', admin.idUser);
    console.log('Email:', admin.email);
    console.log('Rol:', admin.rol);

    // Verificar que la contraseña se guardó correctamente
    const savedAdmin = await Usuario.findOne({ email: ADMIN_CREDENTIALS.email });
    console.log('\n✓ Verificación: Usuario guardado en BD');
    console.log('Contraseña hasheada correctamente:', savedAdmin.contraseña.startsWith('$2b$'));

    console.log('\n========================================');
    console.log('CREDENCIALES DE ADMINISTRADOR');
    console.log('========================================');
    console.log('Email:', ADMIN_CREDENTIALS.email);
    console.log('Contraseña:', ADMIN_CREDENTIALS.contraseña);
    console.log('========================================\n');

  } catch (error) {
    console.error('✗ Error al resetear administrador:', error);

    if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.error('MongoDB Atlas rechazo la autenticacion. Verifica el usuario y la contraseña configurados en MONGODB_URI.');
      console.error('Tambien confirma que el usuario de base de datos exista en Atlas y tenga permisos sobre el cluster.');
    }

    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
resetAdmin();
