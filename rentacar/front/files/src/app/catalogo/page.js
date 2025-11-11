'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './page.module.css';
import apiService from '@/services/api';

// Mock data for development (will be used as fallback if API fails)
const mockAutos = [
  {
    id: 1,
    marca: 'Toyota',
    modelo: 'Corolla',
    anio: 2023,
    tipo: 'Sedan',
    disponible: true,
    precioBase: 50,
    imagen: 'https://via.placeholder.com/300'
  },
  {
    id: 2,
    marca: 'Honda',
    modelo: 'Civic',
    anio: 2022,
    tipo: 'Sedan',
    disponible: true,
    precioBase: 45,
    imagen: 'https://via.placeholder.com/300'
  },
  {
    id: 3,
    marca: 'Ford',
    modelo: 'Explorer',
    anio: 2023,
    tipo: 'SUV',
    disponible: true,
    precioBase: 75,
    imagen: 'https://via.placeholder.com/300'
  },
  {
    id: 4,
    marca: 'Chevrolet',
    modelo: 'Spark',
    anio: 2021,
    tipo: 'Compacto',
    disponible: true,
    precioBase: 35,
    imagen: 'https://via.placeholder.com/300'
  },
  {
    id: 5,
    marca: 'BMW',
    modelo: 'X5',
    anio: 2023,
    tipo: 'SUV',
    disponible: true,
    precioBase: 120,
    imagen: 'https://via.placeholder.com/300'
  },
  {
    id: 6,
    marca: 'Mercedes-Benz',
    modelo: 'CLA',
    anio: 2022,
    tipo: 'Sedan',
    disponible: true,
    precioBase: 100,
    imagen: 'https://via.placeholder.com/300'
  }
];

export default function Catalogo() {
  const [autos, setAutos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filtro, setFiltro] = useState({
    marca: '',
    modelo: '',
    tipo: '',
    soloDisponibles: false
  });

  // Función para cargar datos
  const fetchAutos = async () => {
    try {
      setLoading(true);
      setError('');
      
      try {
        // Intenta obtener datos de la API
        const response = await apiService.autos.getAll();
        
        if (response.success && response.data) {
          console.log('Datos del catálogo actualizados desde API:', response.data);
          setAutos(response.data);
          return;
        }
      } catch (error) {
        console.error('Error fetching autos from API:', error);
        // Si hay error, continuamos para usar datos de localStorage o mock
      }
      
      // Intenta obtener datos de localStorage
      try {
        if (typeof window !== 'undefined') {
          const localData = localStorage.getItem('rentacar_autos');
          if (localData) {
            const parsedData = JSON.parse(localData);
            if (Array.isArray(parsedData) && parsedData.length > 0) {
              console.log('Datos del catálogo actualizados desde localStorage:', parsedData);
              setAutos(parsedData);
              return;
            }
          }
        }
      } catch (error) {
        console.error('Error getting autos from localStorage:', error);
      }
      
      // Si no se pudieron obtener datos de la API ni localStorage, usar mock data
      console.log('Usando datos mock para el catálogo');
      setAutos(mockAutos);
    } catch (error) {
      console.error('Error general en fetchAutos:', error);
      setError('Error al cargar el catálogo de vehículos');
    } finally {
      setLoading(false);
    }
  };
  
  // Cargar datos al montar el componente
  useEffect(() => {
    fetchAutos();
  }, []);
  
  // Escuchar cambios en localStorage o eventos personalizados
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleDataChange = () => {
      console.log('Evento de cambio de datos detectado, actualizando catálogo');
      fetchAutos();
    };
    
    // Escuchar eventos de almacenamiento
    window.addEventListener('storage', handleDataChange);
    
    // Escuchar evento personalizado para actualizaciones
    window.addEventListener('rentacarDataUpdate', handleDataChange);
    
    return () => {
      window.removeEventListener('storage', handleDataChange);
      window.removeEventListener('rentacarDataUpdate', handleDataChange);
    };
  }, []);

  const handleFilterChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFiltro({ 
      ...filtro, 
      [name]: type === 'checkbox' ? checked : value 
    });
  };

  const filteredAutos = autos.filter(auto => {
    const { marca, modelo, tipo, soloDisponibles } = filtro;
    
    // Si soloDisponibles está activo y el auto no está disponible, filtrarlo
    if (soloDisponibles && !auto.disponible) {
      return false;
    }
    
    return (
      auto.marca.toLowerCase().includes(marca.toLowerCase()) &&
      auto.modelo.toLowerCase().includes(modelo.toLowerCase()) &&
      (tipo === '' || auto.tipo === tipo)
    );
  });

  return (
    <div className="container">
      <h1 className={styles.title}>Catálogo de Vehículos</h1>
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      {/* Filter section */}
      <div className={styles.filters}>
        <div className={styles.filterItem}>
          <label htmlFor="marca">Marca:</label>
          <input
            type="text"
            id="marca"
            name="marca"
            value={filtro.marca}
            onChange={handleFilterChange}
            placeholder="Ej. Toyota"
          />
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="modelo">Modelo:</label>
          <input
            type="text"
            id="modelo"
            name="modelo"
            value={filtro.modelo}
            onChange={handleFilterChange}
            placeholder="Ej. Corolla"
          />
        </div>
        
        <div className={styles.filterItem}>
          <label htmlFor="tipo">Tipo:</label>
          <select
            id="tipo"
            name="tipo"
            value={filtro.tipo}
            onChange={handleFilterChange}
          >
            <option value="">Todos</option>
            <option value="Compacto">Compacto</option>
            <option value="Sedan">Sedan</option>
            <option value="SUV">SUV</option>
            <option value="Deportivo">Deportivo</option>
            <option value="Pickup">Pickup</option>
            <option value="Minivan">Minivan</option>
          </select>
        </div>
        
        <div className={styles.filterCheckbox}>
          <input
            type="checkbox"
            id="soloDisponibles"
            name="soloDisponibles"
            checked={filtro.soloDisponibles}
            onChange={handleFilterChange}
          />
          <label htmlFor="soloDisponibles">Mostrar solo autos disponibles</label>
        </div>
      </div>
      
      {/* Cars grid */}
      {loading ? (
        <div className={styles.loading}>Cargando vehículos...</div>
      ) : (
        <div className={styles.autosGrid}>
          {filteredAutos.length > 0 ? (
            filteredAutos.map(auto => (
              <div key={auto.id} className={styles.autoCard}>
                <div className={styles.autoImage}>
                  <Image 
                    src={
                      (auto.imagen && (auto.imagen.startsWith('http') || auto.imagen.startsWith('/'))) 
                        ? auto.imagen 
                        : `/images/autos/${auto.marca.toLowerCase()}-${auto.modelo.toLowerCase()}.jpg`
                    } 
                    alt={`${auto.marca} ${auto.modelo}`}
                    width={300}
                    height={200}
                    style={{ objectFit: 'cover' }}
                    onError={(e) => {
                      console.log(`Error al cargar imagen para: ${auto.marca} ${auto.modelo}, usando imagen de fallback`);
                      e.target.onerror = null; // Prevenir loop infinito
                      // Intentar con la imagen específica primero
                      const localImage = `/images/autos/${auto.marca.toLowerCase()}-${auto.modelo.toLowerCase()}.jpg`;
                      // Verificar si la imagen ya es la local (para evitar ciclos)
                      if (e.target.src.includes(localImage)) {
                        e.target.src = '/images/autos/default-car.jpg';
                      } else {
                        e.target.src = localImage;
                      }
                    }}
                    unoptimized
                  />
                  {!auto.disponible && (
                    <div className={styles.noDisponible}>No Disponible</div>
                  )}
                </div>
                <div className={styles.autoInfo}>
                  <h3>{auto.marca} {auto.modelo}</h3>
                  <p className={styles.autoYear}>Año: {auto.anio}</p>
                  <p className={styles.autoType}>Tipo: {auto.tipo}</p>
                  <p className={styles.autoPrice}>${auto.precioBase} / día</p>
                  <div className={styles.autoActions}>
                    <Link 
                      href={`/autos/${auto.id}`} 
                      className={styles.btnDetails}
                    >
                      Ver Detalles
                    </Link>
                    {auto.disponible && (
                      <Link 
                        href={`/reservas/nueva?autoId=${auto.id}`} 
                        className={styles.btnReserve}
                      >
                        Reservar
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.noResults}>
              No se encontraron vehículos con los filtros seleccionados.
            </div>
          )}
        </div>
      )}
    </div>
  );
} 