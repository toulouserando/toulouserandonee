"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Utilitaire pour centrer la carte
function AutoZoom({ data }: { data: any }) {
  const map = useMap();
  useEffect(() => {
    if (data && map) {
      try {
        const layer = L.geoJSON(data);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
      } catch (e) { console.error("Erreur zoom:", e); }
    }
  }, [data, map]);
  return null;
}

interface MapProps {
  showPoints: boolean;
  showRoutes: boolean;
  selectedRando?: { cat: string, file: string } | null;
}

export default function MapGeoComponent({ showPoints, showRoutes, selectedRando }: MapProps) {
  const [points, setPoints] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [mounted, setMounted] = useState(false);
  const [selectedRando, setSelectedRando] = useState<{cat: string, file: string} | null>(null);

  useEffect(() => { setMounted(true); }, []);

  // Chargement des POI (Points d'intérêt)
  useEffect(() => {
    if (mounted && showPoints) {
      fetch('/api/geo?type=poi')
        .then(res => res.json())
        .then(data => setPoints(data))
        .catch(err => console.error("Erreur POI:", err));
    }
  }, [showPoints, mounted]);

  // Chargement de la randonnée sélectionnée (Gère l'effacement et le nouveau format)
  useEffect(() => {
    if (mounted && selectedRando) {
      const url = `/api/1randos?cat=${encodeURIComponent(selectedRando.cat)}&file=${encodeURIComponent(selectedRando.file)}`;
      
      fetch(url)
        .then(res => res.json())
        .then(data => {
          // Extraction du tracé : gère l'ancien format ET le nouveau format (geo_shape)
          const geoData = data.geo_shape ? data.geo_shape : data;
          
          // Normalisation en FeatureCollection
          const validGeoJSON = geoData.type === "Feature" 
            ? { type: "FeatureCollection", features: [geoData] } 
            : geoData;

          setActiveRoute(validGeoJSON);
        })
        .catch(err => {
          console.error("Erreur chargement rando:", err);
          setActiveRoute(null);
        });
    } else {
      setActiveRoute(null); // Efface le tracé si rien n'est sélectionné
    }
  }, [selectedRando, mounted]);

  const customIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

  if (!mounted) return <div className="h-full w-full bg-gray-100" />;

  return (
    <div className="h-full w-full">
      <MapContainer center={[43.60, 1.44]} zoom={10} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* Recentrage auto */}
        <AutoZoom data={activeRoute} />

        {/* Affichage du tracé sélectionné */}
        {showRoutes && activeRoute && (
          <GeoJSON 
            key={`${selectedRando?.cat}-${selectedRando?.file}`} // Force l'effacement du précédent
            data={activeRoute}
            style={{ color: "#2563eb", weight: 6, opacity: 0.8 }}
          />
        )}

        {/* Affichage des POI */}
        {showPoints && points?.features?.map((poi: any, idx: number) => (
          <Marker key={idx} position={[poi.properties.latitude, poi.properties.longitude]} icon={customIcon}>
            <Popup>{poi.properties.local_name}</Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}