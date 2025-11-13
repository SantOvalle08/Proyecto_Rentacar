import { useState, useEffect } from 'react';
import styles from './ChecklistVehiculo.module.css';
import apiService from '@/services/api';

export default function ChecklistVehiculo({ autoId, onClose, readonly = false }) {
  const [checklist, setChecklist] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Estado para nuevo rayón
  const [nuevoRayon, setNuevoRayon] = useState({
    descripcion: '',
    ubicacion: ''
  });
  const [mostrarFormRayon, setMostrarFormRayon] = useState(false);

  useEffect(() => {
    cargarChecklist();
  }, [autoId]);

  const cargarChecklist = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await apiService.checklists.getByAuto(autoId);
      
      if (response.success && response.data) {
        setChecklist(response.data);
      } else {
        setError('No se pudo cargar el checklist');
      }
    } catch (err) {
      console.error('Error al cargar checklist:', err);
      setError('Error al cargar el checklist del vehículo');
    } finally {
      setLoading(false);
    }
  };

  const actualizarNivelGasolina = async (nivel, porcentaje) => {
    if (readonly) return;
    
    try {
      setSaving(true);
      const response = await apiService.checklists.update(autoId, {
        nivelGasolina: nivel,
        porcentajeGasolina: porcentaje
      });
      
      if (response.success) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error('Error al actualizar nivel de gasolina:', err);
      setError('Error al actualizar el nivel de gasolina');
    } finally {
      setSaving(false);
    }
  };

  const actualizarInventario = async (itemId, campo, valor) => {
    if (readonly) return;
    
    try {
      setSaving(true);
      const inventarioActualizado = checklist.inventario.map(item => {
        if (item.id === itemId) {
          return { ...item, [campo]: valor };
        }
        return item;
      });
      
      const response = await apiService.checklists.update(autoId, {
        inventario: inventarioActualizado
      });
      
      if (response.success) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error('Error al actualizar inventario:', err);
      setError('Error al actualizar el inventario');
    } finally {
      setSaving(false);
    }
  };

  const agregarRayon = async () => {
    if (readonly) return;
    if (!nuevoRayon.descripcion || !nuevoRayon.ubicacion) {
      setError('Descripción y ubicación son requeridos');
      return;
    }
    
    try {
      setSaving(true);
      setError('');
      const response = await apiService.checklists.agregarRayon(autoId, nuevoRayon);
      
      if (response.success) {
        setChecklist(response.data);
        setNuevoRayon({ descripcion: '', ubicacion: '' });
        setMostrarFormRayon(false);
      }
    } catch (err) {
      console.error('Error al agregar rayón:', err);
      setError('Error al agregar el rayón');
    } finally {
      setSaving(false);
    }
  };

  const eliminarRayon = async (rayonId) => {
    if (readonly) return;
    if (!confirm('¿Está seguro de eliminar este rayón?')) return;
    
    try {
      setSaving(true);
      const response = await apiService.checklists.eliminarRayon(autoId, rayonId);
      
      if (response.success) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error('Error al eliminar rayón:', err);
      setError('Error al eliminar el rayón');
    } finally {
      setSaving(false);
    }
  };

  const actualizarEstadoGeneral = async (estado) => {
    if (readonly) return;
    
    try {
      setSaving(true);
      const response = await apiService.checklists.update(autoId, {
        estadoGeneral: estado
      });
      
      if (response.success) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error('Error al actualizar estado general:', err);
      setError('Error al actualizar el estado general');
    } finally {
      setSaving(false);
    }
  };

  const actualizarObservaciones = async (observaciones) => {
    if (readonly) return;
    
    try {
      setSaving(true);
      const response = await apiService.checklists.update(autoId, {
        observaciones
      });
      
      if (response.success) {
        setChecklist(response.data);
      }
    } catch (err) {
      console.error('Error al actualizar observaciones:', err);
      setError('Error al actualizar las observaciones');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.loading}>Cargando checklist...</div>
        </div>
      </div>
    );
  }

  if (!checklist) {
    return (
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <div className={styles.error}>No se pudo cargar el checklist</div>
          <button onClick={onClose} className={styles.btnClose}>Cerrar</button>
        </div>
      </div>
    );
  }

  const nivelesGasolina = [
    { label: 'Vacío', value: 'Vacío', porcentaje: 0 },
    { label: '1/4', value: '1/4', porcentaje: 25 },
    { label: '1/2', value: '1/2', porcentaje: 50 },
    { label: '3/4', value: '3/4', porcentaje: 75 },
    { label: 'Lleno', value: 'Lleno', porcentaje: 100 }
  ];

  const estadosGenerales = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere atención'];
  const condiciones = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No funcional'];

  return (
    <div className={styles.modal} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Checklist del Vehículo</h2>
          <button onClick={onClose} className={styles.btnCloseX}>×</button>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        
        <div className={styles.scrollContent}>
          {/* Nivel de Gasolina */}
          <section className={styles.section}>
            <h3>Nivel de Gasolina</h3>
            <div className={styles.gasolinaIndicator}>
              <div className={styles.gasolinaNiveles}>
                {nivelesGasolina.map((nivel) => (
                  <button
                    key={nivel.value}
                    className={`${styles.nivelBtn} ${checklist.nivelGasolina === nivel.value ? styles.active : ''}`}
                    onClick={() => !readonly && actualizarNivelGasolina(nivel.value, nivel.porcentaje)}
                    disabled={readonly || saving}
                  >
                    {nivel.label}
                  </button>
                ))}
              </div>
              <div className={styles.gasolinaBarra}>
                <div 
                  className={styles.gasolinaFill} 
                  style={{ width: `${checklist.porcentajeGasolina}%` }}
                />
              </div>
              <p className={styles.gasolinaPorcentaje}>{checklist.porcentajeGasolina}%</p>
            </div>
          </section>

          {/* Rayones */}
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Rayones y Daños</h3>
              {!readonly && (
                <button 
                  onClick={() => setMostrarFormRayon(!mostrarFormRayon)}
                  className={styles.btnAdd}
                  disabled={saving}
                >
                  {mostrarFormRayon ? 'Cancelar' : '+ Agregar'}
                </button>
              )}
            </div>

            {mostrarFormRayon && !readonly && (
              <div className={styles.formRayon}>
                <input
                  type="text"
                  placeholder="Descripción del daño"
                  value={nuevoRayon.descripcion}
                  onChange={(e) => setNuevoRayon({ ...nuevoRayon, descripcion: e.target.value })}
                  className={styles.input}
                />
                <input
                  type="text"
                  placeholder="Ubicación (ej: Puerta delantera izquierda)"
                  value={nuevoRayon.ubicacion}
                  onChange={(e) => setNuevoRayon({ ...nuevoRayon, ubicacion: e.target.value })}
                  className={styles.input}
                />
                <button 
                  onClick={agregarRayon}
                  className={styles.btnSave}
                  disabled={saving}
                >
                  Guardar Rayón
                </button>
              </div>
            )}

            <div className={styles.rayonesList}>
              {checklist.rayones && checklist.rayones.length > 0 ? (
                checklist.rayones.map((rayon) => (
                  <div key={rayon.id} className={styles.rayonItem}>
                    <div className={styles.rayonInfo}>
                      <strong>{rayon.ubicacion}</strong>
                      <p>{rayon.descripcion}</p>
                      <small>Registrado: {new Date(rayon.fecha).toLocaleDateString()}</small>
                    </div>
                    {!readonly && (
                      <button 
                        onClick={() => eliminarRayon(rayon.id)}
                        className={styles.btnDelete}
                        disabled={saving}
                      >
                        Eliminar
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <p className={styles.emptyMessage}>No hay rayones registrados</p>
              )}
            </div>
          </section>

          {/* Inventario */}
          <section className={styles.section}>
            <h3>Inventario del Vehículo</h3>
            <div className={styles.inventarioList}>
              {checklist.inventario && checklist.inventario.map((item) => (
                <div key={item.id} className={styles.inventarioItem}>
                  <div className={styles.inventarioCheckbox}>
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={item.presente}
                      onChange={(e) => !readonly && actualizarInventario(item.id, 'presente', e.target.checked)}
                      disabled={readonly || saving}
                    />
                    <label htmlFor={`item-${item.id}`}>{item.nombre}</label>
                  </div>
                  <div className={styles.inventarioDetails}>
                    <select
                      value={item.condicion}
                      onChange={(e) => !readonly && actualizarInventario(item.id, 'condicion', e.target.value)}
                      disabled={readonly || saving || !item.presente}
                      className={styles.select}
                    >
                      {condiciones.map(cond => (
                        <option key={cond} value={cond}>{cond}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="Notas..."
                      value={item.notas}
                      onChange={(e) => !readonly && actualizarInventario(item.id, 'notas', e.target.value)}
                      disabled={readonly || saving}
                      className={styles.inputNotas}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Estado General */}
          <section className={styles.section}>
            <h3>Estado General del Vehículo</h3>
            <div className={styles.estadosGrid}>
              {estadosGenerales.map((estado) => (
                <button
                  key={estado}
                  className={`${styles.estadoBtn} ${checklist.estadoGeneral === estado ? styles.active : ''} ${styles[estado.toLowerCase().replace(' ', '-')]}`}
                  onClick={() => !readonly && actualizarEstadoGeneral(estado)}
                  disabled={readonly || saving}
                >
                  {estado}
                </button>
              ))}
            </div>
          </section>

          {/* Observaciones */}
          <section className={styles.section}>
            <h3>Observaciones Generales</h3>
            <textarea
              value={checklist.observaciones}
              onChange={(e) => !readonly && actualizarObservaciones(e.target.value)}
              onBlur={(e) => !readonly && actualizarObservaciones(e.target.value)}
              placeholder="Agregar observaciones adicionales..."
              className={styles.textarea}
              disabled={readonly || saving}
              rows={4}
            />
          </section>

          {/* Información de última actualización */}
          <div className={styles.infoFooter}>
            <small>
              Última revisión: {new Date(checklist.fechaUltimaRevision).toLocaleString()}
            </small>
          </div>
        </div>

        <div className={styles.footer}>
          <button onClick={onClose} className={styles.btnClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
