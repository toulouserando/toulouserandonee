"use client";
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction des icônes
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

export default function MapComponent() {
  const [pois, setPois] = useState<any[]>([]);

  useEffect(() => {
    fetch('/balade/poi_occitanie_clean.json.geojson')
      .then(res => res.json())
      .then(data => setPois(data.features))
      .catch(err => console.error("Erreur chargement JSON:", err));
  }, []);

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

        {pois.map((poi) => (
          <Marker 
            key={poi.properties.id} 
            position={[poi.properties.latitude, poi.properties.longitude]}
            icon={customIcon}
          >
            <Popup>
              <div className="p-2 w-48">
                <h3 className="font-bold text-lg">{poi.properties.local_name}</h3>
                <p className="text-sm text-gray-600">{poi.properties.city}</p>
                <img 
                  src={`/pois-photos/Img_${poi.properties.id}.jpg`} 
                  alt={poi.properties.local_name}
                  className="mt-2 rounded-lg w-full h-32 object-cover"
                  onError={(e) => (e.currentTarget.style.display = 'none')} 
                />
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}