"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  showPoints: boolean;
  showRoutes: boolean;
  singleRoute?: any; // 🎯 Reçoit le tracé unique envoyé par le formulaire
}

// 🎯 Petit helper pour recentrer automatiquement la carte sur le tracé reçu
function RecenterMap({ geojson }: { geojson: any }) {
  const map = useMap();
  useEffect(() => {
    if (geojson) {
      import('leaflet').then((L) => {
        const geoJsonLayer = L.geoJSON(geojson);
        map.fitBounds(geoJsonLayer.getBounds(), { padding: [30, 30] });
      });
    }
  }, [geojson, map]);
  return null;
}

export default function MapGeoComponent({ showPoints, showRoutes, singleRoute }: MapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div style={{ height: '100%', width: '100%', background: '#f0f0f0' }} />;
  }

  return (
    <div style={{ height: '100%', width: '100%' }}>
      <MapContainer 
        center={[43.6045, 1.4442]} 
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* 🎯 Affiche l'itinéraire unique choisi s'il existe */}
        {singleRoute && (
          <GeoJSON 
            data={singleRoute} 
            style={{ color: "#0066ff", weight: 5, opacity: 0.8 }} 
          />
        )}

        {/* Recadre automatiquement la vue sur la rando */}
        <RecenterMap geojson={singleRoute} />
      </MapContainer>
    </div>
  );
}