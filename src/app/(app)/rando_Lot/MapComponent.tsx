"use client";
import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapComponentProps {
  geojsonData: any;
  center: [number, number];
}

// 🎯 Petit sous-composant interne pour forcer Leaflet à déplacer la caméra
function ChangeView({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.setView(center, 14); // Recentre avec un zoom de 14
    }
  }, [center, map]);
  return null;
}

export default function MapComponent({ geojsonData, center }: MapComponentProps) {
  return (
    <MapContainer 
      center={center} 
      zoom={14} 
      style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}
    >
      {/* Fond de carte OpenStreetMap classique */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Gère le recadrage automatique de la caméra sur le village choisi */}
      <ChangeView center={center} />

      {/* Dessin du tracé GeoJSON de la randonnée en bleu cyan éclatant */}
      {geojsonData && (
        <GeoJSON 
          key={geojsonData.name || 'geojson-layer'} // Permet de forcer Leaflet à redessiner la ligne lors d'un changement de fichier
          data={geojsonData} 
          style={{
            color: '#0ea5e9', 
            weight: 5,
            opacity: 0.85
          }} 
        />
      )}
    </MapContainer>
  );
}