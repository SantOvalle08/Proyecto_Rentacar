/**
 * @module utils/factories/AutoFactory
 * @description Factory para crear diferentes tipos de vehículos
 */

const Auto = require('../../models/Auto');

/**
 * @typedef {Object} AutoData
 * @property {string} [tipoCoche] - Tipo de vehículo
 * @property {string} [tipo] - Tipo de vehículo (alternativo)
 * @property {number} [año] - Año del vehículo
 * @property {number} [anio] - Año del vehículo (alternativo)
 * @property {number} [precioDia] - Precio por día
 * @property {number} [precioBase] - Precio base (alternativo)
 * @property {string} marca - Marca del vehículo
 * @property {string} modelo - Modelo del vehículo
 * @property {string} matricula - Matrícula del vehículo
 * @property {string} combustible - Tipo de combustible
 * @property {string} transmision - Tipo de transmisión
 * @property {number} capacidad - Capacidad de pasajeros
 */

/**
 * @typedef {Object} AutoEnriquecido
 * @property {string} tipoCoche - Tipo de vehículo
 * @property {string} consumoCombustible - Nivel de consumo de combustible
 * @property {string} tamaño - Tamaño del vehículo
 * @property {string} categoria - Categoría del vehículo
 * @property {string} [traccion] - Tipo de tracción (para SUV y Camioneta)
 * @property {string} [velocidadMaxima] - Velocidad máxima (para Deportivo)
 * @property {number} [capacidadCarga] - Capacidad de carga (para Camioneta)
 * @property {Array<string>} [comodidades] - Lista de comodidades (para Lujo)
 * @property {boolean} [servicioChofer] - Disponibilidad de servicio de chofer (para Lujo)
 */

/**
 * Factory para crear diferentes tipos de vehículos
 * @class
 */
class AutoFactory {
  /**
   * Crea un objeto de vehículo basado en su tipo
   * @param {AutoData} autoData - Datos del vehículo
   * @returns {AutoEnriquecido} Datos del vehículo con propiedades específicas según su tipo
   */
  createAuto(autoData) {
    // Asegurarse de que usemos el campo correcto independientemente de cómo se nombró
    const tipoCoche = autoData.tipoCoche || autoData.tipo || 'Sedan';
    
    // Normalizar los nombres de campos para compatibilidad
    const normalizedData = {
      ...autoData,
      tipoCoche: tipoCoche,
      tipo: tipoCoche,
      año: autoData.año || autoData.anio,
      anio: autoData.año || autoData.anio,
      precioDia: autoData.precioDia || autoData.precioBase,
      precioBase: autoData.precioDia || autoData.precioBase
    };
    
    // Base car properties
    const baseAuto = {
      ...normalizedData,
    };
    
    // Add specific properties based on car type
    switch (tipoCoche) {
      case 'Compacto':
        return {
          ...baseAuto,
          consumoCombustible: 'Bajo',
          tamaño: 'Pequeño',
          categoria: 'Económico'
        };
        
      case 'Sedan':
        return {
          ...baseAuto,
          consumoCombustible: 'Medio',
          tamaño: 'Mediano',
          categoria: 'Estándar'
        };
        
      case 'SUV':
        return {
          ...baseAuto,
          consumoCombustible: 'Alto',
          tamaño: 'Grande',
          traccion: '4x4',
          categoria: 'Premium'
        };
        
      case 'Deportivo':
        return {
          ...baseAuto,
          consumoCombustible: 'Alto',
          velocidadMaxima: '250 km/h',
          categoria: 'Lujo'
        };
        
      case 'Camioneta':
        return {
          ...baseAuto,
          consumoCombustible: 'Alto',
          capacidadCarga: '1 tonelada',
          traccion: '4x4',
          categoria: 'Utilitario'
        };
        
      case 'Lujo':
        return {
          ...baseAuto,
          consumoCombustible: 'Alto',
          comodidades: ['Asientos de cuero', 'Sistema de navegación premium', 'Sonido de alta fidelidad'],
          servicioChofer: true,
          categoria: 'VIP'
        };
        
      default:
        return baseAuto;
    }
  }
  
  /**
   * Genera una instancia completa de Auto lista para guardar en la base de datos
   * @param {AutoData} autoData - Datos del vehículo
   * @returns {Promise<Object>} Instancia de Auto
   * @throws {Error} Si hay un error al generar el vehículo
   */
  async generateAuto(autoData) {
    try {
      // Generate new car ID if not provided
      if (!autoData.idAuto) {
        const lastAuto = await Auto.findOne().sort({ idAuto: -1 });
        autoData.idAuto = lastAuto ? lastAuto.idAuto + 1 : 1;
      }
      
      // Apply type-specific properties
      const enrichedData = this.createAuto(autoData);
      
      // Create but don't save the Auto instance
      return new Auto(enrichedData);
    } catch (error) {
      console.error('Error in AutoFactory:', error);
      throw error;
    }
  }
}

module.exports = new AutoFactory(); 