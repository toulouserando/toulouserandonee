"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapComponent() {
  const [pois, setPois] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/rando/poi_occitanie_clean.json.geojson')
      .then(res => res.json())
      .then(data => setPois(data.features || []))
      .catch(err => console.error("Erreur chargement JSON:", err));
  }, []);

  // On crée l'icône uniquement côté client
  const customIcon = mounted ? new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41]
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

        {pois.map((poi, idx) => {
          const lat = poi?.properties?.latitude;
          const lng = poi?.properties?.longitude;
          if (lat === undefined || lng === undefined) return null;

          return (
            <Marker 
              key={poi?.properties?.id || idx} 
              position={[lat, lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-2 w-48">
                  <h3 className="font-bold text-lg">{poi.properties?.local_name || 'Sans nom'}</h3>
                  <p className="text-sm text-gray-600">{poi.properties?.city}</p>
                  {poi.properties?.id && (
                    <img 
                      src={`/pois-photos/Img_${poi.properties.id}.jpg`} 
                      alt={poi.properties.local_name}
                      className="mt-2 rounded-lg w-full h-32 object-cover"
                      onError={(e) => { e.currentTarget.remove(); }} 
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