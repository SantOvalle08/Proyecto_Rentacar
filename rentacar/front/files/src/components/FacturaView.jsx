'use client';

import { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { generarFactura, generarTextoQR, formatearMoneda } from '@/utils/facturaGenerator';
import styles from './FacturaView.module.css';

/**
 * Componente para visualizar, imprimir y descargar facturas
 * Formato de facturación electrónica Colombia (DIAN)
 */
export default function FacturaView({ reserva, onClose }) {
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const facturaRef = useRef(null);
  
  // Generar datos de la factura
  const factura = generarFactura(reserva);
  const qrText = generarTextoQR(factura.qrData);

  /**
   * Imprimir solo la factura (no toda la página)
   * Oculta temporalmente el resto del contenido durante la impresión
   */
  const handleImprimir = () => {
    // Obtener todos los elementos del body excepto el overlay de la factura
    const overlay = facturaRef.current?.closest(`.${styles.overlay}`);
    if (!overlay) return;

    // Guardar el body original
    const body = document.body;
    const originalContents = body.innerHTML;
    const originalOverflow = body.style.overflow;
    
    // Durante la impresión, mostrar solo la factura
    const beforePrint = () => {
      // Ocultar todo el contenido original
      Array.from(body.children).forEach(child => {
        if (!child.contains(overlay)) {
          child.style.display = 'none';
        }
      });
      body.style.overflow = 'visible';
    };

    const afterPrint = () => {
      // Restaurar todo el contenido después de imprimir
      Array.from(body.children).forEach(child => {
        child.style.display = '';
      });
      body.style.overflow = originalOverflow;
    };

    // Escuchar eventos de impresión
    window.addEventListener('beforeprint', beforePrint);
    window.addEventListener('afterprint', afterPrint);

    // Iniciar impresión
    window.print();

    // Limpiar listeners
    setTimeout(() => {
      window.removeEventListener('beforeprint', beforePrint);
      window.removeEventListener('afterprint', afterPrint);
    }, 1000);
  };

  /**
   * Descargar como PDF (usando la funcionalidad de impresión del navegador)
   */
  const handleDescargarPDF = () => {
    setGenerandoPDF(true);
    
    // Mensaje al usuario
    alert('En el diálogo de impresión que se abrirá:\n\n1. Selecciona "Guardar como PDF" o "Microsoft Print to PDF"\n2. Haz clic en "Guardar"\n3. Elige dónde guardar el archivo');
    
    // Usar la misma estrategia de impresión
    setTimeout(() => {
      handleImprimir();
      setGenerandoPDF(false);
    }, 100);
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.container}>
        {/* Botones de acción (se ocultan al imprimir) */}
        <div className={styles.actionBar}>
          <button onClick={handleImprimir} className={styles.btnPrimary}>
            🖨️ Imprimir
          </button>
          <button onClick={handleDescargarPDF} className={styles.btnSecondary} disabled={generandoPDF}>
            📄 {generandoPDF ? 'Preparando PDF...' : 'Descargar PDF'}
          </button>
          <button onClick={onClose} className={styles.btnClose}>
            ✕ Cerrar
          </button>
        </div>

        {/* Contenido de la factura */}
        <div ref={facturaRef} className={styles.factura}>
          {/* Encabezado */}
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <h1 className={styles.empresaNombre}>{factura.empresa.razonSocial}</h1>
              <p className={styles.empresaNit}>NIT: {factura.empresa.nit}</p>
              <p className={styles.empresaInfo}>{factura.empresa.direccion}</p>
              <p className={styles.empresaInfo}>Tel: {factura.empresa.telefono}</p>
              <p className={styles.empresaInfo}>{factura.empresa.email}</p>
              <p className={styles.empresaInfo}>{factura.empresa.web}</p>
            </div>
            <div className={styles.headerRight}>
              <div className={styles.facturaNumero}>
                <h2>FACTURA DE VENTA</h2>
                <p className={styles.numeroFactura}>{factura.numero}</p>
              </div>
              <div className={styles.qrCode}>
                <QRCodeSVG 
                  value={qrText}
                  size={120}
                  level="M"
                  includeMargin={false}
                  className={styles.qrImage}
                />
                <p className={styles.qrLabel}>Código QR DIAN</p>
              </div>
            </div>
          </div>

          {/* Información DIAN */}
          <div className={styles.dianInfo}>
            <p><strong>{factura.empresa.resolucionDian}</strong></p>
            <p>Fecha resolución: {factura.empresa.fechaResolucion}</p>
            <p>Rango autorizado: {factura.empresa.rangoAutorizado}</p>
            <p>Vigencia: {factura.empresa.vigenciaResolucion}</p>
            <p>{factura.empresa.responsabilidadFiscal} - {factura.empresa.regimenFiscal}</p>
          </div>

          {/* Información de facturación */}
          <div className={styles.infoSection}>
            <div className={styles.infoGrid}>
              <div className={styles.infoColumn}>
                <h3>FECHA DE EXPEDICIÓN</h3>
                <p>{factura.fecha}</p>
                <h3 className={styles.mt1}>FECHA DE VENCIMIENTO</h3>
                <p>{factura.fechaVencimiento}</p>
              </div>
              <div className={styles.infoColumn}>
                <h3>DATOS DEL CLIENTE</h3>
                <p><strong>{factura.cliente.nombre}</strong></p>
                <p>CC/NIT: {factura.cliente.identificacion}</p>
                <p>Dirección: {factura.cliente.direccion}</p>
                <p>Tel: {factura.cliente.telefono}</p>
                <p>Email: {factura.cliente.email}</p>
              </div>
              <div className={styles.infoColumn}>
                <h3>PERÍODO DE SERVICIO</h3>
                <p>Inicio: {factura.periodo.inicio}</p>
                <p>Fin: {factura.periodo.fin}</p>
                <p>Total días: {factura.periodo.dias}</p>
                <h3 className={styles.mt1}>MÉTODO DE PAGO</h3>
                <p>{factura.metodoPago}</p>
              </div>
            </div>
          </div>

          {/* Detalle de productos/servicios */}
          <div className={styles.detalleSection}>
            <h3>DETALLE DE PRODUCTOS Y/O SERVICIOS</h3>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>CANT.</th>
                  <th>DESCRIPCIÓN</th>
                  <th>VALOR UNIT.</th>
                  <th>SUBTOTAL</th>
                  <th>IVA (19%)</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {factura.detalles.map((detalle, index) => (
                  <tr key={index}>
                    <td className={styles.textCenter}>{detalle.cantidad}</td>
                    <td>{detalle.descripcion}</td>
                    <td className={styles.textRight}>{formatearMoneda(detalle.valorUnitario)}</td>
                    <td className={styles.textRight}>{formatearMoneda(detalle.subtotal)}</td>
                    <td className={styles.textRight}>{formatearMoneda(detalle.iva)}</td>
                    <td className={styles.textRight}><strong>{formatearMoneda(detalle.total)}</strong></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className={styles.totalesSection}>
            <div className={styles.totalesGrid}>
              <div className={styles.notasColumn}>
                <h4>NOTAS:</h4>
                <p className={styles.notaTexto}>
                  El servicio de alquiler incluye seguro básico obligatorio.
                  Combustible por cuenta del cliente. Debe presentar documentos
                  originales al momento de retirar el vehículo.
                </p>
              </div>
              <div className={styles.totalesColumn}>
                <div className={styles.totalRow}>
                  <span>Subtotal:</span>
                  <span>{formatearMoneda(factura.subtotal)}</span>
                </div>
                <div className={styles.totalRow}>
                  <span>IVA (19%):</span>
                  <span>{formatearMoneda(factura.iva)}</span>
                </div>
                <div className={styles.totalRowFinal}>
                  <span><strong>TOTAL A PAGAR:</strong></span>
                  <span><strong>{formatearMoneda(factura.total)}</strong></span>
                </div>
                <div className={styles.totalLetras}>
                  <p><strong>SON:</strong> {factura.totalLetras}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Nota legal */}
          <div className={styles.notaLegal}>
            <p>
              <strong>NOTA LEGAL:</strong> Esta factura se asimila en todos sus efectos a una letra de cambio según el Art. 774 del Código de Comercio.
              Vencida sin pago, causará intereses de mora a la tasa máxima permitida por la ley.
            </p>
            <p className={styles.textSmall}>
              Resolución DIAN No. 18764000123456 del 15/01/2024. Software certificado.
              Emisor no responsable del IVA en el momento de la transacción (si aplica según régimen).
            </p>
          </div>

          {/* Firma y sello */}
          <div className={styles.firmaSection}>
            <div className={styles.firmaBox}>
              <div className={styles.firmaLinea}></div>
              <p className={styles.firmaLabel}>Firma Autorizada</p>
              <p className={styles.firmaLabel}>{factura.empresa.razonSocial}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
