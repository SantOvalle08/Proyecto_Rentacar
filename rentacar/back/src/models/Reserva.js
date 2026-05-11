/**
 * @module models/Reserva
 * @description Modelo de datos para las reservas de vehículos
 */

const mongoose = require('mongoose');

/**
 * @constant {Array<string>} estadosReserva - Estados posibles para una reserva
 */
const estadosReserva = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada', 'Alquilado'];

/**
 * @typedef {Object} ReservaSchema
 * @property {number} idReserva - Identificador único de la reserva
 * @property {Date} fechaInicio - Fecha de inicio de la reserva
 * @property {Date} fechaFin - Fecha de fin de la reserva
 * @property {string} estado - Estado actual de la reserva (Pendiente, Confirmada, Cancelada, Completada)
 * @property {mongoose.Schema.Types.ObjectId} usuario - Referencia al usuario que realizó la reserva
 * @property {mongoose.Schema.Types.ObjectId} auto - Referencia al vehículo reservado
 * @property {number} precioTotal - Precio total de la reserva
 * @property {number} porcentajeAnticipo - Porcentaje del anticipo aplicado para reservar
 * @property {number} montoAnticipo - Monto abonado al reservar
 * @property {number} saldoPendiente - Saldo restante por pagar
 * @property {string} estadoPago - Estado del pago parcial de la reserva
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
  metodoPago: {
    type: String,
    default: 'efectivo'
  },
  datosPago: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  diasReserva: {
    type: Number,
    default: 0
  },
  precioTotal: {
    type: Number,
    required: true
  },
  porcentajeAnticipo: {
    type: Number,
    default: 30,
    min: 0,
    max: 100
  },
  montoAnticipo: {
    type: Number,
    default: 0,
    min: 0
  },
  saldoPendiente: {
    type: Number,
    default: 0,
    min: 0
  },
  estadoPago: {
    type: String,
    default: 'Anticipo pendiente'
  }
}, {
  timestamps: true
});

reservaSchema.index({ usuario: 1 });
reservaSchema.index({ estado: 1 });

reservaSchema.pre('validate', function(next) {
  if (this.fechaInicio && this.fechaFin && this.fechaFin <= this.fechaInicio) {
    return next(new Error('La fecha de fin debe ser posterior a la fecha de inicio'));
  }
  next();
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
    metodoPago: this.metodoPago,
    datosPago: this.datosPago,
    diasReserva: this.diasReserva,
    porcentajeAnticipo: this.porcentajeAnticipo,
    montoAnticipo: this.montoAnticipo,
    saldoPendiente: this.saldoPendiente,
    estadoPago: this.estadoPago,
    fechaCreacion: this.createdAt,
    precioTotal: this.precioTotal
  };
};

/**
 * Modelo de Reserva
 * @type {mongoose.Model}
 */
const Reserva = mongoose.model('Reserva', reservaSchema);

module.exports = Reserva; 