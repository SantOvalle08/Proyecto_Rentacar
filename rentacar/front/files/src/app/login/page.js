'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import apiService from '@/services/api';

export default function Login() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    contraseña: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Use the API service for authentication
      const response = await apiService.auth.login(formData);
      
      // Check response structure and extract user and token
      if (!response.data || !response.data.token) {
        throw new Error('Formato de respuesta inválido del servidor');
      }
      
      const userData = response.data.usuario;
      const token = response.data.token;
      
      // Store the token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      
      console.log('User data stored:', userData);
      
      // Trigger storage event for Header component to update
      window.dispatchEvent(new Event('storage'));
      
      // Redirect to appropriate page
      if (userData && userData.rol === 'admin') {
        router.push('/dashboard');
      } else {
        router.push('/');
      }
    } catch (error) {
      setError(error.message || 'Error al iniciar sesión');
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.loginContainer}>
        <h1 className={styles.title}>Iniciar Sesión</h1>
        
        {error && (
          <div className={styles.error}>{error}</div>
        )}
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Correo Electrónico</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="ejemplo@correo.com"
            />
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="contraseña">Contraseña</label>
            <input
              type="password"
              id="contraseña"
              name="contraseña"
              value={formData.contraseña}
              onChange={handleChange}
              required
              placeholder="Tu contraseña"
            />
          </div>
          
          <div className={styles.forgotPassword}>
            <Link href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
          </div>
          
          <button 
            type="submit" 
            className={styles.submitButton}
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
        
        <div className={styles.registerLink}>
          ¿No tienes una cuenta? <Link href="/register">Regístrate aquí</Link>
        </div>
      </div>
    </div>
  );
} 