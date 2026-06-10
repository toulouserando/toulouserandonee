"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

function normaliserPoints(points: any[]): any[] {
  if (!Array.isArray(points)) return [];
  
  return points
    .map(pt => {
      const lat = typeof pt.latitude === 'number' ? pt.latitude : pt.lat;
      const lng = typeof pt.longitude === 'number' ? pt.longitude : pt.lng;
      
      if (typeof lat !== 'number' || typeof lng !== 'number') return null;
      
      return {
        ...pt,
        computedLat: lat,
        computedLng: lng
      };
    })
    .filter(pt => pt !== null);
}

function ChangeView({ pointsValides }: { pointsValides: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || pointsValides.length === 0) return;

    try {
      const bounds = L.latLngBounds(pointsValides.map(pt => [pt.computedLat, pt.computedLng]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      }
    } catch (err) {
      console.error("Erreur lors du recadrage Leaflet :", err);
    }
  }, [map, pointsValides]);

  return null;
}

interface MapComponentProps {
  points: any[];
}

export default function MapComponent({ points }: MapComponentProps) {
  const pointsAvecGps = normaliserPoints(points);

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[43.6045, 1.4442]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <ChangeView pointsValides={pointsAvecGps} />

        {/* CORRECTION : Ajout de l'index 'idx' pour forcer une clé unique par marqueur */}
        {pointsAvecGps.map((pt, idx) => (
          <Marker 
            key={`marker-${pt.id || idx}-${idx}`} 
            position={[pt.computedLat, pt.computedLng]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-1 font-sans max-w-[220px]">
                <span className="inline-block bg-amber-500 text-slate-950 text-[10px] font-black rounded-full w-5 h-5 flex items-center justify-center mb-1 shadow-sm text-center leading-5">
                  {pt.id || idx + 1}
                </span>
                <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">
                  {pt.nom}
                </h3>
                {pt.adresse && (
                  <p className="text-[11px] text-slate-500 m-0 leading-normal">
                    📍 {pt.adresse}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}