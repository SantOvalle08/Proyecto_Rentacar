/**
 * @module routes/index
 * @description Configuración de rutas principales de la API
 */

const express = require('express');
const router = express.Router();

const usuarioController = require('../controllers/usuarioController');
const autoController = require('../controllers/autoController');
const reservaController = require('../controllers/reservaController');
const checklistController = require('../controllers/checklistController');
const { verifyToken, isAdmin } = require('../middleware/auth');

/**
 * @route GET /api/test
 * @description Ruta de prueba para verificar el funcionamiento de la API
 * @returns {Object} Objeto con estado de éxito y mensaje
 */
router.get('/api/test', (req, res) => {
  console.log('Solicitud de prueba API recibida');
  res.json({ success: true, message: 'API funciona correctamente' });
});

/**
 * @route GET /api/test-cors
 * @description Ruta de prueba para verificar la configuración CORS
 * @returns {Object} Objeto con estado de éxito y mensaje
 */
router.get('/api/test-cors', (req, res) => {
  console.log('Solicitud de prueba CORS recibida');
  res.json({ 
    success: true, 
    message: 'CORS configurado correctamente' 
  });
});

// IMPORTANTE: Rutas públicas temporales para pruebas de la aplicación
// Para producción, estas rutas deben ser protegidas con autenticación

// Auto routes - Orden específico para evitar conflictos
// Rutas específicas primero
router.get('/api/autos/search', autoController.searchAutos); // Ruta sin autenticación para pruebas
router.get('/api/autos/:id', autoController.getAutoById); // Ruta sin autenticación para pruebas
// Rutas genéricas después
router.get('/api/autos', autoController.getAllAutos); // Ruta sin autenticación para pruebas
router.post('/api/autos', autoController.createAuto); // Ruta sin autenticación para pruebas
router.put('/api/autos/:id', autoController.updateAuto); // Ruta sin autenticación para pruebas
router.delete('/api/autos/:id', autoController.deleteAuto); // Ruta sin autenticación para pruebas

// Catalog routes - también con orden específico
router.get('/api/catalogo/search', autoController.searchAutos);
router.get('/api/catalogo/:id', autoController.getAutoById);
router.get('/api/catalogo', autoController.getAllAutos);

// Auth routes - Estas rutas deben ser accesibles sin verificación de token
/**
 * @route POST /api/auth/register
 * @description Registro de nuevos usuarios
 * @access Public
 */
router.post('/api/auth/register', usuarioController.register);

/**
 * @route POST /api/auth/login
 * @description Inicio de sesión de usuarios
 * @access Public
 */
router.post('/api/auth/login', usuarioController.login);

// User routes - Orden específico para evitar conflictos
/**
 * @route GET /api/usuarios
 * @description Obtener todos los usuarios
 * @access Private/Admin
 */
router.get('/api/usuarios', verifyToken, isAdmin, usuarioController.getAllUsers);

/**
 * @route GET /api/usuarios/:id
 * @description Obtener un usuario específico
 * @access Private
 */
router.get('/api/usuarios/:id', verifyToken, usuarioController.getUserById);

/**
 * @route PUT /api/usuarios/:id/profile
 * @description Actualizar perfil de usuario
 * @access Private
 */
router.put('/api/usuarios/:id/profile', verifyToken, usuarioController.updateProfile); // Ruta para actualizar perfil

/**
 * @route PUT /api/usuarios/:id
 * @description Actualizar datos de usuario
 * @access Private
 */
router.put('/api/usuarios/:id', verifyToken, usuarioController.updateUser);

/**
 * @route DELETE /api/usuarios/:id
 * @description Eliminar usuario
 * @access Private/Admin
 */
router.delete('/api/usuarios/:id', verifyToken, isAdmin, usuarioController.deleteUser);

// Reserva routes
/**
 * @route POST /api/reservas
 * @description Crear nueva reserva
 * @access Private
 */
router.post('/api/reservas', verifyToken, reservaController.createReserva);

/**
 * @route GET /api/reservas
 * @description Obtener todas las reservas
 * @access Private/Admin
 */
router.get('/api/reservas', verifyToken, isAdmin, reservaController.getAllReservas);

/**
 * @route GET /api/reservas/:id
 * @description Obtener una reserva específica
 * @access Private
 */
router.get('/api/reservas/:id', verifyToken, reservaController.getReservaById);

/**
 * @route GET /api/usuarios/:usuarioId/reservas
 * @description Obtener reservas de un usuario
 * @access Private
 */
router.get('/api/usuarios/:usuarioId/reservas', verifyToken, reservaController.getReservasByUsuario);

/**
 * @route POST /api/reservas/calcular-precio
 * @description Calcular precio de una reserva
 * @access Private
 */
router.post('/api/reservas/calcular-precio', verifyToken, reservaController.calcularPrecio);

/**
 * @route PUT /api/reservas/:id/cancelar
 * @description Cancelar una reserva
 * @access Private
 */
router.put('/api/reservas/:id/cancelar', verifyToken, reservaController.cancelarReserva);

/**
 * @route GET /api/reservas/:id/factura
 * @description Generar factura de una reserva
 * @access Private
 */
router.get('/api/reservas/:id/factura', verifyToken, reservaController.generarFactura);

// Checklist routes
/**
 * @route GET /api/checklists
 * @description Obtener todos los checklists
 * @access Private/Admin
 */
router.get('/api/checklists', verifyToken, isAdmin, checklistController.getAllChecklists);

/**
 * @route GET /api/autos/:autoId/checklist
 * @description Obtener checklist de un vehículo específico
 * @access Private (usuarios y admin pueden ver)
 */
router.get('/api/autos/:autoId/checklist', verifyToken, checklistController.getChecklistByAuto);

/**
 * @route PUT /api/autos/:autoId/checklist
 * @description Actualizar checklist de un vehículo
 * @access Private (usuarios y admin pueden actualizar)
 */
router.put('/api/autos/:autoId/checklist', verifyToken, checklistController.updateChecklist);

/**
 * @route POST /api/autos/:autoId/checklist/rayones
 * @description Agregar un rayón al checklist
 * @access Private
 */
router.post('/api/autos/:autoId/checklist/rayones', verifyToken, checklistController.agregarRayon);

/**
 * @route DELETE /api/autos/:autoId/checklist/rayones/:rayonId
 * @description Eliminar un rayón del checklist
 * @access Private
 */
router.delete('/api/autos/:autoId/checklist/rayones/:rayonId', verifyToken, checklistController.eliminarRayon);

/**
 * @route DELETE /api/autos/:autoId/checklist
 * @description Eliminar checklist completo (solo admin)
 * @access Private/Admin
 */
router.delete('/api/autos/:autoId/checklist', verifyToken, isAdmin, checklistController.deleteChecklist);

module.exports = router; 