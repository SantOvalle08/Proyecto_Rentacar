/**
 * @module controllers/reservaController
 * @description Controlador para operaciones relacionadas con reservas
 */

const sistemaRentaAutos = require('../utils/SistemaRentaAutos');
const Reserva = require('../models/Reserva');
const Auto = require('../models/Auto');
const calculadoraFactory = require('../utils/factories/CalculadoraFactory');

/**
 * @typedef {Object} ReservaController
 * @property {Function} createReserva - Crea una nueva reserva
 * @property {Function} calcularPrecio - Calcula el precio de una reserva
 * @property {Function} getAllReservas - Obtiene todas las reservas
 * @property {Function} getReservasByUsuario - Obtiene las reservas de un usuario
 * @property {Function} getReservaById - Obtiene una reserva por su ID
 * @property {Function} cancelarReserva - Cancela una reserva
 * @property {Function} generarFactura - Genera una factura para una reserva
 */

/**
 * Controlador para operaciones de reservas
 * @type {ReservaController}
 */
const reservaController = {
  /**
   * Crea una nueva reserva en el sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.body - Datos de la reserva
   * @param {string} req.body.fechaInicio - Fecha de inicio de la reserva
   * @param {string} req.body.fechaFin - Fecha de fin de la reserva
   * @param {string} req.body.usuario - ID del usuario
   * @param {string} req.body.autoId - ID del vehículo
   * @param {string} [req.body.metodoPago] - Método de pago
   * @param {Object} [req.body.datosPago] - Datos del pago
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la operación
   */
  async createReserva(req, res) {
    try {
      const { fechaInicio, fechaFin, usuario, autoId, metodoPago, datosPago } = req.body;
      
      // Validate required fields
      if (!fechaInicio || !fechaFin || !usuario || !autoId) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }
      
      // Validate dates
      const startDate = new Date(fechaInicio);
      const endDate = new Date(fechaFin);
      
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return res.status(400).json({
          success: false,
          message: 'Fechas inválidas'
        });
      }
      
      if (startDate >= endDate) {
        return res.status(400).json({
          success: false,
          message: 'La fecha de inicio debe ser anterior a la fecha de fin'
        });
      }
      
      // Find the car
      const auto = await Auto.findOne({ idAuto: autoId });
      if (!auto) {
        return res.status(404).json({
          success: false,
          message: 'Auto no encontrado'
        });
      }
      
      // Check if car is available
      if (!auto.disponible) {
        return res.status(400).json({
          success: false,
          message: 'El auto no está disponible'
        });
      }
      
      // Use CalculadoraFactory to calculate total price
      const calculadora = calculadoraFactory.createCalculadora(
        fechaInicio,
        fechaFin,
        auto
      );
      
      const precioTotal = calculadora.calcularPrecioTotal();
      
      // Create reservation using SistemaRentaAutos
      try {
        const reserva = await sistemaRentaAutos.realizarReserva({
          fechaInicio,
          fechaFin,
          usuario,
          auto: auto._id,
          precioTotal,
          estado: 'Pendiente',
          metodoPago,
          datosPago
        });
        
        if (!reserva) {
          throw new Error('No se pudo crear la reserva');
        }
        
        return res.status(201).json({
          success: true,
          message: 'Reserva creada con éxito',
          data: {
            reserva: reserva.mostrarDetalleReserva(),
            precioTotal
          }
        });
      } catch (error) {
        console.error('Error al crear reserva:', error);
        return res.status(500).json({
          success: false,
          message: error.message || 'Error al crear la reserva'
        });
      }
    } catch (error) {
      console.error('Error en createReserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Calcula el precio total de una reserva
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.body - Datos para el cálculo
   * @param {string} req.body.fechaInicio - Fecha de inicio
   * @param {string} req.body.fechaFin - Fecha de fin
   * @param {string} req.body.autoId - ID del vehículo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el cálculo del precio
   */
  async calcularPrecio(req, res) {
    try {
      const { fechaInicio, fechaFin, autoId } = req.body;
      
      // Validate required fields
      if (!fechaInicio || !fechaFin || !autoId) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }
      
      // Find the car
      const auto = await Auto.findOne({ idAuto: autoId });
      if (!auto) {
        return res.status(404).json({
          success: false,
          message: 'Auto no encontrado'
        });
      }
      
      // Use CalculadoraFactory (Factory Pattern)
      const calculadora = calculadoraFactory.createCalculadora(
        fechaInicio,
        fechaFin,
        auto
      );
      
      const precioTotal = calculadora.calcularPrecioTotal();
      
      // Calculate days
      const diffTime = Math.abs(new Date(fechaFin) - new Date(fechaInicio));
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      res.status(200).json({
        success: true,
        data: {
          precioBase: auto.precioDia * dias,
          descuento: calculadora.descuento,
          precioTotal,
          dias,
          auto: auto.mostrarDetalles()
        }
      });
    } catch (error) {
      console.error('Error en calcularPrecio:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Obtiene todas las reservas del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con la lista de reservas
   */
  async getAllReservas(req, res) {
    try {
      const reservas = await Reserva.find()
        .populate('usuario', '-contraseña')
        .populate('auto');
      
      res.status(200).json({
        success: true,
        data: reservas.map(reserva => reserva.mostrarDetalleReserva())
      });
    } catch (error) {
      console.error('Error en getAllReservas:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Obtiene las reservas de un usuario específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.usuarioId - ID del usuario
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con las reservas del usuario
   */
  async getReservasByUsuario(req, res) {
    try {
      const { usuarioId } = req.params;
      
      const reservas = await Reserva.find({ usuario: usuarioId })
        .populate('usuario', '-contraseña')
        .populate('auto');
      
      res.status(200).json({
        success: true,
        data: reservas.map(reserva => reserva.mostrarDetalleReserva())
      });
    } catch (error) {
      console.error('Error en getReservasByUsuario:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Obtiene una reserva específica por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la reserva
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con los datos de la reserva
   */
  async getReservaById(req, res) {
    try {
      const { id } = req.params;
      
      const reserva = await Reserva.findOne({ idReserva: id })
        .populate('usuario', '-contraseña')
        .populate('auto');
      
      if (!reserva) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }
      
      res.status(200).json({
        success: true,
        data: reserva.mostrarDetalleReserva()
      });
    } catch (error) {
      console.error('Error en getReservaById:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Cancela una reserva existente
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la reserva a cancelar
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la cancelación
   */
  async cancelarReserva(req, res) {
    try {
      const { id } = req.params;
      
      const reserva = await Reserva.findOne({ idReserva: id });
      
      if (!reserva) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }
      
      // Update reservation status
      reserva.estado = 'Cancelada';
      await reserva.save();
      
      // Set car as available again
      const auto = await Auto.findById(reserva.auto);
      if (auto) {
        auto.disponible = true;
        await auto.save();
      }
      
      res.status(200).json({
        success: true,
        message: 'Reserva cancelada con éxito',
        data: reserva.mostrarDetalleReserva()
      });
    } catch (error) {
      console.error('Error en cancelarReserva:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },
  
  /**
   * Genera una factura para una reserva
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID de la reserva
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con los datos de la factura
   */
  async generarFactura(req, res) {
    try {
      const { id } = req.params;
      
      const reserva = await Reserva.findOne({ idReserva: id })
        .populate('usuario')
        .populate('auto');
      
      if (!reserva) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }
      
      // Calculate details for invoice
      const fechaInicio = new Date(reserva.fechaInicio);
      const fechaFin = new Date(reserva.fechaFin);
      const diffTime = Math.abs(fechaFin - fechaInicio);
      const dias = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      // Generate invoice
      const factura = {
        numeroFactura: `INV-${reserva.idReserva}-${Date.now().toString().slice(-4)}`,
        fecha: new Date(),
        cliente: {
          nombre: reserva.usuario.nombre,
          email: reserva.usuario.email,
          telefono: reserva.usuario.telefono
        },
        reserva: {
          id: reserva.idReserva,
          fechaInicio: reserva.fechaInicio,
          fechaFin: reserva.fechaFin,
          dias
        },
        auto: {
          marca: reserva.auto.marca,
          modelo: reserva.auto.modelo,
          año: reserva.auto.año,
          tipo: reserva.auto.tipoCoche,
          precioDia: reserva.auto.precioDia
        },
        detalles: {
          subtotal: reserva.auto.precioDia * dias,
          impuestos: Math.round(reserva.auto.precioDia * dias * 0.16 * 100) / 100,
          total: reserva.precioTotal
        }
      };
      
      res.status(200).json({
        success: true,
        data: factura
      });
    } catch (error) {
      console.error('Error en generarFactura:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
};

module.exports = reservaController; 