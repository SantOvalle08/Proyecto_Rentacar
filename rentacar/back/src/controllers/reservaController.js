/**
 * @module controllers/reservaController
 * @description Controlador para operaciones relacionadas con reservas
 */

const sistemaRentaAutos = require('../utils/SistemaRentaAutos');
const Reserva = require('../models/Reserva');
const Auto = require('../models/Auto');
const calculadoraFactory = require('../utils/factories/CalculadoraFactory');

const calcularPlanPago = (precioTotal, porcentajeAnticipoInput) => {
  const porcentajeRaw = Number(porcentajeAnticipoInput);
  const porcentajeAnticipo = Number.isFinite(porcentajeRaw)
    ? Math.min(100, Math.max(10, porcentajeRaw))
    : 30;

  const montoAnticipo = Math.round((precioTotal * (porcentajeAnticipo / 100)) * 100) / 100;
  const saldoPendiente = Math.round((Math.max(precioTotal - montoAnticipo, 0)) * 100) / 100;

  return {
    porcentajeAnticipo,
    montoAnticipo,
    saldoPendiente,
    estadoPago: saldoPendiente > 0 ? 'Anticipo pagado' : 'Pagado'
  };
};

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
      const {
        fechaInicio,
        fechaFin,
        usuario,
        usuarioId,
        autoId,
        metodoPago,
        datosPago,
        porcentajeAnticipo
      } = req.body;
      const usuarioAutenticado = req.user?.id;
      const usuarioReserva = usuarioAutenticado || usuarioId || (typeof usuario === 'string' ? usuario : usuario?._id || usuario?.id);
      
      // Validate required fields
      if (!fechaInicio || !fechaFin || !usuarioReserva || !autoId) {
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
      const planPago = calcularPlanPago(precioTotal, porcentajeAnticipo);

      const diffTime = Math.abs(endDate - startDate);
      const diasReserva = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      const datosPagoConAnticipo = {
        ...(datosPago || {}),
        porcentajeAnticipo: planPago.porcentajeAnticipo,
        montoAnticipo: planPago.montoAnticipo,
        saldoPendiente: planPago.saldoPendiente,
        estadoPago: planPago.estadoPago
      };

      // Create reservation using SistemaRentaAutos
      try {
        const reserva = await sistemaRentaAutos.realizarReserva({
          fechaInicio,
          fechaFin,
          usuario: usuarioReserva,
          auto: auto._id,
          precioTotal,
          diasReserva,
          porcentajeAnticipo: planPago.porcentajeAnticipo,
          montoAnticipo: planPago.montoAnticipo,
          saldoPendiente: planPago.saldoPendiente,
          estadoPago: planPago.estadoPago,
          estado: 'Pendiente',
          metodoPago,
          datosPago: datosPagoConAnticipo
        });
        
        if (!reserva) {
          throw new Error('No se pudo crear la reserva');
        }
        
        return res.status(201).json({
          success: true,
          message: 'Reserva creada con éxito',
          data: {
            reserva: reserva.mostrarDetalleReserva(),
            precioTotal,
            planPago
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
        .populate('usuario', 'idUser nombre email')
        .populate('auto', 'idAuto marca modelo tipoCoche tipo color matricula precioDia imagen disponible');

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
      
      // VALIDACIÓN DE AUTORIZACIÓN: Verificar que el usuario solicitado sea el mismo o admin
      if (String(req.user.id) !== String(usuarioId) && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver reservas de otro usuario'
        });
      }
      
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
      
      // VALIDACIÓN DE AUTORIZACIÓN: Verificar que la reserva pertenezca al usuario o sea admin
      if (String(req.user.id) !== String(reserva.usuario._id) && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para ver esta reserva'
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
      
      const reserva = await Reserva.findOne({ idReserva: id }).populate('usuario');
      
      if (!reserva) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }
      
      // VALIDACIÓN DE AUTORIZACIÓN: Verificar que la reserva pertenezca al usuario o sea admin
      if (String(req.user.id) !== String(reserva.usuario._id) && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para cancelar esta reserva'
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
   * Elimina una reserva (solo admin)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID numérico de la reserva (idReserva)
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado
   */
  async deleteReserva(req, res) {
    try {
      const { id } = req.params;
      const reserva = await Reserva.findOne({ idReserva: id });

      if (!reserva) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      const auto = await Auto.findById(reserva.auto);
      await Reserva.deleteOne({ _id: reserva._id });

      if (auto) {
        auto.disponible = true;
        await auto.save();
      }

      return res.status(200).json({
        success: true,
        message: 'Reserva eliminada con éxito'
      });
    } catch (error) {
      console.error('Error en deleteReserva:', error);
      return res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  },

  /**
   * Actualiza el estado de una reserva (solo admin)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID numérico de la reserva (idReserva)
   * @param {Object} req.body - Cuerpo de la solicitud
   * @param {string} req.body.estado - Nuevo estado (Pendiente, Confirmada, Cancelada, Completada)
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con la reserva actualizada
   */
  async actualizarEstadoReserva(req, res) {
    try {
      const { id } = req.params;
      const { estado } = req.body;

      const estadosValidos = ['Pendiente', 'Confirmada', 'Cancelada', 'Completada'];
      if (!estado || !estadosValidos.includes(estado)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido'
        });
      }

      const reserva = await Reserva.findOne({ idReserva: id }).populate('auto');
      if (!reserva) {
        return res.status(404).json({
          success: false,
          message: 'Reserva no encontrada'
        });
      }

      const estadoAnterior = reserva.estado;
      reserva.estado = estado;
      await reserva.save();

      // Si se cancela o completa, el vehículo vuelve a disponible.
      // Si se confirma o pendiente, permanece no disponible por tener reserva activa.
      if (reserva.auto) {
        if (estado === 'Cancelada' || estado === 'Completada') {
          reserva.auto.disponible = true;
          await reserva.auto.save();
        } else if (estado === 'Pendiente' || estado === 'Confirmada') {
          reserva.auto.disponible = false;
          await reserva.auto.save();
        }
      }

      return res.status(200).json({
        success: true,
        message: `Estado actualizado de ${estadoAnterior} a ${estado}`,
        data: reserva.mostrarDetalleReserva()
      });
    } catch (error) {
      console.error('Error en actualizarEstadoReserva:', error);
      return res.status(500).json({
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
      
      // VALIDACIÓN DE AUTORIZACIÓN: Verificar que la reserva pertenezca al usuario o sea admin
      if (String(req.user.id) !== String(reserva.usuario._id) && req.user.rol !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'No tienes permiso para generar factura de esta reserva'
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