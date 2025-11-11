/**
 * @module components/Modal
 * @description Componente de ventana modal reutilizable
 */

'use client';

import { useEffect, useRef } from 'react';
import styles from './Modal.module.css';

/**
 * Componente de ventana modal reutilizable
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {function} props.onClose - Función para cerrar el modal
 * @param {string} props.title - Título del modal
 * @param {React.ReactNode} props.children - Contenido del modal
 * @param {('small'|'medium'|'large')} [props.size='medium'] - Tamaño del modal
 * @param {boolean} [props.showCloseButton=true] - Si mostrar el botón de cerrar
 * @returns {JSX.Element|null} Componente modal o null si no está abierto
 */
export default function Modal({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'medium',
  showCloseButton = true,
}) {
  const modalRef = useRef(null);

  /**
   * Maneja el cierre del modal con la tecla Escape y el scroll del body
   * @effect
   */
  useEffect(() => {
    const handleEsc = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEsc);
      // Prevent scrolling of the body when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = 'auto';
    };
  }, [isOpen, onClose]);

  /**
   * Maneja el cierre del modal al hacer clic fuera
   * @param {MouseEvent} e - Evento de clic
   */
  const handleOutsideClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay} onClick={handleOutsideClick}>
      <div 
        ref={modalRef}
        className={`${styles.modalContent} ${styles[size]}`}
        aria-modal="true"
        role="dialog"
      >
        <div className={styles.modalHeader}>
          <h2 className={styles.modalTitle}>{title}</h2>
          {showCloseButton && (
            <button
              type="button"
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Cerrar"
            >
              &times;
            </button>
          )}
        </div>
        <div className={styles.modalBody}>
          {children}
        </div>
      </div>
    </div>
  );
} 