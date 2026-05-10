'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import apiService from '@/services/api';
import styles from './page.module.css';

const NIVELES_GAS = ['Vacío', '1/4', '1/2', '3/4', 'Lleno'];
const CONDICIONES = ['Excelente', 'Bueno', 'Regular', 'Malo', 'No funcional'];
const ESTADO_GENERAL = ['Excelente', 'Bueno', 'Regular', 'Malo', 'Requiere atención'];

export default function CheckinPage() {
  const router = useRouter();
  const { reservaId } = useParams();

  const [reserva, setReserva] = useState(null);
  const [entrega, setEntrega] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [form, setForm] = useState({
    kmRetorno: '',
    nivelGasolina: 'Lleno',
    porcentajeGasolina: 100,
    estadoGeneral: 'Bueno',
    observaciones: '',
    inventario: [],
    dañosNuevos: [],
    estadoFinalVehiculo: 'disponible'
  });

  const [nuevoDaño, setNuevoDaño] = useState({ descripcion: '', ubicacion: '', costoReparacion: 0 });
  const [nuevaIncidencia, setNuevaIncidencia] = useState({ tipo: 'Daño', descripcion: '', costoEstimado: 0 });
  const [showIncidencia, setShowIncidencia] = useState(false);

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed?.rol !== 'admin') { router.push('/'); return; }
    loadData();
  }, [reservaId]);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [reservaRes, checkoutRes] = await Promise.all([
        apiService.reservas.getById(reservaId),
        apiService.entregas.getCheckout(reservaId).catch(() => ({ success: false }))
      ]);

      if (!reservaRes.success || !reservaRes.data) {
        setError('No se encontró la reserva.'); return;
      }
      const r = reservaRes.data;
      setReserva(r);

      if (r.estado !== 'Alquilado') {
        setError(`Solo se puede hacer check-in de reservas en estado "Alquilado". Estado actual: ${r.estado}`);
        return;
      }

      if (checkoutRes.success && checkoutRes.data) {
        const e = checkoutRes.data;
        setEntrega(e);
        // Pre-fill return inventory from checkout
        setForm(f => ({
          ...f,
          nivelGasolina: e.nivelGasolina || 'Lleno',
          porcentajeGasolina: e.porcentajeGasolina ?? 100,
          inventario: (e.inventario || []).map(item => ({ ...item }))
        }));
      }
    } catch (e) {
      setError('Error al cargar los datos. Verifique la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

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
      dañosNuevos: [...f.dañosNuevos, { ...nuevoDaño, fecha: new Date().toISOString() }]
    }));
    setNuevoDaño({ descripcion: '', ubicacion: '', costoReparacion: 0 });
  };

  const removeDaño = (idx) =>
    setForm(f => ({ ...f, dañosNuevos: f.dañosNuevos.filter((_, i) => i !== idx) }));

  // Live charge preview
  const calcChargePreview = () => {
    if (!entrega || !reserva) return [];
    const auto = reserva.auto || {};
    const precioDia = auto.precioDia || 0;
    const charges = [];

    const gasDiff = (entrega.porcentajeGasolina ?? 100) - (form.porcentajeGasolina ?? 100);
    if (gasDiff > 5) {
      charges.push({
        concepto: `Combustible faltante (${gasDiff.toFixed(0)}% menos)`,
        monto: Math.round(gasDiff * precioDia * 0.015),
        tipo: 'combustible'
      });
    }

    const fechaFin = new Date(reserva.fechaFin);
    const ahora = new Date();
    if (ahora > fechaFin) {
      const diasExtra = Math.ceil((ahora - fechaFin) / (1000 * 60 * 60 * 24));
      charges.push({
        concepto: `Retraso (${diasExtra} día(s) adicional(es))`,
        monto: Math.round(diasExtra * precioDia * 1.5),
        tipo: 'retraso'
      });
    }

    (entrega.inventario || []).forEach(itemSalida => {
      const itemRetorno = form.inventario.find(i => i.nombre === itemSalida.nombre);
      if (itemSalida.presente && (!itemRetorno || !itemRetorno.presente)) {
        charges.push({
          concepto: `Falta: ${itemSalida.nombre}`,
          monto: Math.round(precioDia * 0.5),
          tipo: 'accesorio'
        });
      }
    });

    form.dañosNuevos.forEach(d => {
      if (d.costoReparacion > 0) {
        charges.push({
          concepto: `Daño: ${d.descripcion}`,
          monto: Number(d.costoReparacion),
          tipo: 'daño'
        });
      }
    });

    return charges;
  };

  const chargePreview = calcChargePreview();
  const totalPreview = chargePreview.reduce((s, c) => s + c.monto, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.kmRetorno) { setError('El kilometraje de retorno es requerido.'); return; }
    if (entrega && Number(form.kmRetorno) < entrega.kmSalida) {
      setError(`El kilometraje de retorno (${form.kmRetorno}) no puede ser menor al de salida (${entrega.kmSalida}).`);
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await apiService.entregas.checkin(reservaId, {
        ...form,
        kmRetorno: Number(form.kmRetorno),
        porcentajeGasolina: Number(form.porcentajeGasolina),
        dañosNuevos: form.dañosNuevos.map(d => ({
          ...d,
          costoReparacion: Number(d.costoReparacion)
        }))
      });
      if (res.success) {
        setSuccess(
          `Check-in registrado. ${res.data?.totalCargosAdicionales > 0
            ? `Cargos adicionales: $${res.data.totalCargosAdicionales.toLocaleString()}`
            : 'Sin cargos adicionales.'}`
        );
        setTimeout(() => router.push('/dashboard/entregas'), 2500);
      } else {
        setError(res.message || 'Error al registrar el check-in.');
      }
    } catch (e) {
      setError(e.message || 'Error al conectar con el servidor.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <button className={styles.backBtn} onClick={() => router.push('/dashboard/entregas')}>
          ← Volver a entregas
        </button>

        <h1 className={styles.title}>Check-In — Devolución del vehículo</h1>
        <p className={styles.subtitle}>Reserva #{reservaId}</p>

        {error && <div className={styles.errorBanner}>{error}</div>}
        {success && <div className={styles.successBanner}>{success}</div>}

        {/* Summary cards */}
        {reserva && (
          <div className={styles.summaryRow}>
            <div className={styles.infoCard}>
              <h3>Reserva</h3>
              <p><strong>Cliente:</strong> {reserva.usuario ? `${reserva.usuario.nombre} ${reserva.usuario.apellido}` : '—'}</p>
              <p><strong>Vehículo:</strong> {reserva.auto ? `${reserva.auto.marca} ${reserva.auto.modelo} ${reserva.auto.año}` : '—'}{reserva.auto?.matricula && ` · ${reserva.auto.matricula}`}</p>
              <p><strong>Período:</strong> {new Date(reserva.fechaInicio).toLocaleDateString('es-ES')} → {new Date(reserva.fechaFin).toLocaleDateString('es-ES')}</p>
              <p><strong>Total base:</strong> ${reserva.precioTotal?.toLocaleString()}</p>
            </div>
            {entrega && (
              <div className={styles.infoCard}>
                <h3>Datos de check-out</h3>
                <p><strong>Fecha salida:</strong> {new Date(entrega.fechaEntrega).toLocaleString('es-ES')}</p>
                <p><strong>Km salida:</strong> {entrega.kmSalida?.toLocaleString()}</p>
                <p><strong>Gasolina salida:</strong> {entrega.nivelGasolina} ({entrega.porcentajeGasolina}%)</p>
                <p><strong>Daños pre-existentes:</strong> {entrega.dañosPreExistentes?.length || 0}</p>
              </div>
            )}
          </div>
        )}

        {reserva?.estado === 'Alquilado' && (
          <form onSubmit={handleSubmit} className={styles.form}>

            {/* Kilometraje y combustible */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>1. Estado al retorno</h2>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Kilometraje de retorno *</label>
                  <input
                    type="number"
                    min={entrega?.kmSalida || 0}
                    required
                    value={form.kmRetorno}
                    onChange={e => setForm(f => ({ ...f, kmRetorno: e.target.value }))}
                    placeholder={entrega ? `Mínimo ${entrega.kmSalida}` : 'Km actuales'}
                  />
                  {entrega && form.kmRetorno && (
                    <span className={styles.hint}>
                      Km recorridos: {(Number(form.kmRetorno) - entrega.kmSalida).toLocaleString()}
                    </span>
                  )}
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
                  {entrega && (
                    <span className={styles.hint}>
                      Salida: {entrega.porcentajeGasolina}%
                      {entrega.porcentajeGasolina - form.porcentajeGasolina > 5 &&
                        <span className={styles.warningText}> ⚠ Déficit de {entrega.porcentajeGasolina - form.porcentajeGasolina}%</span>}
                    </span>
                  )}
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
            {form.inventario.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>2. Verificación de accesorios</h2>
                <div className={styles.inventoryTable}>
                  <table className={styles.table}>
                    <thead>
                      <tr>
                        <th>Accesorio</th>
                        <th>Salió</th>
                        <th>Volvió</th>
                        <th>Condición</th>
                        <th>Notas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {form.inventario.map((item, idx) => {
                        const salidaItem = entrega?.inventario?.find(i => i.nombre === item.nombre);
                        const missing = salidaItem?.presente && !item.presente;
                        return (
                          <tr key={item.nombre} className={missing ? styles.rowMissing : ''}>
                            <td>{item.nombre}</td>
                            <td className={styles.centeredCell}>
                              {salidaItem?.presente ? '✓' : '✗'}
                            </td>
                            <td className={styles.centeredCell}>
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
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </section>
            )}

            {/* Daños nuevos */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>3. Daños nuevos detectados</h2>
              <p className={styles.hint}>Solo registre daños que NO estaban presentes al momento de la entrega.</p>

              {entrega?.dañosPreExistentes?.length > 0 && (
                <div className={styles.preExistingNote}>
                  <strong>Daños pre-existentes (referencia):</strong>
                  <ul>
                    {entrega.dañosPreExistentes.map((d, i) => (
                      <li key={i}>{d.ubicacion}: {d.descripcion}</li>
                    ))}
                  </ul>
                </div>
              )}

              {form.dañosNuevos.length > 0 && (
                <div className={styles.damageList}>
                  {form.dañosNuevos.map((d, idx) => (
                    <div key={idx} className={styles.damageItem}>
                      <span>
                        <strong>{d.ubicacion}</strong>: {d.descripcion}
                        {d.costoReparacion > 0 && ` · $${Number(d.costoReparacion).toLocaleString()}`}
                      </span>
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
                  placeholder="Ubicación (ej: puerta trasera der.)"
                  value={nuevoDaño.ubicacion}
                  onChange={e => setNuevoDaño(d => ({ ...d, ubicacion: e.target.value }))}
                />
                <input
                  type="number"
                  min="0"
                  placeholder="Costo estimado $"
                  value={nuevoDaño.costoReparacion}
                  onChange={e => setNuevoDaño(d => ({ ...d, costoReparacion: e.target.value }))}
                />
                <button type="button" className={styles.addBtn} onClick={addDaño}>
                  + Agregar
                </button>
              </div>
            </section>

            {/* Cargos adicionales preview */}
            {chargePreview.length > 0 && (
              <section className={styles.section}>
                <h2 className={styles.sectionTitle}>Cargos adicionales estimados</h2>
                <div className={styles.chargeList}>
                  {chargePreview.map((c, i) => (
                    <div key={i} className={styles.chargeRow}>
                      <span className={`${styles.chargeBadge} ${styles[`badge_${c.tipo}`]}`}>{c.tipo}</span>
                      <span className={styles.chargeConcept}>{c.concepto}</span>
                      <span className={styles.chargeAmount}>${c.monto.toLocaleString()}</span>
                    </div>
                  ))}
                  <div className={styles.chargeTotal}>
                    <span>Total adicional</span>
                    <span>${totalPreview.toLocaleString()}</span>
                  </div>
                </div>
              </section>
            )}

            {/* Estado final del vehículo */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>4. Estado final del vehículo</h2>
              <div className={styles.radioRow}>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="estadoFinal"
                    value="disponible"
                    checked={form.estadoFinalVehiculo === 'disponible'}
                    onChange={() => setForm(f => ({ ...f, estadoFinalVehiculo: 'disponible' }))}
                  />
                  Disponible para alquiler
                </label>
                <label className={styles.radioLabel}>
                  <input
                    type="radio"
                    name="estadoFinal"
                    value="mantenimiento"
                    checked={form.estadoFinalVehiculo === 'mantenimiento'}
                    onChange={() => setForm(f => ({ ...f, estadoFinalVehiculo: 'mantenimiento' }))}
                  />
                  Enviar a mantenimiento
                </label>
              </div>
            </section>

            {/* Observaciones */}
            <section className={styles.section}>
              <h2 className={styles.sectionTitle}>5. Observaciones generales</h2>
              <textarea
                value={form.observaciones}
                onChange={e => setForm(f => ({ ...f, observaciones: e.target.value }))}
                rows={3}
                placeholder="Notas adicionales sobre la devolución..."
              />
            </section>

            <div className={styles.submitRow}>
              <button type="button" className={styles.cancelBtn} onClick={() => router.push('/dashboard/entregas')}>
                Cancelar
              </button>
              <button type="submit" className={styles.submitBtn} disabled={submitting}>
                {submitting ? 'Registrando...' : 'Confirmar Check-In'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
