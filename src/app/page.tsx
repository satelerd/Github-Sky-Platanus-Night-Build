'use client'; // Marcar como cliente porque usa next/dynamic con ssr: false
import dynamic from 'next/dynamic';

// Importamos el componente Scene dinámicamente y deshabilitamos SSR
const Scene = dynamic(() => import('@/components/Scene'), {
  ssr: false,
  loading: () => <p style={{ color: 'white', textAlign: 'center', marginTop: '20%' }}>Loading 3D Scene...</p> // Opcional: Muestra algo mientras carga
});

export default function Home() {
  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <Scene />
    </div>
  );
}
