'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import apiService from '@/services/api';

export default function AutoDetalle() {
  const params = useParams();
  const router = useRouter();
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [precioTotal, setPrecioTotal] = useState(0);
  const [calculando, setCalculando] = useState(false);

  useEffect(() => {
    const fetchAutoDetalle = async () => {
      try {
        setLoading(true);
        setError('');

        const id = params?.id;
        if (!id) {
          setError('ID de vehículo no válido');
          return;
        }

        try {
          // Intentar obtener los detalles del vehículo
          const response = await apiService.autos.getById(id);
          
          if (response.success && response.data) {
            console.log('Datos del auto obtenidos:', response.data);
            setAuto(response.data);
            return;
          }
          
          throw new Error('No se pudo obtener la información del vehículo');
        } catch (error) {
          console.error('Error al obtener detalles del auto:', error);
          
          // Intentar obtener desde localStorage
          try {
            if (typeof window !== 'undefined') {
              const localData = localStorage.getItem('rentacar_autos');
              if (localData) {
                const parsedData = JSON.parse(localData);
                if (Array.isArray(parsedData)) {
                  const autoEncontrado = parsedData.find(a => a.id == id);
                  if (autoEncontrado) {
                    console.log('Auto encontrado en localStorage:', autoEncontrado);
                    setAuto(autoEncontrado);
                    return;
                  }
                }
              }
            }
          } catch (localError) {
            console.error('Error al obtener vehículo de localStorage:', localError);
          }
          
          setError('No se pudo encontrar el vehículo solicitado');
        }
      } catch (error) {
        console.error('Error general en fetchAutoDetalle:', error);
        setError('Error al cargar los detalles del vehículo');
      } finally {
        setLoading(false);
      }
    };

    fetchAutoDetalle();
  }, [params]);

  const handleFechaInicioChange = (fecha) => {
    setFechaInicio(fecha);
    // Restablecer fecha fin si la nueva fecha inicio es posterior a fecha fin
    if (fechaFin && fecha > fechaFin) {
      setFechaFin(null);
    }
    setPrecioTotal(0); // Resetear precio al cambiar fechas
  };

  const handleFechaFinChange = (fecha) => {
    setFechaFin(fecha);
    setPrecioTotal(0); // Resetear precio al cambiar fechas
  };

  const calcularPrecio = () => {
    if (!auto || !fechaInicio || !fechaFin) return;
    
    setCalculando(true);
    
    // Calcular diferencia en días
    const diffTime = Math.abs(fechaFin - fechaInicio);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Calcular precio total
    const precioBase = auto.precioBase || auto.precioDia || 0;
    const nuevoTotal = diffDays * precioBase;
    
    // Simular una llamada a API
    setTimeout(() => {
      setPrecioTotal(nuevoTotal);
      setCalculando(false);
    }, 500);
  };

  const handleReserva = () => {
    if (!auto || !fechaInicio || !fechaFin) return;
    
    const queryParams = new URLSearchParams({
      autoId: auto.id,
      fechaInicio: fechaInicio.toISOString(),
      fechaFin: fechaFin.toISOString(),
      precioTotal: precioTotal
    });
    
    router.push(`/reservas/nueva?${queryParams.toString()}`);
  };

  if (loading) {
    return (
      <div className="container">
        <div className={styles.loading}>Cargando detalles del vehículo...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/catalogo" className={styles.backButton}>
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (!auto) {
    return (
      <div className="container">
        <div className={styles.error}>
          <h2>Vehículo no encontrado</h2>
          <p>No pudimos encontrar el vehículo que estás buscando.</p>
          <Link href="/catalogo" className={styles.backButton}>
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className={styles.detalleContainer}>
        <div className={styles.imageSection}>
          <Image 
            src={
              (auto.imagen && (auto.imagen.startsWith('http') || auto.imagen.startsWith('/'))) 
                ? auto.imagen 
                : `/images/autos/${auto.marca.toLowerCase()}-${auto.modelo.toLowerCase()}.jpg`
            }
            alt={`${auto.marca} ${auto.modelo}`}
            width={600}
            height={400}
            style={{ objectFit: 'cover' }}
            className={styles.autoImage}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/autos/default-car.jpg';
            }}
            unoptimized
          />
          {!auto.disponible && (
            <div className={styles.noDisponible}>No Disponible</div>
          )}
        </div>
        
        <div className={styles.infoSection}>
          <div className={styles.autoInfo}>
            <h1 className={styles.autoTitle}>{auto.marca} {auto.modelo}</h1>
            
            <div className={styles.infoDetails}>
              <h2>Detalles del vehículo</h2>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Marca</span>
                <span className={styles.infoValue}>{auto.marca}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Modelo</span>
                <span className={styles.infoValue}>{auto.modelo}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Año</span>
                <span className={styles.infoValue}>{auto.anio || auto.año}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Tipo</span>
                <span className={styles.infoValue}>{auto.tipo || auto.tipoCoche}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Color</span>
                <span className={styles.infoValue}>{auto.color || 'No especificado'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Matrícula</span>
                <span className={styles.infoValue}>{auto.matricula || 'No especificada'}</span>
              </div>
              <div className={styles.infoRow}>
                <span className={styles.infoLabel}>Precio</span>
                <span className={styles.precioBase}>${auto.precioBase || auto.precioDia} /día</span>
              </div>
            </div>
          </div>
          
          {auto.disponible && (
            <div className={styles.reservaSection}>
              <h2>Reserva este vehículo</h2>
              
              <div className={styles.fechasContainer}>
                <div className={styles.fechaItem}>
                  <label htmlFor="fechaInicio">Fecha inicio</label>
                  <input 
                    type="date" 
                    id="fechaInicio"
                    min={new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleFechaInicioChange(e.target.valueAsDate)}
                    className={styles.fechaInput}
                  />
                </div>
                
                <div className={styles.fechaItem}>
                  <label htmlFor="fechaFin">Fecha final</label>
                  <input 
                    type="date" 
                    id="fechaFin"
                    min={fechaInicio ? new Date(fechaInicio.getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                    onChange={(e) => handleFechaFinChange(e.target.valueAsDate)}
                    disabled={!fechaInicio}
                    className={styles.fechaInput}
                  />
                </div>
              </div>
              
              <div className={styles.precioCalculadora}>
                <button 
                  onClick={calcularPrecio} 
                  disabled={!fechaInicio || !fechaFin || calculando}
                  className={styles.calcularButton}
                >
                  {calculando ? 'Calculando...' : 'Calcular precio'}
                </button>
                
                <div className={styles.precioTotal}>
                  <span className={styles.precioLabel}>Precio total:</span>
                  <span className={styles.precioValue}>
                    {precioTotal > 0 ? `$${precioTotal.toFixed(2)}` : '-'}
                  </span>
                </div>
              </div>
              
              <div className={styles.actionButtons}>
                <button 
                  onClick={handleReserva} 
                  disabled={!fechaInicio || !fechaFin || precioTotal <= 0}
                  className={styles.reservarButton}
                >
                  Reservar ahora
                </button>
                
                <Link href="/catalogo" className={styles.volverButton}>
                  Volver al catálogo
                </Link>
              </div>
            </div>
          )}
          
          {!auto.disponible && (
            <div className={styles.noDisponibleMessage}>
              <p>Este vehículo no está disponible actualmente para reserva.</p>
              <Link href="/catalogo" className={styles.volverButton}>
                Volver al catálogo
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 