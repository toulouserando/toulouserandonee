"use client";
import { useEffect, useState } from 'react';
// On importe les composants normalement
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface MapProps {
  showPoints: boolean;
  showRoutes: boolean;
}

export default function MapGeoComponent({ showPoints, showRoutes }: MapProps) {
  const [points, setPoints] = useState<any>(null);
  const [routes, setRoutes] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  // 1. Sécurité anti-SSR : on ne rend rien tant que le composant n'est pas monté
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    if (showPoints) {
      fetch('/api/geo?type=poi')
        .then(res => res.json())
        .then(data => setPoints(data))
        .catch(err => console.error("Erreur POI:", err));
    }
    if (showRoutes) {
      fetch('/api/geo?type=rando')
        .then(res => res.json())
        .then(data => setRoutes(data))
        .catch(err => console.error("Erreur Tracés:", err));
    }
  }, [showPoints, showRoutes, mounted]);

  // Icône personnalisée définie à l'intérieur pour éviter les problèmes de référence
  const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  });

  // Si on est côté serveur, on affiche un div vide ou un loader
  if (!mounted) {
    return <div style={{ height: 'calc(100vh - 64px)', width: '100%', background: '#f0f0f0' }} />;
  }

  return (
    <div style={{ height: 'calc(100vh - 64px)', width: '100%' }}>
      <MapContainer 
        center={[43.6045, 1.4442]} 
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap'
        />

        {/* TRACÉS (LIGNES) */}
        {showRoutes && routes && (
          <GeoJSON 
            data={routes} 
            style={{ color: "#ff7800", weight: 4, opacity: 0.7 }} 
            onEachFeature={(feature, layer) => {
              if (feature.properties?.nom) {
                layer.bindPopup(`<b>Randonnée :</b> ${feature.properties.nom}`);
              }
            }}
          />
        )}

        {/* POINTS (MARQUEURS) */}
        {showPoints && points?.features?.map((poi: any, idx: number) => {
          const lat = poi.properties.latitude;
          const lng = poi.properties.longitude;

          if (lat === undefined || lng === undefined) return null;

          return (
            <Marker 
              key={`poi-${idx}`} 
              position={[lat, lng]} 
              icon={customIcon}
            >
              <Popup>
                <div className="w-40">
                  <h3 className="font-bold">{poi.properties.local_name}</h3>
                  <p className="text-xs text-gray-600">{poi.properties.city}</p>
                  {poi.properties.id && (
                    <img 
                      src={`/pois-photos/Img_${poi.properties.id}.jpg`} 
                      alt={poi.properties.local_name}
                      className="mt-2 rounded w-full h-24 object-cover"
                      onError={(e) => (e.currentTarget.style.display = 'none')}
                    />
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}