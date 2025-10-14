const mongoose = require('mongoose');

/**
 * Connect to MongoDB database
 * @returns {Promise} Connection result
 */
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
    }
    
    // Don't exit process during development to allow fallback to localStorage
    if (process.env.NODE_ENV === 'production') {
      process.exit(1);
    } else {
      console.warn('Continuando sin conexión a MongoDB. Los datos se almacenarán solo en localStorage.');
      return null;
    }
  }
};

module.exports = connectDB; 