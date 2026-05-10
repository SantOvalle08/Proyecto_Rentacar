'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import styles from './page.module.css';

export default function EntregasPage() {
  const router = useRouter();
  const [tab, setTab] = useState('activos');
  const [activos, setActivos] = useState([]);
  const [pendientes, setPendientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const userData = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
    if (!userData) { router.push('/login'); return; }
    const parsed = JSON.parse(userData);
    if (parsed?.rol !== 'admin') { router.push('/'); return; }
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [activosRes, pendientesRes] = await Promise.all([
        apiService.entregas.getAlquiladosActivos(),
        apiService.entregas.getPendientesCheckout()
      ]);
      if (activosRes.success) setActivos(activosRes.data || []);
      if (pendientesRes.success) setPendientes(pendientesRes.data || []);
    } catch (e) {
      setError('No se pudo conectar con el servidor. Verifique que el backend esté activo.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
  const formatDateTime = (d) => d ? new Date(d).toLocaleString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const isOverdue = (fechaFin) => new Date(fechaFin) < new Date();

  if (loading) return <div className={styles.loading}>Cargando...</div>;

  return (
    <div className="container">
      <div className={styles.pageContainer}>
        <div className={styles.header}>
          <div>
            <h1 className={styles.title}>Gestión de Entregas</h1>
            <p className={styles.subtitle}>Control de check-out y check-in de vehículos</p>
          </div>
          <button className={styles.refreshBtn} onClick={loadData}>Actualizar</button>
        </div>

        {error && <div className={styles.errorBanner}>{error}</div>}

        <div className={styles.tabs}>
          <button
            className={`${styles.tab} ${tab === 'activos' ? styles.tabActive : ''}`}
            onClick={() => setTab('activos')}
          >
            En alquiler
            {activos.length > 0 && <span className={styles.badge}>{activos.length}</span>}
          </button>
          <button
            className={`${styles.tab} ${tab === 'pendientes' ? styles.tabActive : ''}`}
            onClick={() => setTab('pendientes')}
          >
            Pendientes de entrega
            {pendientes.length > 0 && <span className={styles.badge}>{pendientes.length}</span>}
          </button>
        </div>

        {tab === 'activos' && (
          <div>
            {activos.length === 0 ? (
              <div className={styles.emptyState}>No hay vehículos alquilados en este momento.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Reserva</th>
                      <th>Vehículo</th>
                      <th>Cliente</th>
                      <th>Fecha salida</th>
                      <th>Fecha retorno prevista</th>
                      <th>Incidencias</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activos.map((item) => {
                      const r = item.reserva;
                      const overdue = isOverdue(r.fechaFin);
                      return (
                        <tr key={r.id} className={overdue ? styles.rowOverdue : ''}>
                          <td>#{r.id}</td>
                          <td>
                            {r.auto ? `${r.auto.marca} ${r.auto.modelo}` : '—'}
                            {r.auto?.matricula && <span className={styles.matricula}> ({r.auto.matricula})</span>}
                          </td>
                          <td>
                            {r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : '—'}
                          </td>
                          <td>{item.entrega ? formatDateTime(item.entrega.fechaEntrega) : formatDate(r.fechaInicio)}</td>
                          <td>
                            <span className={overdue ? styles.overdueText : ''}>
                              {formatDate(r.fechaFin)}
                              {overdue && ' ⚠ Retrasado'}
                            </span>
                          </td>
                          <td>
                            {item.incidenciasPendientes > 0
                              ? <span className={styles.incBadge}>{item.incidenciasPendientes}</span>
                              : <span className={styles.incNone}>—</span>}
                          </td>
                          <td className={styles.actionCell}>
                            <button
                              className={styles.btnCheckin}
                              onClick={() => router.push(`/dashboard/entregas/checkin/${r.id}`)}
                            >
                              Check-in
                            </button>
                            <button
                              className={styles.btnSecondary}
                              onClick={() => router.push(`/dashboard/reservas/${r.id}`)}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'pendientes' && (
          <div>
            {pendientes.length === 0 ? (
              <div className={styles.emptyState}>No hay reservas confirmadas pendientes de entrega.</div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Reserva</th>
                      <th>Vehículo</th>
                      <th>Cliente</th>
                      <th>Fecha inicio</th>
                      <th>Fecha fin</th>
                      <th>Total</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendientes.map((r) => (
                      <tr key={r.id}>
                        <td>#{r.id}</td>
                        <td>
                          {r.auto ? `${r.auto.marca} ${r.auto.modelo}` : '—'}
                          {r.auto?.matricula && <span className={styles.matricula}> ({r.auto.matricula})</span>}
                        </td>
                        <td>
                          {r.usuario ? `${r.usuario.nombre} ${r.usuario.apellido}` : '—'}
                        </td>
                        <td>{formatDate(r.fechaInicio)}</td>
                        <td>{formatDate(r.fechaFin)}</td>
                        <td>${r.precioTotal?.toLocaleString()}</td>
                        <td className={styles.actionCell}>
                          <button
                            className={styles.btnCheckout}
                            onClick={() => router.push(`/dashboard/entregas/checkout/${r.id}`)}
                          >
                            Check-out
                          </button>
                          <button
                            className={styles.btnSecondary}
                            onClick={() => router.push(`/dashboard/reservas/${r.id}`)}
                          >
                            Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
