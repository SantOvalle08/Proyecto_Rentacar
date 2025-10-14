const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configurar la conexión a MongoDB
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
console.log(`Usando URI de MongoDB: ${dbUri}`);

// Definir el esquema de Auto para MongoDB
const autoSchema = new mongoose.Schema({
  idAuto: {
    type: Number,
    required: true,
    unique: true
  },
  marca: {
    type: String,
    required: true
  },
  modelo: {
    type: String,
    required: true
  },
  año: {
    type: Number,
    required: true
  },
  anio: {
    type: Number
  },
  tipoCoche: {
    type: String,
    required: true
  },
  tipo: {
    type: String
  },
  color: {
    type: String,
    default: 'No especificado'
  },
  matricula: {
    type: String,
    default: 'No especificado'
  },
  disponible: {
    type: Boolean,
    default: true
  },
  precioDia: {
    type: Number,
    required: true
  },
  precioBase: {
    type: Number
  },
  imagen: {
    type: String,
    default: 'default-car.jpg'
  }
}, {
  timestamps: true
});

// Método para mostrar detalles
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

// Middleware pre-save para sincronizar campos
autoSchema.pre('save', function(next) {
  if (this.año && !this.anio) this.anio = this.año;
  if (this.anio && !this.año) this.año = this.anio;
  if (this.tipoCoche && !this.tipo) this.tipo = this.tipoCoche;
  if (this.tipo && !this.tipoCoche) this.tipoCoche = this.tipo;
  if (this.precioDia && !this.precioBase) this.precioBase = this.precioDia;
  if (this.precioBase && !this.precioDia) this.precioDia = this.precioBase;
  next();
});

// Definir el esquema para el catálogo
const catalogoSchema = new mongoose.Schema({
  listaAutos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Auto' }]
}, { timestamps: true });

// Método para obtener el catálogo
catalogoSchema.methods.mostrarCatalogo = async function() {
  await this.populate('listaAutos');
  return this.listaAutos;
};

// Registrar los modelos
const Auto = mongoose.model('Auto', autoSchema);
const Catalogo = mongoose.model('Catalogo', catalogoSchema);

// Función principal para importar datos
async function importDataFromJson() {
  try {
    console.log('Iniciando importación de datos desde JSON a MongoDB...');
    
    // Conectar a MongoDB
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Conexión a MongoDB establecida');
    
    // Ruta al archivo JSON
    const jsonPath = path.resolve(__dirname, '../front/rentacar/public/data/autos.json');
    console.log(`Buscando archivo JSON en: ${jsonPath}`);
    
    // Verificar que el archivo existe
    if (!fs.existsSync(jsonPath)) {
      console.error(`Error: El archivo JSON no existe en la ruta: ${jsonPath}`);
      return;
    }
    
    // Leer el archivo JSON
    const jsonData = fs.readFileSync(jsonPath, 'utf8');
    const autos = JSON.parse(jsonData);
    console.log(`Se cargaron ${autos.length} autos desde el JSON`);
    
    // Buscar o crear el catálogo
    let catalogo = await Catalogo.findOne();
    if (!catalogo) {
      console.log('No se encontró un catálogo. Creando uno nuevo.');
      catalogo = new Catalogo({ listaAutos: [] });
      await catalogo.save();
    }
    
    // Procesar cada auto del JSON
    console.log('Procesando autos...');
    let creados = 0;
    let actualizados = 0;
    let errores = 0;
    
    for (const autoData of autos) {
      try {
        // Normalizar datos
        const autoNormalizado = {
          idAuto: autoData.id || autoData.idAuto,
          marca: autoData.marca,
          modelo: autoData.modelo,
          año: autoData.año || autoData.anio,
          anio: autoData.año || autoData.anio,
          tipoCoche: autoData.tipoCoche || autoData.tipo,
          tipo: autoData.tipoCoche || autoData.tipo,
          color: autoData.color,
          matricula: autoData.matricula,
          disponible: autoData.disponible === undefined ? true : autoData.disponible,
          precioDia: autoData.precioDia || autoData.precioBase,
          precioBase: autoData.precioDia || autoData.precioBase,
          imagen: autoData.imagen || 'default-car.jpg'
        };
        
        // Verificar si el auto ya existe
        const existingAuto = await Auto.findOne({ idAuto: autoNormalizado.idAuto });
        
        if (existingAuto) {
          // Actualizar auto existente
          Object.assign(existingAuto, autoNormalizado);
          await existingAuto.save();
          console.log(`Auto actualizado: ${existingAuto.marca} ${existingAuto.modelo} (ID: ${existingAuto.idAuto})`);
          actualizados++;
          
          // Verificar si ya está en el catálogo
          if (!catalogo.listaAutos.includes(existingAuto._id)) {
            catalogo.listaAutos.push(existingAuto._id);
            await catalogo.save();
            console.log(`Auto añadido al catálogo: ${existingAuto.idAuto}`);
          }
        } else {
          // Crear nuevo auto
          const nuevoAuto = new Auto(autoNormalizado);
          await nuevoAuto.save();
          console.log(`Auto creado: ${nuevoAuto.marca} ${nuevoAuto.modelo} (ID: ${nuevoAuto.idAuto})`);
          creados++;
          
          // Añadir al catálogo
          catalogo.listaAutos.push(nuevoAuto._id);
          await catalogo.save();
          console.log(`Auto añadido al catálogo: ${nuevoAuto.idAuto}`);
        }
      } catch (error) {
        console.error(`Error al procesar auto: ${JSON.stringify(autoData)}`, error);
        errores++;
      }
    }
    
    // Mostrar resumen
    console.log('\nResumen de importación:');
    console.log(`- Autos creados: ${creados}`);
    console.log(`- Autos actualizados: ${actualizados}`);
    console.log(`- Errores: ${errores}`);
    
    // Verificar resultados
    const autosEnDb = await Auto.find();
    console.log(`\nTotal de autos en MongoDB: ${autosEnDb.length}`);
    
    await catalogo.populate('listaAutos');
    console.log(`Total de autos en catálogo: ${catalogo.listaAutos.length}`);
    
    console.log('\nImportación completada');
    
  } catch (error) {
    console.error('Error en la importación:', error);
  } finally {
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Conexión a MongoDB cerrada');
    }
  }
}

// Ejecutar la importación
importDataFromJson(); 