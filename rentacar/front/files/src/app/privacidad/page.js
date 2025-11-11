'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function PrivacidadRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/politica-de-privacidad');
  }, [router]);

  return (
    <div className="container">
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <h2>Redirigiendo...</h2>
        <p>Por favor espere mientras le redirigimos a la página de Política de Privacidad.</p>
      </div>
    </div>
  );
} 