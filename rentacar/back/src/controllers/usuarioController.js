/**
 * @module controllers/usuarioController
 * @description Controlador para operaciones relacionadas con usuarios
 */

const sistemaRentaAutos = require('../utils/SistemaRentaAutos');
const Usuario = require('../models/usuario');

/**
 * @typedef {Object} UsuarioController
 * @property {Function} register - Registra un nuevo usuario
 * @property {Function} login - Autentica un usuario existente
 * @property {Function} getAllUsers - Obtiene todos los usuarios
 * @property {Function} getUserById - Obtiene un usuario por su ID
 * @property {Function} updateUser - Actualiza los datos de un usuario
 * @property {Function} deleteUser - Elimina un usuario
 * @property {Function} updateProfile - Actualiza el perfil de un usuario
 */

/**
 * Controlador para operaciones de usuario
 * @type {UsuarioController}
 */
const usuarioController = {
  /**
   * Registra un nuevo usuario en el sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.body - Datos del usuario
   * @param {string} req.body.nombre - Nombre del usuario
   * @param {string} [req.body.apellido] - Apellido del usuario
   * @param {string} req.body.email - Correo electrónico del usuario
   * @param {string} [req.body.telefono] - Teléfono del usuario
   * @param {string} req.body.contraseña - Contraseña del usuario
   * @param {string} [req.body.tipoDocumento] - Tipo de documento de identidad
   * @param {string} [req.body.numeroDocumento] - Número de documento de identidad
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la operación
   */
  async register(req, res) {
    try {
      console.log('============================================');
      console.log('SOLICITUD DE REGISTRO RECIBIDA');
      console.log('Body:', req.body);
      console.log('Headers:', req.headers);
      console.log('============================================');
      
      const { 
        nombre, 
        apellido, 
        email, 
        telefono, 
        contraseña, 
        tipoDocumento, 
        numeroDocumento 
      } = req.body;
      
      // Validate required fields
      if (!nombre || !email || !contraseña) {
        console.log('Campos requeridos faltantes:', { nombre, email, contraseña });
        return res.status(400).json({
          success: false,
          message: 'Nombre, email y contraseña son campos requeridos'
        });
      }
      
      // Check if user already exists
      const existingUser = await Usuario.findOne({ email });
      if (existingUser) {
        console.log('Email ya registrado:', email);
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está registrado'
        });
      }
      
      // Format the user data for registration
      const nombreCompleto = apellido ? `${nombre} ${apellido}` : nombre;
      
      // Register user using Singleton instance
      const result = await sistemaRentaAutos.registrarUsuario({
        nombre: nombreCompleto,
        email,
        telefono: telefono || '',
        contraseña,
        // Add additional fields to user metadata if needed
        metadata: {
          tipoDocumento,
          numeroDocumento
        }
      });
      
      if (result) {
        console.log('Usuario registrado con éxito:', email);
        return res.status(201).json({
          success: true,
          message: 'Usuario registrado con éxito'
        });
      } else {
        console.log('Error en registro por resultado inválido');
        return res.status(500).json({
          success: false,
          message: 'Error al registrar usuario'
        });
      }
    } catch (error) {
      console.error('Error en register:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: error.message
      });
    }
  },
  
  /**
   * Autentica un usuario existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.body - Credenciales del usuario
   * @param {string} req.body.email - Correo electrónico del usuario
   * @param {string} req.body.contraseña - Contraseña del usuario
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la autenticación
   */
  async login(req, res) {
    try {
      console.log('============================================');
      console.log('SOLICITUD DE LOGIN RECIBIDA');
      console.log('Body:', req.body);
      console.log('Headers:', req.headers);
      console.log('============================================');
      
      const { email, contraseña } = req.body;
      
      // Validate required fields
      if (!email || !contraseña) {
        console.log('Campos requeridos faltantes:', { email, contraseña: '***' });
        return res.status(400).json({
          success: false,
          message: 'Correo y contraseña son requeridos'
        });
      }
      
      // Normalizar email
      const normalizedEmail = email.toLowerCase().trim();
      
      // Authenticate user using Singleton instance
      try {
        const result = await sistemaRentaAutos.autenticarUsuario(normalizedEmail, contraseña);
        
        if (result) {
          console.log('Login exitoso para:', normalizedEmail);
          return res.status(200).json({
            success: true,
            message: 'Inicio de sesión exitoso',
            data: result
          });
        } else {
          console.log('Credenciales inválidas para:', normalizedEmail);
          return res.status(401).json({
            success: false,
            message: 'Credenciales inválidas'
          });
        }
      } catch (authError) {
        console.error('Error en autenticación:', authError);
        return res.status(500).json({
          success: false,
          message: 'Error al autenticar usuario',
          error: process.env.NODE_ENV === 'development' ? authError.message : undefined
        });
      }
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Obtiene todos los usuarios registrados
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con la lista de usuarios
   */
  async getAllUsers(req, res) {
    try {
      const users = await Usuario.find({}, { contraseña: 0 });
      
      res.status(200).json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Error en getAllUsers:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Obtiene un usuario específico por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del usuario
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con los datos del usuario
   */
  async getUserById(req, res) {
    try {
      const { id } = req.params;
      
      const user = await Usuario.findOne({ idUser: id }, { contraseña: 0 });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Error en getUserById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Actualiza los datos de un usuario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del usuario
   * @param {Object} req.body - Datos actualizados del usuario
   * @param {string} req.body.nombre - Nuevo nombre del usuario
   * @param {string} req.body.email - Nuevo correo electrónico
   * @param {string} [req.body.telefono] - Nuevo teléfono
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la actualización
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const { nombre, email, telefono } = req.body;
      
      // Find and update user
      const user = await Usuario.findOneAndUpdate(
        { idUser: id },
        { nombre, email, telefono },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Usuario actualizado con éxito',
        data: {
          idUser: user.idUser,
          nombre: user.nombre,
          email: user.email,
          telefono: user.telefono
        }
      });
    } catch (error) {
      console.error('Error en updateUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Elimina un usuario del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del usuario a eliminar
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la eliminación
   */
  async deleteUser(req, res) {
    try {
      const { id } = req.params;
      
      const user = await Usuario.findOneAndDelete({ idUser: id });
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Usuario eliminado con éxito'
      });
    } catch (error) {
      console.error('Error en deleteUser:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Actualiza el perfil de un usuario
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del usuario
   * @param {Object} req.body - Datos actualizados del perfil
   * @param {string} req.body.nombre - Nuevo nombre del usuario
   * @param {string} req.body.email - Nuevo correo electrónico
   * @param {string} [req.body.telefono] - Nuevo teléfono
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la actualización
   */
  async updateProfile(req, res) {
    try {
      console.log('============================================');
      console.log('SOLICITUD DE ACTUALIZACIÓN DE PERFIL');
      console.log('Body:', req.body);
      console.log('Headers:', req.headers);
      console.log('============================================');
      
      const { id } = req.params;
      const { nombre, email, telefono } = req.body;
      
      // Validate required fields
      if (!nombre || !email) {
        return res.status(400).json({
          success: false,
          message: 'Nombre y email son campos requeridos'
        });
      }
      
      // Check if email is already taken by another user
      const existingUser = await Usuario.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: id } // Exclude current user
      });
      
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: 'El correo electrónico ya está en uso por otro usuario'
        });
      }
      
      // Find and update user
      const user = await Usuario.findByIdAndUpdate(
        id,
        { 
          nombre,
          email: email.toLowerCase(),
          telefono: telefono || ''
        },
        { new: true, runValidators: true }
      );
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuario no encontrado'
        });
      }
      
      // Return updated user data (excluding password)
      const userData = {
        id: user._id,
        idUser: user.idUser,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        rol: user.rol
      };
      
      res.status(200).json({
        success: true,
        message: 'Perfil actualizado con éxito',
        data: userData
      });
    } catch (error) {
      console.error('Error en updateProfile:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el perfil',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
};

module.exports = usuarioController; 