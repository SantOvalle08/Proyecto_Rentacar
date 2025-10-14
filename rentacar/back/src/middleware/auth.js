/**
 * @module middleware/auth
 * @description Middleware para autenticación y autorización de usuarios
 */

const jwt = require('jsonwebtoken');
const Usuario = require('../models/usuario');

/**
 * @typedef {Object} AuthMiddleware
 * @property {Function} verifyToken - Verifica el token JWT y autentica al usuario
 * @property {Function} isAdmin - Verifica si el usuario tiene rol de administrador
 */

/**
 * Middleware para verificar el token JWT y autenticar al usuario
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.headers - Encabezados de la solicitud
 * @param {string} [req.headers.authorization] - Token de autorización en formato 'Bearer <token>'
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar con el siguiente middleware
 * @returns {Object|void} Respuesta JSON con error o continúa al siguiente middleware
 * @throws {JsonWebTokenError} Si el token es inválido
 * @throws {TokenExpiredError} Si el token ha expirado
 */
const verifyToken = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado o formato inválido'
      });
    }
    
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Acceso denegado. Token no proporcionado'
      });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secretkey');
    
    // Check if user exists
    const user = await Usuario.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido: usuario no encontrado'
      });
    }
    
    // Add user to request
    req.user = {
      id: user._id,
      idUser: user.idUser,
      email: user.email,
      nombre: user.nombre,
      rol: user.rol || 'usuario' // Ensure role is included
    };
    
    console.log(`Usuario autenticado: ${user.email}, rol: ${req.user.rol}`);
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    
    console.error('Error en auth middleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

/**
 * Middleware para verificar si el usuario tiene rol de administrador
 * @param {Object} req - Objeto de solicitud Express
 * @param {Object} req.user - Usuario autenticado (agregado por verifyToken)
 * @param {string} req.user.rol - Rol del usuario
 * @param {Object} res - Objeto de respuesta Express
 * @param {Function} next - Función para continuar con el siguiente middleware
 * @returns {Object|void} Respuesta JSON con error o continúa al siguiente middleware
 */
const isAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuario no autenticado'
    });
  }
  
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requiere rol de administrador'
    });
  }
  
  next();
};

module.exports = { verifyToken, isAdmin }; 