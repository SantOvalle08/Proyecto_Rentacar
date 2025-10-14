/**
 * @module models/usuario
 * @description Modelo de Usuario para la aplicación de renta de autos
 */

const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

/**
 * @typedef {Object} UsuarioSchema
 * @property {number} idUser - ID único del usuario
 * @property {string} nombre - Nombre del usuario
 * @property {string} email - Correo electrónico del usuario (único)
 * @property {string} [telefono] - Teléfono del usuario
 * @property {string} contraseña - Contraseña hasheada del usuario
 * @property {string} [tipoDocumento] - Tipo de documento de identidad
 * @property {string} [numeroDocumento] - Número de documento de identidad
 * @property {('admin'|'cliente')} [rol] - Rol del usuario en el sistema
 * @property {string} [apellido] - Apellido del usuario
 * @property {Date} createdAt - Fecha de creación del registro
 * @property {Date} updatedAt - Fecha de última actualización
 */

/**
 * Esquema de Usuario para MongoDB
 * @type {mongoose.Schema}
 */
const usuarioSchema = new mongoose.Schema({
  idUser: {
    type: Number,
    required: true,
    unique: true
  },
  nombre: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true
  },
  telefono: {
    type: String,
    default: ""
  },
  contraseña: {
    type: String,
    required: true
  },
  tipoDocumento: {
    type: String,
    default: "Cédula"
  },
  numeroDocumento: {
    type: String,
    default: ""
  },
  rol: {
    type: String,
    enum: ['admin', 'cliente'],
    default: 'cliente'
  },
  apellido: {
    type: String,
    default: ""
  }
}, { 
  timestamps: true,
  // Permite convertir el modelo a JSON con transformaciones
  toJSON: {
    transform: function (doc, ret) {
      delete ret.contraseña; // No incluir la contraseña en la respuesta JSON
      return ret;
    }
  }
});

/**
 * Compara una contraseña plana con la contraseña hasheada del usuario
 * @param {string} contraseñaPlana - Contraseña a comparar
 * @returns {Promise<boolean>} True si la contraseña coincide
 */
usuarioSchema.methods.compararContraseña = async function(contraseñaPlana) {
  return await bcrypt.compare(contraseñaPlana, this.contraseña);
};

/**
 * Middleware para hashear la contraseña antes de guardar
 * @param {Function} next - Función para continuar con el siguiente middleware
 */
usuarioSchema.pre('save', async function(next) {
  // Solo hash la contraseña si ha sido modificada o es nueva
  if (!this.isModified('contraseña')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.contraseña = await bcrypt.hash(this.contraseña, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Evitar compilar el modelo si ya existe
const Usuario = mongoose.models.Usuario || mongoose.model('Usuario', usuarioSchema);

module.exports = Usuario; 