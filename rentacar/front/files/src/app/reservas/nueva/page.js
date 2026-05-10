'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import styles from './page.module.css';
import apiService from '@/services/api';

// Métodos de pago disponibles
const METODOS_PAGO = [
  { 
    id: 'mercadopago', 
    nombre: 'Mercado Pago', 
    descripcion: 'Paga de forma segura con tu cuenta de Mercado Pago',
    campos: ['email', 'fotoPasaporte', 'fotoLicencia']
  },
  { 
    id: 'tarjeta', 
    nombre: 'Tarjeta de Crédito/Débito', 
    descripcion: 'Visa, Mastercard, American Express, etc.',
    campos: ['tipoTarjeta', 'ultimosDigitos', 'fotoPasaporte', 'fotoLicencia']  // Campos simplificados para mayor seguridad
  },
  { 
    id: 'transferencia', 
    nombre: 'Transferencia Bancaria', 
    descripcion: 'Realiza una transferencia a nuestra cuenta bancaria',
    campos: ['nombreTitular', 'emailConfirmacion', 'comprobante', 'fotoPasaporte', 'fotoLicencia']
  },
  { 
    id: 'efectivo', 
    nombre: 'Efectivo al retirar', 
    descripcion: 'Pago en efectivo al momento de retirar el vehículo',
    campos: ['fotoPasaporte', 'fotoLicencia']
  }
];

// Componente de carga para Suspense
function ReservaLoading() {
  return (
    <div className="container">
      <div className={styles.loading}>Cargando formulario de reserva...</div>
    </div>
  );
}

// Componente principal que usa useSearchParams
function ReservaFormulario() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Estado para el auto seleccionado
  const [auto, setAuto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estado para los datos de la reserva
  const [fechaInicio, setFechaInicio] = useState(null);
  const [fechaFin, setFechaFin] = useState(null);
  const [precioBase, setPrecioBase] = useState(0);
  const [precioTotal, setPrecioTotal] = useState(0);
  const [diasReserva, setDiasReserva] = useState(0);
  
  // Estado para el método de pago
  const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState(null);
  const [datosPago, setDatosPago] = useState({});
  const [archivosDocumentos, setArchivosDocumentos] = useState({}); // Para guardar los archivos reales
  const [enviandoReserva, setEnviandoReserva] = useState(false);
  const [reservaExitosa, setReservaExitosa] = useState(false);
  const [showConfirmationPopup, setShowConfirmationPopup] = useState(false);

  // Obtener los datos del vehículo y procesar los parámetros de la URL
  useEffect(() => {
    const fetchAutoYProcesarParams = async () => {
      try {
        setLoading(true);
        setError('');

        // Obtener parámetros de la URL
        const autoId = searchParams.get('autoId');
        const fechaInicioParam = searchParams.get('fechaInicio');
        const fechaFinParam = searchParams.get('fechaFin');
        const precioTotalParam = searchParams.get('precioTotal');

        if (!autoId) {
          setError('No se ha seleccionado un vehículo para reservar');
          setLoading(false);
          return;
        }

        // Procesar fechas si se proporcionaron en la URL
        let inicio = null;
        let fin = null;
        
        if (fechaInicioParam) {
          inicio = new Date(fechaInicioParam);
          setFechaInicio(inicio);
        }
        
        if (fechaFinParam) {
          fin = new Date(fechaFinParam);
          setFechaFin(fin);
        }

        // Si ambas fechas fueron provistas en la URL, validar orden lógico
        if (inicio && fin && inicio >= fin) {
          setError('La fecha de inicio debe ser anterior a la fecha de fin');
          setLoading(false);
          return;
        }
        
        if (precioTotalParam) {
          setPrecioTotal(Number(precioTotalParam));
        }

        // Calcular días de reserva inmediatamente si tenemos ambas fechas
        if (inicio && fin) {
          const diffTime = Math.abs(fin - inicio);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          setDiasReserva(diffDays);
        }

        // Obtener datos del auto
        try {
          const response = await apiService.autos.getById(autoId);
          
          if (response.success && response.data) {
            setAuto(response.data);
            const precio = response.data.precioBase || response.data.precioDia || 0;
            setPrecioBase(precio);
            
            // Calcular precio total si no se pasó en la URL pero tenemos las fechas
            if (inicio && fin && !precioTotalParam) {
              const diffTime = Math.abs(fin - inicio);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              setDiasReserva(diffDays);
              setPrecioTotal(diffDays * precio);
            }
            
            setLoading(false);
            return;
          }
          
          throw new Error('No se pudo obtener la información del vehículo');
        } catch (error) {
          console.error('Error al obtener detalles del auto:', error);
          
          // Intentar obtener desde localStorage
          try {
            if (typeof window !== 'undefined') {
              const localData = localStorage.getItem('rentacar_autos');
              if (localData) {
                const parsedData = JSON.parse(localData);
                if (Array.isArray(parsedData)) {
                  const autoEncontrado = parsedData.find(a => a.id == autoId);
                  if (autoEncontrado) {
                    setAuto(autoEncontrado);
                    const precio = autoEncontrado.precioBase || autoEncontrado.precioDia || 0;
                    setPrecioBase(precio);
                    
                    // Calcular precio total si no se pasó en la URL pero tenemos las fechas
                    if (inicio && fin && !precioTotalParam) {
                      const diffTime = Math.abs(fin - inicio);
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      setDiasReserva(diffDays);
                      setPrecioTotal(diffDays * precio);
                    }
                    
                    setLoading(false);
                    return;
                  }
                }
              }
            }
          } catch (localError) {
            console.error('Error al obtener vehículo de localStorage:', localError);
          }
          
          setError('No se pudo encontrar el vehículo solicitado');
          setLoading(false);
        }
      } catch (error) {
        console.error('Error general:', error);
        setError('Error al cargar los datos para la reserva');
        setLoading(false);
      }
    };

    fetchAutoYProcesarParams();
  }, [searchParams]);

  // Manejar cambios en fechas
  const handleFechaInicioChange = (e) => {
    const fecha = e.target.valueAsDate;
    setFechaInicio(fecha);
    
    // Restablecer fecha fin si la nueva fecha inicio es posterior
    if (fechaFin && fecha > fechaFin) {
      setFechaFin(null);
    }
    
    // Recalcular precio si ambas fechas están definidas
    if (fecha && fechaFin && precioBase) {
      const diffTime = Math.abs(fechaFin - fecha);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDiasReserva(diffDays);
      setPrecioTotal(diffDays * precioBase);
    } else {
      setPrecioTotal(0);
      setDiasReserva(0);
    }
  };

  const handleFechaFinChange = (e) => {
    const fecha = e.target.valueAsDate;
    setFechaFin(fecha);
    
    // Recalcular precio si ambas fechas están definidas
    if (fechaInicio && fecha && precioBase) {
      const diffTime = Math.abs(fecha - fechaInicio);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      setDiasReserva(diffDays);
      setPrecioTotal(diffDays * precioBase);
    } else {
      setPrecioTotal(0);
      setDiasReserva(0);
    }
  };

  // Manejar selección de método de pago
  const handleMetodoPagoChange = (metodo) => {
    setMetodoPagoSeleccionado(metodo);
    
    // Resetear los datos de pago al cambiar de método
    setDatosPago({});
  };

  // Manejar cambios en datos de pago
  const handleDatosPagoChange = (e) => {
    const { name, value } = e.target;
    setDatosPago(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Verificar si los datos de pago están completos
  const datosPagoCompletos = () => {
    if (!metodoPagoSeleccionado) return false;
    
    // Verificar que todos los campos requeridos (excepto archivos) tengan datos según el método de pago
    const camposTexto = metodoPagoSeleccionado.campos.filter(campo => 
      campo !== 'fotoPasaporte' && campo !== 'fotoLicencia'
    );
    
    return camposTexto.every(campo => 
      datosPago[campo] && datosPago[campo].trim() !== ''
    );
  };

  // Manejar envío de la reserva
  const handleEnviarReserva = async () => {
    if (!auto || !fechaInicio || !fechaFin || !metodoPagoSeleccionado || precioTotal <= 0) {
      setError('Complete todos los campos requeridos y asegúrese que las fechas sean válidas');
      return;
    }

    // Validación explícita de orden de fechas
    if (fechaInicio >= fechaFin) {
      setError('La fecha de inicio debe ser anterior a la fecha de fin');
      return;
    }

    try {
      const porcentajeAnticipo = 30;
      const montoAnticipo = Math.round((precioTotal * (porcentajeAnticipo / 100)) * 100) / 100;
      const saldoPendiente = Math.round((Math.max(precioTotal - montoAnticipo, 0)) * 100) / 100;

      const checkoutDraft = {
        auto: {
          id: auto.id,
          marca: auto.marca,
          modelo: auto.modelo,
          anio: auto.anio,
          placa: auto.placa || auto.matricula || 'Sin placa',
          tipo: auto.tipo || 'Automóvil',
          imagen: auto.imagen
        },
        autoId: auto.id,
        fechaInicio: fechaInicio.toISOString(),
        fechaFin: fechaFin.toISOString(),
        precioTotal,
        diasReserva,
        metodoPago: metodoPagoSeleccionado.id,
        metodoPagoLabel: metodoPagoSeleccionado.nombre,
        datosPago,
        porcentajeAnticipo,
        montoAnticipo,
        saldoPendiente,
        estadoPago: 'Anticipo pendiente',
        origen: 'reservas/nueva'
      };

      if (typeof window !== 'undefined') {
        sessionStorage.setItem('rentacar_checkout_draft', JSON.stringify(checkoutDraft));
      }

      router.push('/reservas/pago');
    } catch (error) {
      console.error('Error preparando la pasarela de pago:', error);
      setError('No se pudo preparar la pasarela de pago. Inténtelo de nuevo.');
    }
  };

  // Componente para el mensaje pop-up
  const ConfirmationPopup = () => {
    return (
      <div className={styles.popupOverlay}>
        <div className={styles.popupContent}>
          <h3>Reserva en Proceso</h3>
          <p>Se ha comenzado el proceso de reservar el vehículo. Pronto un asesor se comunicará con usted sobre el estado de su reserva.</p>
          <button 
            className={styles.popupButton}
            onClick={() => setShowConfirmationPopup(false)}
          >
            Aceptar
          </button>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container">
        <div className={styles.loading}>Cargando datos para la reserva...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className={styles.error}>
          <h2>Error</h2>
          <p>{error}</p>
          <Link href="/catalogo" className={styles.cancelarButton}>
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  if (reservaExitosa) {
    return (
      <div className="container">
        <div className={styles.success}>
          <h2>¡Reserva realizada con éxito!</h2>
          <p>Tu reserva del vehículo {auto.marca} {auto.modelo} ha sido procesada correctamente.</p>
          <p>Recibirás un correo electrónico con los detalles de tu reserva.</p>
          <div className={styles.accionesContainer}>
            <Link href="/reservas" className={styles.confirmarButton}>
              Ver mis reservas
            </Link>
            <Link href="/catalogo" className={styles.cancelarButton}>
              Volver al catálogo
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!auto) {
    return (
      <div className="container">
        <div className={styles.error}>
          <h2>Vehículo no encontrado</h2>
          <p>No pudimos encontrar el vehículo que quieres reservar.</p>
          <Link href="/catalogo" className={styles.cancelarButton}>
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1 className={styles.pageTitle}>Completar Reserva</h1>
      
      {/* Pop-up de confirmación */}
      {showConfirmationPopup && <ConfirmationPopup />}
      
      <div className={styles.reservaContainer}>
        {/* Columna izquierda: Detalles del auto */}
        <div className={styles.detalleAuto}>
          <h2 className={styles.pageSubtitle}>Vehículo seleccionado</h2>
          
          <div className={styles.autoImage}>
            <Image 
              src={
                (auto.imagen && (auto.imagen.startsWith('http') || auto.imagen.startsWith('/'))) 
                  ? auto.imagen 
                  : `/images/autos/${auto.marca.toLowerCase()}-${auto.modelo.toLowerCase()}.jpg`
              }
              alt={`${auto.marca} ${auto.modelo}`}
              fill
              style={{ objectFit: 'cover' }}
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/autos/default-car.jpg';
              }}
              unoptimized
            />
          </div>
          
          <h3 className={styles.autoTitle}>{auto.marca} {auto.modelo}</h3>
          <p className={styles.autoSubtitle}>{auto.anio} - {auto.tipo}</p>
          
          <div className={styles.infoGroup}>
            <p className={styles.infoLabel}>Precio base</p>
            <p className={styles.infoValue}>${precioBase} / día</p>
          </div>
          
          {auto?.color && (
            <div className={styles.infoGroup}>
              <p className={styles.infoLabel}>Color</p>
              <p className={styles.infoValue}>{auto.color}</p>
            </div>
          )}
        </div>
        
        {/* Columna derecha: Detalles de la reserva */}
        <div className={styles.detalleReserva}>
          <h2 className={styles.pageSubtitle}>Detalles de la reserva</h2>
          
          <div className={styles.fechasContainer}>
            <div className={styles.fechaItem}>
              <label htmlFor="fechaInicio">Fecha inicio</label>
              <input 
                type="date" 
                id="fechaInicio"
                value={fechaInicio ? fechaInicio.toISOString().split('T')[0] : ''}
                min={new Date().toISOString().split('T')[0]}
                onChange={handleFechaInicioChange}
                className={styles.fechaInput}
                required
              />
            </div>
            
            <div className={styles.fechaItem}>
              <label htmlFor="fechaFin">Fecha final</label>
              <input 
                type="date" 
                id="fechaFin"
                value={fechaFin ? fechaFin.toISOString().split('T')[0] : ''}
                min={fechaInicio ? new Date(fechaInicio.getTime() + 86400000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]}
                onChange={handleFechaFinChange}
                disabled={!fechaInicio}
                className={styles.fechaInput}
                required
              />
            </div>
          </div>
          
          <div className={styles.precioContainer}>
            <div className={styles.precioRow}>
              <span>Precio por día:</span>
              <span>${precioBase}</span>
            </div>
            <div className={styles.precioRow}>
              <span>Días de alquiler:</span>
              <span>{diasReserva || 0}</span>
            </div>
            <div className={styles.divider}></div>
            <div className={styles.precioRow}>
              <span>Precio total:</span>
              <span className={styles.precioTotal}>${precioTotal.toFixed(2)}</span>
            </div>
            <div className={styles.precioRow}>
              <span>Anticipo para reservar (30%):</span>
              <span>${(precioTotal * 0.3).toFixed(2)}</span>
            </div>
            <div className={styles.precioRow}>
              <span>Saldo pendiente:</span>
              <span>${(precioTotal * 0.7).toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Métodos de pago */}
      <div className={styles.metodosPago}>
        <h2 className={styles.pageSubtitle}>Método de pago</h2>
        
        <div className={styles.metodoPagoOptions}>
          {METODOS_PAGO.map(metodo => (
            <div 
              key={metodo.id}
              className={`${styles.metodoPagoOption} ${metodoPagoSeleccionado?.id === metodo.id ? styles.metodoPagoSelected : ''}`}
              onClick={() => handleMetodoPagoChange(metodo)}
            >
              <div className={styles.metodoPagoIcon}>
                {metodo.id === 'mercadopago' && '💳'}
                {metodo.id === 'tarjeta' && '💳'}
                {metodo.id === 'transferencia' && '🏦'}
                {metodo.id === 'efectivo' && '💵'}
              </div>
              <div className={styles.metodoPagoDetails}>
                <div className={styles.metodoPagoTitle}>{metodo.nombre}</div>
                <div className={styles.metodoPagoDescription}>{metodo.descripcion}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Campos específicos para el método de pago seleccionado */}
        {metodoPagoSeleccionado && (
          <div className={styles.datosPagoContainer}>
            <h3>Datos de pago - {metodoPagoSeleccionado.nombre}</h3>
            
            {/* Documentos obligatorios para todos los métodos de pago */}
            <div className={styles.documentosObligatorios}>
              <h4>Documentos Obligatorios</h4>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="fotoPasaporte">Foto del Pasaporte</label>
                <input
                  type="file"
                  id="fotoPasaporte"
                  name="fotoPasaporte"
                  accept="image/jpeg,image/png,application/pdf"
                  className={styles.formInput}
                  onChange={(e) => {
                    try {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDatosPago(prev => ({
                          ...prev,
                          fotoPasaporte: file.name
                        }));
                        setArchivosDocumentos(prev => ({
                          ...prev,
                          fotoPasaporte: file
                        }));
                      } else {
                        // Usuario canceló o no seleccionó archivo
                        setDatosPago(prev => ({
                          ...prev,
                          fotoPasaporte: ''
                        }));
                        setArchivosDocumentos(prev => {
                          const newState = { ...prev };
                          delete newState.fotoPasaporte;
                          return newState;
                        });
                      }
                    } catch (error) {
                      console.warn('Error al seleccionar archivo de pasaporte:', error);
                    }
                  }}
                />
                <small className={styles.formHelp}>Adjunta una foto clara del pasaporte en formato JPG, PNG o PDF</small>
                {datosPago.fotoPasaporte && (
                  <small className={styles.fileName}>📄 {datosPago.fotoPasaporte}</small>
                )}
              </div>
              
              <div className={styles.formGroup}>
                <label className={styles.formLabel} htmlFor="fotoLicencia">Foto de la Licencia de Conducción (ambos lados)</label>
                <input
                  type="file"
                  id="fotoLicencia"
                  name="fotoLicencia"
                  accept="image/jpeg,image/png,application/pdf"
                  className={styles.formInput}
                  onChange={(e) => {
                    try {
                      const file = e.target.files?.[0];
                      if (file) {
                        setDatosPago(prev => ({
                          ...prev,
                          fotoLicencia: file.name
                        }));
                        setArchivosDocumentos(prev => ({
                          ...prev,
                          fotoLicencia: file
                        }));
                      } else {
                        // Usuario canceló o no seleccionó archivo
                        setDatosPago(prev => ({
                          ...prev,
                          fotoLicencia: ''
                        }));
                        setArchivosDocumentos(prev => {
                          const newState = { ...prev };
                          delete newState.fotoLicencia;
                          return newState;
                        });
                      }
                    } catch (error) {
                      console.warn('Error al seleccionar archivo de licencia:', error);
                    }
                  }}
                  required
                />
                <small className={styles.formHelp}>Adjunta una foto clara de ambos lados de la licencia en formato JPG, PNG o PDF</small>
                {datosPago.fotoLicencia && (
                  <small className={styles.fileName}>📄 {datosPago.fotoLicencia}</small>
                )}
              </div>
            </div>
            
            {metodoPagoSeleccionado.id !== 'efectivo' && (
              <>
                {metodoPagoSeleccionado.id === 'tarjeta' && (
                  <>
                    <div className={styles.infoGroup}>
                      <p className={styles.disclaimer}>
                        Por tu seguridad, no solicitamos datos sensibles de tu tarjeta a través de este formulario. 
                        Al confirmar la reserva, serás redirigido a nuestro procesador de pagos seguro.
                      </p>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="tipoTarjeta">Tipo de tarjeta</label>
                      <select
                        id="tipoTarjeta"
                        name="tipoTarjeta"
                        className={styles.formInput}
                        value={datosPago.tipoTarjeta || ''}
                        onChange={handleDatosPagoChange}
                        required
                      >
                        <option value="">Selecciona un tipo</option>
                        <option value="visa">Visa</option>
                        <option value="mastercard">MasterCard</option>
                        <option value="amex">American Express</option>
                        <option value="otro">Otro</option>
                      </select>
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="ultimosDigitos">Últimos 4 dígitos de tu tarjeta</label>
                      <input
                        type="text"
                        id="ultimosDigitos"
                        name="ultimosDigitos"
                        placeholder="Ej. 1234"
                        maxLength="4"
                        pattern="[0-9]{4}"
                        className={styles.formInput}
                        value={datosPago.ultimosDigitos || ''}
                        onChange={handleDatosPagoChange}
                        required
                      />
                      <small className={styles.formHelp}>Solo para referencia futura</small>
                    </div>
                  </>
                )}
                
                {metodoPagoSeleccionado.id === 'mercadopago' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="email">Email de Mercado Pago</label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        placeholder="tu@email.com"
                        className={styles.formInput}
                        value={datosPago.email || ''}
                        onChange={handleDatosPagoChange}
                        required
                      />
                    </div>
                    <div className={styles.infoGroup}>
                      <p className={styles.disclaimer}>
                        Al confirmar, serás redirigido a la página de Mercado Pago para completar el pago de forma segura.
                      </p>
                    </div>
                  </>
                )}
                
                {metodoPagoSeleccionado.id === 'transferencia' && (
                  <>
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="nombreTitular">Nombre del titular de la cuenta</label>
                      <input
                        type="text"
                        id="nombreTitular"
                        name="nombreTitular"
                        placeholder="Nombre completo"
                        className={styles.formInput}
                        value={datosPago.nombreTitular || ''}
                        onChange={handleDatosPagoChange}
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="emailConfirmacion">Email para confirmación</label>
                      <input
                        type="email"
                        id="emailConfirmacion"
                        name="emailConfirmacion"
                        placeholder="tu@email.com"
                        className={styles.formInput}
                        value={datosPago.emailConfirmacion || ''}
                        onChange={handleDatosPagoChange}
                        required
                      />
                    </div>
                    
                    <div className={styles.formGroup}>
                      <label className={styles.formLabel} htmlFor="comprobante">Comprobante de transferencia</label>
                      <input
                        type="file"
                        id="comprobante"
                        name="comprobante"
                        accept="image/jpeg,image/png,application/pdf"
                        className={styles.formInput}
                        onChange={(e) => {
                          setDatosPago(prev => ({
                            ...prev,
                            comprobante: e.target.files[0]?.name || ''
                          }));
                        }}
                        required
                      />
                      <small className={styles.formHelp}>Adjunta el comprobante en formato JPG, PNG o PDF</small>
                    </div>
                    
                    <div className={styles.infoGroup}>
                      <p className={styles.infoLabel}>Datos para la transferencia:</p>
                      <p className={styles.infoValue}>
                        Banco: Banco Nacional<br />
                        Titular: RentaCar S.A.<br />
                        IBAN: ES91 2100 0418 4502 0005 1332<br />
                        Concepto: Reserva {auto.marca} {auto.modelo}
                      </p>
                    </div>
                  </>
                )}
              </>
            )}

            <div className={styles.disclaimerContainer}>
              <p className={styles.disclaimer}>
                <strong>Protección de datos:</strong> La información proporcionada será utilizada exclusivamente para procesar tu reserva.
                Tus datos están protegidos según nuestra política de privacidad y no serán compartidos con terceros sin tu consentimiento.
              </p>
            </div>
          </div>
        )}
      </div>
      
      {/* Botones de acción */}
      <div className={styles.accionesContainer}>
        <button
          className={styles.confirmarButton}
          onClick={handleEnviarReserva}
          disabled={
            !auto || 
            !fechaInicio || 
            !fechaFin || 
            !metodoPagoSeleccionado || 
            precioTotal <= 0 ||
            enviandoReserva
          }
        >
          {enviandoReserva ? 'Preparando pasarela...' : 'Continuar al pago'}
        </button>
        
        <Link href="/catalogo" className={styles.cancelarButton}>
          Cancelar
        </Link>
      </div>
    </div>
  );
}

// Componente principal que usa Suspense para envolver el formulario
export default function NuevaReserva() {
  return (
    <Suspense fallback={<ReservaLoading />}>
      <ReservaFormulario />
    </Suspense>
  );
} 