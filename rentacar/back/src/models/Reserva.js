/**
 * @module models/Reserva
 * @description Modelo de datos para las reservas de vehículos
 */

const mongoose = require('mongoose');

/**
 * @constant {Array<string>} estadosReserva - Estados posibles para una reserva
 */
const estadosReserva = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'];

/**
 * @typedef {Object} ReservaSchema
 * @property {number} idReserva - Identificador único de la reserva
 * @property {Date} fechaInicio - Fecha de inicio de la reserva
 * @property {Date} fechaFin - Fecha de fin de la reserva
 * @property {string} estado - Estado actual de la reserva (Pendiente, Confirmada, Cancelada, Completada)
 * @property {mongoose.Schema.Types.ObjectId} usuario - Referencia al usuario que realizó la reserva
 * @property {mongoose.Schema.Types.ObjectId} auto - Referencia al vehículo reservado
 * @property {number} precioTotal - Precio total de la reserva
 */

/**
 * Esquema de Mongoose para el modelo de Reserva
 * @type {mongoose.Schema}
 */
const reservaSchema = new mongoose.Schema({
  idReserva: {
    type: Number,
    required: true,
    unique: true
  },
  fechaInicio: {
    type: Date,
    required: true
  },
  fechaFin: {
    type: Date,
    required: true
  },
  estado: {
    type: String,
    enum: estadosReserva,
    default: 'Pendiente'
  },
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario',
    required: true
  },
  auto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Auto',
    required: true
  },
  precioTotal: {
    type: Number,
    required: true
  }
}, {
  timestamps: true
});

/**
 * Método para mostrar los detalles de una reserva
 * @returns {Object} Objeto con los detalles de la reserva
 */
reservaSchema.methods.mostrarDetalleReserva = function() {
  return {
    id: this.idReserva,
    fechaInicio: this.fechaInicio,
    fechaFin: this.fechaFin,
    estado: this.estado,
    usuario: this.usuario,
    auto: this.auto,
    precioTotal: this.precioTotal
  };
};

/**
 * Modelo de Reserva
 * @type {mongoose.Model}
 */
const Reserva = mongoose.model('Reserva', reservaSchema);

module.exports = Reserva; 