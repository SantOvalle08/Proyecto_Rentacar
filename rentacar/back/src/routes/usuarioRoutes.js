const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verifyToken } = require('../middleware/auth');

// Rutas públicas
router.post('/register', usuarioController.register);
router.post('/login', usuarioController.login);

// Rutas protegidas
router.get('/', verifyToken, usuarioController.getAllUsers);
router.get('/:id', verifyToken, usuarioController.getUserById);
router.put('/:id/profile', verifyToken, usuarioController.updateProfile);
router.put('/:id', verifyToken, usuarioController.updateUser);
router.delete('/:id', verifyToken, usuarioController.deleteUser);

module.exports = router; 