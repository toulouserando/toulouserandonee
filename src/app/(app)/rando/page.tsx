"use client";
import dynamic from 'next/dynamic';

// Chargement dynamique SANS Server Side Rendering (SSR)
const MapWithNoSSR = dynamic(() => import('./MapGeoComponent'), {
  ssr: false, 
  loading: () => (
    <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p>Chargement de la carte des randos d'Occitanie...</p>
    </div>
  )
});

export default function RandoPage() {
  return (
    <main style={{ height: '100vh', width: '100%' }}>
      <MapWithNoSSR showPoints={true} showRoutes={true} />
    </main>
  );
}