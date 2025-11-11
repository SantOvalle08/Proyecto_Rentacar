'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import styles from './page.module.css';

export default function TerminosYCondiciones() {
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
        <h1 className={styles.title}>Términos y Condiciones</h1>
        
        <div className={styles.highlight}>
          <p className={styles.paragraph}>
            Estos términos y condiciones establecen las normas y regulaciones para el uso de los servicios de RentaCar, incluyendo reserva, alquiler, devolución y todos los demás servicios asociados.
          </p>
        </div>

        <h2 id="definiciones" className={styles.subtitle}>1. Definiciones</h2>
        <p className={styles.paragraph}>
          A efectos de estos Términos y Condiciones, &quot;RentaCar&quot; o &quot;nosotros&quot; hace referencia a nuestra empresa, mientras que &quot;usted&quot;, &quot;cliente&quot; o &quot;arrendatario&quot; hace referencia a la persona o entidad que alquila un vehículo.
          &quot;Servicios&quot; se refiere a los servicios de alquiler de vehículos y cualquier servicio adicional o relacionado ofrecido por RentaCar.
        </p>

        <h2 id="requisitos" className={styles.subtitle}>2. Requisitos para el Alquiler</h2>
        <p className={styles.paragraph}>
          Para poder alquilar un vehículo en RentaCar, los clientes deben cumplir con los siguientes requisitos:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Tener al menos 21 años de edad (25 años para ciertos vehículos de alta gama).</li>
          <li className={styles.listItem}>Poseer un permiso de conducir válido con al menos 2 años de antigüedad.</li>
          <li className={styles.listItem}>Presentar una tarjeta de crédito válida a nombre del conductor principal.</li>
          <li className={styles.listItem}>Cumplir con cualquier otro requisito especificado en el contrato de alquiler.</li>
        </ul>

        <h2 id="reservas" className={styles.subtitle}>3. Reservas y Pagos</h2>
        <p className={styles.paragraph}>
          Las reservas pueden realizarse a través de nuestra página web, por teléfono o directamente en nuestras oficinas. Al realizar una reserva, se compromete a:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Proporcionar información precisa y veraz sobre su identidad y datos de contacto.</li>
          <li className={styles.listItem}>Realizar el pago según los términos acordados en el momento de la reserva.</li>
          <li className={styles.listItem}>Aceptar que ciertas reservas pueden requerir un depósito no reembolsable.</li>
          <li className={styles.listItem}>Entender que los precios pueden variar según la temporada, ubicación y disponibilidad.</li>
        </ul>

        <h2 id="recogida" className={styles.subtitle}>4. Recogida y Devolución</h2>
        <p className={styles.paragraph}>
          El cliente se compromete a recoger y devolver el vehículo en las fechas, horas y ubicaciones especificadas en la reserva.
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Cualquier retraso en la devolución no comunicado con antelación puede resultar en cargos adicionales.</li>
          <li className={styles.listItem}>El vehículo debe devolverse en las mismas condiciones en que fue entregado, salvo el desgaste normal por uso.</li>
          <li className={styles.listItem}>Los vehículos deben devolverse con el mismo nivel de combustible con el que se entregaron, a menos que se haya contratado la opción de &quot;depósito lleno&quot;.</li>
        </ul>

        <h2 id="uso" className={styles.subtitle}>5. Uso del Vehículo</h2>
        <p className={styles.paragraph}>
          Durante el período de alquiler, el cliente se compromete a:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Utilizar el vehículo de acuerdo con las leyes de tráfico y normativas aplicables.</li>
          <li className={styles.listItem}>No utilizar el vehículo para actividades ilegales o transportar mercancías peligrosas.</li>
          <li className={styles.listItem}>No permitir que el vehículo sea conducido por personas no autorizadas en el contrato.</li>
          <li className={styles.listItem}>No conducir bajo los efectos del alcohol, drogas u otras sustancias que puedan afectar su capacidad de conducción.</li>
          <li className={styles.listItem}>No utilizar el vehículo en competiciones, pruebas o carreras.</li>
          <li className={styles.listItem}>No salir del país sin autorización previa por escrito.</li>
        </ul>

        <h2 id="seguros" className={styles.subtitle}>6. Seguros y Coberturas</h2>
        <p className={styles.paragraph}>
          Todos nuestros vehículos incluyen un seguro básico que cubre:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Responsabilidad civil obligatoria.</li>
          <li className={styles.listItem}>Daños a terceros según los límites establecidos en la póliza.</li>
        </ul>
        <p className={styles.paragraph}>
          Ofrecemos coberturas adicionales opcionales que pueden contratarse al momento de la reserva:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Cobertura de daños por colisión (CDW).</li>
          <li className={styles.listItem}>Protección contra robo (TP).</li>
          <li className={styles.listItem}>Seguro personal de accidentes (PAI).</li>
          <li className={styles.listItem}>Reducción o eliminación de franquicia.</li>
        </ul>

        <h2 id="accidentes" className={styles.subtitle}>7. Accidentes e Incidentes</h2>
        <p className={styles.paragraph}>
          En caso de accidente, robo o daño al vehículo, el cliente debe:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Notificar inmediatamente a las autoridades correspondientes y obtener un informe policial.</li>
          <li className={styles.listItem}>Contactar a RentaCar a través de los números de emergencia proporcionados.</li>
          <li className={styles.listItem}>No admitir responsabilidad o culpa ante terceros.</li>
          <li className={styles.listItem}>Proporcionar toda la información solicitada para el informe de incidentes.</li>
        </ul>

        <h2 id="cargos" className={styles.subtitle}>8. Cargos Adicionales</h2>
        <p className={styles.paragraph}>
          RentaCar puede aplicar cargos adicionales en las siguientes circunstancias:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Devolución tardía del vehículo.</li>
          <li className={styles.listItem}>Devolución en una ubicación distinta a la acordada sin aviso previo.</li>
          <li className={styles.listItem}>Limpieza especial debido a suciedad excesiva.</li>
          <li className={styles.listItem}>Multas de tráfico o estacionamiento durante el período de alquiler.</li>
          <li className={styles.listItem}>Daños no cubiertos por el seguro contratado.</li>
          <li className={styles.listItem}>Pérdida o daño de llaves, documentos o accesorios del vehículo.</li>
        </ul>

        <h2 id="cancelaciones" className={styles.subtitle}>9. Cancelaciones y Modificaciones</h2>
        <p className={styles.paragraph}>
          Las condiciones para cancelaciones y modificaciones son las siguientes:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Cancelaciones con más de 48 horas de antelación: reembolso completo menos gastos de gestión.</li>
          <li className={styles.listItem}>Cancelaciones entre 24 y 48 horas: 50% del costo de alquiler.</li>
          <li className={styles.listItem}>Cancelaciones con menos de 24 horas o no presentación: no hay reembolso.</li>
          <li className={styles.listItem}>Las modificaciones están sujetas a disponibilidad y pueden conllevar cargos adicionales.</li>
        </ul>

        <h2 id="responsabilidad" className={styles.subtitle}>10. Limitación de Responsabilidad</h2>
        <p className={styles.paragraph}>
          RentaCar no será responsable por:
        </p>
        <ul className={styles.list}>
          <li className={styles.listItem}>Pérdida o daño de pertenencias dejadas en el vehículo.</li>
          <li className={styles.listItem}>Consecuencias derivadas del incumplimiento por parte del cliente de estos términos.</li>
          <li className={styles.listItem}>Pérdidas o daños indirectos o consecuentes.</li>
          <li className={styles.listItem}>Fallos mecánicos no atribuibles a falta de mantenimiento adecuado.</li>
        </ul>

        <h2 id="privacidad" className={styles.subtitle}>11. Protección de Datos</h2>
        <p className={styles.paragraph}>
          RentaCar recoge y procesa sus datos personales de acuerdo con nuestra Política de Privacidad. Para más información, consulte nuestra <Link href="/politica-de-privacidad">Política de Privacidad</Link>.
        </p>

        <h2 id="modificaciones" className={styles.subtitle}>12. Modificaciones a los Términos</h2>
        <p className={styles.paragraph}>
          RentaCar se reserva el derecho de modificar estos términos y condiciones en cualquier momento. Las modificaciones entrarán en vigor inmediatamente después de su publicación en nuestro sitio web.
        </p>

        <h2 id="legislacion" className={styles.subtitle}>13. Legislación Aplicable</h2>
        <p className={styles.paragraph}>
          Estos términos y condiciones se rigen por las leyes del país en el que RentaCar tiene su domicilio social. Cualquier disputa será sometida a la jurisdicción de los tribunales competentes de dicha localidad.
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