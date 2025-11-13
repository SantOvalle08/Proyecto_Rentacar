/**
 * Script para inicializar el usuario administrador de prueba
 * Ejecutar con: node init-admin.js
 */

const mongoose = require('mongoose');
const Usuario = require('./src/models/usuario');

const ADMIN_CREDENTIALS = {
  email: 'admin@rentacar.com',
  contraseña: 'admin123',
  nombre: 'Admin User',
  telefono: '',
  rol: 'admin'
};

async function initAdmin() {
  try {
    // Conectar a MongoDB
    const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
    console.log('Conectando a MongoDB...');
    await mongoose.connect(MONGO_URI);
    console.log('✓ Conectado a MongoDB');

    // Verificar si el admin ya existe
    const existingAdmin = await Usuario.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('ℹ El usuario administrador ya existe en la base de datos');
      console.log('Email:', existingAdmin.email);
      console.log('Rol:', existingAdmin.rol);
      
      // Actualizar rol si no es admin
      if (existingAdmin.rol !== 'admin') {
        existingAdmin.rol = 'admin';
        await existingAdmin.save();
        console.log('✓ Rol actualizado a "admin"');
      }
    } else {
      // Crear el usuario administrador
      console.log('Creando usuario administrador...');
      
      // Obtener el siguiente ID de usuario
      const lastUser = await Usuario.findOne().sort({ idUser: -1 });
      const idUser = lastUser ? lastUser.idUser + 1 : 1;
      
      const admin = new Usuario({
        ...ADMIN_CREDENTIALS,
        idUser
      });
      
      await admin.save();
      console.log('✓ Usuario administrador creado exitosamente');
      console.log('Email:', admin.email);
      console.log('Contraseña:', 'admin123');
      console.log('Rol:', admin.rol);
    }

    console.log('\n========================================');
    console.log('CREDENCIALES DE ADMINISTRADOR');
    console.log('========================================');
    console.log('Email:', ADMIN_CREDENTIALS.email);
    console.log('Contraseña:', ADMIN_CREDENTIALS.contraseña);
    console.log('========================================\n');

  } catch (error) {
    console.error('✗ Error al inicializar administrador:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('Conexión a MongoDB cerrada');
    process.exit(0);
  }
}

// Ejecutar el script
initAdmin();
