'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  
  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsLoggedIn(!!token);
    
    // Listen for auth changes
    const handleStorageChange = () => {
      const token = localStorage.getItem('token');
      setIsLoggedIn(!!token);
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <main className={styles.main}>
      <div className={styles.hero}>
        <h1 className={styles.title}>RentaCar</h1>
        <p className={styles.description}>
          Tu plataforma de confianza para rentar autos en cualquier momento, en cualquier lugar.
          Encuentra el vehículo perfecto para tus necesidades con nuestro amplio catálogo.
        </p>
        <div className={styles.buttons}>
          {!isLoggedIn ? (
            <>
              <Link href="/login" className={styles.button}>
                Iniciar Sesión
              </Link>
              <Link href="/register" className={styles.button}>
                Registrarse
              </Link>
            </>
          ) : (
            <Link href="/reservas" className={styles.button}>
              Mis Reservas
            </Link>
          )}
          <Link href="/catalogo" className={styles.button}>
            Ver Catálogo
          </Link>
        </div>
      </div>

      <div className={styles.features}>
        <div className={styles.feature}>
          <h2>Amplio Catálogo</h2>
          <p>Encuentra vehículos de todas las categorías: económicos, SUVs, de lujo y más.</p>
        </div>
        <div className={styles.feature}>
          <h2>Precios Competitivos</h2>
          <p>Tarifas accesibles con descuentos por duración y promociones especiales.</p>
        </div>
        <div className={styles.feature}>
          <h2>Reservas Sencillas</h2>
          <p>Proceso de reserva rápido y sin complicaciones, con confirmación inmediata.</p>
        </div>
      </div>
    </main>
  );
}
