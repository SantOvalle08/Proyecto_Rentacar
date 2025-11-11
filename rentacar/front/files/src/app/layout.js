import './globals.css';
import Link from 'next/link';
import Header from '@/components/Header';
import ClientInitializer from '@/components/ClientInitializer';

export const metadata = {
  title: 'RentaCar - Renta de Autos',
  description: 'Sistema de renta de autos con un amplio catálogo de vehículos',
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <ClientInitializer />
        <Header />
        {children}
        <footer className="footer">
          <div className="container">
            <div className="footer-content">
              <div className="footer-section">
                <h3>RentaCar</h3>
                <p>Tu plataforma de confianza para rentar autos en todo el país.</p>
              </div>
              <div className="footer-section">
                <h3>Enlaces</h3>
                <ul>
                  <li><Link href="/">Inicio</Link></li>
                  <li><Link href="/catalogo">Catálogo</Link></li>
                  <li><Link href="/login">Iniciar Sesión</Link></li>
                  <li><Link href="/register">Registrarse</Link></li>
                </ul>
              </div>
              <div className="footer-section">
                <h3>Contacto</h3>
                <p>Email: info@rentacar.com</p>
                <p>Teléfono: (123) 456-7890</p>
              </div>
              <div className="footer-section">
                <h3>Legal</h3>
                <ul>
                  <li><Link href="/terminos-y-condiciones">Términos y Condiciones</Link></li>
                  <li><Link href="/politica-de-privacidad">Política de Privacidad</Link></li>
                </ul>
              </div>
            </div>
            <div className="footer-bottom">
              <p>&copy; {new Date().getFullYear()} RentaCar. Todos los derechos reservados.</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
