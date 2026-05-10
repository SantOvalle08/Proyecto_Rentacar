'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/services/api';
import styles from './page.module.css';

const normalizeEstado = (estado = '') => {
  const map = {
    pendiente: 'Pendiente',
    activa: 'Confirmada',
    confirmada: 'Confirmada',
    completada: 'Completada',
    cancelada: 'Cancelada'
  };
  return map[String(estado).toLowerCase()] || estado;
};

const estadoLabel = (estado = '') => {
  const normalized = normalizeEstado(estado);
  const map = {
    Pendiente: 'Pendiente',
    Confirmada: 'Activa',
    Completada: 'Completada',
    Cancelada: 'Cancelada'
  };
  return map[normalized] || normalized;
};

export default function ReservaDetalles() {
  const router = useRouter();
  const params = useParams();
  const id = Array.isArray(params?.id) ? params.id[0] : params?.id;
  
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nuevoEstado, setNuevoEstado] = useState('');
  
  // Cargar datos de la reserva
  useEffect(() => {
    const loadReserva = async () => {
      try {
        setLoading(true);
        setError('');
        
        const response = await apiService.reservas.getById(id);
        
        if (response.success && response.data) {
          // Asegurar que los datos del auto estén completos
          const reservaData = response.data;
          
          // Si falta la placa o el tipo, intentar completarlos
          if (reservaData.auto) {
            if (!reservaData.auto.placa) {
              reservaData.auto.placa = 'Sin placa';
            }
            
            if (!reservaData.auto.tipo) {
              reservaData.auto.tipo = reservaData.auto.tipoCoche || 'Automóvil';
            }
          }
          
          setReserva(reservaData);
          setNuevoEstado(normalizeEstado(reservaData.estado || 'Pendiente'));
        } else {
          throw new Error('No se pudo cargar la información de la reserva');
        }
      } catch (error) {
        console.error('Error al cargar la reserva:', error);
        setError('Error al cargar los datos de la reserva. ' + (error.message || ''));
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      loadReserva();
    }
  }, [id]);
  
  // Cambiar el estado de la reserva
  const handleCambiarEstado = async () => {
    if (!reserva || !nuevoEstado || normalizeEstado(nuevoEstado) === normalizeEstado(reserva.estado)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Actualizar estado en la API (fuente de verdad: base de datos)
      const response = await apiService.reservas.actualizarEstadoAdmin(reserva.id, normalizeEstado(nuevoEstado));
      
      if (response.success) {
        // Actualizar localmente
        setReserva(prev => ({ ...prev, estado: normalizeEstado(nuevoEstado) }));
        alert('Estado de la reserva actualizado correctamente');
      } else {
        throw new Error('No se pudo actualizar el estado de la reserva');
      }
    } catch (error) {
      console.error('Error al actualizar el estado:', error);
      setError('Error al actualizar el estado de la reserva. ' + (error.message || ''));
    } finally {
      setLoading(false);
    }
  };
  
  // Función para formatear fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    });
  };

  const getDocumentUrl = (value) => {
    if (!value || typeof value !== 'string') return null;
    if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/') || value.startsWith('data:')) {
      return value;
    }
    return null;
  };

  const getDocumentLabel = (value) => {
    if (!value || typeof value !== 'string') return 'No disponible';
    if (value.startsWith('data:')) return 'Documento adjunto';
    return value;
  };

  const openDocument = async (value) => {
    if (!value || typeof value !== 'string') return;

    let urlToOpen = value;

    if (value.startsWith('data:')) {
      try {
        const response = await fetch(value);
        const blob = await response.blob();
        urlToOpen = URL.createObjectURL(blob);
      } catch (error) {
        console.error('Error al preparar el documento para visualización:', error);
        return;
      }
    }

    window.open(urlToOpen, '_blank', 'noopener,noreferrer');
  };
  
  if (loading) {
    return (
      <div className="container">
        <div className={styles.loading}>Cargando detalles de la reserva...</div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="container">
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/dashboard/reservas" className={styles.backLink}>
            ← Volver a Reservas
          </Link>
        </div>
      </div>
    );
  }
  
  if (!reserva) {
    return (
      <div className="container">
        <div className={styles.notFound}>
          <h2>Reserva no encontrada</h2>
          <p>No se pudo encontrar la reserva con ID: {id}</p>
          <Link href="/dashboard/reservas" className={styles.backLink}>
            ← Volver a Reservas
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Detalles de Reserva</h1>
        <Link href="/dashboard/reservas" className={styles.backLink}>
          ← Volver a Reservas
        </Link>
      </div>
      
      <div className={styles.reservaDetallesContainer}>
        {/* Información general de la reserva */}
        <div className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Información General</h2>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>ID de Reserva:</span>
            <span className={styles.detailValue}>{reserva.id}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Estado:</span>
            <span className={`${styles.detailValue} ${
              normalizeEstado(reserva.estado) === 'Confirmada' ? styles.estadoActiva : 
              normalizeEstado(reserva.estado) === 'Pendiente' ? styles.estadoPendiente :
              normalizeEstado(reserva.estado) === 'Completada' ? styles.estadoCompletada :
              styles.estadoCancelada
            }`}>
              {estadoLabel(reserva.estado)}
            </span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Fecha de Creación:</span>
            <span className={styles.detailValue}>{formatDate(reserva.fechaCreacion)}</span>
          </div>
          
          <div className={styles.detailItem}>
            <span className={styles.detailLabel}>Método de Pago:</span>
            <span className={styles.detailValue}>
              {reserva.metodoPago === 'mercadopago' ? 'Mercado Pago' : 
               reserva.metodoPago === 'tarjeta' ? 'Tarjeta de Crédito/Débito' :
               reserva.metodoPago === 'transferencia' ? 'Transferencia Bancaria' : 'Efectivo'}
            </span>
          </div>
          
          <div className={styles.cambiarEstadoContainer}>
            <h3>Cambiar Estado</h3>
            <div className={styles.cambiarEstadoForm}>
              <select 
                className={styles.estadoSelect} 
                value={nuevoEstado}
                onChange={(e) => setNuevoEstado(e.target.value)}
              >
                <option value="Pendiente">Pendiente</option>
                <option value="Confirmada">Activa</option>
                <option value="Completada">Completada</option>
                <option value="Cancelada">Cancelada</option>
              </select>
              <button 
                className={styles.cambiarButton} 
                onClick={handleCambiarEstado}
                disabled={loading || normalizeEstado(nuevoEstado) === normalizeEstado(reserva.estado)}
              >
                Actualizar Estado
              </button>
            </div>
          </div>
        </div>
        
        {/* Información del vehículo */}
        <div className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Vehículo</h2>
          
          {reserva.auto && (
            <div className={styles.vehiculoContainer}>
              <div className={styles.vehiculoImage}>
                {reserva.auto.imagen ? (
                  <Image 
                    src={reserva.auto.imagen}
                    alt={`${reserva.auto.marca} ${reserva.auto.modelo}`}
                    width={300}
                    height={200}
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/autos/default-car.jpg';
                    }}
                    unoptimized
                  />
                ) : (
                  <div className={styles.noImage}>Sin imagen</div>
                )}
              </div>
              
              <div className={styles.vehiculoDetails}>
                <h3>{reserva.auto.marca} {reserva.auto.modelo}</h3>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Año:</span>
                  <span className={styles.detailValue}>{reserva.auto.anio || reserva.auto.año || 'No disponible'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Placa:</span>
                  <span className={styles.detailValue}>{reserva.auto.placa || reserva.auto.matricula || 'Sin placa'}</span>
                </div>
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Tipo:</span>
                  <span className={styles.detailValue}>{reserva.auto.tipo || reserva.auto.tipoCoche || 'Automóvil'}</span>
                </div>
              </div>
            </div>
          )}
          
          <div className={styles.fechasReserva}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fecha de Inicio:</span>
              <span className={styles.detailValue}>{formatDate(reserva.fechaInicio)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Fecha de Fin:</span>
              <span className={styles.detailValue}>{formatDate(reserva.fechaFin)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Días de Alquiler:</span>
              <span className={styles.detailValue}>{reserva.diasReserva || '-'}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Precio Total:</span>
              <span className={styles.detailValue}>${reserva.precioTotal}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Anticipo:</span>
              <span className={styles.detailValue}>${Number(reserva.montoAnticipo ?? reserva.precioTotal * 0.3).toFixed(2)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Saldo Pendiente:</span>
              <span className={styles.detailValue}>${Number(reserva.saldoPendiente ?? reserva.precioTotal * 0.7).toFixed(2)}</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Estado del Pago:</span>
              <span className={styles.detailValue}>{reserva.estadoPago || 'Anticipo pendiente'}</span>
            </div>
          </div>
        </div>
        
        {/* Información del cliente */}
        <div className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Cliente</h2>
          
          {reserva.usuario && (
            <div className={styles.clienteContainer}>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Nombre:</span>
                <span className={styles.detailValue}>{reserva.usuario.nombre} {reserva.usuario.apellido}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Email:</span>
                <span className={styles.detailValue}>{reserva.usuario.email}</span>
              </div>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>ID de Usuario:</span>
                <span className={styles.detailValue}>{reserva.usuarioId || reserva.usuario.id}</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Documentos adjuntos */}
        <div className={styles.infoSection}>
          <h2 className={styles.sectionTitle}>Documentos Adjuntos</h2>
          
          {reserva.datosPago && (
            <div className={styles.documentosContainer}>
              <h3>Documentos de Identidad y Conducción</h3>
              <div className={styles.documentosList}>
                {reserva.datosPago.fotoPasaporte && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Pasaporte:</span>
                    <span className={styles.documentoValue}>{getDocumentLabel(reserva.datosPago.fotoPasaporte)}</span>
                    {getDocumentUrl(reserva.datosPago.fotoPasaporte) ? (
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDocument(reserva.datosPago.fotoPasaporte)}
                      >
                        Ver documento
                      </button>
                    ) : null}
                  </div>
                )}
                
                {reserva.datosPago.fotoLicencia && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Licencia de Conducción:</span>
                    <span className={styles.documentoValue}>{getDocumentLabel(reserva.datosPago.fotoLicencia)}</span>
                    {getDocumentUrl(reserva.datosPago.fotoLicencia) ? (
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDocument(reserva.datosPago.fotoLicencia)}
                      >
                        Ver documento
                      </button>
                    ) : null}
                  </div>
                )}
                
                {reserva.metodoPago === 'transferencia' && reserva.datosPago.comprobante && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Comprobante de Transferencia:</span>
                    <span className={styles.documentoValue}>{getDocumentLabel(reserva.datosPago.comprobante)}</span>
                    {getDocumentUrl(reserva.datosPago.comprobante) ? (
                      <button
                        type="button"
                        className={styles.viewButton}
                        onClick={() => openDocument(reserva.datosPago.comprobante)}
                      >
                        Ver documento
                      </button>
                    ) : null}
                  </div>
                )}
                
                {(!reserva.datosPago.fotoPasaporte && !reserva.datosPago.fotoLicencia) && (
                  <p className={styles.noDocumentos}>No hay documentos adjuntos disponibles</p>
                )}
              </div>
              
              <h3>Información de Pago</h3>
              <div className={styles.detailItem}>
                <span className={styles.detailLabel}>Pasarela:</span>
                <span className={styles.detailValue}>{reserva.pasarelaPago || 'Pasarela ficticia'}</span>
              </div>
              {reserva.metodoPago === 'tarjeta' && (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Tipo de Tarjeta:</span>
                    <span className={styles.detailValue}>{reserva.datosPago.tipoTarjeta || 'No disponible'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Últimos 4 dígitos:</span>
                    <span className={styles.detailValue}>{reserva.datosPago.ultimosDigitos || 'No disponible'}</span>
                  </div>
                </>
              )}
              
              {reserva.metodoPago === 'mercadopago' && (
                <div className={styles.detailItem}>
                  <span className={styles.detailLabel}>Email de Mercado Pago:</span>
                  <span className={styles.detailValue}>{reserva.datosPago.email || 'No disponible'}</span>
                </div>
              )}
              
              {reserva.metodoPago === 'transferencia' && (
                <>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Nombre del Titular:</span>
                    <span className={styles.detailValue}>{reserva.datosPago.nombreTitular || 'No disponible'}</span>
                  </div>
                  <div className={styles.detailItem}>
                    <span className={styles.detailLabel}>Email de Confirmación:</span>
                    <span className={styles.detailValue}>{reserva.datosPago.emailConfirmacion || 'No disponible'}</span>
                  </div>
                </>
              )}
              
              {reserva.metodoPago === 'efectivo' && (
                <p>Pago en efectivo al retirar el vehículo.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 