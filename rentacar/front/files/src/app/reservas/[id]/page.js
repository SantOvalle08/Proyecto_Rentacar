'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/services/api';
import styles from './page.module.css';

export default function DetallesReservaCliente({ params }) {
  const router = useRouter();
  const { id } = params;
  
  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);
  
  // Cargar datos de la reserva
  const loadReserva = useCallback(async (reservaId, userId) => {
    try {
      setLoading(true);
      setError('');
      
      // Intentar obtener la reserva de la API
      try {
        const response = await apiService.reservas.getById(reservaId);
        
        if (response.success && response.data) {
          // Verificar que la reserva pertenece al usuario actual o el usuario es admin
          const reservaData = response.data;
          
          if (reservaData.usuarioId == userId || 
              reservaData.usuario?.id == userId || 
              user?.rol === 'admin') {
            setReserva(reservaData);
            setLoading(false);
            return;
          } else {
            throw new Error('No tienes permiso para ver esta reserva');
          }
        } else {
          throw new Error('No se pudo cargar la información de la reserva');
        }
      } catch (apiError) {
        console.error('Error al obtener reserva desde API:', apiError);
        
        // Intentar obtener desde localStorage
        try {
          const localData = localStorage.getItem('rentacar_reservas');
          if (localData) {
            const allReservas = JSON.parse(localData);
            const userReserva = allReservas.find(r => r.id == reservaId);
            
            if (userReserva && (userReserva.usuarioId == userId || 
                userReserva.usuario?.id == userId || 
                user?.rol === 'admin')) {
              setReserva(userReserva);
              setLoading(false);
              return;
            }
          }
        } catch (localError) {
          console.error('Error al obtener reserva desde localStorage:', localError);
        }
        
        throw new Error('No se pudo encontrar la reserva solicitada');
      }
    } catch (error) {
      console.error('Error general al cargar reserva:', error);
      setError(error.message || 'Error al cargar los datos de la reserva');
      setLoading(false);
    }
  }, [user?.rol]);

  // Verificar autenticación y cargar datos del usuario
  useEffect(() => {
    const checkAuth = () => {
      try {
        if (typeof window === 'undefined') return;
        
        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/login');
          return;
        }
        
        try {
          const parsedUser = JSON.parse(userData);
          setUser(parsedUser);
          loadReserva(id, parsedUser.id);
        } catch (error) {
          console.error('Error parsing user data:', error);
          localStorage.removeItem('user');
          localStorage.removeItem('token');
          router.push('/login');
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        router.push('/login');
      }
    };
    
    checkAuth();
  }, [id, router, loadReserva]);
  
  // Función para cancelar reserva
  const handleCancelReservation = async () => {
    if (!reserva || ['cancelada', 'completada'].includes(reserva.estado)) {
      return;
    }
    
    try {
      setLoading(true);
      
      // Intentar cancelar en la API
      try {
        const response = await apiService.reservas.cancelar(reserva.id);
        
        if (response.success) {
          setReserva({...reserva, estado: 'cancelada'});
          alert('Reserva cancelada correctamente');
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('Error al cancelar reserva en API:', apiError);
      }
      
      // Fallback: actualizar en localStorage
      try {
        const localData = localStorage.getItem('rentacar_reservas');
        if (localData) {
          const allReservas = JSON.parse(localData);
          const updatedReservas = allReservas.map(r => 
            r.id === reserva.id ? {...r, estado: 'cancelada'} : r
          );
          
          localStorage.setItem('rentacar_reservas', JSON.stringify(updatedReservas));
          setReserva({...reserva, estado: 'cancelada'});
          alert('Reserva cancelada correctamente');
        }
      } catch (localError) {
        console.error('Error al actualizar localStorage:', localError);
        throw new Error('No se pudo cancelar la reserva');
      }
    } catch (error) {
      console.error('Error general al cancelar reserva:', error);
      setError('Error al cancelar la reserva: ' + (error.message || ''));
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
          <Link href="/reservas" className={styles.backLink}>
            ← Volver a Mis Reservas
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
          <Link href="/reservas" className={styles.backLink}>
            ← Volver a Mis Reservas
          </Link>
        </div>
      </div>
    );
  }
  
  return (
    <div className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Detalles de Reserva</h1>
        <Link href="/reservas" className={styles.backLink}>
          ← Volver a Mis Reservas
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
          
          {/* Botón para cancelar reserva (solo si está activa o pendiente) */}
          {(reserva.estado === 'activa' || reserva.estado === 'pendiente') && (
            <div className={styles.cancelarContainer}>
              <button 
                className={styles.cancelarButton}
                onClick={handleCancelReservation}
                disabled={loading}
              >
                {loading ? 'Procesando...' : 'Cancelar Reserva'}
              </button>
            </div>
          )}
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
                  </div>
                )}
                
                {reserva.datosPago.fotoLicencia && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Licencia de Conducción:</span>
                    <span className={styles.documentoValue}>{reserva.datosPago.fotoLicencia}</span>
                  </div>
                )}
                
                {reserva.metodoPago === 'transferencia' && reserva.datosPago.comprobante && (
                  <div className={styles.documentoItem}>
                    <span className={styles.documentoLabel}>Comprobante de Transferencia:</span>
                    <span className={styles.documentoValue}>{reserva.datosPago.comprobante}</span>
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