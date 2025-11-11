/**
 * @module Perfil
 * @description Componente de página para la gestión del perfil de usuario
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import apiService from '@/services/api';

/**
 * Componente de página de perfil de usuario
 * @returns {JSX.Element} Componente de perfil
 */
export default function Perfil() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  /**
   * Efecto para cargar los datos del usuario al montar el componente
   */
  useEffect(() => {
    // Check if user is logged in and localStorage is available
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const userData = localStorage.getItem('user');
      
      if (!userData) {
        router.push('/login');
        return;
      }
      
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
        setFormData({
          nombre: parsedUser.nombre || '',
          email: parsedUser.email || '',
          telefono: parsedUser.telefono || ''
        });
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

  /**
   * Manejador de cambios en los campos del formulario
   * @param {Event} e - Evento de cambio
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  /**
   * Manejador de envío del formulario
   * @param {Event} e - Evento de envío
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Basic validation
    if (!formData.nombre || !formData.email) {
      setError('Nombre y email son campos requeridos');
      return;
    }
    
    try {
      // Get token from localStorage
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No hay token de autenticación');
      }

      // Ensure we have the API URL and user ID
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';
      if (!user || !user.id) {
        throw new Error('ID de usuario no encontrado');
      }

      console.log('Actualizando perfil para usuario:', user.id);
      console.log('Datos a enviar:', formData);

      // Make API call to update profile
      const response = await fetch(`${apiUrl}/api/usuarios/${user.id}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      // Log the response for debugging
      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      // Check if response is JSON
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Respuesta del servidor no válida');
      }

      const data = await response.json();
      console.log('Response data:', data);

      if (!response.ok) {
        throw new Error(data.message || 'Error al actualizar el perfil');
      }

      if (data.success) {
        // Update local storage with new data
        const updatedUser = { ...user, ...data.data };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
        
        setSuccess('Perfil actualizado con éxito');
        setIsEditing(false);
      } else {
        throw new Error(data.message || 'Error al actualizar el perfil');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error.message || 'Error al actualizar el perfil');
    }
  };

  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  return (
    <div className="container">
      <div className={styles.profileContainer}>
        <h1 className={styles.title}>Mi Perfil</h1>
        
        {error && <div className={styles.error}>{error}</div>}
        {success && <div className={styles.success}>{success}</div>}
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
              />
            </div>
            
            <div className={styles.buttonGroup}>
              <button type="submit" className={styles.saveButton}>
                Guardar Cambios
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={() => {
                  setIsEditing(false);
                  setFormData({
                    nombre: user.nombre || '',
                    email: user.email || '',
                    telefono: user.telefono || ''
                  });
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <div className={styles.profileInfo}>
            <div className={styles.profileField}>
              <span className={styles.fieldLabel}>Nombre:</span>
              <span className={styles.fieldValue}>{user.nombre}</span>
            </div>
            
            <div className={styles.profileField}>
              <span className={styles.fieldLabel}>Correo Electrónico:</span>
              <span className={styles.fieldValue}>{user.email}</span>
            </div>
            
            <div className={styles.profileField}>
              <span className={styles.fieldLabel}>Teléfono:</span>
              <span className={styles.fieldValue}>{user.telefono || 'No especificado'}</span>
            </div>
            
            <div className={styles.profileField}>
              <span className={styles.fieldLabel}>Tipo de Usuario:</span>
              <span className={styles.fieldValue}>{user.rol === 'admin' ? 'Administrador' : 'Cliente'}</span>
            </div>
            
            <button 
              className={styles.editButton}
              onClick={() => setIsEditing(true)}
            >
              Editar Perfil
            </button>
          </div>
        )}
        
        <div className={styles.linksContainer}>
          <h2>Acciones</h2>
          <div className={styles.links}>
            <Link href="/reservas" className={styles.actionLink}>
              Mis Reservas
            </Link>
            <Link href="/catalogo" className={styles.actionLink}>
              Ver Catálogo
            </Link>
            <button 
              className={styles.logoutButton}
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.dispatchEvent(new Event('storage'));
                router.push('/');
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 