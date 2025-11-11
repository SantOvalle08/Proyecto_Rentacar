'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import apiService from '@/services/api';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    vehiculos: 0,
    usuarios: 0,
    reservas: 0
  });

  useEffect(() => {
    // Check if localStorage is available
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      // Check if user is logged in and is admin
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        router.push('/login');
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        
        // Redirect if not admin
        if (!parsedUser || parsedUser.rol !== 'admin') {
          router.push('/');
          return;
        }
        
        // Load statistics
        loadStats();
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
    } finally {
      setLoading(false);
    }
  }, [router]);
  
  const loadStats = async () => {
    try {
      // Cargar datos desde localStorage o API
      const loadDataCount = async (service, storageKey) => {
        try {
          const response = await service.getAll();
          if (response.success && response.data) {
            return response.data.length;
          }
          return 0;
        } catch (error) {
          console.error(`Error loading ${storageKey} count:`, error);
          
          // Si falla la API, intentar obtener de localStorage
          try {
            const localData = localStorage.getItem(`rentacar_${storageKey}`);
            if (localData) {
              const parsedData = JSON.parse(localData);
              return Array.isArray(parsedData) ? parsedData.length : 0;
            }
          } catch (e) {
            console.error(`Error reading ${storageKey} from localStorage:`, e);
          }
          return 0;
        }
      };
      
      // Cargar contadores de manera paralela
      const [vehiculosCount, usuariosCount, reservasCount] = await Promise.all([
        loadDataCount(apiService.autos, 'autos'),
        loadDataCount(apiService.usuarios, 'usuarios'),
        loadDataCount(apiService.reservas, 'reservas')
      ]);
      
      setStats({
        vehiculos: vehiculosCount,
        usuarios: usuariosCount,
        reservas: reservasCount
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };
  
  // Escuchar cambios en localStorage para actualizar contadores
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const handleStorageChange = () => {
      loadStats();
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    // También crear un evento personalizado para actualizar desde otras páginas
    window.addEventListener('rentacarDataUpdate', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('rentacarDataUpdate', handleStorageChange);
    };
  }, []);

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className="container">
      <div className={styles.dashboardContainer}>
        <h1 className={styles.title}>Panel de Administración</h1>
        
        <div className={styles.welcomeMessage}>
          <p>Bienvenido, {user?.nombre || 'Administrador'}!</p>
          <p>Desde aquí puedes gestionar tu sistema de alquiler de coches.</p>
        </div>
        
        <div className={styles.statsContainer}>
          <div className={styles.statCard}>
            <h3>Vehículos</h3>
            <p className={styles.statValue}>{stats.vehiculos}</p>
            <button 
              className={styles.actionButton}
              onClick={() => router.push('/dashboard/vehiculos')}
            >
              Gestionar
            </button>
          </div>
          
          <div className={styles.statCard}>
            <h3>Usuarios</h3>
            <p className={styles.statValue}>{stats.usuarios}</p>
            <button 
              className={styles.actionButton}
              onClick={() => router.push('/dashboard/usuarios')}
            >
              Gestionar
            </button>
          </div>
          
          <div className={styles.statCard}>
            <h3>Reservas</h3>
            <p className={styles.statValue}>{stats.reservas}</p>
            <button 
              className={styles.actionButton}
              onClick={() => router.push('/dashboard/reservas')}
            >
              Gestionar
            </button>
          </div>
        </div>
        
        <div className={styles.actionContainer}>
          <h2>Acciones Rápidas</h2>
          <div className={styles.actionButtons}>
            <button 
              className={styles.primaryButton}
              onClick={() => {
                // Store a flag in sessionStorage to indicate we want to open the creation form
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('openVehiculoForm', 'true');
                }
                router.push('/dashboard/vehiculos');
              }}
            >
              Añadir Vehículo
            </button>
            
            <button 
              className={styles.secondaryButton}
              onClick={() => router.push('/dashboard/reportes')}
            >
              Ver Reportes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 