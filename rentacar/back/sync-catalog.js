/**
 * Sync Catalog Script - Ensures the catalog contains all autos from the Auto collection
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Define MongoDB connection URI
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
console.log(`Using MongoDB URI: ${dbUri}`);

// Define schemas
const autoSchema = new mongoose.Schema({
  idAuto: {
    type: Number,
    required: true,
    unique: true
  },
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
}, {
  timestamps: true
});

autoSchema.methods.mostrarDetalles = function() {
  return {
    id: this.idAuto,
    marca: this.marca,
    modelo: this.modelo,
    año: this.año,
    anio: this.año,
    tipo: this.tipoCoche,
    tipoCoche: this.tipoCoche,
    color: this.color,
    matricula: this.matricula,
    disponible: this.disponible,
    precioDia: this.precioDia,
    precioBase: this.precioDia,
    imagen: this.imagen
  };
};

const catalogoSchema = new mongoose.Schema({
  listaAutos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auto'
  }]
}, {
  timestamps: true
});

// Register models
const Auto = mongoose.model('Auto', autoSchema);
const Catalogo = mongoose.model('Catalogo', catalogoSchema);

/**
 * Main sync function
 */
async function syncCatalog() {
  try {
    // Connect to MongoDB
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to MongoDB');

    // Get all autos
    const autos = await Auto.find({});
    console.log(`Found ${autos.length} autos in the database`);

    // Find or create catalog
    let catalogo = await Catalogo.findOne();
    if (!catalogo) {
      console.log('No catalog found. Creating a new one...');
      catalogo = new Catalogo({ listaAutos: [] });
      await catalogo.save();
    }

    console.log(`Current catalog has ${catalogo.listaAutos.length} autos`);

    // Check which autos are missing from the catalog
    const autosIdsInCatalog = catalogo.listaAutos.map(id => id.toString());
    const missingAutos = autos.filter(auto => !autosIdsInCatalog.includes(auto._id.toString()));
    
    console.log(`Found ${missingAutos.length} autos missing from the catalog`);

    // Add missing autos to catalog
    if (missingAutos.length > 0) {
      catalogo.listaAutos = [...catalogo.listaAutos, ...missingAutos.map(auto => auto._id)];
      await catalogo.save();
      console.log(`Added ${missingAutos.length} autos to the catalog`);
    }

    // Verify catalog
    catalogo = await Catalogo.findOne().populate('listaAutos');
    console.log(`\nVerification: Catalog now has ${catalogo.listaAutos.length} autos`);
    
    // List all autos in catalog
    console.log('\nAutos in catalog:');
    catalogo.listaAutos.forEach((auto, index) => {
      console.log(`${index + 1}. ${auto.marca} ${auto.modelo} (${auto.año}) - ID: ${auto.idAuto}`);
    });

    console.log('\nSync completed successfully');
  } catch (error) {
    console.error('Error syncing catalog:', error);
  } finally {
    // Close MongoDB connection
    await mongoose.disconnect();
    console.log('MongoDB connection closed');
  }
}

// Run the sync function
syncCatalog(); 