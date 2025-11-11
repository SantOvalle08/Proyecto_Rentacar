'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function TerminosRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/terminos-y-condiciones');
  }, [router]);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Redirigiendo...</h2>
        <p>Por favor espere mientras le redirigimos a la página de Términos y Condiciones.</p>
      </div>
    </div>
  );
} 