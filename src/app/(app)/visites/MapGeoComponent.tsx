"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes Leaflet par défaut dans Next.js
const customIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function AutoZoom({ data, isVisitePoints }: { data: any, isVisitePoints: boolean }) {
  const map = useMap();
  useEffect(() => {
    if (data && map) {
      try {
        if (isVisitePoints && Array.isArray(data)) {
          // Calcul manuel des bounds pour un tableau de points {lat, lng}
          const latLngs = data.map(p => [p.lat, p.lng]);
          if (latLngs.length > 0) {
            map.fitBounds(L.latLngBounds(latLngs as any), { padding: [50, 50] });
          }
        } else {
          // Calcul standard pour GeoJSON
          const layer = L.geoJSON(data);
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50] });
          }
        }
      } catch (e) { console.error("Erreur AutoZoom:", e); }
    }
  }, [data, map, isVisitePoints]);
  return null;
}

interface MapProps {
  showPoints: boolean;
  showRoutes: boolean;
  selectedRando?: { cat: string, file: string } | null;
  visitePoints?: any[]; 
}

export default function MapGeoComponent({ showPoints, showRoutes, selectedRando, visitePoints }: MapProps) {
  const [points, setPoints] = useState<any>(null);
  const [activeRoute, setActiveRoute] = useState<any>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Logique de chargement conservée...
  useEffect(() => {
    if (mounted && showPoints) {
      fetch('/api/geo?type=poi').then(res => res.json()).then(setPoints).catch(console.error);
    }
  }, [showPoints, mounted]);

  useEffect(() => {
    if (mounted && selectedRando) {
      const url = `/api/randos?cat=${encodeURIComponent(selectedRando.cat)}&file=${encodeURIComponent(selectedRando.file)}`;
      fetch(url).then(res => res.json()).then(data => {
        const geoData = data.geo_shape || data;
        setActiveRoute(geoData.type === "Feature" ? { type: "FeatureCollection", features: [geoData] } : geoData);
      }).catch(console.error);
    }
  }, [selectedRando, mounted]);

  if (!mounted) return <div className="h-full w-full bg-gray-100" />;

  return (
    <div className="h-full w-full">
      <MapContainer center={[43.00, -0.09]} zoom={13} style={{ height: '100%', width: '100%' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        
        {/* On transmet une indication pour savoir si on zoome sur des points simples ou du GeoJSON */}
        <AutoZoom data={activeRoute || visitePoints} isVisitePoints={!!visitePoints} />

        {showRoutes && activeRoute && (
          <GeoJSON key={`${selectedRando?.cat}-${selectedRando?.file}`} data={activeRoute} style={{ color: "#2563eb", weight: 6 }} />
        )}

        {showPoints && points?.features?.map((poi: any, idx: number) => (
          <Marker key={`poi-${idx}`} position={[poi.properties.latitude, poi.properties.longitude]} icon={customIcon}>
            <Popup>{poi.properties.local_name}</Popup>
          </Marker>
        ))}

{/* Points de visite (spécifique au formulaire) */}
{visitePoints?.map((pt: any, idx: number) => {

  // Accepte plusieurs noms de propriétés
  const lat = Number(pt.lat ?? pt.latitude);
  const lng = Number(pt.lng ?? pt.longitude);

  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    console.warn("Coordonnées manquantes :", pt);
    return null;
  }

  return (
    <Marker
      key={`visite-${idx}`}
      position={[lat, lng]}
      icon={customIcon}
    >
      <Popup>
        <strong>{pt.nom || pt.local_name || "Étape"}</strong>
        {pt.adresse && (
          <>
            <br />
            {pt.adresse}
          </>
        )}
      </Popup>
    </Marker>
  );

})}

      </MapContainer>
    </div>
  );
}