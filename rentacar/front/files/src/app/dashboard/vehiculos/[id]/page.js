'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import styles from './page.module.css';
import apiService from '@/services/api';
import Modal from '@/components/Modal';

export default function VehiculoDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vehiculoId = params.id;

  const [vehiculo, setVehiculo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [formErrors, setFormErrors] = useState({});

  // Check auth and load vehicle
  useEffect(() => {
    const checkAuthAndLoadVehiculo = async () => {
      try {
        // Check if user is admin
        if (typeof window === 'undefined') return;

        const userData = localStorage.getItem('user');
        if (!userData) {
          router.push('/login');
          return;
        }

        try {
          const parsedUser = JSON.parse(userData);
          if (!parsedUser || parsedUser.rol !== 'admin') {
            router.push('/');
            return;
          }
        } catch (err) {
          console.error('Error parsing user data:', err);
          router.push('/login');
          return;
        }

        // Load vehicle
        const response = await apiService.autos.getById(vehiculoId);
        if (response.success && response.data) {
          setVehiculo(response.data);
          setFormData(response.data);
        } else {
          setError('Vehículo no encontrado');
        }
      } catch (err) {
        console.error('Error:', err);
        setError('Error al cargar vehículo');
      } finally {
        setLoading(false);
      }
    };

    checkAuthAndLoadVehiculo();
  }, [vehiculoId, router]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.marca) errors.marca = 'La marca es requerida';
    if (!formData.modelo) errors.modelo = 'El modelo es requerido';
    if (!formData.combustible) errors.combustible = 'El combustible es requerido';
    if (!formData.transmision) errors.transmision = 'La transmisión es requerida';
    if (!formData.capacidad || formData.capacidad < 1) errors.capacidad = 'Capacidad válida requerida';

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleUpdate = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      const response = await apiService.autos.update(vehiculoId, formData);
      
      if (response.success) {
        setVehiculo(response.data || formData);
        setEditMode(false);
        setError('');
      } else {
        setError(response.error || 'Error al actualizar vehículo');
      }
    } catch (err) {
      console.error('Error updating vehiculo:', err);
      setError('Error al actualizar vehículo');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setEditMode(false);
    setFormData(vehiculo || {});
    setFormErrors({});
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este vehículo?')) return;

    try {
      setLoading(true);
      const response = await apiService.autos.delete(vehiculoId);
      
      if (response.success) {
        router.push('/dashboard/vehiculos');
      } else {
        setError(response.error || 'Error al eliminar vehículo');
      }
    } catch (err) {
      console.error('Error deleting vehiculo:', err);
      setError('Error al eliminar vehículo');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '20px' }}>Cargando...</div>;
  }

  if (!vehiculo) {
    return (
      <div style={{ padding: '20px' }}>
        <p>Vehículo no encontrado</p>
        <button onClick={() => router.push('/dashboard/vehiculos')}>
          Volver a Vehículos
        </button>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1>Detalles del Vehículo</h1>
      
      {error && <div style={{ color: 'red', marginBottom: '10px' }}>{error}</div>}

      {!editMode ? (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '10px' }}>
            <strong>Marca:</strong> {vehiculo.marca}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Modelo:</strong> {vehiculo.modelo}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Año:</strong> {vehiculo.anio || vehiculo.año}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Tipo:</strong> {vehiculo.tipo || vehiculo.tipoCoche}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Combustible:</strong> {vehiculo.combustible}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Transmisión:</strong> {vehiculo.transmision}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Capacidad:</strong> {vehiculo.capacidad} pasajeros
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Precio por día:</strong> ${vehiculo.precioBase || vehiculo.precioDia}
          </div>
          <div style={{ marginBottom: '10px' }}>
            <strong>Disponible:</strong> {vehiculo.disponible ? 'Sí' : 'No'}
          </div>

          <div style={{ marginTop: '20px', gap: '10px', display: 'flex' }}>
            <button 
              onClick={() => setEditMode(true)}
              style={{ padding: '10px 20px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Editar
            </button>
            <button 
              onClick={handleDelete}
              style={{ padding: '10px 20px', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Eliminar
            </button>
            <button 
              onClick={() => router.push('/dashboard/vehiculos')}
              style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Volver
            </button>
          </div>
        </div>
      ) : (
        <div style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px' }}>
          <div style={{ marginBottom: '15px' }}>
            <label>Marca:</label>
            <input
              type="text"
              name="marca"
              value={formData.marca || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '5px' }}
            />
            {formErrors.marca && <span style={{ color: 'red' }}>{formErrors.marca}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Modelo:</label>
            <input
              type="text"
              name="modelo"
              value={formData.modelo || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '5px' }}
            />
            {formErrors.modelo && <span style={{ color: 'red' }}>{formErrors.modelo}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Año:</label>
            <input
              type="number"
              name="anio"
              value={formData.anio || formData.año || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Tipo:</label>
            <select
              name="tipo"
              value={formData.tipo || formData.tipoCoche || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="Sedan">Sedan</option>
              <option value="SUV">SUV</option>
              <option value="Compacto">Compacto</option>
              <option value="Hatchback">Hatchback</option>
              <option value="Pickup">Pickup</option>
              <option value="Deportivo">Deportivo</option>
              <option value="Minivan">Minivan</option>
              <option value="Camioneta">Camioneta</option>
              <option value="Lujo">Lujo</option>
            </select>
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Combustible:</label>
            <select
              name="combustible"
              value={formData.combustible || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="">Selecciona...</option>
              <option value="Gasolina">Gasolina</option>
              <option value="Diesel">Diesel</option>
              <option value="Híbrido">Híbrido</option>
              <option value="Eléctrico">Eléctrico</option>
            </select>
            {formErrors.combustible && <span style={{ color: 'red' }}>{formErrors.combustible}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Transmisión:</label>
            <select
              name="transmision"
              value={formData.transmision || ''}
              onChange={handleInputChange}
              style={{ width: '100%', padding: '5px' }}
            >
              <option value="Manual">Manual</option>
              <option value="Automática">Automática</option>
            </select>
            {formErrors.transmision && <span style={{ color: 'red' }}>{formErrors.transmision}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Capacidad:</label>
            <input
              type="number"
              name="capacidad"
              value={formData.capacidad || ''}
              onChange={handleInputChange}
              min="1"
              style={{ width: '100%', padding: '5px' }}
            />
            {formErrors.capacidad && <span style={{ color: 'red' }}>{formErrors.capacidad}</span>}
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>Precio por día:</label>
            <input
              type="number"
              name="precioBase"
              value={formData.precioBase || formData.precioDia || ''}
              onChange={handleInputChange}
              step="0.01"
              style={{ width: '100%', padding: '5px' }}
            />
          </div>

          <div style={{ marginBottom: '15px' }}>
            <label>
              <input
                type="checkbox"
                name="disponible"
                checked={formData.disponible || false}
                onChange={handleInputChange}
              />
              Disponible
            </label>
          </div>

          <div style={{ marginTop: '20px', gap: '10px', display: 'flex' }}>
            <button 
              onClick={handleUpdate}
              style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              disabled={loading}
            >
              {loading ? 'Guardando...' : 'Guardar'}
            </button>
            <button 
              onClick={handleCancel}
              style={{ padding: '10px 20px', backgroundColor: '#6c757d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
