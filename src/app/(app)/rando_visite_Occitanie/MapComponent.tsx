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
  iconAnchor: [12, 41],
  popupAnchor: [1, -34] // Ajouté pour que le popup s'ouvre au-dessus du marqueur
});

export default function MapComponent() {
  const [pois, setPois] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/rando/poi_occitanie_clean.json.geojson')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.features)) {
          // Sécurisation : On filtre pour ne garder que les features avec des coordonnées valides
          const featuresValides = data.features.filter((poi: any) => {
            // Cas 1 : Structure standard GeoJSON [lng, lat]
            if (poi.geometry?.coordinates && Array.isArray(poi.geometry.coordinates)) {
              return typeof poi.geometry.coordinates[1] === 'number' && typeof poi.geometry.coordinates[0] === 'number';
            }
            // Cas 2 : Vos propriétés personnalisées
            return typeof poi.properties?.latitude === 'number' && typeof poi.properties?.longitude === 'number';
          });
          setPois(featuresValides);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement JSON:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="h-12 flex items-center justify-center font-mono text-slate-500">Chargement des points d'intérêt d'Occitanie...</div>;
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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {pois.map((poi, idx) => {
          // Détermination dynamique des coordonnées selon la structure du fichier
          let lat = poi.properties?.latitude;
          let lng = poi.properties?.longitude;

          if (poi.geometry?.coordinates) {
            lng = poi.geometry.coordinates[0]; // En GeoJSON, la longitude est en premier
            lat = poi.geometry.coordinates[1]; // La latitude est en deuxième
          }

          const poiId = poi.properties?.id || idx;

          return (
            <Marker 
              key={`poi-${poiId}-${idx}`} // Clé garantie 100% unique
              position={[lat, lng]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-1 w-48 font-sans">
                  <h3 className="font-bold text-base text-slate-900 leading-snug">
                    {poi.properties?.local_name || "Point d'intérêt"}
                  </h3>
                  {poi.properties?.city && (
                    <p className="text-xs text-slate-500 mt-0.5">🏙️ {poi.properties.city}</p>
                  )}
                  <img 
                    src={`/pois-photos/Img_${poiId}.jpg`} 
                    alt={poi.properties?.local_name || "Photo"}
                    className="mt-2 rounded-lg w-full h-32 object-cover border border-slate-100 shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'; // Cache proprement l'image cassée
                    }} 
                  />
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
}