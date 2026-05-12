'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiService from '@/services/api';
import styles from './page.module.css';

const METHOD_LABELS = {
  tarjeta: 'Tarjeta de crédito o débito',
  mercadopago: 'Mercado Pago',
  transferencia: 'Transferencia bancaria',
  efectivo: 'Efectivo al retirar'
};

const METHOD_HINTS = {
  tarjeta: 'Verificamos titular, número y vigencia antes de autorizar el anticipo.',
  mercadopago: 'Simulamos la validación de cuenta y un código de confirmación.',
  transferencia: 'Se valida el titular, la referencia y el comprobante cargado.',
  efectivo: 'Se confirma el punto de retiro y el anticipo para bloquear el vehículo.'
};

const METHOD_FIELDS = {
  tarjeta: [
    { name: 'titularTarjeta', label: 'Titular de la tarjeta', type: 'text', placeholder: 'Nombre completo' },
    { name: 'numeroTarjeta', label: 'Número de tarjeta', type: 'text', placeholder: '1234 5678 9012 3456', inputMode: 'numeric' },
    { name: 'fechaExpiracion', label: 'Vencimiento', type: 'text', placeholder: 'MM/AA' },
    { name: 'cvv', label: 'CVV', type: 'password', placeholder: '123', inputMode: 'numeric' }
  ],
  mercadopago: [
    { name: 'emailCuenta', label: 'Email de la cuenta', type: 'email', placeholder: 'tu@email.com' },
    { name: 'codigoVerificacion', label: 'Código de verificación (6 dígitos)', type: 'text', placeholder: '123456', inputMode: 'numeric' }
  ],
  transferencia: [
    { name: 'titularCuenta', label: 'Titular de la cuenta', type: 'text', placeholder: 'Nombre del titular' },
    { name: 'bancoOrigen', label: 'Banco emisor', type: 'text', placeholder: 'Banco / entidad' },
    { name: 'referenciaTransferencia', label: 'Referencia de transferencia', type: 'text', placeholder: 'Referencia o número de operación' }
  ],
  efectivo: [
    { name: 'puntoRetiro', label: 'Punto de retiro', type: 'text', placeholder: 'Sucursal o punto de entrega' },
    { name: 'nombreContacto', label: 'Nombre de contacto', type: 'text', placeholder: 'Nombre completo' },
    { name: 'telefonoContacto', label: 'Teléfono de contacto', type: 'tel', placeholder: '+52...' }
  ]
};

const STEP_LABELS = ['Datos de pago', 'Verificación', 'Confirmación'];

const CARD_TYPES = {
  visa: { label: 'Visa', pattern: /^4/, cvvLen: 3, maxLen: 16 },
  mastercard: { label: 'Mastercard', pattern: /^(5[1-5]|2[2-7])/, cvvLen: 3, maxLen: 16 },
  amex: { label: 'American Express', pattern: /^3[47]/, cvvLen: 4, maxLen: 15 },
  otro: { label: 'Tarjeta', pattern: null, cvvLen: 3, maxLen: 19 }
};

function detectCardType(number) {
  const digits = number.replace(/\D/g, '');
  if (CARD_TYPES.visa.pattern.test(digits)) return 'visa';
  if (CARD_TYPES.mastercard.pattern.test(digits)) return 'mastercard';
  if (CARD_TYPES.amex.pattern.test(digits)) return 'amex';
  return 'otro';
}

function formatCardNumber(value) {
  const digits = value.replace(/\D/g, '').slice(0, 19);
  // Amex: 4-6-5; todas las demás: grupos de 4
  const cardType = detectCardType(digits);
  if (cardType === 'amex') {
    return digits.replace(/^(\d{4})(\d{0,6})(\d{0,5}).*/, (_, a, b, c) =>
      [a, b, c].filter(Boolean).join(' ')
    );
  }
  return digits.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function luhnCheck(value) {
  const digits = value.replace(/\D/g, '');
  let sum = 0;
  let shouldDouble = false;
  for (let i = digits.length - 1; i >= 0; i -= 1) {
    let digit = Number(digits[i]);
    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }
    sum += digit;
    shouldDouble = !shouldDouble;
  }
  return digits.length >= 12 && sum % 10 === 0;
}

function formatMoney(amount) {
  return `$${Number(amount || 0).toFixed(2)}`;
}

export default function PagoReservaPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [draft, setDraft] = useState(null);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    titularTarjeta: '',
    numeroTarjeta: '',
    fechaExpiracion: '',
    cvv: '',
    emailCuenta: '',
    codigoVerificacion: '',
    titularCuenta: '',
    bancoOrigen: '',
    referenciaTransferencia: '',
    puntoRetiro: '',
    nombreContacto: '',
    telefonoContacto: ''
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [detectedCardType, setDetectedCardType] = useState('otro');
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const rawDraft = sessionStorage.getItem('rentacar_checkout_draft');
      if (!rawDraft) {
        setError('No existe una reserva en preparación. Vuelve al catálogo para iniciar el proceso.');
        setLoading(false);
        return;
      }

      const parsedDraft = JSON.parse(rawDraft);
      if (!parsedDraft?.autoId || !parsedDraft?.fechaInicio || !parsedDraft?.fechaFin || !parsedDraft?.metodoPago) {
        setError('La información de la reserva está incompleta. Vuelve a preparar el checkout.');
        setLoading(false);
        return;
      }

      setDraft(parsedDraft);
      setLoading(false);
    } catch (draftError) {
      console.error('Error al cargar el borrador de pago:', draftError);
      setError('No se pudo cargar la pasarela de pago simulada.');
      setLoading(false);
    }
  }, []);

  const paymentMethod = draft?.metodoPago || 'efectivo';
  const methodLabel = METHOD_LABELS[paymentMethod] || 'Método de pago';
  const methodHint = METHOD_HINTS[paymentMethod] || 'Verificación de datos antes de reservar.';
  const stepFields = METHOD_FIELDS[paymentMethod] || [];
  const anticipo = draft?.montoAnticipo ?? Math.round((Number(draft?.precioTotal || 0) * 0.3) * 100) / 100;
  const saldoPendiente = draft?.saldoPendiente ?? Math.round((Number(draft?.precioTotal || 0) - anticipo) * 100) / 100;
  const cardInfo = CARD_TYPES[detectedCardType] || CARD_TYPES.otro;

  const updateField = (name, value) => {
    let processedValue = value;

    if (name === 'numeroTarjeta') {
      processedValue = formatCardNumber(value);
      setDetectedCardType(detectCardType(value));
    }

    if (name === 'fechaExpiracion') {
      const digits = value.replace(/\D/g, '').slice(0, 4);
      if (digits.length >= 3) {
        processedValue = `${digits.slice(0, 2)}/${digits.slice(2)}`;
      } else {
        processedValue = digits;
      }
    }

    if (name === 'cvv') {
      processedValue = value.replace(/\D/g, '').slice(0, cardInfo.cvvLen);
    }

    if (name === 'codigoVerificacion') {
      processedValue = value.replace(/\D/g, '').slice(0, 6);
    }

    setFormData(prev => ({ ...prev, [name]: processedValue }));

    if (fieldErrors[name]) {
      setFieldErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateStepOne = () => {
    const errors = {};

    if (paymentMethod === 'tarjeta') {
      if (!formData.titularTarjeta.trim()) errors.titularTarjeta = 'El titular es requerido';
      const digits = formData.numeroTarjeta.replace(/\s/g, '');
      const expectedMax = CARD_TYPES[detectCardType(digits)]?.maxLen || 19;
      if (!digits) {
        errors.numeroTarjeta = 'El número de tarjeta es requerido';
      } else if (digits.length < 12 || digits.length > expectedMax || !luhnCheck(digits)) {
        errors.numeroTarjeta = 'El número de tarjeta no es válido';
      }
      if (!/^\d{2}\/\d{2}$/.test(formData.fechaExpiracion)) {
        errors.fechaExpiracion = 'Usa el formato MM/AA';
      } else {
        const [monthText, yearText] = formData.fechaExpiracion.split('/');
        const month = Number(monthText);
        const year = Number(`20${yearText}`);
        const now = new Date();
        const expiration = new Date(year, month - 1, 1);
        if (month < 1 || month > 12 || Number.isNaN(expiration.getTime()) || expiration < new Date(now.getFullYear(), now.getMonth(), 1)) {
          errors.fechaExpiracion = 'La tarjeta está vencida o la fecha no es válida';
        }
      }
      const cvvLen = CARD_TYPES[detectedCardType]?.cvvLen || 3;
      if (!new RegExp(`^\\d{${cvvLen}}$`).test(formData.cvv)) {
        errors.cvv = `El CVV debe tener ${cvvLen} dígitos`;
      }
    }

    if (paymentMethod === 'mercadopago') {
      if (!isValidEmail(formData.emailCuenta)) errors.emailCuenta = 'Ingresa un email válido';
      if (!/^\d{6}$/.test(formData.codigoVerificacion)) errors.codigoVerificacion = 'El código debe tener exactamente 6 dígitos';
    }

    if (paymentMethod === 'transferencia') {
      if (!formData.titularCuenta.trim()) errors.titularCuenta = 'El titular es requerido';
      if (!formData.bancoOrigen.trim()) errors.bancoOrigen = 'El banco es requerido';
      if (!formData.referenciaTransferencia.trim()) errors.referenciaTransferencia = 'La referencia es requerida';
    }

    if (paymentMethod === 'efectivo') {
      if (!formData.puntoRetiro.trim()) errors.puntoRetiro = 'El punto de retiro es requerido';
      if (!formData.nombreContacto.trim()) errors.nombreContacto = 'El nombre de contacto es requerido';
      if (!formData.telefonoContacto.trim()) errors.telefonoContacto = 'El teléfono es requerido';
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const buildDatosPago = () => {
    const base = draft?.datosPago || {};

    if (paymentMethod === 'tarjeta') {
      const digits = formData.numeroTarjeta.replace(/\s/g, '');
      const tipoTarjeta = detectCardType(digits);
      const ultimosDigitos = digits.slice(-4);
      return {
        ...base,
        titularTarjeta: formData.titularTarjeta.trim(),
        numeroTarjeta: `****${ultimosDigitos}`,
        ultimosDigitos,
        tipoTarjeta,
        fechaExpiracion: formData.fechaExpiracion.trim(),
        metodoVerificado: 'tarjeta_simulada'
      };
    }

    if (paymentMethod === 'mercadopago') {
      return {
        ...base,
        emailCuenta: formData.emailCuenta.trim(),
        codigoVerificacion: formData.codigoVerificacion.trim(),
        metodoVerificado: 'mercadopago_simulado'
      };
    }

    if (paymentMethod === 'transferencia') {
      return {
        ...base,
        titularCuenta: formData.titularCuenta.trim(),
        bancoOrigen: formData.bancoOrigen.trim(),
        referenciaTransferencia: formData.referenciaTransferencia.trim(),
        metodoVerificado: 'transferencia_simulada'
      };
    }

    return {
      ...base,
      puntoRetiro: formData.puntoRetiro.trim(),
      nombreContacto: formData.nombreContacto.trim(),
      telefonoContacto: formData.telefonoContacto.trim(),
      metodoVerificado: 'efectivo_simulado'
    };
  };

  const isUserLoggedIn = () => {
    if (typeof window === 'undefined') return false;
    try {
      const userRaw = localStorage.getItem('user');
      if (!userRaw) return false;
      const user = JSON.parse(userRaw);
      return !!user?.id;
    } catch {
      return false;
    }
  };

  const handleContinue = () => {
    if (!validateStepOne()) return;
    if (!isUserLoggedIn()) {
      setShowLoginModal(true);
      return;
    }
    setStep(2);
  };

  const handleConfirmPayment = async () => {
    if (!validateStepOne()) {
      setStep(1);
      return;
    }

    if (typeof window === 'undefined') {
      setError('No se pudo completar la pasarela en este entorno.');
      return;
    }

    if (!isUserLoggedIn()) {
      setShowLoginModal(true);
      return;
    }

    const usuario = JSON.parse(localStorage.getItem('user'));

    const datosPago = buildDatosPago();
    const referenciaPago = `GW-${Date.now().toString(36).toUpperCase()}`;

    setSubmitting(true);
    setError('');

    try {
      await new Promise(resolve => setTimeout(resolve, 1200));

      const response = await apiService.reservas.create({
        autoId: draft.autoId,
        fechaInicio: draft.fechaInicio,
        fechaFin: draft.fechaFin,
        usuario: usuario.id,
        metodoPago: paymentMethod,
        datosPago: {
          ...datosPago,
          referenciaPago,
          gatewaySimulado: true
        },
        porcentajeAnticipo: draft.porcentajeAnticipo,
        montoAnticipo: draft.montoAnticipo,
        saldoPendiente: draft.saldoPendiente,
        estadoPago: 'Anticipo pagado',
        pasarelaPago: 'pasarela-ficticia',
        referenciaPago
      });

      if (!response.success || !response.data) {
        throw new Error(response.message || 'No se pudo crear la reserva');
      }

      sessionStorage.removeItem('rentacar_checkout_draft');
      sessionStorage.setItem('rentacar_last_reserva', JSON.stringify(response.data));
      setSuccess({ reserva: response.data, referenciaPago });
    } catch (submitError) {
      console.error('Error al confirmar el pago:', submitError);
      setError(submitError.message || 'La pasarela no pudo validar los datos.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.shell}>
        <div className={styles.loadingCard}>Cargando pasarela de pago...</div>
      </div>
    );
  }

  if (error && !draft) {
    return (
      <div className={styles.shell}>
        <div className={styles.errorCard}>
          <h1>No se pudo abrir el checkout</h1>
          <p>{error}</p>
          <div className={styles.errorActions}>
            <Link href="/catalogo" className={styles.primaryButton}>Volver al catálogo</Link>
            <Link href="/reservas/nueva" className={styles.secondaryButton}>Reiniciar reserva</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!draft) return null;

  if (success) {
    return (
      <div className={styles.shell}>
        <div className={styles.successCard}>
          <div className={styles.successBadge}>Pago confirmado</div>
          <h1>Reserva completada con anticipo</h1>
          <p className={styles.successText}>
            Tu reserva para {draft.auto?.marca} {draft.auto?.modelo} quedó registrada con el anticipo procesado.
          </p>
          <div className={styles.successGrid}>
            <div>
              <span className={styles.summaryLabel}>Referencia</span>
              <strong>{success.referenciaPago}</strong>
            </div>
            <div>
              <span className={styles.summaryLabel}>Anticipo</span>
              <strong>{formatMoney(draft.montoAnticipo)}</strong>
            </div>
            <div>
              <span className={styles.summaryLabel}>Saldo pendiente</span>
              <strong>{formatMoney(draft.saldoPendiente)}</strong>
            </div>
            <div>
              <span className={styles.summaryLabel}>Método</span>
              <strong>{methodLabel}</strong>
            </div>
          </div>
          <div className={styles.successActions}>
            <Link href={`/reservas/${success.reserva.id}`} className={styles.primaryButton}>Ver detalle</Link>
            <Link href="/reservas" className={styles.secondaryButton}>Mis reservas</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.shell}>
      <div className={styles.backdrop} />
      <div className={styles.page}>
        <section className={styles.heroCard}>
          <div>
            <p className={styles.kicker}>Pasarela ficticia segura</p>
            <h1>Verifica tu pago parcial antes de reservar</h1>
            <p className={styles.heroText}>{methodHint}</p>
          </div>
          <div className={styles.heroMeta}>
            <div>
              <span className={styles.summaryLabel}>Vehículo</span>
              <strong>{draft.auto?.marca} {draft.auto?.modelo}</strong>
            </div>
            <div>
              <span className={styles.summaryLabel}>Anticipo</span>
              <strong>{formatMoney(draft.montoAnticipo)}</strong>
            </div>
            <div>
              <span className={styles.summaryLabel}>Saldo</span>
              <strong>{formatMoney(draft.saldoPendiente)}</strong>
            </div>
          </div>
        </section>

        <section className={styles.contentGrid}>
          <aside className={styles.summaryCard}>
            <div className={styles.summaryHeader}>
              <p className={styles.sectionLabel}>Resumen de reserva</p>
              <span className={styles.methodChip}>{methodLabel}</span>
            </div>

            <div className={styles.vehicleCard}>
              <div className={styles.vehicleTitle}>{draft.auto?.marca} {draft.auto?.modelo}</div>
              <div className={styles.vehicleSubtitle}>{draft.auto?.anio} · {draft.auto?.tipo}</div>
            </div>

            <div className={styles.summaryList}>
              <div className={styles.summaryRow}>
                <span>Inicio</span>
                <strong>{new Date(draft.fechaInicio).toLocaleDateString('es-ES')}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Fin</span>
                <strong>{new Date(draft.fechaFin).toLocaleDateString('es-ES')}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Días</span>
                <strong>{draft.diasReserva || '-'}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Total</span>
                <strong>{formatMoney(draft.precioTotal)}</strong>
              </div>
              <div className={styles.summaryRowHighlight}>
                <span>Anticipo ({draft.porcentajeAnticipo || 30}%)</span>
                <strong>{formatMoney(anticipo)}</strong>
              </div>
              <div className={styles.summaryRow}>
                <span>Saldo pendiente</span>
                <strong>{formatMoney(saldoPendiente)}</strong>
              </div>
            </div>

            <div className={styles.noticeBox}>
              <strong>Importante</strong>
              <p>
                Esta pantalla simula la pasarela de pago. Ningún dato sensible se envía a un proveedor externo.
                Solo se confirma el anticipo para dejar la reserva bloqueada.
              </p>
            </div>
          </aside>

          <main className={styles.gatewayCard}>
            <div className={styles.stepper}>
              {STEP_LABELS.map((label, index) => (
                <div key={label} className={`${styles.step} ${step >= index + 1 ? styles.stepActive : ''}`}>
                  <div className={styles.stepNumber}>{index + 1}</div>
                  <div className={styles.stepLabel}>{label}</div>
                </div>
              ))}
            </div>

            {step === 1 && (
              <div className={styles.stepBody}>
                <h2>Datos de pago</h2>
                <p className={styles.stepIntro}>
                  Completa la información solicitada según el método elegido.
                </p>

                {paymentMethod === 'tarjeta' && detectedCardType !== 'otro' && (
                  <div className={styles.cardTypeChip}>
                    {CARD_TYPES[detectedCardType]?.label}
                  </div>
                )}

                <div className={styles.fieldsGrid}>
                  {stepFields.map(field => (
                    <label key={field.name} className={styles.fieldGroup}>
                      <span>{field.label}</span>
                      <input
                        type={field.type}
                        inputMode={field.inputMode}
                        placeholder={field.placeholder}
                        value={formData[field.name]}
                        onChange={(event) => updateField(field.name, event.target.value)}
                        className={fieldErrors[field.name] ? styles.inputError : ''}
                        autoComplete={field.name === 'cvv' ? 'off' : undefined}
                      />
                      {fieldErrors[field.name] && <small>{fieldErrors[field.name]}</small>}
                    </label>
                  ))}
                </div>
                <div className={styles.actionsRow}>
                  <Link href="/reservas/nueva" className={styles.secondaryButton}>Regresar</Link>
                  <button type="button" className={styles.primaryButton} onClick={handleContinue}>Continuar</button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.stepBody}>
                <h2>Verificación automática</h2>
                <p className={styles.stepIntro}>
                  Revisamos los datos capturados, el anticipo y la disponibilidad del vehículo para bloquear la reserva.
                </p>
                <div className={styles.verificationList}>
                  <div>✓ Anticipo calculado: {formatMoney(anticipo)}</div>
                  <div>✓ Saldo pendiente: {formatMoney(saldoPendiente)}</div>
                  <div>✓ Método: {methodLabel}</div>
                  {paymentMethod === 'tarjeta' && (
                    <div>✓ Tarjeta: {CARD_TYPES[detectedCardType]?.label} **** {formData.numeroTarjeta.replace(/\s/g, '').slice(-4)}</div>
                  )}
                  <div>✓ Reserva temporal: {draft.auto?.marca} {draft.auto?.modelo}</div>
                </div>
                <div className={styles.actionsRow}>
                  <button type="button" className={styles.secondaryButton} onClick={() => setStep(1)}>Editar datos</button>
                  <button type="button" className={styles.primaryButton} onClick={handleConfirmPayment} disabled={submitting}>
                    {submitting ? 'Validando...' : 'Confirmar anticipo'}
                  </button>
                </div>
              </div>
            )}
          </main>
        </section>

        {error && (
          <div className={styles.inlineError}>{error}</div>
        )}
      </div>

      {showLoginModal && (
        <div className={styles.modalOverlay} onClick={() => setShowLoginModal(false)}>
          <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
            <div className={styles.modalIconWrap}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
            </div>
            <h2 className={styles.modalTitle}>Inicia sesión para continuar</h2>
            <p className={styles.modalDesc}>
              Necesitas una cuenta para completar tu reserva. Los datos del vehículo y las fechas quedarán guardados para cuando vuelvas.
            </p>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.secondaryButton}
                onClick={() => setShowLoginModal(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.primaryButton}
                onClick={() => router.push('/login?returnTo=/reservas/pago')}
              >
                Ir a iniciar sesión
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
