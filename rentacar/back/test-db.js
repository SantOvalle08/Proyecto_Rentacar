const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const connectDB = async () => {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
    
    console.log(`Intentando conectar a MongoDB en: ${dbUri}`);
    
    const connection = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB conectado: ${connection.connection.host}`);
    console.log(`Nombre de la base de datos: ${connection.connection.name}`);
    
    // Ver las colecciones disponibles
    const collections = await connection.connection.db.listCollections().toArray();
    console.log(`Colecciones disponibles: ${collections.map(c => c.name).join(', ') || 'Ninguna'}`);
    
    // Crear una colección de prueba si no existe ninguna
    if (collections.length === 0) {
      console.log('No hay colecciones. Creando colección de prueba...');
      await connection.connection.db.createCollection('test');
      console.log('Colección de prueba creada.');
    }
    
    // Cerrar conexión
    await mongoose.disconnect();
    console.log('Conexión cerrada.');
    
    return true;
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    console.error('Detalles completos del error:', error);
    return false;
  }
};

// Ejecutar la función
connectDB()
  .then(result => {
    console.log(`Resultado de la prueba: ${result ? 'Éxito' : 'Fallo'}`);
    process.exit(result ? 0 : 1);
  })
  .catch(err => {
    console.error('Error inesperado:', err);
    process.exit(1);
  }); 