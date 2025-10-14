const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Cargar modelos
const catalogoSchema = new mongoose.Schema({
  listaAutos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auto' }]
}, { timestamps: true });

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

catalogoSchema.methods.mostrarCatalogo = async function() {
  await this.populate('listaAutos');
  return this.listaAutos;
};

const Catalogo = mongoose.model('Catalogo', catalogoSchema);
const Auto = mongoose.model('Auto', autoSchema);

async function checkCatalog() {
  try {
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
    console.log(`Conectando a MongoDB en: ${dbUri}`);
    
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conexión establecida. Verificando catálogo...');
    
    // Buscar catálogo existente
    let catalogo = await Catalogo.findOne();
    
    if (!catalogo) {
      console.log('No existe catálogo. Creando uno nuevo...');
      catalogo = new Catalogo({ listaAutos: [] });
      await catalogo.save();
      console.log('Catálogo creado.');
    }
    
    console.log(`Catálogo encontrado con ID: ${catalogo._id}`);
    console.log(`Autos en el catálogo: ${catalogo.listaAutos.length}`);
    
    // Buscar autos que no estén en el catálogo
    const todosLosAutos = await Auto.find();
    console.log(`Total de autos en la base de datos: ${todosLosAutos.length}`);
    
    // Añadir autos al catálogo si no están ya
    for (const auto of todosLosAutos) {
      if (!catalogo.listaAutos.includes(auto._id)) {
        console.log(`Añadiendo auto ${auto.idAuto} (${auto.marca} ${auto.modelo}) al catálogo...`);
        catalogo.listaAutos.push(auto._id);
        await catalogo.save();
      }
    }
    
    console.log(`Catálogo actualizado. Ahora tiene ${catalogo.listaAutos.length} autos.`);
    
    // Mostrar todos los autos en el catálogo
    if (catalogo.listaAutos.length > 0) {
      await catalogo.populate('listaAutos');
      console.log('\nAutos en el catálogo:');
      catalogo.listaAutos.forEach((auto, index) => {
        console.log(`\nAuto #${index + 1}:`);
        console.log(`ID: ${auto.idAuto}`);
        console.log(`Marca: ${auto.marca}`);
        console.log(`Modelo: ${auto.modelo}`);
      });
    }
    
    await mongoose.disconnect();
    console.log('Conexión cerrada.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

checkCatalog(); 