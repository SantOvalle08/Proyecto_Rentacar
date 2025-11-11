'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import apiService from '@/services/api';

export default function Register() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    contraseña: '',
    confirmarContraseña: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    aceptaTerminos: false
  });
  
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [serverStatus, setServerStatus] = useState('unknown'); // 'unknown', 'online', 'offline'

  // Check if server is running when component mounts
  useEffect(() => {
    checkServerStatus();
  }, []);

  // Function to check if server is running
  const checkServerStatus = async () => {
    try {
      const response = await fetch('http://localhost:5001', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        timeout: 5000
      });
      
      if (response.ok) {
        setServerStatus('online');
        console.log('Servidor activo');
      } else {
        setServerStatus('offline');
        setServerError('El servidor parece estar fuera de línea o no responde correctamente');
      }
    } catch (error) {
      console.error('Error al verificar estado del servidor:', error);
      setServerStatus('offline');
      setServerError('Error al conectar con el servidor. Verifique que esté en ejecución en http://localhost:5001');
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Clear field-specific error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Required fields
    if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
    if (!formData.apellido.trim()) newErrors.apellido = 'El apellido es requerido';
    if (!formData.email.trim()) newErrors.email = 'El email es requerido';
    if (!formData.contraseña) newErrors.contraseña = 'La contraseña es requerida';
    if (!formData.numeroDocumento.trim()) newErrors.numeroDocumento = 'El número de documento es requerido';
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (formData.email && !emailRegex.test(formData.email)) {
      newErrors.email = 'Ingrese un email válido';
    }
    
    // Password length
    if (formData.contraseña && formData.contraseña.length < 6) {
      newErrors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
    }
    
    // Password confirmation
    if (formData.contraseña !== formData.confirmarContraseña) {
      newErrors.confirmarContraseña = 'Las contraseñas no coinciden';
    }
    
    // Phone validation (optional field)
    if (formData.telefono) {
      const phoneRegex = /^\d{10}$/;
      if (!phoneRegex.test(formData.telefono.replace(/\D/g, ''))) {
        newErrors.telefono = 'Ingrese un número de teléfono válido (10 dígitos)';
      }
    }
    
    // Terms agreement
    if (!formData.aceptaTerminos) {
      newErrors.aceptaTerminos = 'Debe aceptar los términos y condiciones';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Añadir función de prueba CORS
  const testCorsConnection = async () => {
    try {
      setLoading(true);
      setServerError('');
      setSuccess('');
      
      console.log('Probando conexión CORS...');
      
      // Usar fetch directamente con mode: 'cors' explícito
      const response = await fetch('http://localhost:5001/api/test-cors', {
        method: 'GET',
        mode: 'cors',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta CORS status:', response.status);
      
      // Handle 404 error specifically
      if (response.status === 404) {
        throw new Error('Endpoint de prueba CORS no encontrado. El servidor necesita ser reiniciado.');
      }
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data = await response.json();
      setSuccess(`Test CORS exitoso: ${data.message}`);
      console.log('Prueba CORS exitosa:', data);
      
    } catch (error) {
      console.error('Error en prueba CORS:', error);
      setServerError(`Error en prueba CORS: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Añadir función de prueba API básica
  const testApiConnection = async () => {
    try {
      setLoading(true);
      setServerError('');
      setSuccess('');
      
      console.log('Probando conexión API básica...');
      
      // Usar fetch directo con configuración más permisiva
      const response = await fetch('http://localhost:5001/api/test', {
        method: 'GET',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Respuesta API status:', response.status);
      
      if (!response.ok) {
        throw new Error(`Error en la respuesta: ${response.status}`);
      }
      
      const data = await response.json();
      setSuccess(`Test API exitoso: ${data.message}`);
      console.log('Prueba API exitosa:', data);
      
    } catch (error) {
      console.error('Error en prueba API:', error);
      setServerError(`Error en prueba API: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccess('');
    
    // Validate form
    if (!validateForm()) return;
    
    setLoading(true);
    
    try {
      // Remove confirmarContraseña and aceptaTerminos from data sent to API
      const { confirmarContraseña, aceptaTerminos, ...userData } = formData;
      
      console.log('Enviando datos de registro:', userData);
      
      // Usar fetch con configuración explícita para CORS
      const response = await fetch('http://localhost:5001/api/auth/register', {
        method: 'POST',
        mode: 'cors',
        cache: 'no-cache',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(userData)
      });
      
      console.log('Respuesta status:', response.status);
      console.log('Respuesta headers:', response.headers);
      
      // Obtener respuesta como texto primero para depuración
      const responseText = await response.text();
      console.log('Respuesta de texto:', responseText);
      
      // Intentar parsear como JSON si es posible
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('Respuesta JSON parseada:', data);
      } catch (e) {
        console.log('La respuesta no es JSON válido');
        if (responseText.includes('Usuario registrado')) {
          data = { success: true, message: 'Usuario registrado con éxito' };
        } else {
          data = { success: false, message: responseText };
        }
      }
      
      if (data.success) {
        // Show success message
        setSuccess('¡Registro exitoso! Redireccionando al login...');
        
        // Clear form
        setFormData({
          nombre: '',
          apellido: '',
          email: '',
          telefono: '',
          contraseña: '',
          confirmarContraseña: '',
          tipoDocumento: 'DNI',
          numeroDocumento: '',
          aceptaTerminos: false
        });
        
        // Redirect to login after a short delay
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      } else {
        setServerError(data.message || 'Error en el registro');
      }
      
    } catch (error) {
      console.error('Registration error:', error);
      
      // Mostrar mensaje de error específico
      if (error.message.includes('already exists') || error.message.includes('ya está registrado')) {
        setServerError('Este correo electrónico ya está registrado. Por favor utilice otro o inicie sesión.');
      } else if (error instanceof TypeError && error.message.includes('NetworkError')) {
        setServerError('Error de conexión con el servidor. Verifique que el servidor esté en ejecución y accesible. Si está usando Firefox, pruebe con otro navegador como Chrome.');
      } else {
        setServerError(error.message || 'Error al registrar usuario. Por favor intente nuevamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.registerContainer}>
        <h1 className={styles.title}>Crear Cuenta</h1>
        
        {/* Server Status Indicator */}
        <div className={styles.serverStatus}>
          <span>
            Estado del servidor: {' '}
            <span className={
              serverStatus === 'online' ? styles.statusOnline : 
              serverStatus === 'offline' ? styles.statusOffline : 
              styles.statusUnknown
            }>
              {serverStatus === 'online' ? 'Conectado' : 
               serverStatus === 'offline' ? 'Desconectado' : 
               'Verificando...'}
            </span>
          </span>
          <button 
            type="button" 
            className={styles.refreshButton}
            onClick={checkServerStatus}
            disabled={loading}
          >
            Verificar conexión
          </button>
        </div>
        
        {serverError && (
          <div className={styles.error}>{serverError}</div>
        )}
        
        {success && (
          <div className={styles.success}>{success}</div>
        )}
        
        {/* Test Buttons */}
        <div className={styles.testButtonsContainer}>
          <button
            type="button"
            className={styles.testButton}
            onClick={testCorsConnection}
            disabled={loading || serverStatus === 'offline'}
          >
            {loading ? 'Probando...' : 'Probar Conexión CORS'}
          </button>
          
          <button
            type="button"
            className={styles.testButton}
            onClick={testApiConnection}
            disabled={loading || serverStatus === 'offline'}
          >
            {loading ? 'Probando...' : 'Probar Conexión API'}
          </button>
        </div>
        
        {serverStatus === 'offline' ? (
          <div className={styles.serverOfflineMessage}>
            <p>El servidor parece estar desconectado. Por favor:</p>
            <ol>
              <li>Verifique que el servidor esté ejecutándose en <code>http://localhost:5001</code></li>
              <li>Intente reiniciar el servidor</li>
              <li>Haga clic en &ldquo;Verificar conexión&rdquo; después de reiniciar el servidor</li>
            </ol>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleChange}
                aria-invalid={!!errors.nombre}
                aria-describedby={errors.nombre ? "nombre-error" : undefined}
                placeholder="Ingrese su nombre"
              />
              {errors.nombre && (
                <span id="nombre-error" className={styles.errorText}>{errors.nombre}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                name="apellido"
                value={formData.apellido}
                onChange={handleChange}
                aria-invalid={!!errors.apellido}
                aria-describedby={errors.apellido ? "apellido-error" : undefined}
                placeholder="Ingrese su apellido"
              />
              {errors.apellido && (
                <span id="apellido-error" className={styles.errorText}>{errors.apellido}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Correo Electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
                placeholder="ejemplo@correo.com"
              />
              {errors.email && (
                <span id="email-error" className={styles.errorText}>{errors.email}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono (opcional)</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleChange}
                aria-invalid={!!errors.telefono}
                aria-describedby={errors.telefono ? "telefono-error" : undefined}
                placeholder="Ingrese su teléfono"
              />
              {errors.telefono && (
                <span id="telefono-error" className={styles.errorText}>{errors.telefono}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="tipoDocumento">Tipo de Documento</label>
              <select
                id="tipoDocumento"
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleChange}
              >
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Cédula">Cédula</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="numeroDocumento">Número de Documento</label>
              <input
                type="text"
                id="numeroDocumento"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={handleChange}
                aria-invalid={!!errors.numeroDocumento}
                aria-describedby={errors.numeroDocumento ? "numeroDocumento-error" : undefined}
                placeholder="Ingrese su número de documento"
              />
              {errors.numeroDocumento && (
                <span id="numeroDocumento-error" className={styles.errorText}>{errors.numeroDocumento}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="contraseña">Contraseña</label>
              <input
                type="password"
                id="contraseña"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleChange}
                aria-invalid={!!errors.contraseña}
                aria-describedby={errors.contraseña ? "contraseña-error" : undefined}
                placeholder="Mínimo 6 caracteres"
              />
              {errors.contraseña && (
                <span id="contraseña-error" className={styles.errorText}>{errors.contraseña}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmarContraseña">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmarContraseña"
                name="confirmarContraseña"
                value={formData.confirmarContraseña}
                onChange={handleChange}
                aria-invalid={!!errors.confirmarContraseña}
                aria-describedby={errors.confirmarContraseña ? "confirmarContraseña-error" : undefined}
                placeholder="Repita su contraseña"
              />
              {errors.confirmarContraseña && (
                <span id="confirmarContraseña-error" className={styles.errorText}>{errors.confirmarContraseña}</span>
              )}
            </div>
            
            <div className={styles.checkboxGroup}>
              <input
                type="checkbox"
                id="aceptaTerminos"
                name="aceptaTerminos"
                checked={formData.aceptaTerminos}
                onChange={handleChange}
                aria-invalid={!!errors.aceptaTerminos}
                aria-describedby={errors.aceptaTerminos ? "aceptaTerminos-error" : undefined}
              />
              <label htmlFor="aceptaTerminos">
                Acepto los <Link href="/terminos-y-condiciones">términos y condiciones</Link> y la <Link href="/politica-de-privacidad">política de privacidad</Link>
              </label>
            </div>
            {errors.aceptaTerminos && (
              <span id="aceptaTerminos-error" className={styles.errorText}>{errors.aceptaTerminos}</span>
            )}
            
            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={loading}
            >
              {loading ? 'Registrando...' : 'Crear Cuenta'}
            </button>
          </form>
        )}
        
        <div className={styles.loginLink}>
          ¿Ya tienes una cuenta? <Link href="/login">Inicia sesión aquí</Link>
        </div>
      </div>
    </div>
  );
} 