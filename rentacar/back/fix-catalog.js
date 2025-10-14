/**
 * Fix Catalog Script - Regenera el catálogo y lo sincroniza con los autos existentes
 * 
 * Este script:
 * 1. Busca el catálogo actual y lo elimina si existe
 * 2. Busca todos los autos en la colección Auto
 * 3. Crea un nuevo catálogo con referencias a todos los autos encontrados
 * 4. Guarda el nuevo catálogo en la base de datos
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Cargar variables de entorno
dotenv.config();

// Configuración de MongoDB
const dbUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rentacar';
console.log(`Usando URI de MongoDB: ${dbUri}`);

// Definir esquemas necesarios
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

// Añadir método mostrarDetalles para tener consistencia
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

// Añadir el método mostrarCatalogo para mantener consistencia
catalogoSchema.methods.mostrarCatalogo = async function() {
  await this.populate('listaAutos');
  if (!this.listaAutos || this.listaAutos.length === 0) {
    return [];
  }
  return this.listaAutos.map(auto => {
    if (auto && typeof auto.mostrarDetalles === 'function') {
      return auto.mostrarDetalles();
    } else {
      return auto;
    }
  });
};

// Verificar también si tenemos autos en un archivo local JSON
const buscarAutosJSON = () => {
  try {
    const jsonPath = path.resolve(__dirname, '../front/rentacar/public/data/autos.json');
    
    if (fs.existsSync(jsonPath)) {
      console.log(`Encontrado archivo JSON en: ${jsonPath}`);
      const jsonData = fs.readFileSync(jsonPath, 'utf8');
      return JSON.parse(jsonData);
    }
  } catch (error) {
    console.error('Error leyendo archivo JSON:', error);
  }
  return null;
};

// Registrar los modelos
const Auto = mongoose.model('Auto', autoSchema);
const Catalogo = mongoose.model('Catalogo', catalogoSchema);

// Función principal para corregir el catálogo
async function fixCatalog() {
  console.log('=== INICIO DEL PROCESO DE REPARACIÓN DEL CATÁLOGO ===');
  
  try {
    // Conectar a MongoDB
    console.log('Conectando a MongoDB...');
    await mongoose.connect(dbUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    console.log('Conexión a MongoDB establecida');
    
    // Paso 1: Buscar y eliminar el catálogo actual
    console.log('Buscando catálogo existente...');
    const catalogoExistente = await Catalogo.findOne();
    
    if (catalogoExistente) {
      console.log(`Catálogo encontrado. ID: ${catalogoExistente._id}. Eliminando...`);
      await Catalogo.deleteOne({ _id: catalogoExistente._id });
      console.log('Catálogo eliminado con éxito.');
    } else {
      console.log('No se encontró ningún catálogo existente.');
    }
    
    // Paso 2: Buscar todos los autos en la colección Auto
    console.log('Buscando autos en la base de datos...');
    const autosEnDB = await Auto.find({});
    console.log(`Se encontraron ${autosEnDB.length} autos en la base de datos.`);
    
    // Paso 3: Si no hay autos en la base de datos, intentar cargarlos desde el archivo JSON
    if (autosEnDB.length === 0) {
      console.log('No hay autos en la base de datos. Verificando JSON...');
      
      const autosJSON = buscarAutosJSON();
      
      if (autosJSON && autosJSON.length > 0) {
        console.log(`Encontrados ${autosJSON.length} autos en archivo JSON. Importando a MongoDB...`);
        
        // Importar autos desde JSON
        for (const autoData of autosJSON) {
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
              color: autoData.color || 'No especificado',
              matricula: autoData.matricula || 'No especificado',
              disponible: autoData.disponible === undefined ? true : autoData.disponible,
              precioDia: autoData.precioDia || autoData.precioBase || 0,
              precioBase: autoData.precioDia || autoData.precioBase || 0,
              imagen: autoData.imagen || 'default-car.jpg'
            };
            
            // Verificar si ya existe
            const existingAuto = await Auto.findOne({ idAuto: autoNormalizado.idAuto });
            
            if (!existingAuto) {
              const nuevoAuto = new Auto(autoNormalizado);
              await nuevoAuto.save();
              console.log(`Auto importado: ${nuevoAuto.marca} ${nuevoAuto.modelo}`);
            }
          } catch (importError) {
            console.error(`Error importando auto: ${JSON.stringify(autoData)}`, importError);
          }
        }
        
        // Volver a buscar los autos después de la importación
        const autosImportados = await Auto.find({});
        console.log(`Después de importar, hay ${autosImportados.length} autos en la base de datos.`);
        
        if (autosImportados.length > 0) {
          autosEnDB.push(...autosImportados);
        }
      }
    }
    
    // Paso 4: Crear un nuevo catálogo con referencias a todos los autos
    console.log('Creando nuevo catálogo...');
    const nuevoCatalogo = new Catalogo({
      listaAutos: autosEnDB.map(auto => auto._id)
    });
    
    // Paso 5: Guardar el nuevo catálogo
    await nuevoCatalogo.save();
    console.log(`Nuevo catálogo creado con ${nuevoCatalogo.listaAutos.length} autos. ID: ${nuevoCatalogo._id}`);
    
    // Paso 6: Verificar el nuevo catálogo
    const catalogoVerificado = await Catalogo.findOne().populate('listaAutos');
    
    if (catalogoVerificado) {
      console.log('\nVerificación del catálogo:');
      console.log(`- Catálogo ID: ${catalogoVerificado._id}`);
      console.log(`- Total de autos en catálogo: ${catalogoVerificado.listaAutos.length}`);
      
      // Listar los autos en el catálogo
      console.log('\nAutos en el catálogo:');
      if (catalogoVerificado.listaAutos && catalogoVerificado.listaAutos.length > 0) {
        catalogoVerificado.listaAutos.forEach((auto, index) => {
          if (auto) {
            console.log(`${index + 1}. ${auto.marca} ${auto.modelo} (${auto.año}) - ID: ${auto.idAuto}`);
          } else {
            console.log(`${index + 1}. Auto no válido o no encontrado`);
          }
        });
      } else {
        console.log('  No hay autos en el catálogo.');
      }
    } else {
      console.log('ADVERTENCIA: No se pudo verificar el catálogo recién creado.');
    }
    
    console.log('\n=== PROCESO DE REPARACIÓN COMPLETADO CON ÉXITO ===');
  } catch (error) {
    console.error('Error en el proceso de reparación:', error);
    console.log('\n=== PROCESO DE REPARACIÓN FINALIZADO CON ERRORES ===');
  } finally {
    // Cerrar la conexión a MongoDB
    if (mongoose.connection.readyState === 1) {
      await mongoose.disconnect();
      console.log('Conexión a MongoDB cerrada.');
    }
  }
}

// Ejecutar la función principal
fixCatalog(); 