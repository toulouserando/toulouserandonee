"use client";
import { useEffect, useState } from 'react';
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

    // 🎯 CHARGEMENT DES POINTS (POI)
    if (showPoints) {
      fetch('/api/point_rando_occitanie/poi_occitanie_clean.json.geojson')
        .then(res => {
          if (!res.ok) throw new Error(`Fichier POI introuvable (Status ${res.status})`);
          return res.json();
        })
        .then(data => setPoints(data))
        .catch(err => console.error("Erreur POI:", err));
    }

    // 🎯 CHARGEMENT DES TRACÉS (LIGNES)
    if (showRoutes) {
      fetch('/api/point_rando_occitanie/rando_occitanie_ligne.geojson') 
        .then(res => {
          if (!res.ok) throw new Error(`Fichier Tracés introuvable (Status ${res.status})`);
          return res.json();
        })
        .then(data => setRoutes(data))
        .catch(err => console.error("Erreur Tracés:", err));
    }
  }, [showPoints, showRoutes, mounted]);

  const customIcon = mounted ? new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
  }) : null;

  if (!mounted || !customIcon) {
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
            key={`routes-${routes.features?.length || 0}`}
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
          const lat = poi.properties?.latitude ?? poi.geometry?.coordinates?.[1];
          const lng = poi.properties?.longitude ?? poi.geometry?.coordinates?.[0];

          if (lat === undefined || lng === undefined) return null;

          return (
            <Marker 
              key={`poi-${poi.properties?.id || idx}`} 
              position={[lat, lng]} 
              icon={customIcon}
            >
              <Popup>
                <div className="w-40">
                  <h3 className="font-bold">{poi.properties?.local_name || "Sans nom"}</h3>
                  <p className="text-xs text-gray-600">{poi.properties?.city || "Ville inconnue"}</p>
                  {poi.properties?.id && (
                    <img 
                      src={`/pois-photos/Img_${poi.properties.id}.jpg`} 
                      alt={poi.properties.local_name}
                      className="mt-2 rounded w-full h-24 object-cover"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
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