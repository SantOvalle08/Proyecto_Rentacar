/**
 * @module components/ClientInitializer
 * @description Componente para inicializar datos de ejemplo en localStorage
 */

'use client';

import { useEffect } from 'react';

/**
 * @typedef {Object} Auto
 * @property {number} id - ID único del vehículo
 * @property {string} marca - Marca del vehículo
 * @property {string} modelo - Modelo del vehículo
 * @property {number} anio - Año del vehículo
 * @property {string} tipo - Tipo de vehículo
 * @property {boolean} disponible - Estado de disponibilidad
 * @property {number} precioBase - Precio base por día
 * @property {string} imagen - URL de la imagen
 * @property {string} matricula - Matrícula del vehículo
 * @property {string} color - Color del vehículo
 */

/**
 * @typedef {Object} Usuario
 * @property {number} id - ID único del usuario
 * @property {number} idUser - ID de usuario
 * @property {string} nombre - Nombre del usuario
 * @property {string} email - Correo electrónico
 * @property {('admin'|'cliente')} rol - Rol del usuario
 * @property {string} telefono - Teléfono del usuario
 * @property {string} tipoDocumento - Tipo de documento
 * @property {string} numeroDocumento - Número de documento
 */

/**
 * @typedef {Object} Reserva
 * @property {number} id - ID único de la reserva
 * @property {Object} usuario - Datos del usuario
 * @property {Object} auto - Datos del vehículo
 * @property {string} fechaInicio - Fecha de inicio
 * @property {string} fechaFin - Fecha de fin
 * @property {number} precioTotal - Precio total
 * @property {string} estado - Estado de la reserva
 */

/**
 * Datos de ejemplo para inicializar la aplicación
 * @type {Object}
 * @property {Array<Auto>} autos - Lista de vehículos
 * @property {Array<Usuario>} usuarios - Lista de usuarios
 * @property {Array<Reserva>} reservas - Lista de reservas
 */
const initialData = {
  autos: [
    {
      id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2023,
      tipo: 'Sedan',
      disponible: true,
      precioBase: 50,
      imagen: 'https://via.placeholder.com/300',
      matricula: 'ABC-123',
      color: 'Blanco'
    },
    {
      id: 2,
      marca: 'Honda',
      modelo: 'Civic',
      anio: 2022,
      tipo: 'Sedan',
      disponible: true,
      precioBase: 45,
      imagen: 'https://via.placeholder.com/300',
      matricula: 'XYZ-789',
      color: 'Azul'
    },
    {
      id: 3,
      marca: 'Ford',
      modelo: 'Explorer',
      anio: 2021,
      tipo: 'SUV',
      disponible: false,
      precioBase: 75,
      imagen: 'https://via.placeholder.com/300',
      matricula: 'DEF-456',
      color: 'Negro'
    }
  ],
  usuarios: [
    {
      id: 1,
      idUser: 1,
      nombre: 'Admin User',
      email: 'admin@rentacar.com',
      rol: 'admin',
      telefono: '1234567890',
      tipoDocumento: 'DNI',
      numeroDocumento: '12345678'
    },
    {
      id: 2,
      idUser: 2,
      nombre: 'Cliente Ejemplo',
      email: 'cliente@example.com',
      rol: 'cliente',
      telefono: '0987654321',
      tipoDocumento: 'DNI',
      numeroDocumento: '87654321'
    }
  ],
  reservas: [
    {
      id: 1,
      usuario: {
        id: 2,
        nombre: 'Cliente Ejemplo',
        email: 'cliente@example.com'
      },
      auto: {
        id: 1,
        marca: 'Toyota',
        modelo: 'Corolla',
        matricula: 'ABC-123'
      },
      fechaInicio: new Date('2023-11-10').toISOString(),
      fechaFin: new Date('2023-11-15').toISOString(),
      precioTotal: 250,
      estado: 'activa'
    }
  ]
};

/**
 * Componente que inicializa datos de ejemplo en localStorage
 * @component
 * @returns {null} No renderiza nada
 */
export default function ClientInitializer() {
  /**
   * Inicializa los datos en localStorage cuando la aplicación se carga
   * @effect
   */
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Verificar e inicializar cada tipo de datos
      Object.keys(initialData).forEach(key => {
        const storageKey = `rentacar_${key}`;
        try {
          const existingData = localStorage.getItem(storageKey);
          if (!existingData) {
            console.log(`Inicializando datos de ${key} en localStorage`);
            localStorage.setItem(storageKey, JSON.stringify(initialData[key]));
            
            // Disparar evento para notificar a otros componentes
            window.dispatchEvent(new Event('storage'));
            window.dispatchEvent(new Event('rentacarDataUpdate'));
          }
        } catch (error) {
          console.error(`Error inicializando ${key} en localStorage:`, error);
        }
      });
    }
  }, []);

  // Este componente no renderiza nada
  return null;
} 