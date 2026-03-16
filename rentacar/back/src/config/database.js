const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise} Connection result
 */
const connectDB = async () => {
  try {
    const isProduction = process.env.NODE_ENV === 'production';
    const dbUri = process.env.MONGODB_URI || (!isProduction ? 'mongodb://localhost:27017/rentacar' : null);

    if (!dbUri) {
      console.error('MONGODB_URI no está configurada en producción.');
      console.error('Defina MONGODB_URI en las variables de entorno del servicio en AWS.');
      return null;
    }
    
    console.log(`Intentando conectar a MongoDB en: ${dbUri}`);
    
    const connection = await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log(`MongoDB conectado: ${connection.connection.host}`);
    console.log(`Nombre de la base de datos: ${connection.connection.name}`);
    
    // Test connection by trying to access a collection
    const collections = await connection.connection.db.listCollections().toArray();
    console.log(`Colecciones disponibles: ${collections.map(c => c.name).join(', ') || 'Ninguna'}`);
    
    return connection;
  } catch (error) {
    console.error(`Error al conectar a MongoDB: ${error.message}`);
    console.error('Detalles completos del error:', error);
    
    if (error.name === 'MongoNetworkError') {
      console.error('Error de red: Verifique que MongoDB esté en ejecución y accesible');
    } else if (error.name === 'MongoServerSelectionError') {
      console.error('Error al seleccionar servidor: Verifique la configuración y que MongoDB esté en ejecución');
    } else if (error.code === 8000 || error.codeName === 'AtlasError') {
      console.error('Error de autenticacion con MongoDB Atlas: revise el usuario y la contraseña de MONGODB_URI.');
      console.error('Asegurese tambien de que el usuario exista en Database Access dentro de Atlas.');
    }
    
    // Keep process alive so container can pass health checks and retry later.
    console.warn('Continuando sin conexión a MongoDB. Se reintentará en segundo plano.');
    return null;
  }
};

module.exports = connectDB; 