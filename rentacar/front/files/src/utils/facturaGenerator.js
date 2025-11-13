/**
 * Generador de Facturas Electrónicas - Formato Colombia
 * Compatible con normativa DIAN
 */

// Datos de la empresa (RentACar)
export const EMPRESA_DATA = {
  razonSocial: 'RENTACAR S.A.S',
  nit: '900.123.456-7',
  direccion: 'Calle 100 # 45-67, Bogotá D.C.',
  telefono: '(+57) 601 234 5678',
  email: 'facturacion@rentacar.com.co',
  web: 'www.rentacar.com.co',
  // Datos DIAN
  resolucionDian: 'Resolución DIAN No. 18764000123456',
  fechaResolucion: '2024-01-15',
  rangoAutorizado: 'Del RC-1000 al RC-9999',
  vigenciaResolucion: '2024-01-15 hasta 2026-01-14',
  responsabilidadFiscal: 'O-13 Gran Contribuyente',
  regimenFiscal: 'Responsable de IVA'
};

/**
 * Convierte un número a texto en español (para valor en letras)
 */
export function numeroALetras(num) {
  const unidades = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const decenas = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const especiales = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  if (num === 0) return 'CERO';
  if (num === 100) return 'CIEN';

  let resultado = '';
  
  // Millones
  const millones = Math.floor(num / 1000000);
  if (millones > 0) {
    if (millones === 1) {
      resultado += 'UN MILLÓN ';
    } else {
      resultado += numeroALetras(millones) + ' MILLONES ';
    }
    num %= 1000000;
  }

  // Miles
  const miles = Math.floor(num / 1000);
  if (miles > 0) {
    if (miles === 1) {
      resultado += 'MIL ';
    } else {
      resultado += numeroALetras(miles) + ' MIL ';
    }
    num %= 1000;
  }

  // Centenas
  const cent = Math.floor(num / 100);
  if (cent > 0) {
    resultado += centenas[cent] + ' ';
    num %= 100;
  }

  // Decenas y unidades
  if (num >= 10 && num < 20) {
    resultado += especiales[num - 10];
  } else {
    const dec = Math.floor(num / 10);
    const uni = num % 10;
    
    if (dec > 0) {
      resultado += decenas[dec];
      if (uni > 0) {
        resultado += ' Y ' + unidades[uni];
      }
    } else if (uni > 0) {
      resultado += unidades[uni];
    }
  }

  return resultado.trim();
}

/**
 * Genera el número de factura con formato
 */
export function generarNumeroFactura(reservaId) {
  const fecha = new Date();
  const año = fecha.getFullYear();
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const consecutivo = String(reservaId).padStart(6, '0');
  return `RC-${año}${mes}-${consecutivo}`;
}

/**
 * Calcula el IVA (19% en Colombia)
 */
export function calcularIVA(subtotal) {
  const IVA_RATE = 0.19;
  return subtotal * IVA_RATE;
}

/**
 * Genera datos completos de la factura
 */
export function generarFactura(reserva) {
  const fecha = new Date();
  const numeroFactura = generarNumeroFactura(reserva.id || reserva.idReserva || Math.floor(Math.random() * 10000));
  
  // Calcular fechas
  const fechaInicio = new Date(reserva.fechaInicio);
  const fechaFin = new Date(reserva.fechaFin);
  const diasReserva = reserva.diasReserva || Math.ceil((fechaFin - fechaInicio) / (1000 * 60 * 60 * 24));
  
  // Calcular precios
  const precioDia = reserva.auto?.precioDia || reserva.auto?.precioBase || 50;
  const subtotal = precioDia * diasReserva;
  const iva = calcularIVA(subtotal);
  const total = subtotal + iva;
  
  // Datos del cliente
  const cliente = {
    nombre: `${reserva.usuario?.nombre || 'Cliente'} ${reserva.usuario?.apellido || ''}`.trim(),
    identificacion: reserva.usuario?.cedula || reserva.usuario?.email || 'N/A',
    direccion: reserva.usuario?.direccion || 'No especificada',
    telefono: reserva.usuario?.telefono || 'No especificado',
    email: reserva.usuario?.email || 'cliente@email.com'
  };
  
  // Detalle de servicios
  const detalles = [
    {
      cantidad: diasReserva,
      descripcion: `Alquiler de vehículo ${reserva.auto?.marca || ''} ${reserva.auto?.modelo || ''} ${reserva.auto?.anio || ''}`,
      valorUnitario: precioDia,
      subtotal: subtotal,
      iva: iva,
      total: total
    }
  ];
  
  // Agregar servicios adicionales si existen
  if (reserva.serviciosAdicionales && reserva.serviciosAdicionales.length > 0) {
    reserva.serviciosAdicionales.forEach(servicio => {
      const subtotalServicio = servicio.precio * servicio.cantidad;
      const ivaServicio = calcularIVA(subtotalServicio);
      detalles.push({
        cantidad: servicio.cantidad,
        descripcion: servicio.descripcion || servicio.nombre,
        valorUnitario: servicio.precio,
        subtotal: subtotalServicio,
        iva: ivaServicio,
        total: subtotalServicio + ivaServicio
      });
    });
  }
  
  // Calcular totales generales
  const subtotalGeneral = detalles.reduce((sum, item) => sum + item.subtotal, 0);
  const ivaGeneral = detalles.reduce((sum, item) => sum + item.iva, 0);
  const totalGeneral = subtotalGeneral + ivaGeneral;
  
  return {
    numero: numeroFactura,
    fecha: fecha.toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    fechaVencimiento: new Date(fecha.getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    empresa: EMPRESA_DATA,
    cliente,
    detalles,
    subtotal: subtotalGeneral,
    iva: ivaGeneral,
    total: totalGeneral,
    totalLetras: numeroALetras(Math.floor(totalGeneral)) + ' PESOS COLOMBIANOS M/CTE',
    metodoPago: reserva.metodoPago || 'No especificado',
    periodo: {
      inicio: fechaInicio.toLocaleDateString('es-CO'),
      fin: fechaFin.toLocaleDateString('es-CO'),
      dias: diasReserva
    },
    reservaId: reserva.id || reserva.idReserva,
    // Datos para código QR (simplificado)
    qrData: {
      nit: EMPRESA_DATA.nit,
      factura: numeroFactura,
      fecha: fecha.toISOString().split('T')[0],
      total: totalGeneral.toFixed(2),
      cliente: cliente.identificacion
    }
  };
}

/**
 * Genera código QR en formato texto (para DIAN)
 */
export function generarTextoQR(qrData) {
  return `NIT:${qrData.nit}|FAC:${qrData.factura}|FECHA:${qrData.fecha}|TOTAL:${qrData.total}|CLIENTE:${qrData.cliente}`;
}

/**
 * Formatea moneda colombiana
 */
export function formatearMoneda(valor) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(valor);
}
