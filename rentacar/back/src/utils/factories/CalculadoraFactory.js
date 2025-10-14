/**
 * @module utils/factories/CalculadoraFactory
 * @description Factory para crear calculadoras de precios de reservas
 */

/**
 * @typedef {Object} Auto
 * @property {string} tipoCoche - Tipo de vehículo
 * @property {number} precioDia - Precio por día
 */

/**
 * Calculadora class for calculating reservation prices
 * @class
 */
class Calculadora {
  /**
   * Create a new Calculadora instance
   * @param {Date|string} fechaInicio - Start date
   * @param {Date|string} fechaFinal - End date
   * @param {number} tarifaBase - Base rate (car price per day)
   * @param {number} descuento - Discount percentage
   * @param {Auto} auto - Car object
   */
  constructor(fechaInicio, fechaFinal, tarifaBase, descuento, auto) {
    this.fechaInicio = new Date(fechaInicio);
    this.fechaFinal = new Date(fechaFinal);
    this.tarifaBase = tarifaBase;
    this.descuento = descuento;
    this.auto = auto;
  }

  /**
   * Calculate total price for reservation
   * @returns {number} - Total price
   */
  calcularPrecioTotal() {
    // Calculate days
    const diffTime = Math.abs(this.fechaFinal - this.fechaInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Base price
    let precioBase = this.tarifaBase * diffDays;
    
    // Apply discount
    let precioConDescuento = precioBase * (1 - (this.descuento / 100));
    
    // Apply car type modifier
    const tipoModifier = this._getCarTypeModifier();
    
    // Calculate final price
    return Math.round(precioConDescuento * tipoModifier * 100) / 100;
  }

  /**
   * Get price modifier based on car type
   * @returns {number} - Price modifier
   * @private
   */
  _getCarTypeModifier() {
    const tipo = this.auto.tipoCoche;
    
    switch(tipo) {
      case 'Compacto':
        return 1.0;
      case 'Sedan':
        return 1.2;
      case 'SUV':
        return 1.5;
      case 'Deportivo':
        return 1.8;
      case 'Camioneta':
        return 1.6;
      case 'Lujo':
        return 2.0;
      default:
        return 1.0;
    }
  }
}

/**
 * Factory for creating Calculadora instances
 * @class
 */
class CalculadoraFactory {
  /**
   * Create a specific calculator based on rental duration
   * @param {Date|string} fechaInicio - Start date
   * @param {Date|string} fechaFinal - End date
   * @param {Auto} auto - Car object
   * @returns {Calculadora} - Calculator instance
   * 
   * @example
   * // Crear calculadora para alquiler de 7 días
   * const calculadora = calculadoraFactory.createCalculadora(
   *   '2024-03-01',
   *   '2024-03-08',
   *   { tipoCoche: 'Sedan', precioDia: 100 }
   * );
   * const precioTotal = calculadora.calcularPrecioTotal();
   */
  createCalculadora(fechaInicio, fechaFinal, auto) {
    // Get days difference
    const diffTime = Math.abs(new Date(fechaFinal) - new Date(fechaInicio));
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    let descuento = 0;
    
    // Apply discount based on rental duration
    if (diffDays >= 30) {
      // Monthly rental (30+ days): 30% discount
      descuento = 30;
    } else if (diffDays >= 7) {
      // Weekly rental (7+ days): 15% discount
      descuento = 15;
    } else if (diffDays >= 3) {
      // Short rental (3+ days): 5% discount
      descuento = 5;
    }
    
    return new Calculadora(
      fechaInicio,
      fechaFinal,
      auto.precioDia,
      descuento,
      auto
    );
  }
}

module.exports = new CalculadoraFactory(); 