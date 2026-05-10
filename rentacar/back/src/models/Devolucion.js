const mongoose = require('mongoose');

const nivelesGasolina = ['Vacío', '1/4', '1/2', '3/4', 'Lleno'];
const estadosGenerales = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere atención'];
const condiciones = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No funcional'];
const tiposCargoAdicional = ['combustible', 'daño', 'accesorio', 'retraso', 'otro'];

const rayonNuevoSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  ubicacion: { type: String, required: true },
  costoReparacion: { type: Number, default: 0, min: 0 },
  fecha: { type: Date, default: Date.now }
}, { _id: true });

const inventarioItemSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  presente: { type: Boolean, default: true },
  condicion: { type: String, enum: condiciones, default: 'Bueno' },
  notas: { type: String, default: '' }
}, { _id: true });

const cargoAdicionalSchema = new mongoose.Schema({
  concepto: { type: String, required: true },
  monto: { type: Number, required: true, min: 0 },
  tipo: { type: String, enum: tiposCargoAdicional, required: true }
}, { _id: true });

const devolucionSchema = new mongoose.Schema({
  idDevolucion: { type: Number, required: true, unique: true },
  reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true },
  entrega: { type: mongoose.Schema.Types.ObjectId, ref: 'Entrega', required: true },
  auto: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
  fechaDevolucion: { type: Date, default: Date.now },
  kmRetorno: { type: Number, required: true, min: 0 },
  nivelGasolina: { type: String, enum: nivelesGasolina, default: 'Lleno' },
  porcentajeGasolina: { type: Number, min: 0, max: 100, default: 100 },
  inventario: { type: [inventarioItemSchema], default: [] },
  dañosNuevos: { type: [rayonNuevoSchema], default: [] },
  estadoGeneral: { type: String, enum: estadosGenerales, default: 'Bueno' },
  observaciones: { type: String, default: '' },
  realizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  cargosAdicionales: { type: [cargoAdicionalSchema], default: [] },
  totalCargosAdicionales: { type: Number, default: 0, min: 0 },
  estadoFinalVehiculo: {
    type: String,
    enum: ['disponible', 'mantenimiento'],
    default: 'disponible'
  }
}, { timestamps: true });

devolucionSchema.index({ reserva: 1 });
devolucionSchema.index({ auto: 1 });

const Devolucion = mongoose.model('Devolucion', devolucionSchema);
module.exports = Devolucion;
