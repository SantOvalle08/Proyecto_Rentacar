'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/services/api';
import styles from './page.module.css';

export default function ReservaDetalles({ params }) {
  const router = useRouter();
  const { id } = params;
  
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
          setNuevoEstado(reservaData.estado || 'pendiente');
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
    if (!reserva || !nuevoEstado || nuevoEstado === reserva.estado) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Preparar datos actualizados
      const datosActualizados = {
        ...reserva,
        estado: nuevoEstado
      };
      
      // Actualizar en la API
      const response = await apiService.reservas.update(reserva.id, datosActualizados);
      
      if (response.success) {
        // Actualizar localmente
        setReserva(datosActualizados);
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
              reserva.estado === 'activa' ? styles.estadoActiva : 
              reserva.estado === 'pendiente' ? styles.estadoPendiente :
              reserva.estado === 'completada' ? styles.estadoCompletada :
              styles.estadoCancelada
            }`}>
              {reserva.estado === 'activa' ? 'Activa' : 
               reserva.estado === 'pendiente' ? 'Pendiente' :
               reserva.estado === 'completada' ? 'Completada' : 'Cancelada'}
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
                <option value="pendiente">Pendiente</option>
                <option value="activa">Activa</option>
                <option value="completada">Completada</option>
                <option value="cancelada">Cancelada</option>
              </select>
              <button 
                className={styles.cambiarButton} 
                onClick={handleCambiarEstado}
                disabled={loading || nuevoEstado === reserva.estado}
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
                    <span className={styles.documentoValue}>{reserva.datosPago.fotoPasaporte}</span>
                    <button className={styles.viewButton}>Ver documento</button>
                  </div>
                )}
                
                {reserva.datosPago.fotoLicencia && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Licencia de Conducción:</span>
                    <span className={styles.documentoValue}>{reserva.datosPago.fotoLicencia}</span>
                    <button className={styles.viewButton}>Ver documento</button>
                  </div>
                )}
                
                {reserva.metodoPago === 'transferencia' && reserva.datosPago.comprobante && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Comprobante de Transferencia:</span>
                    <span className={styles.documentoValue}>{reserva.datosPago.comprobante}</span>
                    <button className={styles.viewButton}>Ver documento</button>
                  </div>
                )}
                
                {(!reserva.datosPago.fotoPasaporte && !reserva.datosPago.fotoLicencia) && (
                  <p className={styles.noDocumentos}>No hay documentos adjuntos disponibles</p>
                )}
              </div>
              
              <h3>Información de Pago</h3>
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