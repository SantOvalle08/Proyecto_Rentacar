/**
 * Script para inicializar datos de ejemplo en localStorage
 * Incluye reservas de ejemplo para testing de facturas
 */

// Datos de ejemplo de reservas
const reservasEjemplo = [
  {
    id: 'RES-001-2024-11-12',
    idReserva: 1,
    autoId: 1,
    usuarioId: 1,
    fechaInicio: '2024-11-15T08:00:00.000Z',
    fechaFin: '2024-11-20T18:00:00.000Z',
    precioTotal: 350000,
    diasReserva: 5,
    metodoPago: 'tarjeta',
    datosPago: {
      tipoTarjeta: 'Visa',
      ultimosDigitos: '4532',
      fotoPasaporte: 'pasaporte_001.pdf',
      fotoLicencia: 'licencia_001.pdf'
    },
    estado: 'activa',
    fechaCreacion: '2024-11-12T10:30:00.000Z',
    auto: {
      id: 1,
      marca: 'Toyota',
      modelo: 'Corolla',
      anio: 2022,
      año: 2022,
      tipo: 'Sedan',
      color: 'Blanco',
      placa: 'ABC-123',
      disponible: false,
      precioBase: 70000,
      precioDia: 70000,
      imagen: '/images/autos/toyota-corolla.jpg'
    },
    usuario: {
      id: 1,
      nombre: 'Juan Carlos',
      apellido: 'Rodríguez Pérez',
      email: 'juan.rodriguez@email.com',
      cedula: '1.234.567.890',
      telefono: '+57 310 555 1234',
      direccion: 'Calle 45 #12-34, Bogotá'
    }
  },
  {
    id: 'RES-002-2024-11-12',
    idReserva: 2,
    autoId: 2,
    usuarioId: 1,
    fechaInicio: '2024-11-10T09:00:00.000Z',
    fechaFin: '2024-11-13T17:00:00.000Z',
    precioTotal: 195000,
    diasReserva: 3,
    metodoPago: 'efectivo',
    datosPago: {
      fotoPasaporte: 'pasaporte_002.pdf',
      fotoLicencia: 'licencia_002.pdf'
    },
    estado: 'completada',
    fechaCreacion: '2024-11-08T14:20:00.000Z',
    auto: {
      id: 2,
      marca: 'Honda',
      modelo: 'Civic',
      anio: 2021,
      año: 2021,
      tipo: 'Sedan',
      color: 'Azul',
      placa: 'XYZ-789',
      disponible: true,
      precioBase: 65000,
      precioDia: 65000,
      imagen: '/images/autos/honda-civic.jpg'
    },
    usuario: {
      id: 1,
      nombre: 'Juan Carlos',
      apellido: 'Rodríguez Pérez',
      email: 'juan.rodriguez@email.com',
      cedula: '1.234.567.890',
      telefono: '+57 310 555 1234',
      direccion: 'Calle 45 #12-34, Bogotá'
    }
  },
  {
    id: 'RES-003-2024-11-12',
    idReserva: 3,
    autoId: 3,
    usuarioId: 2,
    fechaInicio: '2024-11-18T10:00:00.000Z',
    fechaFin: '2024-11-25T16:00:00.000Z',
    precioTotal: 637000,
    diasReserva: 7,
    metodoPago: 'mercadopago',
    datosPago: {
      email: 'maria.lopez@email.com',
      fotoPasaporte: 'pasaporte_003.pdf',
      fotoLicencia: 'licencia_003.pdf'
    },
    estado: 'pendiente',
    fechaCreacion: '2024-11-12T16:45:00.000Z',
    auto: {
      id: 3,
      marca: 'Ford',
      modelo: 'Explorer',
      anio: 2023,
      año: 2023,
      tipo: 'SUV',
      color: 'Negro',
      placa: 'DEF-456',
      disponible: false,
      precioBase: 91000,
      precioDia: 91000,
      imagen: '/images/autos/ford-explorer.jpg'
    },
    usuario: {
      id: 2,
      nombre: 'María Fernanda',
      apellido: 'López García',
      email: 'maria.lopez@email.com',
      cedula: '9.876.543.210',
      telefono: '+57 320 444 5678',
      direccion: 'Carrera 7 #89-12, Medellín'
    },
    serviciosAdicionales: [
      {
        nombre: 'GPS',
        descripcion: 'Sistema de navegación GPS',
        precio: 5000,
        cantidad: 7
      },
      {
        nombre: 'Silla para bebé',
        descripcion: 'Silla de seguridad infantil',
        precio: 8000,
        cantidad: 7
      }
    ]
  },
  {
    id: 'RES-004-2024-11-12',
    idReserva: 4,
    autoId: 4,
    usuarioId: 3,
    fechaInicio: '2024-11-05T08:00:00.000Z',
    fechaFin: '2024-11-08T20:00:00.000Z',
    precioTotal: 168000,
    diasReserva: 3,
    metodoPago: 'transferencia',
    datosPago: {
      nombreTitular: 'Carlos Andrés Martínez',
      emailConfirmacion: 'carlos.martinez@email.com',
      comprobante: 'comprobante_004.pdf',
      fotoPasaporte: 'pasaporte_004.pdf',
      fotoLicencia: 'licencia_004.pdf'
    },
    estado: 'cancelada',
    fechaCreacion: '2024-11-03T11:15:00.000Z',
    auto: {
      id: 4,
      marca: 'Chevrolet',
      modelo: 'Spark',
      anio: 2020,
      año: 2020,
      tipo: 'Compacto',
      color: 'Rojo',
      placa: 'GHI-789',
      disponible: true,
      precioBase: 56000,
      precioDia: 56000,
      imagen: '/images/autos/chevrolet-spark.jpg'
    },
    usuario: {
      id: 3,
      nombre: 'Carlos Andrés',
      apellido: 'Martínez Sánchez',
      email: 'carlos.martinez@email.com',
      cedula: '5.432.109.876',
      telefono: '+57 315 333 9999',
      direccion: 'Avenida 68 #23-45, Cali'
    }
  }
];

/**
 * Inicializar datos en localStorage
 */
export function inicializarDatosEjemplo() {
  try {
    if (typeof window === 'undefined') return;

    // Guardar reservas
    localStorage.setItem('rentacar_reservas', JSON.stringify(reservasEjemplo));
    
    console.log('✅ Datos de ejemplo inicializados correctamente');
    console.log(`📄 ${reservasEjemplo.length} reservas de ejemplo agregadas`);
    
    return {
      success: true,
      message: 'Datos de ejemplo inicializados',
      reservas: reservasEjemplo.length
    };
  } catch (error) {
    console.error('❌ Error al inicializar datos de ejemplo:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

/**
 * Limpiar datos de ejemplo
 */
export function limpiarDatosEjemplo() {
  try {
    if (typeof window === 'undefined') return;
    
    localStorage.removeItem('rentacar_reservas');
    
    console.log('🗑️ Datos de ejemplo limpiados');
    
    return {
      success: true,
      message: 'Datos limpiados correctamente'
    };
  } catch (error) {
    console.error('❌ Error al limpiar datos:', error);
    return {
      success: false,
      message: error.message
    };
  }
}

// Si se ejecuta directamente en el navegador
if (typeof window !== 'undefined') {
  window.inicializarDatosEjemplo = inicializarDatosEjemplo;
  window.limpiarDatosEjemplo = limpiarDatosEjemplo;
}
