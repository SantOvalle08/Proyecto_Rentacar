'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import styles from './page.module.css';

const INVENTARIO_DEFAULT = [
  'Gato hidráulico',
  'Llanta de repuesto',
  'Llave de ruedas',
  'Triángulos de seguridad',
  'Botiquín de primeros auxilios',
  'Extintor',
  'Manual del vehículo',
  'Cables de arranque',
];

const CONDICIONES = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No funcional'];
const NIVELES_GAS = ['Vacío', '1/4', '1/2', '3/4', 'Lleno'];
const ESTADO_GENERAL = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere atención'];

export default function CheckoutPage() {
  const router = useRouter();
  const { reservaId } = useParams();

  const [reserva, setReserva] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    verificacionCliente: {
      documentoVerificado: false,
      licenciaVerificada: false,
      numeroDocumento: '',
      numeroLicencia: '',
      observaciones: ''
    },
    kmSalida: '',
    nivelGasolina: 'Lleno',
    porcentajeGasolina: 100,
    estadoGeneral: 'Bueno',
    observaciones: '',
    inventario: INVENTARIO_DEFAULT.map(nombre => ({
      nombre,
      presente: true,
      condicion: 'Bueno',
      notas: ''
    })),
    dañosPreExistentes: []
  });

  const [nuevoDaño, setNuevoDaño] = useState({ descripcion: '', ubicacion: '' });

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed?.rol !== 'admin') { router.push('/'); return; }
    loadReserva();
  }, [reservaId]);

  const loadReserva = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiService.reservas.getById(reservaId);
      if (res.success && res.data) {
        setReserva(res.data);
        if (res.data.estado !== 'Confirmada') {
          setError(`Esta reserva no está en estado "Confirmada" (estado actual: ${res.data.estado}). No se puede hacer check-out.`);
        }
        // Pre-fill document from user data
        if (res.data.usuario?.numeroDocumento) {
          setForm(f => ({
            ...f,
            verificacionCliente: {
              ...f.verificacionCliente,
              numeroDocumento: res.data.usuario.numeroDocumento
            }
          }));
        }
      } else {
        setError('No se encontró la reserva.');
      }
    } catch (e) {
      setError('Error al cargar la reserva. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  const setVerif = (field, value) =>
    setForm(f => ({ ...f, verificacionCliente: { ...f.verificacionCliente, [field]: value } }));

  const setInventarioItem = (idx, field, value) =>
    setForm(f => {
      const inv = [...f.inventario];
      inv[idx] = { ...inv[idx], [field]: value };
      return { ...f, inventario: inv };
    });

  const addDaño = () => {
    if (!nuevoDaño.descripcion || !nuevoDaño.ubicacion) return;
    setForm(f => ({
      ...f,
      dañosPreExistentes: [...f.dañosPreExistentes, { ...nuevoDaño, fecha: new Date().toISOString() }]
    }));
    setNuevoDaño({ descripcion: '', ubicacion: '' });
  };

  const removeDaño = (idx) =>
    setForm(f => ({ ...f, dañosPreExistentes: f.dañosPreExistentes.filter((_, i) => i !== idx) }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kmSalida) { setError('El kilometraje de salida es requerido.'); return; }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.entregas.checkout(reservaId, {
        ...form,
        kmSalida: Number(form.kmSalida),
        porcentajeGasolina: Number(form.porcentajeGasolina)
      });
      if (res.success) {
        setSuccess('Check-out registrado exitosamente. El vehículo está ahora en alquiler.');
        setTimeout(() => router.push('/dashboard/entregas'), 2000);
      } else {
        setError(res.message || 'Error al registrar el check-out.');
      }
    } catch (e) {
      setError(e.message || 'Error al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando reserva...</div>;

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/entregas')}>
          ← Volver a entregas
        </button>

        <h1 className={styles.title}>Check-Out — Entrega del vehículo</h1>
        <p className={styles.subtitle}>Reserva #{reservaId}</p>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        {reserva && (
          <div className={styles.infoCard}>
            <h3>Información de la reserva</h3>
            <div className={styles.infoGrid}>
              <div>
                <span className={styles.label}>Cliente</span>
                <span className={styles.value}>
                  {reserva.usuario ? `${reserva.usuario.nombre} ${reserva.usuario.apellido}` : '—'}
                </span>
              </div>
              <div>
                <span className={styles.label}>Email</span>
                <span className={styles.value}>{reserva.usuario?.email || '—'}</span>
              </div>
              <div>
                <span className={styles.label}>Vehículo</span>
                <span className={styles.value}>
                  {reserva.auto ? `${reserva.auto.marca} ${reserva.auto.modelo} ${reserva.auto.año}` : '—'}
                  {reserva.auto?.matricula && ` · ${reserva.auto.matricula}`}
                </span>
              </div>
              <div>
                <span className={styles.label}>Período</span>
                <span className={styles.value}>
                  {new Date(reserva.fechaInicio).toLocaleDateString('es-ES')} →{' '}
                  {new Date(reserva.fechaFin).toLocaleDateString('es-ES')}
                </span>
              </div>
              <div>
                <span className={styles.label}>Total reserva</span>
                <span className={styles.value}>${reserva.precioTotal?.toLocaleString()}</span>
              </div>
              <div>
                <span className={styles.label}>Estado</span>
                <span className={`${styles.value} ${styles.estadoBadge}`}>{reserva.estado}</span>
              </div>
            </div>
          </div>
        )}

        {reserva?.estado === 'Confirmada' && (
          <form onSubmit={handleSubmit} className={styles.form}>

            {/* Verificación del cliente */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Verificación del cliente</h2>
              <div className={styles.checkRow}>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.verificacionCliente.documentoVerificado}
                    onChange={e => setVerif('documentoVerificado', e.target.checked)}
                  />
                  Documento de identidad verificado
                </label>
                <label className={styles.checkLabel}>
                  <input
                    type="checkbox"
                    checked={form.verificacionCliente.licenciaVerificada}
                    onChange={e => setVerif('licenciaVerificada', e.target.checked)}
                  />
                  Licencia de conducir verificada
                </label>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Nº Documento</label>
                  <input
                    type="text"
                    value={form.verificacionCliente.numeroDocumento}
                    onChange={e => setVerif('numeroDocumento', e.target.value)}
                    placeholder="Número de documento"
                  />
                </div>
                <div className={styles.field}>
                  <label>Nº Licencia</label>
                  <input
                    type="text"
                    value={form.verificacionCliente.numeroLicencia}
                    onChange={e => setVerif('numeroLicencia', e.target.value)}
                    placeholder="Número de licencia"
                  />
                </div>
              </div>
              <div className={styles.field}>
                <label>Observaciones de verificación</label>
                <textarea
                  value={form.verificacionCliente.observaciones}
                  onChange={e => setVerif('observaciones', e.target.value)}
                  rows={2}
                  placeholder="Notas sobre la verificación del cliente..."
                />
              </div>
            </section>

            {/* Estado del vehículo */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>2. Estado del vehículo al salir</h2>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Kilometraje de salida *</label>
                  <input
                    type="number"
                    min="0"
                    required
                    value={form.kmSalida}
                    onChange={e => setForm(f => ({ ...f, kmSalida: e.target.value }))}
                    placeholder="Ej: 45800"
                  />
                </div>
                <div className={styles.field}>
                  <label>Nivel de gasolina</label>
                  <select
                    value={form.nivelGasolina}
                    onChange={e => setForm(f => ({ ...f, nivelGasolina: e.target.value }))}
                  >
                    {NIVELES_GAS.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>% Gasolina ({form.porcentajeGasolina}%)</label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    value={form.porcentajeGasolina}
                    onChange={e => setForm(f => ({ ...f, porcentajeGasolina: Number(e.target.value) }))}
                  />
                </div>
                <div className={styles.field}>
                  <label>Estado general</label>
                  <select
                    value={form.estadoGeneral}
                    onChange={e => setForm(f => ({ ...f, estadoGeneral: e.target.value }))}
                  >
                    {ESTADO_GENERAL.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </div>
              </div>
            </section>

            {/* Inventario */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Inventario de accesorios</h2>
              <div className={styles.inventoryTable}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Accesorio</th>
                      <th>Presente</th>
                      <th>Condición</th>
                      <th>Notas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {form.inventario.map((item, idx) => (
                      <tr key={item.nombre}>
                        <td>{item.nombre}</td>
                        <td>
                          <input
                            type="checkbox"
                            checked={item.presente}
                            onChange={e => setInventarioItem(idx, 'presente', e.target.checked)}
                          />
                        </td>
                        <td>
                          <select
                            value={item.condicion}
                            disabled={!item.presente}
                            onChange={e => setInventarioItem(idx, 'condicion', e.target.value)}
                          >
                            {CONDICIONES.map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </td>
                        <td>
                          <input
                            type="text"
                            value={item.notas}
                            onChange={e => setInventarioItem(idx, 'notas', e.target.value)}
                            placeholder="Notas..."
                            disabled={!item.presente}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* Daños pre-existentes */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Daños pre-existentes</h2>
              <p className={styles.hint}>Registre todos los daños que tiene el vehículo ANTES de la entrega.</p>

              {form.dañosPreExistentes.length > 0 && (
                <div className={styles.damageList}>
                  {form.dañosPreExistentes.map((d, idx) => (
                    <div key={idx} className={styles.damageItem}>
                      <span><strong>{d.ubicacion}</strong>: {d.descripcion}</span>
                      <button type="button" className={styles.removeBtn} onClick={() => removeDaño(idx)}>✕</button>
                    </div>
                  ))}
                </div>
              )}

              <div className={styles.addDamageRow}>
                <input
                  type="text"
                  placeholder="Descripción del daño"
                  value={nuevoDaño.descripcion}
                  onChange={e => setNuevoDaño(d => ({ ...d, descripcion: e.target.value }))}
                />
                <input
                  type="text"
                  placeholder="Ubicación (ej: puerta delantera izq.)"
                  value={nuevoDaño.ubicacion}
                  onChange={e => setNuevoDaño(d => ({ ...d, ubicacion: e.target.value }))}
                />
                <button type="button" className={styles.addBtn} onClick={addDaño}>
                  + Agregar
                </button>
              </div>
            </section>

            {/* Observaciones generales */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Observaciones generales</h2>
              <textarea
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                rows={3}
                placeholder="Cualquier información adicional relevante para la entrega..."
              />
            </section>

            <div className={styles.submitRow}>
              <button type="button" className={styles.cancelBtn} onClick={() => router.push('/dashboard/entregas')}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Registrando...' : 'Confirmar Check-Out'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
