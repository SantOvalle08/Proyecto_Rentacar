'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function PoliticaDePrivacidad() {
  // Función para volver al inicio de la página
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <div className="container">
      <div className={styles.container}>
        <h1 className={styles.title}>Política de Privacidad</h1>
        
        <div className={styles.highlight}>
          <p className={styles.paragraph}>
            En RentaCar, valoramos y respetamos su privacidad. Esta Política de Privacidad explica cómo recopilamos, utilizamos, compartimos y protegemos la información personal que usted nos proporciona al utilizar nuestros servicios de alquiler de vehículos.
          </p>
        </div>

        <h2 id="informacion" className={styles.subtitle}>1. Información que Recopilamos</h2>
        <p className={styles.paragraph}>
          Podemos recopilar los siguientes tipos de información personal:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>
            <strong>Información de identificación personal:</strong> Nombre completo, dirección, número de teléfono, dirección de correo electrónico, fecha de nacimiento.
          </li>
          <li className={styles.listItem}>
            <strong>Información de licencia de conducir:</strong> Número de licencia, fecha de expedición, fecha de vencimiento, país emisor.
          </li>
          <li className={styles.listItem}>
            <strong>Información de pago:</strong> Datos de tarjetas de crédito/débito, información de facturación.
          </li>
          <li className={styles.listItem}>
            <strong>Información del vehículo:</strong> Detalles sobre los vehículos que alquila, incluyendo historial de alquileres.
          </li>
          <li className={styles.listItem}>
            <strong>Información de la reserva:</strong> Fechas, ubicaciones, preferencias y requisitos especiales.
          </li>
          <li className={styles.listItem}>
            <strong>Información técnica:</strong> Dirección IP, tipo de navegador, proveedor de servicios de Internet, páginas de referencia/salida, sistema operativo.
          </li>
        </ul>

        <h2 id="recopilacion" className={styles.subtitle}>2. Cómo Recopilamos la Información</h2>
        <p className={styles.paragraph}>
          Recopilamos información personal de diversas formas:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Cuando crea una cuenta en nuestro sitio web o aplicación móvil.</li>
          <li className={styles.listItem}>Cuando realiza una reserva o alquila un vehículo.</li>
          <li className={styles.listItem}>Cuando se comunica con nosotros a través de nuestro sitio web, correo electrónico, teléfono o en persona.</li>
          <li className={styles.listItem}>Cuando completa encuestas o formularios de comentarios.</li>
          <li className={styles.listItem}>A través de tecnologías de rastreo como cookies y píxeles de seguimiento.</li>
          <li className={styles.listItem}>De terceros, como socios comerciales, agencias de referencia crediticia o redes sociales con su consentimiento.</li>
        </ul>

        <h2 id="finalidad" className={styles.subtitle}>3. Finalidad del Tratamiento de Datos</h2>
        <p className={styles.paragraph}>
          Utilizamos su información personal para los siguientes fines:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Procesar y gestionar sus reservas y alquileres de vehículos.</li>
          <li className={styles.listItem}>Verificar su identidad y elegibilidad para alquilar vehículos.</li>
          <li className={styles.listItem}>Procesar pagos y gestionar su cuenta con nosotros.</li>
          <li className={styles.listItem}>Proporcionar servicio al cliente y responder a sus consultas.</li>
          <li className={styles.listItem}>Enviar comunicaciones relevantes sobre su alquiler, incluyendo confirmaciones, recordatorios y actualizaciones.</li>
          <li className={styles.listItem}>Con su consentimiento, enviarle materiales promocionales y boletines informativos.</li>
          <li className={styles.listItem}>Mejorar nuestros servicios y desarrollar nuevos productos.</li>
          <li className={styles.listItem}>Prevenir fraudes y proteger nuestros derechos legales.</li>
          <li className={styles.listItem}>Cumplir con las obligaciones legales y regulatorias.</li>
        </ul>

        <h2 id="legitimacion" className={styles.subtitle}>4. Legitimación para el Tratamiento</h2>
        <p className={styles.paragraph}>
          Tratamos sus datos personales basándonos en las siguientes bases legales:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}><strong>Ejecución de un contrato:</strong> Cuando es necesario para cumplir con nuestro contrato de alquiler con usted.</li>
          <li className={styles.listItem}><strong>Consentimiento:</strong> Cuando nos ha dado su permiso para tratar sus datos para fines específicos, como el marketing.</li>
          <li className={styles.listItem}><strong>Intereses legítimos:</strong> Cuando es necesario para nuestros intereses legítimos, como la prevención de fraudes o la mejora de nuestros servicios.</li>
          <li className={styles.listItem}><strong>Obligación legal:</strong> Cuando estamos obligados por ley a procesar su información.</li>
        </ul>

        <h2 id="compartir" className={styles.subtitle}>5. Compartir Información Personal</h2>
        <p className={styles.paragraph}>
          Podemos compartir su información personal con las siguientes categorías de destinatarios:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}><strong>Proveedores de servicios:</strong> Empresas que nos prestan servicios, como procesamiento de pagos, alojamiento web, análisis de datos y servicios de marketing.</li>
          <li className={styles.listItem}><strong>Socios comerciales:</strong> Empresas con las que colaboramos para ofrecer servicios conjuntos o promociones.</li>
          <li className={styles.listItem}><strong>Autoridades públicas:</strong> Cuando sea requerido por ley, regulación o proceso legal.</li>
          <li className={styles.listItem}><strong>Compañías aseguradoras:</strong> En caso de accidentes o reclamaciones relacionadas con el vehículo.</li>
          <li className={styles.listItem}><strong>Empresas del grupo:</strong> Otras entidades dentro de nuestro grupo empresarial.</li>
        </ul>
        <p className={styles.paragraph}>
          No vendemos ni alquilamos su información personal a terceros para sus propios fines de marketing.
        </p>

        <h2 id="seguridad" className={styles.subtitle}>6. Medidas de Seguridad</h2>
        <p className={styles.paragraph}>
          Implementamos medidas técnicas y organizativas apropiadas para proteger su información personal contra pérdida, acceso no autorizado, divulgación, alteración o destrucción. Estas medidas incluyen:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Encriptación de datos sensibles.</li>
          <li className={styles.listItem}>Acceso restringido a la información personal.</li>
          <li className={styles.listItem}>Sistemas de seguridad física en nuestras instalaciones.</li>
          <li className={styles.listItem}>Evaluaciones periódicas de seguridad.</li>
          <li className={styles.listItem}>Formación del personal en prácticas de privacidad y seguridad.</li>
        </ul>

        <h2 id="derechos" className={styles.subtitle}>7. Sus Derechos</h2>
        <p className={styles.paragraph}>
          Dependiendo de su ubicación, puede tener los siguientes derechos respecto a sus datos personales:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}><strong>Acceso:</strong> Derecho a solicitar una copia de su información personal.</li>
          <li className={styles.listItem}><strong>Rectificación:</strong> Derecho a corregir información inexacta o incompleta.</li>
          <li className={styles.listItem}><strong>Supresión:</strong> Derecho a solicitar la eliminación de sus datos personales.</li>
          <li className={styles.listItem}><strong>Limitación del tratamiento:</strong> Derecho a solicitar que restrinjamos el procesamiento de sus datos.</li>
          <li className={styles.listItem}><strong>Portabilidad de datos:</strong> Derecho a recibir sus datos en un formato estructurado y transferirlos a otro controlador.</li>
          <li className={styles.listItem}><strong>Oposición:</strong> Derecho a oponerse al procesamiento de sus datos.</li>
          <li className={styles.listItem}><strong>Retirada del consentimiento:</strong> Derecho a retirar su consentimiento en cualquier momento.</li>
        </ul>
        <p className={styles.paragraph}>
          Para ejercer estos derechos, póngase en contacto con nosotros a través de los datos de contacto proporcionados al final de esta política.
        </p>

        <h2 id="conservacion" className={styles.subtitle}>8. Período de Conservación</h2>
        <p className={styles.paragraph}>
          Conservamos su información personal durante el tiempo necesario para cumplir con los fines para los que se recopiló, incluido el cumplimiento de requisitos legales, contables o de informes. Los criterios utilizados para determinar nuestros períodos de retención incluyen:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>El tiempo que tenemos una relación activa con usted.</li>
          <li className={styles.listItem}>Si estamos sujetos a una obligación legal, contractual o similar.</li>
          <li className={styles.listItem}>La naturaleza y sensibilidad de los datos.</li>
          <li className={styles.listItem}>El riesgo potencial de daño por uso o divulgación no autorizada.</li>
        </ul>

        <h2 id="cookies" className={styles.subtitle}>9. Cookies y Tecnologías Similares</h2>
        <p className={styles.paragraph}>
          Utilizamos cookies y tecnologías similares para recopilar información sobre sus interacciones con nuestro sitio web y aplicaciones. Esto nos ayuda a mejorar su experiencia, analizar tendencias y administrar el sitio. Puede gestionar sus preferencias de cookies a través de la configuración de su navegador.
        </p>

        <h2 id="menores" className={styles.subtitle}>10. Menores de Edad</h2>
        <p className={styles.paragraph}>
          Nuestros servicios no están dirigidos a personas menores de 18 años, y no recopilamos intencionalmente información personal de menores. Si descubrimos que hemos recopilado información personal de un menor sin el consentimiento parental verificable, tomaremos medidas para eliminar esa información.
        </p>

        <h2 id="transferencias" className={styles.subtitle}>11. Transferencias Internacionales</h2>
        <p className={styles.paragraph}>
          Su información personal puede ser transferida y procesada en países distintos al suyo, donde nuestros servidores están ubicados o donde operan nuestros proveedores de servicios. Estos países pueden tener leyes de protección de datos diferentes a las de su país.
        </p>
        <p className={styles.paragraph}>
          Tomaremos medidas apropiadas para garantizar que sus datos personales permanezcan protegidos de acuerdo con esta Política de Privacidad, incluyendo la implementación de cláusulas contractuales estándar aprobadas por la Comisión Europea o mecanismos de transferencia similares.
        </p>

        <h2 id="cambios" className={styles.subtitle}>12. Cambios en la Política de Privacidad</h2>
        <p className={styles.paragraph}>
          Podemos actualizar esta Política de Privacidad periódicamente para reflejar cambios en nuestras prácticas de información o requisitos legales. Le notificaremos cualquier cambio significativo publicando la nueva Política de Privacidad en nuestro sitio web y, cuando sea apropiado, le informaremos por correo electrónico.
        </p>

        <h2 id="contacto" className={styles.subtitle}>13. Contacto</h2>
        <p className={styles.paragraph}>
          Si tiene preguntas o inquietudes sobre nuestra Política de Privacidad o el tratamiento de sus datos personales, póngase en contacto con nuestro Delegado de Protección de Datos en:
        </p>
        <p className={styles.paragraph}>
          Correo electrónico: privacidad@rentacar.com<br />
          Dirección postal: Av. Principal 123, Ciudad<br />
          Teléfono: +123 456 789
        </p>
        <p className={styles.paragraph}>
          También tiene derecho a presentar una reclamación ante la autoridad de control de protección de datos de su país.
        </p>

        <button onClick={scrollToTop} className={styles.backToTop}>
          Volver arriba ↑
        </button>

        <p className={styles.lastUpdated}>
          Última actualización: Mayo 2025
        </p>
      </div>
    </div>
  );
} 