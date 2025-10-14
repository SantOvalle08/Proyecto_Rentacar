const mongoose = require('mongoose');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Cargar variables de entorno
dotenv.config();

// Definir los modelos
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

const catalogoSchema = new mongoose.Schema({
  listaAutos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auto' }]
}, { timestamps: true });

// Método para mostrar detalles
autoSchema.methods.mostrarDetalles = function() {
  return {
    id: this.idAuto,
    marca: this.marca,
    modelo: this.modelo,
    año: this.año,
    anio: this.año, // Incluir ambos para compatibilidad
    tipo: this.tipoCoche,
    tipoCoche: this.tipoCoche, // Incluir ambos para compatibilidad
    color: this.color,
    matricula: this.matricula,
    disponible: this.disponible,
    precioDia: this.precioDia,
    precioBase: this.precioDia, // Incluir ambos para compatibilidad
    imagen: this.imagen
  };
};

catalogoSchema.methods.mostrarCatalogo = async function() {
  await this.populate('listaAutos');
  return this.listaAutos;
};

const Auto = mongoose.model('Auto', autoSchema);
const Catalogo = mongoose.model('Catalogo', catalogoSchema);

async function syncData() {
  try {
    console.log('Iniciando sincronización de datos...');
    
    // Conectar a MongoDB
    const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
    console.log(`Conectando a MongoDB en: ${dbUri}`);
    
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conexión a MongoDB establecida.');
    
    // 1. Verificar autos existentes en MongoDB
    const autos = await Auto.find();
    console.log(`Se encontraron ${autos.length} autos en MongoDB.`);
    
    // 2. Verificar el catálogo
    let catalogo = await Catalogo.findOne();
    if (!catalogo) {
      console.log('No se encontró catálogo. Creando uno nuevo...');
      catalogo = new Catalogo({ listaAutos: [] });
      await catalogo.save();
    }
    
    // 3. Crear autos de ejemplo si no hay ninguno
    if (autos.length === 0) {
      console.log('No hay autos en la base de datos. Creando ejemplos...');
      
      const ejemplos = [
        {
          idAuto: 1,
          marca: 'Toyota',
          modelo: 'Corolla',
          año: 2022,
          anio: 2022,
          tipoCoche: 'Sedan',
          tipo: 'Sedan',
          color: 'Blanco',
          matricula: 'ABC-123',
          disponible: true,
          precioDia: 50,
          precioBase: 50,
          imagen: 'https://toyotaassets.scene7.com/is/image/toyota/COR_MY23_0001_V001-1?fmt=jpg&fit=crop&qlt=90&wid=1500'
        },
        {
          idAuto: 2,
          marca: 'Honda',
          modelo: 'Civic',
          año: 2021,
          anio: 2021,
          tipoCoche: 'Sedan',
          tipo: 'Sedan',
          color: 'Azul',
          matricula: 'XYZ-789',
          disponible: true,
          precioDia: 45,
          precioBase: 45,
          imagen: 'https://www.honda.com.mx/assets/img/auto/civic/colores/cosmic-blue.jpg'
        },
        {
          idAuto: 3,
          marca: 'Ford',
          modelo: 'Explorer',
          año: 2023,
          anio: 2023,
          tipoCoche: 'SUV',
          tipo: 'SUV',
          color: 'Negro',
          matricula: 'DEF-456',
          disponible: true,
          precioDia: 75,
          precioBase: 75,
          imagen: 'https://www.ford.mx/content/dam/Ford/website-assets/latam/mx/nameplate/explorer/2022/overview/new/ford-explorer-2022-camioneta-familia-diseno-exterior-color-rojo-lucid.jpg.dam.full.high.jpg/1642097494293.jpg'
        }
      ];
      
      for (const ejemplo of ejemplos) {
        const auto = new Auto(ejemplo);
        await auto.save();
        console.log(`Auto creado: ${auto.marca} ${auto.modelo}`);
        
        // Añadir al catálogo
        catalogo.listaAutos.push(auto._id);
      }
      
      await catalogo.save();
      console.log(`Se agregaron ${ejemplos.length} autos al catálogo.`);
    }
    
    // 4. Asegurarse de que todos los autos estén en el catálogo
    for (const auto of autos) {
      if (!catalogo.listaAutos.includes(auto._id)) {
        console.log(`Añadiendo auto ${auto.idAuto} (${auto.marca} ${auto.modelo}) al catálogo...`);
        catalogo.listaAutos.push(auto._id);
      }
    }
    await catalogo.save();
    
    // 5. Generar un archivo JSON con los datos para el frontend
    const autosTransformados = autos.map(auto => ({
      id: auto.idAuto,
      marca: auto.marca,
      modelo: auto.modelo,
      anio: auto.año || auto.anio,
      año: auto.año || auto.anio,
      tipo: auto.tipoCoche || auto.tipo,
      tipoCoche: auto.tipoCoche || auto.tipo,
      color: auto.color,
      matricula: auto.matricula,
      disponible: auto.disponible,
      precioBase: auto.precioDia || auto.precioBase,
      precioDia: auto.precioDia || auto.precioBase,
      imagen: auto.imagen
    }));
    
    // Guardar el archivo JSON
    const dataPath = path.resolve(__dirname, '../front/rentacar/public/data');
    
    // Crear directorio si no existe
    if (!fs.existsSync(dataPath)) {
      fs.mkdirSync(dataPath, { recursive: true });
    }
    
    fs.writeFileSync(
      path.join(dataPath, 'autos.json'),
      JSON.stringify(autosTransformados, null, 2)
    );
    console.log(`Se guardaron ${autosTransformados.length} autos en el archivo JSON.`);
    
    console.log('Sincronización completada con éxito.');
    await mongoose.disconnect();
    
  } catch (error) {
    console.error('Error durante la sincronización:', error);
    
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    
    process.exit(1);
  }
}

// Ejecutar la sincronización
syncData(); 