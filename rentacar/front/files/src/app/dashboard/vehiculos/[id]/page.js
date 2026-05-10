'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';
import styles from './page.module.css';

export default function VehiculoDetalle({ params }) {
  const router = useRouter();
  const { id } = params;

  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadVehiculo = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiService.autos.getById(id);

        if (response.success && response.data) {
          const data = response.data;
          setVehiculo({
            ...data,
            anio: data.anio || data.año || '—',
            tipo: data.tipo || data.tipoCoche || 'Sedan',
            precioBase: data.precioBase || data.precioDia || 0,
          });
          return;
        }

        // Fallback a localStorage
        const stored = localStorage.getItem('rentacar_autos');
        if (stored) {
          const autos = JSON.parse(stored);
          const found = autos.find(
            (a) => String(a.id) === String(id) || String(a._id) === String(id)
          );
          if (found) {
            setVehiculo({
              ...found,
              anio: found.anio || found.año || '—',
              tipo: found.tipo || found.tipoCoche || 'Sedan',
              precioBase: found.precioBase || found.precioDia || 0,
            });
            return;
          }
        }

        setError('No se encontró el vehículo.');
      } catch (err) {
        console.error('Error al cargar vehículo:', err);
        setError('Error al cargar los datos del vehículo.');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadVehiculo();
  }, [id]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <p>Cargando vehículo...</p>
      </div>
    );
  }

  if (error || !vehiculo) {
    return (
      <div className={styles.centered}>
        <p className={styles.error}>{error || 'Vehículo no encontrado.'}</p>
        <Link href="/dashboard/vehiculos" className={styles.backLink}>
          ← Volver a Vehículos
        </Link>
      </div>
    );
  }

  const imageSrc = vehiculo.imagen || '/images/autos/default-car.jpg';

  return (
    <div className="container">
      <div className={styles.header}>
        <Link href="/dashboard/vehiculos" className={styles.backLink}>
          ← Volver a Vehículos
        </Link>
        <h1 className={styles.title}>
          {vehiculo.marca} {vehiculo.modelo}
        </h1>
      </div>

      <div className={styles.card}>
        <div className={styles.imageWrapper}>
          <img
            src={imageSrc}
            alt={`${vehiculo.marca} ${vehiculo.modelo}`}
            className={styles.image}
            onError={(e) => { e.target.src = '/images/autos/default-car.jpg'; }}
          />
          <span className={vehiculo.disponible ? styles.badgeAvailable : styles.badgeUnavailable}>
            {vehiculo.disponible ? 'Disponible' : 'No disponible'}
          </span>
        </div>

        <div className={styles.details}>
          <h2 className={styles.sectionTitle}>Información del Vehículo</h2>

          <dl className={styles.grid}>
            <div className={styles.field}>
              <dt>Marca</dt>
              <dd>{vehiculo.marca}</dd>
            </div>
            <div className={styles.field}>
              <dt>Modelo</dt>
              <dd>{vehiculo.modelo}</dd>
            </div>
            <div className={styles.field}>
              <dt>Año</dt>
              <dd>{vehiculo.anio}</dd>
            </div>
            <div className={styles.field}>
              <dt>Matrícula</dt>
              <dd>{vehiculo.matricula}</dd>
            </div>
            <div className={styles.field}>
              <dt>Color</dt>
              <dd>{vehiculo.color}</dd>
            </div>
            <div className={styles.field}>
              <dt>Tipo</dt>
              <dd>{vehiculo.tipo}</dd>
            </div>
            <div className={styles.field}>
              <dt>Precio por día</dt>
              <dd className={styles.price}>${vehiculo.precioBase}</dd>
            </div>
            <div className={styles.field}>
              <dt>ID</dt>
              <dd className={styles.id}>{vehiculo._id || vehiculo.id}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <button
              className={styles.btnEdit}
              onClick={() => router.push(`/dashboard/vehiculos?edit=${vehiculo.id || vehiculo._id}`)}
            >
              Editar Vehículo
            </button>
            <Link href="/dashboard/vehiculos" className={styles.btnBack}>
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
