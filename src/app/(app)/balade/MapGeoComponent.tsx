"use client";
import { useEffect, useState, useMemo } from 'react';
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
      fetch('/api/geo?type=balade')
        .then(res => res.json())
        .then(data => setRoutes(data))
        .catch(err => console.error("Erreur Tracés:", err));
    }
  }, [showPoints, showRoutes, mounted]);

  // Mémorisation du filtrage des routes pour éviter les erreurs "geometry: null"
  const filteredRoutes = useMemo(() => {
    if (!routes || !routes.features) return null;
    return {
      ...routes,
      features: routes.features.filter((f: any) => f.geometry !== null)
    };
  }, [routes]);

  const customIcon = useMemo(() => new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }), []);

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

        {/* TRACÉS (LIGNES) - Ajout d'une KEY obligatoire pour l'update */}
        {showRoutes && filteredRoutes && filteredRoutes.features.length > 0 && (
          <GeoJSON 
            key={`routes-layer-${filteredRoutes.features.length}`} // Force le re-rendu quand les données arrivent
            data={filteredRoutes} 
            style={{ color: "#ff7800", weight: 4, opacity: 0.7 }} 
            onEachFeature={(feature, layer) => {
              if (feature.properties?.nom) {
                layer.bindPopup(`<b>Balade :</b> ${feature.properties.nom}`);
              }
            }}
          />
        )}

        {/* POINTS (MARQUEURS) */}
        {showPoints && points?.features?.map((poi: any, idx: number) => {
          // Sécurité supplémentaire : vérifier si les propriétés existent
          const lat = poi.properties?.latitude;
          const lng = poi.properties?.longitude;

          if (lat === undefined || lng === undefined || lat === null || lng === null) return null;

          return (
            <Marker 
              key={`poi-${poi.properties.id || idx}`} 
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