'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiService from '@/services/api';
import styles from './page.module.css';

export default function UsuarioDetalle({ params }) {
  const router = useRouter();
  const { id } = use(params);

  const [usuario, setUsuario] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
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
    } catch {
      router.push('/login');
      return;
    }

    const loadUsuario = async () => {
      try {
        setLoading(true);
        setError('');

        const response = await apiService.usuarios.getById(id);

        if (response.success && response.data) {
          setUsuario(response.data);
          return;
        }

        // Fallback a localStorage
        const stored = localStorage.getItem('rentacar_usuarios');
        if (stored) {
          const lista = JSON.parse(stored);
          const found = lista.find(
            (u) =>
              String(u.id) === String(id) ||
              String(u._id) === String(id) ||
              String(u.idUser) === String(id)
          );
          if (found) {
            setUsuario(found);
            return;
          }
        }

        setError('No se encontró el usuario.');
      } catch (err) {
        console.error('Error al cargar usuario:', err);
        setError('Error al cargar los datos del usuario.');
      } finally {
        setLoading(false);
      }
    };

    if (id) loadUsuario();
  }, [id, router]);

  if (loading) {
    return (
      <div className={styles.centered}>
        <div className={styles.spinner} />
        <p>Cargando usuario...</p>
      </div>
    );
  }

  if (error || !usuario) {
    return (
      <div className={styles.centered}>
        <p className={styles.errorBox}>{error || 'Usuario no encontrado.'}</p>
        <Link href="/dashboard/usuarios" className={styles.backLink}>
          ← Volver a Usuarios
        </Link>
      </div>
    );
  }

  const userId = usuario._id || usuario.id || usuario.idUser;
  const initials = usuario.nombre
    ? usuario.nombre.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  return (
    <div className="container">
      <div className={styles.header}>
        <Link href="/dashboard/usuarios" className={styles.backLink}>
          ← Volver a Usuarios
        </Link>
        <h1 className={styles.title}>{usuario.nombre}</h1>
      </div>

      <div className={styles.card}>
        <div className={styles.avatarWrapper}>
          <div className={styles.avatar}>{initials}</div>
          <span className={usuario.rol === 'admin' ? styles.badgeAdmin : styles.badgeClient}>
            {usuario.rol === 'admin' ? 'Administrador' : 'Cliente'}
          </span>
        </div>

        <div className={styles.details}>
          <h2 className={styles.sectionTitle}>Información del Usuario</h2>

          <dl className={styles.grid}>
            <div className={styles.field}>
              <dt>Nombre</dt>
              <dd>{usuario.nombre || '—'}</dd>
            </div>
            <div className={styles.field}>
              <dt>Email</dt>
              <dd>{usuario.email || '—'}</dd>
            </div>
            <div className={styles.field}>
              <dt>Teléfono</dt>
              <dd>{usuario.telefono || '—'}</dd>
            </div>
            <div className={styles.field}>
              <dt>Tipo de Documento</dt>
              <dd>{usuario.tipoDocumento || '—'}</dd>
            </div>
            <div className={styles.field}>
              <dt>Número de Documento</dt>
              <dd>{usuario.numeroDocumento || '—'}</dd>
            </div>
            <div className={styles.field}>
              <dt>Rol</dt>
              <dd>{usuario.rol === 'admin' ? 'Administrador' : 'Cliente'}</dd>
            </div>
            <div className={styles.field}>
              <dt>ID</dt>
              <dd className={styles.id}>{String(userId)}</dd>
            </div>
          </dl>

          <div className={styles.actions}>
            <button
              className={styles.btnEdit}
              onClick={() => router.push(`/dashboard/usuarios?edit=${userId}`)}
            >
              Editar Usuario
            </button>
            <Link href="/dashboard/usuarios" className={styles.btnBack}>
              Volver al listado
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
