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
 * Devuelve el identificador estable del usuario, sin importar si la sesión
 * fue hidratada con `_id`, `id` o `idUser`. El backend acepta cualquiera
 * de los tres a través de findUsuarioByIdentifier.
 */
const resolveUserId = (user) => {
  if (!user) return null;
  return user._id ?? user.id ?? user.idUser ?? null;
};

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
      // Identificador estable: aceptamos _id, id o idUser. El backend
      // resuelve cualquiera de los tres con findUsuarioByIdentifier.
      const userId = resolveUserId(user);
      if (!userId) {
        throw new Error('No se pudo determinar el ID del usuario en sesión');
      }

      console.log('Actualizando perfil para usuario:', userId);
      console.log('Datos a enviar:', formData);

      // Usamos la capa centralizada de API en lugar de fetch directo.
      // Esto reutiliza el manejo de auth, timeouts, candidatos de host
      // y errores que ya existe para el resto de la aplicación.
      const response = await apiService.usuarios.updateProfile(userId, formData);

      if (!response || !response.success || !response.data) {
        throw new Error(response?.message || 'Error al actualizar el perfil');
      }

      // El backend siempre devuelve el usuario en su shape canónico
      // (toAuthJSON). Reemplazamos completo para no arrastrar campos
      // viejos del objeto en sesión y avisamos al Header vía storage event.
      const refreshedUser = response.data;
      localStorage.setItem('user', JSON.stringify(refreshedUser));
      setUser(refreshedUser);
      setFormData({
        nombre: refreshedUser.nombre || '',
        email: refreshedUser.email || '',
        telefono: refreshedUser.telefono || ''
      });
      window.dispatchEvent(new Event('storage'));

      setSuccess('Perfil actualizado con éxito');
      setIsEditing(false);
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