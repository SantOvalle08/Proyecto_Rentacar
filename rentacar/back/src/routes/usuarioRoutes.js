const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', usuarioController.register);
router.post('/login', usuarioController.login);

// Rutas protegidas
router.get('/', verificarToken, usuarioController.getAllUsers);
router.get('/:id', verificarToken, usuarioController.getUserById);
router.put('/:id/profile', verificarToken, usuarioController.updateProfile);
router.put('/:id', verificarToken, usuarioController.updateUser);
router.delete('/:id', verificarToken, usuarioController.deleteUser);

module.exports = router; 