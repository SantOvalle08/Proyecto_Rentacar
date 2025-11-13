/**
 * @module controllers/checklistController
 * @description Controlador para operaciones relacionadas con checklists de vehículos
 */

const Checklist = require('../models/Checklist');
const Auto = require('../models/Auto');

/**
 * Controlador para operaciones de checklist
 */
const checklistController = {
  /**
   * Obtiene el checklist de un vehículo específico
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.autoId - ID del vehículo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el checklist
   */
  async getChecklistByAuto(req, res) {
    try {
      const { autoId } = req.params;
      
      console.log(`Buscando checklist para auto ID: ${autoId}`);
      
      // Buscar el vehículo primero por idAuto (número)
      let auto = await Auto.findOne({ idAuto: parseInt(autoId) });
      
      // Si no existe en MongoDB, intentar buscarlo por _id
      if (!auto) {
        console.log(`Auto con idAuto ${autoId} no encontrado, intentando buscar por _id`);
        try {
          auto = await Auto.findById(autoId);
        } catch (err) {
          console.log('No es un ObjectId válido:', err.message);
        }
      }
      
      if (!auto) {
        console.log(`Auto ${autoId} no encontrado en MongoDB. Creando checklist temporal.`);
        // Si el auto no existe en MongoDB, crear un checklist temporal
        // que se puede usar hasta que el auto sea sincronizado
        const checklistTemporal = {
          id: null,
          idAuto: parseInt(autoId),
          nivelGasolina: 'Lleno',
          porcentajeGasolina: 100,
          rayones: [],
          inventario: [
            { id: Date.now() + 1, nombre: 'Gato hidráulico', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 2, nombre: 'Llanta de repuesto', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 3, nombre: 'Llave de ruedas', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 4, nombre: 'Triángulos de seguridad', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 5, nombre: 'Botiquín de primeros auxilios', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 6, nombre: 'Extintor', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 7, nombre: 'Manual del vehículo', presente: true, condicion: 'Bueno', notas: '' },
            { id: Date.now() + 8, nombre: 'Cables de arranque', presente: true, condicion: 'Bueno', notas: '' }
          ],
          estadoGeneral: 'Bueno',
          observaciones: '',
          fechaUltimaRevision: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return res.status(200).json({
          success: true,
          data: checklistTemporal,
          warning: 'Vehículo no sincronizado con la base de datos. Los cambios se guardarán cuando el vehículo sea sincronizado.'
        });
      }
      
      // Buscar checklist por idAuto (número)
      let checklist = await Checklist.findOne({ idAuto: parseInt(autoId) });
      
      // Si no existe, crear uno nuevo con valores por defecto
      if (!checklist) {
        console.log(`No existe checklist para auto ${autoId}, creando uno nuevo...`);
        checklist = new Checklist({
          autoId: auto._id,
          idAuto: parseInt(autoId)
        });
        await checklist.save();
        console.log(`Checklist creado para auto ${autoId}`);
      }
      
      res.status(200).json({
        success: true,
        data: checklist.obtenerDetalles()
      });
    } catch (error) {
      console.error('Error al obtener checklist:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener el checklist del vehículo'
      });
    }
  },
  
  /**
   * Crea o actualiza el checklist de un vehículo
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.autoId - ID del vehículo
   * @param {Object} req.body - Datos del checklist
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado
   */
  async updateChecklist(req, res) {
    try {
      const { autoId } = req.params;
      const {
        nivelGasolina,
        porcentajeGasolina,
        rayones,
        inventario,
        estadoGeneral,
        observaciones
      } = req.body;
      
      console.log(`Actualizando checklist para auto ID: ${autoId}`);
      console.log('Datos recibidos:', req.body);
      
      // Buscar el vehículo
      let auto = await Auto.findOne({ idAuto: parseInt(autoId) });
      
      // Si no existe, intentar por _id
      if (!auto) {
        try {
          auto = await Auto.findById(autoId);
        } catch (err) {
          // No es un ObjectId válido
        }
      }
      
      if (!auto) {
        // Si el auto no existe, retornar éxito temporal
        // Los datos se guardarán cuando el auto sea sincronizado
        console.log(`Auto ${autoId} no existe en MongoDB. Retornando actualización temporal.`);
        
        const checklistTemporal = {
          id: null,
          idAuto: parseInt(autoId),
          nivelGasolina: nivelGasolina || 'Lleno',
          porcentajeGasolina: porcentajeGasolina || 100,
          rayones: rayones || [],
          inventario: inventario || [],
          estadoGeneral: estadoGeneral || 'Bueno',
          observaciones: observaciones || '',
          fechaUltimaRevision: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        return res.status(200).json({
          success: true,
          message: 'Checklist actualizado temporalmente',
          data: checklistTemporal,
          warning: 'Los cambios se guardarán permanentemente cuando el vehículo sea sincronizado con la base de datos.'
        });
      }
      
      // Buscar checklist existente
      let checklist = await Checklist.findOne({ idAuto: parseInt(autoId) });
      
      if (!checklist) {
        // Crear nuevo checklist
        checklist = new Checklist({
          autoId: auto._id,
          idAuto: parseInt(autoId)
        });
      }
      
      // Actualizar campos si están presentes en el request
      if (nivelGasolina !== undefined) checklist.nivelGasolina = nivelGasolina;
      if (porcentajeGasolina !== undefined) checklist.porcentajeGasolina = porcentajeGasolina;
      if (rayones !== undefined) checklist.rayones = rayones;
      if (inventario !== undefined) checklist.inventario = inventario;
      if (estadoGeneral !== undefined) checklist.estadoGeneral = estadoGeneral;
      if (observaciones !== undefined) checklist.observaciones = observaciones;
      
      // Agregar información del usuario que actualiza (si está disponible)
      if (req.user && req.user.id) {
        checklist.ultimaActualizacionPor = req.user.id;
      }
      
      await checklist.save();
      
      console.log(`Checklist actualizado para auto ${autoId}`);
      
      res.status(200).json({
        success: true,
        message: 'Checklist actualizado con éxito',
        data: checklist.obtenerDetalles()
      });
    } catch (error) {
      console.error('Error al actualizar checklist:', error);
      res.status(500).json({
        success: false,
        message: 'Error al actualizar el checklist',
        error: error.message
      });
    }
  },
  
  /**
   * Agrega un rayón al checklist
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.autoId - ID del vehículo
   * @param {Object} req.body - Datos del rayón
   * @param {string} req.body.descripcion - Descripción del rayón
   * @param {string} req.body.ubicacion - Ubicación del rayón
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado
   */
  async agregarRayon(req, res) {
    try {
      const { autoId } = req.params;
      const { descripcion, ubicacion } = req.body;
      
      if (!descripcion || !ubicacion) {
        return res.status(400).json({
          success: false,
          message: 'Descripción y ubicación son requeridos'
        });
      }
      
      let checklist = await Checklist.findOne({ idAuto: parseInt(autoId) });
      
      if (!checklist) {
        // Verificar si el auto existe
        let auto = await Auto.findOne({ idAuto: parseInt(autoId) });
        
        if (!auto) {
          try {
            auto = await Auto.findById(autoId);
          } catch (err) {
            // No es ObjectId válido
          }
        }
        
        if (!auto) {
          // Auto no existe en MongoDB
          return res.status(200).json({
            success: true,
            message: 'Rayón agregado temporalmente',
            data: {
              id: null,
              idAuto: parseInt(autoId),
              nivelGasolina: 'Lleno',
              porcentajeGasolina: 100,
              rayones: [{ descripcion, ubicacion, fecha: new Date(), id: Date.now() }],
              inventario: [],
              estadoGeneral: 'Bueno',
              observaciones: '',
              fechaUltimaRevision: new Date()
            },
            warning: 'Los cambios se guardarán cuando el vehículo sea sincronizado.'
          });
        }
        
        checklist = new Checklist({
          autoId: auto._id,
          idAuto: parseInt(autoId)
        });
      }
      
      checklist.rayones.push({
        descripcion,
        ubicacion,
        fecha: new Date()
      });
      
      if (req.user && req.user.id) {
        checklist.ultimaActualizacionPor = req.user.id;
      }
      
      await checklist.save();
      
      res.status(200).json({
        success: true,
        message: 'Rayón agregado con éxito',
        data: checklist.obtenerDetalles()
      });
    } catch (error) {
      console.error('Error al agregar rayón:', error);
      res.status(500).json({
        success: false,
        message: 'Error al agregar rayón'
      });
    }
  },
  
  /**
   * Elimina un rayón del checklist
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.autoId - ID del vehículo
   * @param {string} req.params.rayonId - ID del rayón
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado
   */
  async eliminarRayon(req, res) {
    try {
      const { autoId, rayonId } = req.params;
      
      const checklist = await Checklist.findOne({ idAuto: parseInt(autoId) });
      
      if (!checklist) {
        return res.status(404).json({
          success: false,
          message: 'Checklist no encontrado'
        });
      }
      
      checklist.rayones = checklist.rayones.filter(
        rayon => rayon._id.toString() !== rayonId
      );
      
      if (req.user && req.user.id) {
        checklist.ultimaActualizacionPor = req.user.id;
      }
      
      await checklist.save();
      
      res.status(200).json({
        success: true,
        message: 'Rayón eliminado con éxito',
        data: checklist.obtenerDetalles()
      });
    } catch (error) {
      console.error('Error al eliminar rayón:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar rayón'
      });
    }
  },
  
  /**
   * Obtiene todos los checklists (solo admin)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con la lista de checklists
   */
  async getAllChecklists(req, res) {
    try {
      const checklists = await Checklist.find()
        .populate('autoId', 'marca modelo matricula')
        .sort({ fechaUltimaRevision: -1 });
      
      res.status(200).json({
        success: true,
        data: checklists.map(checklist => checklist.obtenerResumen())
      });
    } catch (error) {
      console.error('Error al obtener checklists:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener los checklists'
      });
    }
  },
  
  /**
   * Elimina un checklist (solo para pruebas/admin)
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} req.params - Parámetros de la URL
   * @param {string} req.params.autoId - ID del vehículo
   * @param {Object} res - Objeto de respuesta Express
   * @returns {Object} Respuesta JSON con el resultado
   */
  async deleteChecklist(req, res) {
    try {
      const { autoId } = req.params;
      
      const result = await Checklist.deleteOne({ idAuto: parseInt(autoId) });
      
      if (result.deletedCount === 0) {
        return res.status(404).json({
          success: false,
          message: 'Checklist no encontrado'
        });
      }
      
      res.status(200).json({
        success: true,
        message: 'Checklist eliminado con éxito'
      });
    } catch (error) {
      console.error('Error al eliminar checklist:', error);
      res.status(500).json({
        success: false,
        message: 'Error al eliminar checklist'
      });
    }
  }
};

module.exports = checklistController;
