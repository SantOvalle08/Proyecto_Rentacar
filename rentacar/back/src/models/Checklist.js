/**
 * @module models/Checklist
 * @description Modelo de Checklist para registrar el estado de los vehículos
 */

const mongoose = require('mongoose');

/**
 * @typedef {Object} RayonItem
 * @property {string} descripcion - Descripción del rayón
 * @property {string} ubicacion - Ubicación del rayón en el vehículo
 * @property {Date} fecha - Fecha de registro del rayón
 */

/**
 * @typedef {Object} InventarioItem
 * @property {string} nombre - Nombre del ítem (ej: "Gato", "Llanta de repuesto")
 * @property {boolean} presente - Si el ítem está presente o no
 * @property {string} [condicion] - Condición del ítem (Bueno, Regular, Malo)
 * @property {string} [notas] - Notas adicionales
 */

/**
 * @typedef {Object} ChecklistSchema
 * @property {ObjectId} autoId - ID del vehículo al que pertenece el checklist
 * @property {number} idAuto - ID numérico del vehículo
 * @property {string} nivelGasolina - Nivel de gasolina (Vacío, 1/4, 1/2, 3/4, Lleno)
 * @property {number} porcentajeGasolina - Porcentaje numérico de gasolina (0-100)
 * @property {Array<RayonItem>} rayones - Lista de rayones identificados
 * @property {Array<InventarioItem>} inventario - Inventario del vehículo
 * @property {string} estadoGeneral - Estado general del vehículo
 * @property {string} [observaciones] - Observaciones adicionales
 * @property {ObjectId} ultimaActualizacionPor - Usuario que realizó la última actualización
 * @property {Date} fechaUltimaRevision - Fecha de la última revisión
 * @property {Date} createdAt - Fecha de creación
 * @property {Date} updatedAt - Fecha de última actualización
 */

// Enum para nivel de gasolina
const nivelesGasolina = ['Vacío', '1/4', '1/2', '3/4', 'Lleno'];

// Enum para estado general
const estadosGenerales = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere atención'];

// Enum para condición de ítems
const condiciones = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No funcional'];

/**
 * Sub-esquema para rayones
 */
const rayonSchema = new mongoose.Schema({
  descripcion: {
    type: String,
    required: true
  },
  ubicacion: {
    type: String,
    required: true
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { _id: true });

/**
 * Sub-esquema para inventario
 */
const inventarioSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: true
  },
  presente: {
    type: Boolean,
    default: true
  },
  condicion: {
    type: String,
    enum: condiciones,
    default: 'Bueno'
  },
  notas: {
    type: String,
    default: ''
  }
}, { _id: true });

/**
 * Esquema principal de Checklist
 */
const checklistSchema = new mongoose.Schema({
  autoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auto',
    required: true
  },
  idAuto: {
    type: Number,
    required: true
  },
  nivelGasolina: {
    type: String,
    enum: nivelesGasolina,
    default: 'Lleno'
  },
  porcentajeGasolina: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  rayones: {
    type: [rayonSchema],
    default: []
  },
  inventario: {
    type: [inventarioSchema],
    default: function() {
      // Inventario básico por defecto
      return [
        { nombre: 'Gato hidráulico', presente: true, condicion: 'Bueno' },
        { nombre: 'Llanta de repuesto', presente: true, condicion: 'Bueno' },
        { nombre: 'Llave de ruedas', presente: true, condicion: 'Bueno' },
        { nombre: 'Triángulos de seguridad', presente: true, condicion: 'Bueno' },
        { nombre: 'Botiquín de primeros auxilios', presente: true, condicion: 'Bueno' },
        { nombre: 'Extintor', presente: true, condicion: 'Bueno' },
        { nombre: 'Manual del vehículo', presente: true, condicion: 'Bueno' },
        { nombre: 'Cables de arranque', presente: true, condicion: 'Bueno' }
      ];
    }
  },
  estadoGeneral: {
    type: String,
    enum: estadosGenerales,
    default: 'Bueno'
  },
  observaciones: {
    type: String,
    default: ''
  },
  ultimaActualizacionPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: false
  },
  fechaUltimaRevision: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

/**
 * Índices para optimizar consultas
 */
checklistSchema.index({ autoId: 1 });
checklistSchema.index({ idAuto: 1 });

/**
 * Método para obtener un resumen del checklist
 * @returns {Object} Resumen del checklist
 */
checklistSchema.methods.obtenerResumen = function() {
  return {
    id: this._id,
    idAuto: this.idAuto,
    nivelGasolina: this.nivelGasolina,
    porcentajeGasolina: this.porcentajeGasolina,
    cantidadRayones: this.rayones.length,
    itemsInventario: this.inventario.length,
    itemsFaltantes: this.inventario.filter(item => !item.presente).length,
    estadoGeneral: this.estadoGeneral,
    fechaUltimaRevision: this.fechaUltimaRevision,
    observaciones: this.observaciones
  };
};

/**
 * Método para obtener los detalles completos del checklist
 * @returns {Object} Detalles completos del checklist
 */
checklistSchema.methods.obtenerDetalles = function() {
  return {
    id: this._id,
    idAuto: this.idAuto,
    nivelGasolina: this.nivelGasolina,
    porcentajeGasolina: this.porcentajeGasolina,
    rayones: this.rayones.map(rayon => ({
      id: rayon._id,
      descripcion: rayon.descripcion,
      ubicacion: rayon.ubicacion,
      fecha: rayon.fecha
    })),
    inventario: this.inventario.map(item => ({
      id: item._id,
      nombre: item.nombre,
      presente: item.presente,
      condicion: item.condicion,
      notas: item.notas
    })),
    estadoGeneral: this.estadoGeneral,
    observaciones: this.observaciones,
    fechaUltimaRevision: this.fechaUltimaRevision,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

/**
 * Middleware para actualizar la fecha de última revisión antes de guardar
 */
checklistSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    this.fechaUltimaRevision = new Date();
  }
  next();
});

const Checklist = mongoose.model('Checklist', checklistSchema);

module.exports = Checklist;
