'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import ChecklistVehiculo from '@/components/ChecklistVehiculo';
import apiService from '@/services/api';
import styles from './page.module.css';
import ImageUploader from '@/components/ImageUploader';

export default function VehiculosPage() {
  const router = useRouter();
  
  // State declarations
  const [vehiculos, setVehiculos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [checklistModalOpen, setChecklistModalOpen] = useState(false);
  const [currentVehiculo, setCurrentVehiculo] = useState(null);
  const [vehiculoChecklist, setVehiculoChecklist] = useState(null);
  const [formData, setFormData] = useState({
    marca: '',
    modelo: '',
    anio: '',
    matricula: '',
    color: '',
    tipo: 'Sedan',
    precioBase: '',
    combustible: '',
    transmision: 'Automática',
    capacidad: '',
    disponible: true,
    imagen: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [vehiculoToDelete, setVehiculoToDelete] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Standalone utility functions that don't depend on other memoized functions
  const notifyDataChange = useCallback(() => {
    if (typeof window !== 'undefined') {
      console.log('Notificando cambios en vehiculos a otros componentes');

      const customEvent = new CustomEvent('rentacarDataUpdate', {
        detail: { type: 'vehiculos', timestamp: Date.now() }
      });
      window.dispatchEvent(customEvent);

      localStorage.setItem('rentacar_data_updated', Date.now().toString());
      window.dispatchEvent(new Event('storage'));

      localStorage.setItem('rentacar_catalogo_updated', Date.now().toString());

      if (process.env.NODE_ENV === 'development') {
        console.log('Eventos de actualizacion disparados para sincronizar componentes');
      }
    }
  }, []);

  const saveVehiculosToLocalStorage = useCallback((data) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem('rentacar_autos', JSON.stringify(data));
      }
    } catch (error) {
      console.error('Error saving vehiculos to localStorage:', error);
    }
  }, []);

  // Form-related functions
  const resetForm = useCallback(() => {
    setCurrentVehiculo(null);
    setFormData({
      marca: '',
      modelo: '',
      anio: '',
      matricula: '',
      color: '',
      tipo: 'Sedan',
      precioBase: '',
      combustible: '',
      transmision: 'Automatica',
      capacidad: '',
      disponible: true,
      imagen: ''
    });
    setFormErrors({});
  }, []);

  const handleInputChange = useCallback((e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'imagen' && e.target.file) {
      handleImageUpload(e.target.file, value);
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));

    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);

  const handleImageUpload = async (file, localPath) => {
    if (!file) {
      setFormData(prev => ({
        ...prev,
        imagen: localPath
      }));
      return;
    }

    try {
      setUploadingImage(true);

      const response = await apiService.uploads.uploadImage(file);

      if (response.success) {
        setFormData(prev => ({
          ...prev,
          imagen: response.path
        }));
        console.log('Imagen subida correctamente:', response.path);
      } else {
        console.error('Error al subir la imagen:', response.message);
        setFormData(prev => ({
          ...prev,
          imagen: localPath
        }));
      }
    } catch (error) {
      console.error('Error al procesar la imagen:', error);
    } finally {
      setUploadingImage(false);
    }
  };

  const validateForm = useCallback(() => {
    const errors = {};

    if (!formData.marca) errors.marca = 'La marca es requerida';
    if (!formData.modelo) errors.modelo = 'El modelo es requerido';
    if (!formData.anio) {
      errors.anio = 'El ano es requerido';
    } else if (isNaN(formData.anio) || formData.anio < 1900 || formData.anio > new Date().getFullYear() + 1) {
      errors.anio = 'Ingrese un ano valido';
    }
    if (!formData.matricula) errors.matricula = 'La matricula es requerida';
    if (!formData.color) errors.color = 'El color es requerido';
    if (!formData.precioBase) {
      errors.precioBase = 'El precio base es requerido';
    } else if (isNaN(formData.precioBase) || formData.precioBase <= 0) {
      errors.precioBase = 'Ingrese un precio valido';
    }
    if (!formData.combustible) errors.combustible = 'El tipo de combustible es requerido';
    if (!formData.transmision) errors.transmision = 'El tipo de transmision es requerido';
    if (!formData.capacidad) {
      errors.capacidad = 'La capacidad es requerida';
    } else if (isNaN(formData.capacidad) || formData.capacidad < 1) {
      errors.capacidad = 'La capacidad debe ser mas de 0 pasajeros';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  // Action handlers
  const handleAddNew = useCallback(() => {
    resetForm();
    setModalOpen(true);
  }, [resetForm]);

  const handleEdit = useCallback((vehiculo) => {
    if (!vehiculo) {
      console.error('Attempted to edit a null or undefined vehicle');
      return;
    }
    
    console.log('Editando vehículo:', vehiculo);
    
    setCurrentVehiculo(vehiculo);
    setFormData({
      marca: vehiculo.marca || '',
      modelo: vehiculo.modelo || '',
      anio: vehiculo.anio?.toString() || vehiculo.año?.toString() || '',
      matricula: vehiculo.matricula || '',
      color: vehiculo.color || '',
      tipo: vehiculo.tipo || vehiculo.tipoCoche || 'Sedan',
      precioBase: vehiculo.precioBase?.toString() || vehiculo.precioDia?.toString() || '',
      combustible: vehiculo.combustible || '',
      transmision: vehiculo.transmision || 'Automática',
      capacidad: vehiculo.capacidad?.toString() || '',
      disponible: vehiculo.disponible === undefined ? true : vehiculo.disponible,
      imagen: vehiculo.imagen || ''
    });
    setModalOpen(true);
  }, []);

  const handleChecklist = useCallback((vehiculo) => {
    if (!vehiculo) {
      console.error('Attempted to view checklist for null or undefined vehicle');
      return;
    }
    
    console.log('Abriendo checklist para vehículo:', vehiculo);
    setVehiculoChecklist(vehiculo);
    setChecklistModalOpen(true);
  }, []);

  const handleDelete = useCallback(async () => {
    if (!vehiculoToDelete) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.autos.delete(vehiculoToDelete.id);
      
      if (response.success) {
        setVehiculos(prev => prev.filter(v => v.id !== vehiculoToDelete.id));
        setDeleteModalOpen(false);
        setVehiculoToDelete(null);
        notifyDataChange();
      } else {
        throw new Error(response.error || 'Error desconocido al eliminar veh\u00edculo');
      }
    } catch (error) {
      console.error('Error deleting vehiculo:', error);
      setError(`Error al eliminar veh\u00edculo: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }, [vehiculoToDelete, vehiculos, notifyDataChange, saveVehiculosToLocalStorage]);

  // Data loading
  const loadVehiculos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await apiService.autos.getAll();

      if (response.success && response.data) {
        const normalizedVehiculos = response.data.map(vehiculo => ({
          ...vehiculo,
          anio: vehiculo.anio || vehiculo.ano || 0,
          tipo: vehiculo.tipo || vehiculo.tipoCoche || 'Sedan',
          precioBase: vehiculo.precioBase || vehiculo.precioDia || 0
        }));
        setVehiculos(normalizedVehiculos);
        return;
      }

      setVehiculos([]);
      setError('No se pudieron cargar los vehiculos.');
    } catch (error) {
      console.error('Error general en loadVehiculos:', error);
      setVehiculos([]);
      setError('Error al cargar los vehiculos');
    } finally {
      setLoading(false);
    }
  }, []);

  // Main form submission handler - placed after all dependent functions
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');

      const vehiculoData = {
        marca: formData.marca,
        modelo: formData.modelo,
        anio: parseInt(formData.anio),
        año: parseInt(formData.anio), // Include both keys for compatibility
        matricula: formData.matricula,
        color: formData.color,
        tipo: formData.tipo,
        tipoCoche: formData.tipo, // Include both keys for compatibility
        precioBase: parseFloat(formData.precioBase),
        precioDia: parseFloat(formData.precioBase), // Include both keys for compatibility
        combustible: formData.combustible,
        transmision: formData.transmision,
        capacidad: parseInt(formData.capacidad),
        disponible: Boolean(formData.disponible),
        imagen: formData.imagen || '/images/autos/default-car.jpg'
      };
      
      console.log('Enviando datos de vehículo al backend:', vehiculoData);
      
      const isCreating = !currentVehiculo;
      let savedVehiculo = null;
      let success = false;
      
      try {
        if (isCreating) {
          const response = await apiService.autos.create(vehiculoData);
          if (response.success && response.data) {
            // Normalize data to ensure consistent keys
            savedVehiculo = normalizeVehiculoData(response.data);
            success = true;
          }
        } else {
          const response = await apiService.autos.update(currentVehiculo.id, vehiculoData);
          if (response.success) {
            // Normalize data to ensure consistent keys
            savedVehiculo = response.data ? 
              normalizeVehiculoData(response.data) : 
              { ...vehiculoData, id: currentVehiculo.id };
            success = true;
          }
        }
      } catch (error) {
        console.error(`Error ${isCreating ? 'creating' : 'updating'} vehicle:`, error);
      }
      
      // Helper function to normalize vehicle data
      function normalizeVehiculoData(data) {
        return {
          ...data,
          anio: data.anio || data.año || 0,
          tipo: data.tipo || data.tipoCoche || 'Sedan',
          precioBase: data.precioBase || data.precioDia || 0
        };
      }
      
      if (!success) {
        // No fallback: report error to the user and abort the optimistic local save.
        throw new Error('Error de API: no fue posible guardar el vehículo.');
      }
      
      setVehiculos(prev => {
        const updated = isCreating 
          ? [...prev, savedVehiculo] 
          : prev.map(v => v.id === currentVehiculo?.id ? savedVehiculo : v);
        
        // Save to localStorage after updating state
        saveVehiculosToLocalStorage(updated);
        return updated;
      });
      
      // Notify other components
      notifyDataChange();
      
      // Reset and close modal
      resetForm();
      setModalOpen(false);
      
      console.log(`Vehículo ${isCreating ? 'creado' : 'actualizado'} con éxito:`, savedVehiculo);
      
    } catch (error) {
      console.error('Error en handleSubmit:', error);
      setError(`Error al ${currentVehiculo ? 'actualizar' : 'crear'} el vehículo. Inténtelo de nuevo.`);
    } finally {
      setLoading(false);
    }
  }, [validateForm, formData, currentVehiculo, resetForm, notifyDataChange, saveVehiculosToLocalStorage]);

  // Auth and initial data loading
  const checkAuthAndLoadData = useCallback(async () => {
    try {
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
      } catch (error) {
        console.error('Error parsing user data:', error);
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        router.push('/login');
        return;
      }

      // User is admin, load data
      await loadVehiculos();
      
      // Check if we should open the creation form
      if (typeof window !== 'undefined' && sessionStorage.getItem('openVehiculoForm') === 'true') {
        // Clear the flag
        sessionStorage.removeItem('openVehiculoForm');
        // Open the form
        handleAddNew();
      }
    } catch (error) {
      console.error('Error checking auth:', error);
      setError('Error verificando autenticación');
      setLoading(false);
    }
  }, [router, loadVehiculos, handleAddNew, setError, setLoading]);

  // Effects
  useEffect(() => {
    checkAuthAndLoadData();
  }, [checkAuthAndLoadData]);

  // Table columns definition
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'marca', label: 'Marca', sortable: true },
    { key: 'modelo', label: 'Modelo', sortable: true },
    { key: 'anio', label: 'Año', sortable: true },
    { key: 'matricula', label: 'Matrícula', sortable: true },
    { key: 'tipo', label: 'Tipo', sortable: true },
    { 
      key: 'precioBase', 
      label: 'Precio Base', 
      sortable: true,
      format: (value) => `$${value}/día`
    },
    { 
      key: 'disponible', 
      label: 'Disponible', 
      sortable: true,
      format: (value) => (
        <span className={value ? styles.tagSuccess : styles.tagError}>
          {value ? 'Disponible' : 'No disponible'}
        </span>
      )
    }
  ];

  // Render component
  return (
    <div className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Vehículos</h1>
        <button 
          className={styles.addButton}
          onClick={handleAddNew}
          aria-label="Añadir nuevo vehículo"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.5rem 1rem',
            background: '#0066cc',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            cursor: 'pointer'
          }}
        >
          <span style={{ fontSize: '1.2rem', marginRight: '0.25rem' }}>+</span>
          Añadir Vehículo
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      <DataTable
        data={vehiculos}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(vehiculo) => {
          setVehiculoToDelete(vehiculo);
          setDeleteModalOpen(true);
        }}
        onView={(vehiculo) => router.push(`/dashboard/vehiculos/${vehiculo.id}`)}
        customActionButtons={(vehiculo) => (
          <button
            onClick={() => handleChecklist(vehiculo)}
            className={styles.checklistButton}
            title="Ver checklist"
            aria-label="Ver checklist del vehículo"
          >
            📋 Checklist
          </button>
        )}
        loading={loading}
        itemName="Vehículo"
        emptyMessage="No hay vehículos registrados. ¡Añade uno nuevo!"
      />
      
      <div className={styles.backLink}>
        <Link href="/dashboard">← Volver al Dashboard</Link>
      </div>
      
      {/* Checklist Modal */}
      {checklistModalOpen && vehiculoChecklist && (
        <ChecklistVehiculo
          autoId={vehiculoChecklist.id}
          onClose={() => {
            setChecklistModalOpen(false);
            setVehiculoChecklist(null);
          }}
          readonly={false}
        />
      )}
      
      {/* Form Modal */}
      <Modal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentVehiculo ? 'Editar Vehículo' : 'Añadir Vehículo'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="marca">Marca</label>
              <input
                type="text"
                id="marca"
                name="marca"
                value={formData.marca}
                onChange={handleInputChange}
                className={formErrors.marca ? styles.inputError : ''}
              />
              {formErrors.marca && (
                <span className={styles.errorText}>{formErrors.marca}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="modelo">Modelo</label>
              <input
                type="text"
                id="modelo"
                name="modelo"
                value={formData.modelo}
                onChange={handleInputChange}
                className={formErrors.modelo ? styles.inputError : ''}
              />
              {formErrors.modelo && (
                <span className={styles.errorText}>{formErrors.modelo}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="anio">Año</label>
              <input
                type="number"
                id="anio"
                name="anio"
                value={formData.anio}
                onChange={handleInputChange}
                min="1900"
                max={new Date().getFullYear() + 1}
                className={formErrors.anio ? styles.inputError : ''}
              />
              {formErrors.anio && (
                <span className={styles.errorText}>{formErrors.anio}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="matricula">Matrícula</label>
              <input
                type="text"
                id="matricula"
                name="matricula"
                value={formData.matricula}
                onChange={handleInputChange}
                className={formErrors.matricula ? styles.inputError : ''}
              />
              {formErrors.matricula && (
                <span className={styles.errorText}>{formErrors.matricula}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="color">Color</label>
              <input
                type="text"
                id="color"
                name="color"
                value={formData.color}
                onChange={handleInputChange}
                className={formErrors.color ? styles.inputError : ''}
              />
              {formErrors.color && (
                <span className={styles.errorText}>{formErrors.color}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="tipo">Tipo</label>
              <select
                id="tipo"
                name="tipo"
                value={formData.tipo}
                onChange={handleInputChange}
              >
                <option value="Compacto">Compacto</option>
                <option value="Sedan">Sedan</option>
                <option value="SUV">SUV</option>
                <option value="Hatchback">Hatchback</option>
                <option value="Pickup">Pickup</option>
                <option value="Deportivo">Deportivo</option>
                <option value="Minivan">Minivan</option>
                <option value="Camioneta">Camioneta</option>
                <option value="Lujo">Lujo</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="combustible">Combustible</label>
              <select
                id="combustible"
                name="combustible"
                value={formData.combustible}
                onChange={handleInputChange}
                className={formErrors.combustible ? styles.inputError : ''}
              >
                <option value="">Selecciona un tipo...</option>
                <option value="Gasolina">Gasolina</option>
                <option value="Diesel">Diesel</option>
                <option value="Híbrido">Híbrido</option>
                <option value="Eléctrico">Eléctrico</option>
              </select>
              {formErrors.combustible && (
                <span className={styles.errorText}>{formErrors.combustible}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="transmision">Transmisión</label>
              <select
                id="transmision"
                name="transmision"
                value={formData.transmision}
                onChange={handleInputChange}
                className={formErrors.transmision ? styles.inputError : ''}
              >
                <option value="Manual">Manual</option>
                <option value="Automática">Automática</option>
              </select>
              {formErrors.transmision && (
                <span className={styles.errorText}>{formErrors.transmision}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="capacidad">Capacidad (pasajeros)</label>
              <input
                type="number"
                id="capacidad"
                name="capacidad"
                value={formData.capacidad}
                onChange={handleInputChange}
                min="1"
                max="20"
                className={formErrors.capacidad ? styles.inputError : ''}
              />
              {formErrors.capacidad && (
                <span className={styles.errorText}>{formErrors.capacidad}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="precioBase">Precio Base (por día)</label>
              <div className={styles.inputWithPrefix}>
                <span className={styles.prefix}>$</span>
                <input
                  type="number"
                  id="precioBase"
                  name="precioBase"
                  value={formData.precioBase}
                  onChange={handleInputChange}
                  min="0"
                  step="0.01"
                  className={formErrors.precioBase ? styles.inputError : ''}
                />
              </div>
              {formErrors.precioBase && (
                <span className={styles.errorText}>{formErrors.precioBase}</span>
              )}
            </div>
            
            <div className={`${styles.formGroup} ${styles.fullWidth}`}>
              <label htmlFor="imagen">Imagen del Vehículo</label>
              <ImageUploader 
                currentValue={formData.imagen} 
                onChange={handleInputChange} 
                name="imagen" 
              />
              {uploadingImage && (
                <p className={styles.uploadingText}>Subiendo imagen...</p>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <div className={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="disponible"
                  name="disponible"
                  checked={formData.disponible}
                  onChange={handleInputChange}
                />
                <label htmlFor="disponible">Disponible para renta</label>
              </div>
            </div>
          </div>
          
          <div className={styles.formActions}>
            <button 
              type="button"
              className={styles.cancelButton}
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.submitButton}
              disabled={loading || uploadingImage}
            >
              {loading && <span className="btn-spinner" />}
              {loading ? 'Guardando...' : currentVehiculo ? 'Actualizar' : 'Añadir'}
            </button>
          </div>
        </form>
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirmar Eliminación"
        size="small"
      >
        <div className={styles.deleteConfirmation}>
          <p>¿Estás seguro que deseas eliminar el vehículo {vehiculoToDelete?.marca} {vehiculoToDelete?.modelo}?</p>
          <p className={styles.deleteWarning}>Esta acción no se puede deshacer.</p>
          
          <div className={styles.deleteActions}>
            <button 
              className={styles.cancelButton}
              onClick={() => setDeleteModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              className={styles.deleteButton}
              onClick={handleDelete}
              disabled={loading}
            >
              {loading && <span className="btn-spinner" />}
              {loading ? 'Eliminando...' : 'Eliminar'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
} 