/**
 * @module controllers/autoController
 * @description Controlador para operaciones relacionadas con vehículos
 */

const sistemaRentaAutos = require('../utils/SistemaRentaAutos');
const Auto = require('../models/Auto');
const autoFactory = require('../utils/factories/AutoFactory');
const mongoose = require('mongoose');
const Reserva = require('../models/Reserva');

/**
 * @typedef {Object} AutoController
 * @property {Function} createAuto - Crea un nuevo vehículo
 * @property {Function} getAllAutos - Obtiene todos los vehículos
 * @property {Function} getAutoById - Obtiene un vehículo por su ID
 * @property {Function} updateAuto - Actualiza los datos de un vehículo
 * @property {Function} deleteAuto - Elimina un vehículo
 * @property {Function} searchAutos - Busca vehículos por criterios
 * @property {Function} checkAvailability - Verifica la disponibilidad de un vehículo
 */

/**
 * Controlador para operaciones de vehículos
 * @type {AutoController}
 */
const autoController = {
  /**
   * Crea un nuevo vehículo en el sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.body - Datos del vehículo
   * @param {string} req.body.marca - Marca del vehículo
   * @param {string} req.body.modelo - Modelo del vehículo
   * @param {number} req.body.año - Año del vehículo
   * @param {string} req.body.matricula - Matrícula del vehículo
   * @param {string} req.body.tipoCoche - Tipo de vehículo
   * @param {number} req.body.precioDia - Precio por día
   * @param {string} [req.body.imagen] - URL de la imagen
   * @param {string} [req.body.descripcion] - Descripción del vehículo
   * @param {Array<string>} [req.body.caracteristicas] - Características del vehículo
   * @param {number} [req.body.kilometraje] - Kilometraje del vehículo
   * @param {string} req.body.combustible - Tipo de combustible
   * @param {string} req.body.transmision - Tipo de transmisión
   * @param {number} req.body.capacidad - Capacidad de pasajeros
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la operación
   */
  async createAuto(req, res) {
    try {
      const {
        marca,
        modelo,
        año,
        matricula,
        tipoCoche,
        precioDia,
        imagen,
        descripcion,
        caracteristicas,
        kilometraje,
        combustible,
        transmision,
        capacidad
      } = req.body;

      // Validar campos requeridos
      if (!marca || !modelo || !año || !matricula || !tipoCoche || !precioDia || !combustible || !transmision || !capacidad) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos requeridos deben ser proporcionados'
        });
      }

      // Verificar si ya existe un auto con la misma matrícula
      const autoExistente = await Auto.findOne({ matricula });
      if (autoExistente) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un auto con esta matrícula'
        });
      }

      // Generar nuevo ID de auto
      const lastAuto = await Auto.findOne().sort({ idAuto: -1 });
      const idAuto = lastAuto ? lastAuto.idAuto + 1 : 1;

      // Crear el auto
      const auto = new Auto({
        idAuto,
        marca,
        modelo,
        año,
        matricula,
        tipoCoche,
        precioDia,
        imagen: imagen || 'default-car.jpg',
        descripcion,
        caracteristicas: caracteristicas || [],
        kilometraje: kilometraje || 0,
        combustible,
        transmision,
        capacidad,
        disponible: true
      });

      await auto.save();

      res.status(201).json({
        success: true,
        message: 'Auto creado con éxito',
        data: auto.mostrarDetalleAuto()
      });
    } catch (error) {
      console.error('Error al crear auto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al crear el auto',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  },
  
  /**
   * Obtiene todos los vehículos con filtros opcionales
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.query - Parámetros de consulta
   * @param {string} [req.query.tipoCoche] - Tipo de vehículo
   * @param {string} [req.query.marca] - Marca del vehículo
   * @param {number} [req.query.precioMin] - Precio mínimo por día
   * @param {number} [req.query.precioMax] - Precio máximo por día
   * @param {boolean} [req.query.disponible] - Estado de disponibilidad
   * @param {string} [req.query.combustible] - Tipo de combustible
   * @param {string} [req.query.transmision] - Tipo de transmisión
   * @param {number} [req.query.capacidad] - Capacidad de pasajeros
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con la lista de vehículos
   */
  async getAllAutos(req, res) {
    try {
      const { 
        tipoCoche, 
        marca, 
        precioMin, 
        precioMax, 
        disponible,
        combustible,
        transmision,
        capacidad
      } = req.query;

      // Construir filtro
      const filtro = {};

      if (tipoCoche) filtro.tipoCoche = tipoCoche;
      if (marca) filtro.marca = marca;
      if (disponible !== undefined) filtro.disponible = disponible === 'true';
      if (combustible) filtro.combustible = combustible;
      if (transmision) filtro.transmision = transmision;
      if (capacidad) filtro.capacidad = parseInt(capacidad);

      // Filtrar por rango de precio
      if (precioMin || precioMax) {
        filtro.precioDia = {};
        if (precioMin) filtro.precioDia.$gte = parseFloat(precioMin);
        if (precioMax) filtro.precioDia.$lte = parseFloat(precioMax);
      }

      const autos = await Auto.find(filtro)
        .sort({ marca: 1, modelo: 1 });

      res.status(200).json({
        success: true,
        data: autos.map(auto => auto.mostrarDetalleAuto())
      });
    } catch (error) {
      console.error('Error al obtener autos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los autos'
      });
    }
  },
  
  /**
   * Obtiene un vehículo específico por su ID
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del vehículo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con los datos del vehículo
   */
  async getAutoById(req, res) {
    try {
      const { id } = req.params;
      const auto = await Auto.findById(id);

      if (!auto) {
        return res.status(404).json({
          success: false,
          message: 'Auto no encontrado'
        });
      }

      res.status(200).json({
        success: true,
        data: auto.mostrarDetalleAuto()
      });
    } catch (error) {
      console.error('Error al obtener auto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el auto'
      });
    }
  },
  
  /**
   * Actualiza los datos de un vehículo
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del vehículo
   * @param {Object} req.body - Datos actualizados del vehículo
   * @param {string} [req.body.marca] - Nueva marca
   * @param {string} [req.body.modelo] - Nuevo modelo
   * @param {number} [req.body.año] - Nuevo año
   * @param {string} [req.body.matricula] - Nueva matrícula
   * @param {string} [req.body.tipoCoche] - Nuevo tipo
   * @param {number} [req.body.precioDia] - Nuevo precio por día
   * @param {string} [req.body.imagen] - Nueva imagen
   * @param {string} [req.body.descripcion] - Nueva descripción
   * @param {Array<string>} [req.body.caracteristicas] - Nuevas características
   * @param {number} [req.body.kilometraje] - Nuevo kilometraje
   * @param {string} [req.body.combustible] - Nuevo tipo de combustible
   * @param {string} [req.body.transmision] - Nuevo tipo de transmisión
   * @param {number} [req.body.capacidad] - Nueva capacidad
   * @param {boolean} [req.body.disponible] - Nueva disponibilidad
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la actualización
   */
  async updateAuto(req, res) {
    try {
      const { id } = req.params;
      const {
        marca,
        modelo,
        año,
        matricula,
        tipoCoche,
        precioDia,
        imagen,
        descripcion,
        caracteristicas,
        kilometraje,
        combustible,
        transmision,
        capacidad,
        disponible
      } = req.body;

      const auto = await Auto.findById(id);
      if (!auto) {
        return res.status(404).json({
          success: false,
          message: 'Auto no encontrado'
        });
      }

      // Verificar si la nueva matrícula ya existe en otro auto
      if (matricula && matricula !== auto.matricula) {
        const autoExistente = await Auto.findOne({ matricula });
        if (autoExistente) {
          return res.status(400).json({
            success: false,
            message: 'Ya existe un auto con esta matrícula'
          });
        }
      }

      // Actualizar campos
      const camposActualizables = {
        marca,
        modelo,
        año,
        matricula,
        tipoCoche,
        precioDia,
        imagen,
        descripcion,
        caracteristicas,
        kilometraje,
        combustible,
        transmision,
        capacidad,
        disponible
      };

      // Filtrar campos undefined
      Object.keys(camposActualizables).forEach(key => {
        if (camposActualizables[key] !== undefined) {
          auto[key] = camposActualizables[key];
        }
      });

      await auto.save();

      res.status(200).json({
        success: true,
        message: 'Auto actualizado con éxito',
        data: auto.mostrarDetalleAuto()
      });
    } catch (error) {
      console.error('Error al actualizar auto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el auto'
      });
    }
  },
  
  /**
   * Elimina un vehículo del sistema
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del vehículo a eliminar
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la eliminación
   */
  async deleteAuto(req, res) {
    try {
      const { id } = req.params;
      const auto = await Auto.findById(id);

      if (!auto) {
        return res.status(404).json({
          success: false,
          message: 'Auto no encontrado'
        });
      }

      await auto.deleteOne();

      res.status(200).json({
        success: true,
        message: 'Auto eliminado con éxito'
      });
    } catch (error) {
      console.error('Error al eliminar auto:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar el auto'
      });
    }
  },
  
  /**
   * Busca vehículos por criterios específicos
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.query - Parámetros de búsqueda
   * @param {string} [req.query.query] - Término de búsqueda general
   * @param {string} [req.query.tipoCoche] - Tipo de vehículo
   * @param {string} [req.query.marca] - Marca del vehículo
   * @param {number} [req.query.precioMin] - Precio mínimo por día
   * @param {number} [req.query.precioMax] - Precio máximo por día
   * @param {boolean} [req.query.disponible] - Estado de disponibilidad
   * @param {string} [req.query.combustible] - Tipo de combustible
   * @param {string} [req.query.transmision] - Tipo de transmisión
   * @param {number} [req.query.capacidad] - Capacidad de pasajeros
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con los vehículos encontrados
   */
  async searchAutos(req, res) {
    try {
      const { 
        query,
        tipoCoche,
        marca,
        precioMin,
        precioMax,
        disponible,
        combustible,
        transmision,
        capacidad
      } = req.query;

      // Construir filtro
      const filtro = {};

      // Búsqueda por texto
      if (query) {
        filtro.$or = [
          { marca: { $regex: query, $options: 'i' } },
          { modelo: { $regex: query, $options: 'i' } },
          { matricula: { $regex: query, $options: 'i' } }
        ];
      }

      // Filtros adicionales
      if (tipoCoche) filtro.tipoCoche = tipoCoche;
      if (marca) filtro.marca = marca;
      if (disponible !== undefined) filtro.disponible = disponible === 'true';
      if (combustible) filtro.combustible = combustible;
      if (transmision) filtro.transmision = transmision;
      if (capacidad) filtro.capacidad = parseInt(capacidad);

      // Filtrar por rango de precio
      if (precioMin || precioMax) {
        filtro.precioDia = {};
        if (precioMin) filtro.precioDia.$gte = parseFloat(precioMin);
        if (precioMax) filtro.precioDia.$lte = parseFloat(precioMax);
      }

      const autos = await Auto.find(filtro)
        .sort({ marca: 1, modelo: 1 });

      res.status(200).json({
        success: true,
        data: autos.map(auto => auto.mostrarDetalleAuto())
      });
    } catch (error) {
      console.error('Error al buscar autos:', error);
      res.status(500).json({
        success: false,
        message: 'Error al buscar los autos'
      });
    }
  },

  /**
   * Verifica la disponibilidad de un vehículo en un rango de fechas
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.id - ID del vehículo
   * @param {Object} req.body - Fechas a verificar
   * @param {string} req.body.inicio - Fecha de inicio
   * @param {string} req.body.fin - Fecha de fin
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado de la verificación
   */
  async checkAvailability(req, res) {
    try {
      const { id } = req.params;
      const { inicio, fin } = req.body;

      const auto = await Auto.findById(id);
      if (!auto) {
        return res.status(404).json({
          success: false,
          message: 'Auto no encontrado'
        });
      }

      // Verificar disponibilidad
      const reservasExistentes = await Reserva.find({
        auto,
        estado: { $ne: 'Cancelada' },
        $or: [
          {
            fechaInicio: { $lte: fin },
            fechaFin: { $gte: inicio }
          }
        ]
      });

      if (reservasExistentes.length > 0) {
        return res.status(400).json({
          success: false,
          message: 'El auto no está disponible en las fechas solicitadas'
        });
      }

      res.status(200).json({
        success: true,
        message: 'El auto está disponible'
      });
    } catch (error) {
      console.error('Error al verificar disponibilidad:', error);
      res.status(500).json({
        success: false,
        message: 'Error al verificar la disponibilidad del auto'
      });
    }
  }
};

module.exports = autoController; 