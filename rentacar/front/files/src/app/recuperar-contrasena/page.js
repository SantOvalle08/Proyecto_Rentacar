'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from './page.module.css';
import apiService from '@/services/api';

export default function RecuperarContrasena() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [nuevaContraseña, setNuevaContraseña] = useState('');
  const [confirmarContraseña, setConfirmarContraseña] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const handleVerificarEmail = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await apiService.auth.verificarEmail(email);
      setStep(2);
    } catch (err) {
      setError(err.message || 'No se pudo verificar el correo electrónico');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (nuevaContraseña !== confirmarContraseña) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (nuevaContraseña.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await apiService.auth.resetPassword(email, nuevaContraseña);
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || 'Error al actualizar la contraseña');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className={styles.container}>
        <h1 className={styles.title}>Recuperar contraseña</h1>

        {step === 1 && (
          <>
            <p className={styles.subtitle}>
              Ingresa tu correo electrónico y verificaremos si existe una cuenta asociada.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleVerificarEmail} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Correo Electrónico</label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="ejemplo@correo.com"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Verificando...' : 'Continuar'}
              </button>
            </form>
          </>
        )}

        {step === 2 && (
          <>
            <p className={styles.subtitle}>
              Ingresa tu nueva contraseña para la cuenta <strong>{email}</strong>.
            </p>

            {error && <div className={styles.error}>{error}</div>}

            <form onSubmit={handleResetPassword} className={styles.form}>
              <div className={styles.formGroup}>
                <label htmlFor="nuevaContraseña">Nueva contraseña</label>
                <input
                  type="password"
                  id="nuevaContraseña"
                  value={nuevaContraseña}
                  onChange={(e) => setNuevaContraseña(e.target.value)}
                  required
                  placeholder="Mínimo 6 caracteres"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmarContraseña">Confirmar contraseña</label>
                <input
                  type="password"
                  id="confirmarContraseña"
                  value={confirmarContraseña}
                  onChange={(e) => setConfirmarContraseña(e.target.value)}
                  required
                  placeholder="Repite la nueva contraseña"
                />
              </div>

              <button
                type="submit"
                className={styles.submitButton}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Confirmar nueva contraseña'}
              </button>
            </form>
          </>
        )}

        <div className={styles.backLink}>
          <Link href="/login">Volver al inicio de sesión</Link>
        </div>
      </div>

      {showSuccess && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <div className={styles.modalIcon}>✓</div>
            <h2 className={styles.modalTitle}>Nueva contraseña guardada</h2>
            <p className={styles.modalText}>
              Tu contraseña ha sido actualizada correctamente.
            </p>
            <button
              className={styles.modalButton}
              onClick={() => router.push('/login')}
            >
              Aceptar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
