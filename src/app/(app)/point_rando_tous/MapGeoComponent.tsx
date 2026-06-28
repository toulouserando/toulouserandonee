'use client';

import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

// Normalisateur de données : transforme TOUS vos formats étranges en {id, nom, lat, lon}
const getCoords = (c: any) => {
  const lat = c.latitude || c.coords?.lat || c.geo_point_2d?.lat || (c.geometry?.coordinates?.[1]);
  const lon = c.longitude || c.coords?.lon || c.geo_point_2d?.lon || (c.geometry?.coordinates?.[0]);
  return { lat: parseFloat(lat), lon: parseFloat(lon) };
};

function AutoCenter({ circuits }: { circuits: any[] }) {
  const map = useMap();
  useEffect(() => {
    if (circuits.length > 0 && map) {
      const validPoints = circuits
        .map(getCoords)
        .filter(p => !isNaN(p.lat) && !isNaN(p.lon));
      
      if (validPoints.length > 0) {
        const bounds = L.latLngBounds(validPoints.map(p => [p.lat, p.lon]));
        map.fitBounds(bounds, { padding: [50, 50], animate: true });
      }
    }
  }, [circuits, map]);
  return null;
}

export default function MapComponent({ circuits, onMarkerClick }: { circuits: any[], onMarkerClick: (id: string | number) => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="h-full w-full bg-slate-100 animate-pulse" />;

  return (
    <MapContainer center={[43.60, 1.44]} zoom={10} style={{ height: '100%', width: '100%' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      
      <AutoCenter circuits={circuits} />

      {circuits.map((c) => {
        const { lat, lon } = getCoords(c);
        if (isNaN(lat) || isNaN(lon)) return null; // Sécurité : ne pas rendre si pas de coordonnées
        
        return (
          <Marker 
            key={c.id} 
            position={[lat, lon]} 
            icon={customIcon}
            eventHandlers={{ click: () => onMarkerClick(c.id) }}
          >
            <Popup>{c.nom || c.properties?.nom || "Sans nom"}</Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}