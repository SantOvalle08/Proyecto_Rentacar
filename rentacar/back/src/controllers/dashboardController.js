const Auto = require('../models/Auto');
const Usuario = require('../models/usuario');
const Reserva = require('../models/Reserva');

const dashboardController = {
  async getEstadisticas(req, res) {
    try {
      const [vehiculos, usuarios, reservas] = await Promise.all([
        Auto.countDocuments(),
        Usuario.countDocuments(),
        Reserva.countDocuments()
      ]);

      res.status(200).json({
        success: true,
        data: { vehiculos, usuarios, reservas }
      });
    } catch (error) {
      console.error('Error en getEstadisticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener estadísticas del dashboard'
      });
    }
  }
};

module.exports = dashboardController;
