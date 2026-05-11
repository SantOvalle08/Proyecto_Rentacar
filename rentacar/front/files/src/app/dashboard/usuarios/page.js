'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import DataTable from '@/components/DataTable';
import Modal from '@/components/Modal';
import apiService from '@/services/api';
import styles from './page.module.css';

export default function UsuariosPage() {
  const router = useRouter();
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [currentUsuario, setCurrentUsuario] = useState(null);
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    telefono: '',
    tipoDocumento: 'DNI',
    numeroDocumento: '',
    rol: 'cliente',
    contraseña: '',
    confirmarContraseña: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [usuarioToDelete, setUsuarioToDelete] = useState(null);

  // Fetch usuarios on mount
  useEffect(() => {
    const checkAuthAndLoadData = async () => {
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
        await loadUsuarios();
      } catch (error) {
        console.error('Error checking auth:', error);
        setError('Error verificando autenticación');
        setLoading(false);
      }
    };

    checkAuthAndLoadData();
  }, [router]);

  const loadUsuarios = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.usuarios.getAll();
      
      if (response.success && response.data) {
        // Normalizar los datos para asegurar que tenemos id e idUser
        const normalizedData = response.data.map(usuario => ({
          ...usuario,
          id: usuario.id || usuario._id || usuario.idUser,
          idUser: usuario.idUser || usuario.id || usuario._id
        }));
        setUsuarios(normalizedData);
      } else {
        setError('No se pudieron cargar los usuarios. Por favor, recarga la página.');
        setUsuarios([]);
      }
    } catch (error) {
      console.error('Error al cargar usuarios desde API:', error);
      setError('Error al conectar con el servidor. Por favor, verifica tu conexión.');
      setUsuarios([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Clear error when typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.nombre) errors.nombre = 'El nombre es requerido';
    if (!formData.email) {
      errors.email = 'El email es requerido';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'El email no es válido';
    }
    if (!formData.tipoDocumento) errors.tipoDocumento = 'El tipo de documento es requerido';
    if (!formData.numeroDocumento) errors.numeroDocumento = 'El número de documento es requerido';
    
    // Check password only if creating a new user or password is being changed
    if (!currentUsuario || formData.contraseña) {
      if (!currentUsuario && !formData.contraseña) {
        errors.contraseña = 'La contraseña es requerida';
      } else if (formData.contraseña && formData.contraseña.length < 6) {
        errors.contraseña = 'La contraseña debe tener al menos 6 caracteres';
      }
      
      if (formData.contraseña !== formData.confirmarContraseña) {
        errors.confirmarContraseña = 'Las contraseñas no coinciden';
      }
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    try {
      setLoading(true);
      setError('');

      const usuarioData = { ...formData };
      
      // If editing and password is empty, remove password fields
      if (currentUsuario && !usuarioData.contraseña) {
        delete usuarioData.contraseña;
        delete usuarioData.confirmarContraseña;
      } else {
        // Always remove confirmarContraseña from data sent to API
        delete usuarioData.confirmarContraseña;
      }
      
      let response;
      try {
        if (currentUsuario) {
          // Update existing usuario
          response = await apiService.usuarios.update(currentUsuario.id, usuarioData);
          
          if (response.success) {
            // Reload all usuarios to get latest data
            await loadUsuarios();
            setModalOpen(false);
            resetForm();
            return;
          } else {
            throw new Error(response.message || 'Error al actualizar usuario');
          }
        } else {
          // Create new usuario
          response = await apiService.usuarios.create(usuarioData);
          
          if (response.success) {
            // Reload all usuarios to get latest data
            await loadUsuarios();
            setModalOpen(false);
            resetForm();
            return;
          } else {
            throw new Error(response.message || 'Error al crear usuario');
          }
        }
      } catch (apiError) {
        console.error('Error en operación:', apiError);
        setError(apiError.message || 'Error al guardar el usuario');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error general en handleSubmit:', error);
      setError('Error inesperado al guardar el usuario');
      setLoading(false);
    }
  };

  const handleEdit = (usuario) => {
    setCurrentUsuario(usuario);
    setFormData({
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono || '',
      tipoDocumento: usuario.tipoDocumento || 'DNI',
      numeroDocumento: usuario.numeroDocumento || '',
      rol: usuario.rol || 'cliente',
      contraseña: '',
      confirmarContraseña: ''
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!usuarioToDelete) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await apiService.usuarios.delete(usuarioToDelete.id);
      
      if (response.success) {
        // Remove the usuario from the local state
        setUsuarios(usuarios.filter(u => u.id !== usuarioToDelete.id));
        setDeleteModalOpen(false);
        setUsuarioToDelete(null);
        return;
      } else {
        throw new Error(response.message || 'Error al eliminar usuario');
      }
    } catch (error) {
      console.error('Error al eliminar usuario:', error);
      setError(error.message || 'Error al eliminar el usuario. Por favor, intenta de nuevo.');
      setDeleteModalOpen(false);
      setUsuarioToDelete(null);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentUsuario(null);
    setFormData({
      nombre: '',
      email: '',
      telefono: '',
      tipoDocumento: 'DNI',
      numeroDocumento: '',
      rol: 'cliente',
      contraseña: '',
      confirmarContraseña: ''
    });
    setFormErrors({});
  };

  const handleAddNew = () => {
    resetForm();
    setModalOpen(true);
  };

  // Columns for the data table
  const columns = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'nombre', label: 'Nombre', sortable: true },
    { key: 'email', label: 'Email', sortable: true },
    { key: 'telefono', label: 'Teléfono', sortable: true },
    { key: 'tipoDocumento', label: 'Tipo Doc.', sortable: true },
    { key: 'numeroDocumento', label: 'Número Doc.', sortable: true },
    { 
      key: 'rol', 
      label: 'Rol', 
      sortable: true,
      format: (value) => (
        <span className={value === 'admin' ? styles.tagAdmin : styles.tagClient}>
          {value === 'admin' ? 'Administrador' : 'Cliente'}
        </span>
      )
    }
  ];

  return (
    <div className="container">
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Gestión de Usuarios</h1>
        <button 
          className={styles.addButton}
          onClick={handleAddNew}
        >
          Añadir Usuario
        </button>
      </div>
      
      {error && (
        <div className={styles.error}>{error}</div>
      )}
      
      <DataTable
        data={usuarios}
        columns={columns}
        onEdit={handleEdit}
        onDelete={(usuario) => {
          // Don't allow deleting the admin user
          if (usuario.rol === 'admin' && usuario.email === 'admin@rentacar.com') {
            setError('No se puede eliminar al usuario administrador principal');
            return;
          }
          setUsuarioToDelete(usuario);
          setDeleteModalOpen(true);
        }}
        onView={(usuario) => router.push(`/dashboard/usuarios/${usuario.idUser || usuario._id || usuario.id}`)}
        loading={loading}
        itemName="Usuario"
        emptyMessage="No hay usuarios registrados. ¡Añade uno nuevo!"
      />
      
      <div className={styles.backLink}>
        <Link href="/dashboard">← Volver al Dashboard</Link>
      </div>
      
      {/* Form Modal */}
      <Modal 
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={currentUsuario ? 'Editar Usuario' : 'Añadir Usuario'}
      >
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGrid}>
            <div className={styles.formGroup}>
              <label htmlFor="nombre">Nombre Completo</label>
              <input
                type="text"
                id="nombre"
                name="nombre"
                value={formData.nombre}
                onChange={handleInputChange}
                className={formErrors.nombre ? styles.inputError : ''}
              />
              {formErrors.nombre && (
                <span className={styles.errorText}>{formErrors.nombre}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className={formErrors.email ? styles.inputError : ''}
              />
              {formErrors.email && (
                <span className={styles.errorText}>{formErrors.email}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="tel"
                id="telefono"
                name="telefono"
                value={formData.telefono}
                onChange={handleInputChange}
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="tipoDocumento">Tipo de Documento</label>
              <select
                id="tipoDocumento"
                name="tipoDocumento"
                value={formData.tipoDocumento}
                onChange={handleInputChange}
              >
                <option value="DNI">DNI</option>
                <option value="Pasaporte">Pasaporte</option>
                <option value="Cédula">Cédula</option>
              </select>
              {formErrors.tipoDocumento && (
                <span className={styles.errorText}>{formErrors.tipoDocumento}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="numeroDocumento">Número de Documento</label>
              <input
                type="text"
                id="numeroDocumento"
                name="numeroDocumento"
                value={formData.numeroDocumento}
                onChange={handleInputChange}
                className={formErrors.numeroDocumento ? styles.inputError : ''}
              />
              {formErrors.numeroDocumento && (
                <span className={styles.errorText}>{formErrors.numeroDocumento}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="rol">Rol</label>
              <select
                id="rol"
                name="rol"
                value={formData.rol}
                onChange={handleInputChange}
              >
                <option value="cliente">Cliente</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="contraseña">
                {currentUsuario ? 'Contraseña (Dejar vacío para mantener)' : 'Contraseña'}
              </label>
              <input
                type="password"
                id="contraseña"
                name="contraseña"
                value={formData.contraseña}
                onChange={handleInputChange}
                className={formErrors.contraseña ? styles.inputError : ''}
              />
              {formErrors.contraseña && (
                <span className={styles.errorText}>{formErrors.contraseña}</span>
              )}
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="confirmarContraseña">Confirmar Contraseña</label>
              <input
                type="password"
                id="confirmarContraseña"
                name="confirmarContraseña"
                value={formData.confirmarContraseña}
                onChange={handleInputChange}
                className={formErrors.confirmarContraseña ? styles.inputError : ''}
              />
              {formErrors.confirmarContraseña && (
                <span className={styles.errorText}>{formErrors.confirmarContraseña}</span>
              )}
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
              disabled={loading}
            >
              {loading && <span className="btn-spinner" />}
              {loading ? 'Guardando...' : currentUsuario ? 'Actualizar' : 'Añadir'}
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
          <p>¿Estás seguro que deseas eliminar el usuario <strong>{usuarioToDelete?.nombre}</strong>?</p>
          <p className={styles.deleteWarning}>Esta acción no se puede deshacer y eliminará todas las reservas asociadas a este usuario.</p>
          
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