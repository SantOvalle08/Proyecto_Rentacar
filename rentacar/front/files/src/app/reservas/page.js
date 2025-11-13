'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import apiService from '@/services/api';
import FacturaView from '@/components/FacturaView';
import styles from './page.module.css';

export default function Reservas() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reservaFactura, setReservaFactura] = useState(null);

  useEffect(() => {
    // Check if localStorage is available
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Check if user is logged in
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        router.push('/login');
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Cargar las reservas del usuario
        loadUserReservas(parsedUser.id);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error);
      router.push('/login');
      setLoading(false);
    }
  }, [router]);
  
  // Función para cargar las reservas del usuario
  const loadUserReservas = async (userId) => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Intentar obtener las reservas desde la API
        const response = await apiService.reservas.getUserReservas(userId);
        
        if (response.success && response.data) {
          setReservas(response.data);
          setLoading(false);
          return;
        }
      } catch (apiError) {
        console.error('Error al obtener reservas desde la API:', apiError);
      }
      
      // Fallback: Intentar obtener de localStorage
      try {
        const localData = localStorage.getItem('rentacar_reservas');
        if (localData) {
          const allReservas = JSON.parse(localData);
          // Filtrar solo las reservas del usuario actual
          const userReservas = allReservas.filter(r => r.usuarioId == userId || (r.usuario && r.usuario.id == userId));
          
          if (userReservas.length > 0) {
            setReservas(userReservas);
            setLoading(false);
            return;
          }
        }
      } catch (localError) {
        console.error('Error al obtener reservas desde localStorage:', localError);
      }
      
      // Si llegamos aquí, no hay reservas
      setReservas([]);
      setLoading(false);
    } catch (error) {
      console.error('Error general al cargar reservas:', error);
      setError('Error al cargar tus reservas. Por favor, intenta de nuevo más tarde.');
      setLoading(false);
    }
  };

  const handleCancelReservation = async (reservaId) => {
    try {
      // Llamar a la API para cancelar la reserva
      const response = await apiService.reservas.cancelar(reservaId);
      
      if (response.success) {
        // Actualizar el estado local
        setReservas(prevReservas => 
          prevReservas.map(r => 
            r.id === reservaId ? { ...r, estado: 'cancelada' } : r
          )
        );
      } else {
        throw new Error('No se pudo cancelar la reserva');
      }
    } catch (error) {
      console.error('Error al cancelar la reserva:', error);
      
      // Fallback: actualizar el UI de todas formas
      setReservas(prevReservas => 
        prevReservas.map(r => 
          r.id === reservaId ? { ...r, estado: 'cancelada' } : r
        )
      );
      
      setError('Error al comunicarse con el servidor. La reserva fue cancelada localmente.');
    }
  };

  // Formato para fechas
  const formatDate = (dateString) => {
    if (!dateString) return 'No disponible';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return <div className={styles.loading}>Cargando reservas...</div>;
  }

  return (
    <div className="container">
      <div className={styles.reservasContainer}>
        <h1 className={styles.title}>Mis Reservas</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        
        {reservas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No tienes reservas activas.</p>
            <Link href="/catalogo" className={styles.primaryButton}>
              Explorar Vehículos
            </Link>
          </div>
        ) : (
          <div className={styles.reservasList}>
            {reservas.map(reserva => (
              <div key={reserva.id} className={styles.reservaCard}>
                <div className={styles.carInfo}>
                  <div className={styles.carImageContainer}>
                    <Image 
                      src={reserva.auto?.imagen || '/images/autos/default-car.jpg'} 
                      alt={`${reserva.auto?.marca} ${reserva.auto?.modelo}`}
                      width={120}
                      height={80}
                      style={{ objectFit: 'cover' }}
                      className={styles.carImage}
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/autos/default-car.jpg';
                      }}
                      unoptimized
                    />
                  </div>
                  <div className={styles.carDetails}>
                    <h3>{reserva.auto?.marca} {reserva.auto?.modelo}</h3>
                    <p className={styles.carYear}>{reserva.auto?.anio || reserva.auto?.año}</p>
                  </div>
                </div>
                
                <div className={styles.reservaDetails}>
                  <div className={styles.dateRange}>
                    <span className={styles.label}>Inicio:</span>
                    <span className={styles.date}>{formatDate(reserva.fechaInicio)}</span>
                  </div>
                  <div className={styles.dateRange}>
                    <span className={styles.label}>Fin:</span>
                    <span className={styles.date}>{formatDate(reserva.fechaFin)}</span>
                  </div>
                  
                  <div className={styles.priceInfo}>
                    <span className={styles.label}>Precio Total:</span>
                    <span className={styles.price}>${reserva.precioTotal}</span>
                  </div>
                  
                  <div className={styles.status}>
                    <span className={styles.label}>Estado:</span>
                    <span className={`${styles.statusBadge} ${styles[reserva.estado]}`}>
                      {reserva.estado === 'activa' ? 'Activa' : 
                       reserva.estado === 'completada' ? 'Completada' : 
                       reserva.estado === 'cancelada' ? 'Cancelada' : 'Pendiente'}
                    </span>
                  </div>
                </div>
                
                <div className={styles.actions}>
                  <Link href={`/reservas/${reserva.id}`} className={styles.viewButton}>
                    Ver Detalles
                  </Link>
                  
                  {reserva.estado !== 'cancelada' && (
                    <button 
                      className={styles.facturaButton}
                      onClick={() => setReservaFactura(reserva)}
                      title="Ver factura"
                    >
                      📄 Factura
                    </button>
                  )}
                  
                  {(reserva.estado === 'activa' || reserva.estado === 'pendiente') && (
                    <button 
                      className={styles.cancelButton}
                      onClick={() => handleCancelReservation(reserva.id)}
                    >
                      Cancelar Reserva
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className={styles.linkContainer}>
          <Link href="/catalogo" className={styles.backLink}>
            Volver al Catálogo
          </Link>
        </div>
      </div>

      {/* Modal de factura */}
      {reservaFactura && (
        <FacturaView 
          reserva={reservaFactura} 
          onClose={() => setReservaFactura(null)} 
        />
      )}
    </div>
  );
} 