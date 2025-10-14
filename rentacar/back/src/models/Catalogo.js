/**
 * @module models/Catalogo
 * @description Modelo de Catálogo para gestionar la lista de vehículos disponibles
 */

const mongoose = require('mongoose');
const Auto = require('./Auto');

/**
 * @typedef {Object} CatalogoSchema
 * @property {Array<mongoose.Schema.Types.ObjectId>} listaAutos - Lista de referencias a vehículos
 * @property {Date} createdAt - Fecha de creación del registro
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * Esquema de Catálogo para MongoDB
 * @type {mongoose.Schema}
 */
const catalogoSchema = new mongoose.Schema({
  listaAutos: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auto'
  }]
}, {
  timestamps: true
});

/**
 * Muestra el catálogo completo de vehículos
 * @async
 * @returns {Promise<Array<Object>>} Lista de vehículos con sus detalles
 * @throws {Error} Si hay un error al obtener los vehículos
 */
catalogoSchema.methods.mostrarCatalogo = async function() {
  try {
    await this.populate('listaAutos');
    
    // Check if listaAutos is populated and has items
    if (!this.listaAutos || this.listaAutos.length === 0) {
      console.log('Catálogo vacío o no poblado correctamente');
      
      // Fallback: Get all autos directly from Auto collection
      const allAutos = await Auto.find({});
      console.log(`Fallback: Encontrados ${allAutos.length} autos directamente de la colección`);
      
      return allAutos.map(auto => auto.mostrarDetalles());
    }
    
    // Normal case - autos are properly populated
    console.log(`Retornando ${this.listaAutos.length} autos del catálogo poblado`);
    return this.listaAutos.map(auto => {
      // Check if the auto has the mostrarDetalles method
      if (auto && typeof auto.mostrarDetalles === 'function') {
        return auto.mostrarDetalles();
      } else {
        // Fallback if auto doesn't have the method
        return auto;
      }
    });
  } catch (error) {
    console.error('Error al mostrar catálogo:', error);
    return [];
  }
};

/**
 * Busca vehículos en el catálogo por marca y modelo
 * @async
 * @param {string} marca - Marca del vehículo a buscar
 * @param {string} modelo - Modelo del vehículo a buscar
 * @returns {Promise<Array<Object>>} Lista de vehículos que coinciden con la búsqueda
 */
catalogoSchema.methods.buscarAuto = async function(marca, modelo) {
  await this.populate({
    path: 'listaAutos',
    match: { 
      marca: new RegExp(marca, 'i'),
      modelo: new RegExp(modelo, 'i') 
    }
  });
  
  return this.listaAutos.map(auto => auto.mostrarDetalles());
};

const Catalogo = mongoose.model('Catalogo', catalogoSchema);

module.exports = Catalogo; 