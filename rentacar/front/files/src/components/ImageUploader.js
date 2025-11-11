'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './ImageUploader.module.css';

/**
 * Componente para subir y previsualizar imágenes.
 * Permite seleccionar una imagen y mostrar su previsualización.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.currentValue - URL o ruta de la imagen actual
 * @param {function} props.onChange - Función a llamar cuando se selecciona una imagen
 * @param {string} props.name - Nombre del campo (para formularios)
 */
export default function ImageUploader({ currentValue = '', onChange, name = 'imagen' }) {
  const [previewUrl, setPreviewUrl] = useState(currentValue);
  const [error, setError] = useState('');

  // Manejar la selección de archivos
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido');
      return;
    }
    
    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('La imagen no debe superar 2MB');
      return;
    }
    
    setError('');
    
    // Crear URL para previsualización
    const fileUrl = URL.createObjectURL(file);
    setPreviewUrl(fileUrl);
    
    // Extraer nombre de archivo para guardar la ruta relativa
    const fileName = file.name.toLowerCase().replace(/[^a-z0-9.]/g, '-');
    const localPath = `/images/autos/${fileName}`;
    
    // Llamar al callback con la ruta relativa
    if (onChange) {
      onChange({
        target: {
          name,
          value: localPath,
          file
        }
      });
    }
  };

  return (
    <div className={styles.imageUploader}>
      <div className={styles.previewContainer}>
        {previewUrl ? (
          <Image 
            src={previewUrl}
            alt="Vista previa" 
            width={200} 
            height={150}
            style={{ objectFit: 'cover' }}
            onError={() => setPreviewUrl('/images/autos/default-car.jpg')}
            unoptimized
          />
        ) : (
          <div className={styles.placeholder}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <span>Vista previa no disponible</span>
          </div>
        )}
      </div>
      
      <div className={styles.controls}>
        <input
          type="file"
          id={`file-${name}`}
          accept="image/*"
          onChange={handleFileChange}
          className={styles.fileInput}
        />
        <label htmlFor={`file-${name}`} className={styles.uploadButton}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          Subir imagen
        </label>
        
        <div className={styles.inputContainer}>
          <input
            type="text"
            value={currentValue}
            placeholder="URL o ruta de imagen"
            onChange={(e) => {
              if (onChange) {
                onChange({
                  target: {
                    name,
                    value: e.target.value
                  }
                });
              }
              setPreviewUrl(e.target.value);
            }}
            className={styles.urlInput}
          />
        </div>
      </div>
      
      {error && <p className={styles.error}>{error}</p>}
      
      <p className={styles.helpText}>
        Selecciona una imagen local o introduce una URL. Las imágenes locales se guardarán en <code>/images/autos/</code>
      </p>
    </div>
  );
} 