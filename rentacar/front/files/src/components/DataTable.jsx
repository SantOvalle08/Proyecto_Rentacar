/**
 * @module components/DataTable
 * @description Componente de tabla de datos con ordenamiento y acciones
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import styles from './DataTable.module.css';

/**
 * @typedef {Object} Column
 * @property {string} key - Clave única de la columna
 * @property {string} label - Etiqueta de la columna
 * @property {boolean} [sortable=true] - Si la columna es ordenable
 * @property {function} [format] - Función para formatear el valor de la celda
 */

/**
 * @typedef {Object} SortConfig
 * @property {string|null} key - Clave de la columna ordenada
 * @property {('ascending'|'descending')} direction - Dirección del ordenamiento
 */

/**
 * Componente de tabla de datos con ordenamiento y acciones
 * @component
 * @param {Object} props - Propiedades del componente
 * @param {Array<Object>} props.data - Datos a mostrar en la tabla
 * @param {Array<Column>} props.columns - Configuración de columnas
 * @param {function} [props.onEdit] - Función para editar un elemento
 * @param {function} [props.onDelete] - Función para eliminar un elemento
 * @param {function} [props.onView] - Función para ver detalles de un elemento
 * @param {boolean} [props.actions=true] - Si mostrar la columna de acciones
 * @param {string} [props.itemName='Item'] - Nombre del tipo de elemento
 * @param {string} [props.emptyMessage='No hay datos disponibles'] - Mensaje cuando no hay datos
 * @param {boolean} [props.loading=false] - Si la tabla está cargando
 * @param {function} [props.customActionButtons] - Función para botones de acción personalizados
 * @returns {JSX.Element} Tabla de datos con ordenamiento y acciones
 */
export default function DataTable({ 
  data, 
  columns, 
  onEdit, 
  onDelete,
  onView,
  actions = true,
  itemName = 'Item',
  emptyMessage = 'No hay datos disponibles',
  loading = false,
  customActionButtons = null
}) {
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'ascending'
  });

  /**
   * Solicita ordenar por una columna específica
   * @param {string} key - Clave de la columna a ordenar
   */
  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  /**
   * Aplica el ordenamiento a los datos
   * @type {Array<Object>}
   */
  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const aValue = a[sortConfig.key];
    const bValue = b[sortConfig.key];
    
    if (aValue < bValue) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (aValue > bValue) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  /**
   * Obtiene el indicador de dirección de ordenamiento
   * @param {string} columnKey - Clave de la columna
   * @returns {string|null} Indicador de dirección o null
   */
  const getSortDirectionIndicator = (columnKey) => {
    if (sortConfig.key !== columnKey) return null;
    return sortConfig.direction === 'ascending' ? '↑' : '↓';
  };

  /**
   * Renderiza el contenido de una celda
   * @param {Object} item - Elemento de datos
   * @param {Column} column - Configuración de la columna
   * @returns {JSX.Element|string} Contenido de la celda
   */
  const renderCell = (item, column) => {
    // Handle special format functions
    if (column.format) {
      return column.format(item[column.key], item);
    }
    
    // Handle boolean values
    if (typeof item[column.key] === 'boolean') {
      return item[column.key] ? 'Sí' : 'No';
    }
    
    // Default rendering
    return item[column.key];
  };

  // Loading state
  if (loading) {
    return <div className={styles.loading}>Cargando...</div>;
  }

  // Empty state
  if (!data || data.length === 0) {
    return (
      <div className={styles.emptyState}>
        <p>{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className={styles.tableContainer}>
      <table className={styles.dataTable}>
        <thead>
          <tr>
            {columns.map((column) => (
              <th 
                key={column.key} 
                onClick={() => column.sortable !== false && requestSort(column.key)}
                className={column.sortable !== false ? styles.sortable : ''}
              >
                {column.label}
                {column.sortable !== false && 
                  <span className={styles.sortIndicator}>
                    {getSortDirectionIndicator(column.key)}
                  </span>
                }
              </th>
            ))}
            {actions && <th className={styles.actionsColumn}>Acciones</th>}
          </tr>
        </thead>
        <tbody>
          {sortedData.map((item) => (
            <tr key={item.id || item._id}>
              {columns.map((column) => (
                <td key={`${item.id || item._id}-${column.key}`}>
                  {renderCell(item, column)}
                </td>
              ))}
              {actions && (
                <td className={styles.actions}>
                  {onView && (
                    <button 
                      onClick={() => onView(item)} 
                      className={styles.viewButton}
                      aria-label={`Ver ${itemName}`}
                    >
                      Ver
                    </button>
                  )}
                  {onEdit && (
                    <button 
                      onClick={() => onEdit(item)} 
                      className={styles.editButton}
                      aria-label={`Editar ${itemName}`}
                    >
                      Editar
                    </button>
                  )}
                  {onDelete && (
                    <button 
                      onClick={() => onDelete(item)} 
                      className={styles.deleteButton}
                      aria-label={`Eliminar ${itemName}`}
                    >
                      Eliminar
                    </button>
                  )}
                  {customActionButtons && customActionButtons(item)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 