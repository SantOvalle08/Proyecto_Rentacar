/**
 * @module models/Auto
 * @description Modelo de Auto para la aplicación de renta de autos
 */

const mongoose = require('mongoose');

/**
 * @typedef {('Compacto'|'Sedan'|'SUV'|'Deportivo'|'Camioneta'|'Lujo')} TipoCoche
 * Tipos de vehículos disponibles en el sistema
 */

/**
 * @typedef {Object} AutoSchema
 * @property {number} idAuto - ID único del vehículo
 * @property {string} marca - Marca del vehículo
 * @property {string} modelo - Modelo del vehículo
 * @property {number} año - Año del vehículo
 * @property {number} [anio] - Año del vehículo (alternativo)
 * @property {TipoCoche} tipoCoche - Tipo de vehículo
 * @property {TipoCoche} [tipo] - Tipo de vehículo (alternativo)
 * @property {string} [color] - Color del vehículo
 * @property {string} [matricula] - Matrícula del vehículo
 * @property {boolean} [disponible] - Estado de disponibilidad
 * @property {number} precioDia - Precio por día
 * @property {number} [precioBase] - Precio base (alternativo)
 * @property {string} [imagen] - URL de la imagen del vehículo
 * @property {Date} createdAt - Fecha de creación del registro
 * @property {Date} updatedAt - Fecha de última actualización
 */

// Enum para tipoCoche
const tiposCoche = ['Compacto', 'Sedan', 'SUV', 'Deportivo', 'Camioneta', 'Lujo'];

/**
 * Esquema de Auto para MongoDB
 * @type {mongoose.Schema}
 */
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
    type: Number,
    default: function() {
      return this.año;
    }
  },
  tipoCoche: {
    type: String,
    enum: tiposCoche,
    required: true
  },
  tipo: {
    type: String,
    default: function() {
      return this.tipoCoche;
    }
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
    type: Number,
    default: function() {
      return this.precioDia;
    }
  },
  imagen: {
    type: String,
    default: 'default-car.jpg'
  }
}, {
  timestamps: true
});

/**
 * Retorna los detalles del vehículo en un formato estandarizado
 * @returns {Object} Detalles del vehículo
 */
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

/**
 * Middleware para sincronizar campos equivalentes antes de guardar
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
autoSchema.pre('save', function(next) {
  if (this.año && !this.anio) this.anio = this.año;
  if (this.anio && !this.año) this.año = this.anio;
  if (this.tipoCoche && !this.tipo) this.tipo = this.tipoCoche;
  if (this.tipo && !this.tipoCoche) this.tipoCoche = this.tipo;
  if (this.precioDia && !this.precioBase) this.precioBase = this.precioDia;
  if (this.precioBase && !this.precioDia) this.precioDia = this.precioBase;
  next();
});

const Auto = mongoose.model('Auto', autoSchema);

module.exports = Auto; 