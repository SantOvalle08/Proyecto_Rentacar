const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Cargar modelos
const autoSchema = new mongoose.Schema({
  idAuto: Number,
  marca: String,
  modelo: String,
  año: Number,
  anio: Number,
  tipoCoche: String,
  tipo: String,
  color: String,
  matricula: String,
  disponible: Boolean,
  precioDia: Number,
  precioBase: Number,
  imagen: String
}, { timestamps: true });

const Auto = mongoose.model('Auto', autoSchema);

async function checkAutos() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
    console.log(`Conectando a MongoDB en: ${dbUri}`);
    
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conexión establecida. Buscando autos...');
    
    // Contar autos
    const count = await Auto.countDocuments();
    console.log(`Total de autos en la base de datos: ${count}`);
    
    // Mostrar primeros 5 autos si existen
    if (count > 0) {
      const autos = await Auto.find().limit(5);
      console.log('Primeros 5 autos:');
      autos.forEach((auto, index) => {
        console.log(`\nAuto #${index + 1}:`);
        console.log(`ID: ${auto.idAuto}`);
        console.log(`Marca: ${auto.marca}`);
        console.log(`Modelo: ${auto.modelo}`);
        console.log(`Año: ${auto.año || auto.anio}`);
        console.log(`Tipo: ${auto.tipoCoche || auto.tipo}`);
        console.log(`Precio: ${auto.precioDia || auto.precioBase}`);
        console.log(`Disponible: ${auto.disponible ? 'Sí' : 'No'}`);
      });
    }
    
    // Crear un auto de prueba si no hay ninguno
    if (count === 0) {
      console.log('No hay autos. Creando uno de prueba...');
      
      // Buscar el último ID o usar 1 si no hay ninguno
      const lastAuto = await Auto.findOne().sort({ idAuto: -1 });
      const nextId = lastAuto ? lastAuto.idAuto + 1 : 1;
      
      const testAuto = new Auto({
        idAuto: nextId,
        marca: 'Toyota',
        modelo: 'Corolla',
        año: 2022,
        anio: 2022,
        tipoCoche: 'Sedan',
        tipo: 'Sedan',
        color: 'Blanco',
        matricula: 'TEST-123',
        disponible: true,
        precioDia: 50,
        precioBase: 50,
        imagen: 'default-car.jpg'
      });
      
      await testAuto.save();
      console.log(`Auto de prueba creado con ID: ${testAuto.idAuto}`);
    }
    
    await mongoose.disconnect();
    console.log('Conexión cerrada.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkAutos(); 