const mongoose = require('mongoose');

const tiposIncidencia = ['Accidente', 'Daño', 'Pérdida de accesorio', 'Robo', 'Avería mecánica', 'Otro'];
const estadosIncidencia = ['Pendiente', 'En proceso', 'Resuelto'];

const incidenciaSchema = new mongoose.Schema({
  idIncidencia: { type: Number, required: true, unique: true },
  reserva: { type: mongoose.Schema.Types.ObjectId, ref: 'Reserva', required: true },
  auto: { type: mongoose.Schema.Types.ObjectId, ref: 'Auto', required: true },
  tipo: { type: String, enum: tiposIncidencia, required: true },
  descripcion: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
  reportadoPor: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' },
  costoEstimado: { type: Number, default: 0, min: 0 },
  estado: { type: String, enum: estadosIncidencia, default: 'Pendiente' },
  observaciones: { type: String, default: '' }
}, { timestamps: true });

incidenciaSchema.index({ reserva: 1 });
incidenciaSchema.index({ auto: 1 });
incidenciaSchema.index({ estado: 1 });

const Incidencia = mongoose.model('Incidencia', incidenciaSchema);
module.exports = Incidencia;
