const mongoose = require('mongoose');

const nivelesGasolina = ['Vacío', '1/4', '1/2', '3/4', 'Lleno'];
const estadosGenerales = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere atención'];
const condiciones = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No funcional'];

const rayonSchema = new mongoose.Schema({
  descripcion: { type: String, required: true },
  ubicacion: { type: String, required: true },
  fecha: { type: Date, default: Date.now }
}, { _id: true });

const inventarioItemSchema = new mongoose.Schema({
  nombre: { type: String, required: true },
  presente: { type: Boolean, default: true },
  condicion: { type: String, enum: condiciones, default: 'Bueno' },
  notas: { type: String, default: '' }
}, { _id: true });

const entregaSchema = new mongoose.Schema({
  idEntrega: { type: Number, required: true, unique: true },
  reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true },
  auto: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
  fechaEntrega: { type: Date, default: Date.now },
  verificacionCliente: {
    documentoVerificado: { type: Boolean, default: false },
    licenciaVerificada: { type: Boolean, default: false },
    numeroDocumento: { type: String, default: '' },
    numeroLicencia: { type: String, default: '' },
    observaciones: { type: String, default: '' }
  },
  kmSalida: { type: Number, required: true, min: 0 },
  nivelGasolina: { type: String, enum: nivelesGasolina, default: 'Lleno' },
  porcentajeGasolina: { type: Number, min: 0, max: 100, default: 100 },
  inventario: { type: [inventarioItemSchema], default: [] },
  dañosPreExistentes: { type: [rayonSchema], default: [] },
  estadoGeneral: { type: String, enum: estadosGenerales, default: 'Bueno' },
  observaciones: { type: String, default: '' },
  realizadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }
}, { timestamps: true });

entregaSchema.index({ reserva: 1 });
entregaSchema.index({ auto: 1 });

const Entrega = mongoose.model('Entrega', entregaSchema);
module.exports = Entrega;
