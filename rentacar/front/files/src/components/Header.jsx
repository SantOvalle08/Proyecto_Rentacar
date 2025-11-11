/**
 * @module components/Header
 * @description Componente de encabezado principal que incluye navegación, autenticación y cambio de tema
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ThemeToggle from './ThemeToggle';

/**
 * @typedef {Object} User
 * @property {string} nombre - Nombre del usuario
 * @property {string} email - Correo electrónico del usuario
 * @property {('admin'|'cliente')} rol - Rol del usuario en el sistema
 */

/**
 * Componente de encabezado principal
 * @component
 * @returns {JSX.Element} Componente de encabezado con navegación y funcionalidades de usuario
 */
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);
  const pathname = usePathname();

  /**
   * Verifica el estado de autenticación al montar el componente y cuando cambia localStorage
   * @effect
   */
  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem('token');
        const userData = localStorage.getItem('user');
        
        if (token && userData) {
          try {
            const parsedUser = JSON.parse(userData);
            setIsLoggedIn(true);
            setUser(parsedUser);
          } catch (err) {
            console.error('Error parsing user data:', err);
            // Data is corrupted, clear it
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setIsLoggedIn(false);
            setUser(null);
          }
        } else {
          setIsLoggedIn(false);
          setUser(null);
        }
      } catch (err) {
        // Handle possible localStorage access errors
        console.error('Error accessing localStorage:', err);
        setIsLoggedIn(false);
        setUser(null);
      }
    };

    // Check on mount
    if (typeof window !== 'undefined') {
      checkAuth();
    }

    // Add event listener for localStorage changes
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', checkAuth);
      
      // Cleanup
      return () => {
        window.removeEventListener('storage', checkAuth);
      };
    }
    
    return undefined;
  }, []);

  /**
   * Alterna el menú móvil
   * @function
   */
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    document.body.classList.toggle('mobile-menu-open');
  };

  /**
   * Maneja el cierre de sesión del usuario
   * @function
   */
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    setUser(null);
    
    // Trigger storage event for other components to update
    window.dispatchEvent(new Event('storage'));
    
    // Navigate to home if needed
    window.location.href = '/';
  };
  
  /**
   * Verifica si una ruta está activa
   * @param {string} path - Ruta a verificar
   * @returns {boolean} True si la ruta está activa
   */
  const isActive = (path) => {
    if (!pathname) {
      return false;
    }
    if (path === '/' && pathname !== '/') {
      return false;
    }
    return pathname.startsWith(path);
  };

  return (
    <header className="header">
      <div className="container">
        <nav className="nav">
          <div className="logo">
            <Link href="/">RentaCar</Link>
          </div>
          
          {/* Mobile menu button */}
          <button 
            className={`menu-button ${isMenuOpen ? 'active' : ''}`} 
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={isMenuOpen}
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          
          {/* Navigation links */}
          <ul className={`menu ${isMenuOpen ? 'open' : ''}`}>
            <li>
              <Link 
                href="/" 
                className={isActive('/') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Inicio
              </Link>
            </li>
            <li>
              <Link 
                href="/catalogo" 
                className={isActive('/catalogo') ? 'active' : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Catálogo
              </Link>
            </li>
            
            {/* Botón de cambio de tema */}
            <li className="theme-toggle-container">
              <ThemeToggle />
            </li>
            
            {/* Conditional navigation based on auth state */}
            {isLoggedIn ? (
              <>
                <li>
                  <Link 
                    href="/reservas" 
                    className={isActive('/reservas') ? 'active' : ''}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Mis Reservas
                  </Link>
                </li>
                {/* Solo mostrar Dashboard a usuarios admin */}
                {user?.rol === 'admin' && (
                  <li>
                    <Link 
                      href="/dashboard" 
                      className={isActive('/dashboard') ? 'active' : ''}
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Dashboard
                    </Link>
                  </li>
                )}
                <li className="user-menu">
                  <div className="user-profile">
                    <span>{user?.nombre || 'Usuario'}</span>
                    <div className="dropdown-menu">
                      <Link 
                        href="/perfil"
                        onClick={() => setIsMenuOpen(false)}
                      >
                        Mi Perfil
                      </Link>
                      <button 
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="btn-text"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  </div>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link 
                    href="/login" 
                    className="btn-text"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Iniciar Sesión
                  </Link>
                </li>
                <li>
                  <Link 
                    href="/register" 
                    className="btn-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Registrarse
                  </Link>
                </li>
              </>
            )}
          </ul>
        </nav>
      </div>
      
      {/* Styles for header */}
      <style jsx>{`
        .menu-button {
          display: none;
          flex-direction: column;
          justify-content: space-between;
          width: 30px;
          height: 21px;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 0;
          z-index: 10;
        }
        
        .menu-button span {
          width: 100%;
          height: 3px;
          background-color: var(--text-primary);
          border-radius: 10px;
          transition: all 0.3s ease;
        }
        
        .menu-button.active span:nth-child(1) {
          transform: translateY(9px) rotate(45deg);
        }
        
        .menu-button.active span:nth-child(2) {
          opacity: 0;
        }
        
        .menu-button.active span:nth-child(3) {
          transform: translateY(-9px) rotate(-45deg);
        }
        
        .user-menu {
          position: relative;
        }
        
        .user-profile {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          cursor: pointer;
          padding: var(--space-2);
          border-radius: var(--border-radius-md);
          color: var(--text-primary);
          font-weight: var(--font-weight-medium);
        }
        
        .user-profile:hover {
          background-color: var(--neutral-100);
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          right: 0;
          background-color: var(--surface-bg);
          border-radius: var(--border-radius-md);
          box-shadow: var(--shadow-lg);
          width: 200px;
          z-index: var(--z-index-dropdown);
          border: 1px solid var(--surface-border);
          opacity: 0;
          visibility: hidden;
          transform: translateY(10px);
          transition: all var(--transition-normal);
        }
        
        .dropdown-menu a,
        .dropdown-menu button {
          display: block;
          width: 100%;
          text-align: left;
          padding: var(--space-3) var(--space-4);
          color: var(--text-primary);
          border-bottom: 1px solid var(--surface-border);
        }
        
        .dropdown-menu a:last-child,
        .dropdown-menu button:last-child {
          border-bottom: none;
        }
        
        .dropdown-menu a:hover,
        .dropdown-menu button:hover {
          background-color: var(--bg-light);
        }
        
        .user-menu:hover .dropdown-menu {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }
        
        .theme-toggle-container {
          order: -2;
          margin: 20px 0;
          justify-content: flex-start;
        }
        
        body.mobile-menu-open {
          overflow: hidden;
        }
        
        /* Responsive styles */
        @media (max-width: 768px) {
          .menu .btn-primary {
            margin-left: 0;
          }
        }
        
        @media (max-width: 640px) {
          .menu-button {
            display: flex;
          }
          
          .menu {
            flex-direction: column;
            position: fixed;
            top: var(--header-height);
            left: 0;
            right: 0;
            background-color: var(--surface-bg);
            padding: var(--space-4);
            box-shadow: var(--shadow-md);
            border-bottom: 1px solid var(--surface-border);
            transform: translateY(-100%);
            opacity: 0;
            visibility: hidden;
            transition: all var(--transition-normal);
            z-index: var(--z-index-dropdown);
          }
          
          .menu.open {
            transform: translateY(0);
            opacity: 1;
            visibility: visible;
          }
          
          .menu li {
            width: 100%;
            margin: var(--space-2) 0;
          }
          
          .menu a, 
          .menu button,
          .menu .btn-primary,
          .menu .btn-text {
            width: 100%;
            display: block;
            text-align: center;
          }
          
          .user-menu {
            position: static;
          }
          
          .user-profile {
            justify-content: center;
          }
          
          .dropdown-menu {
            position: static;
            box-shadow: none;
            width: 100%;
            border: none;
            border-radius: 0;
            opacity: 1;
            visibility: visible;
            transform: none;
            margin-top: var(--space-2);
            background-color: var(--neutral-100);
          }
        }
      `}</style>
    </header>
  );
} 