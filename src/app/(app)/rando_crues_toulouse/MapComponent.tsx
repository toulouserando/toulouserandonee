"use client";
import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

function Updater({ route }: { route: any }) {
  const map = useMap();
  useEffect(() => {
    if (!map || !route) return;
    
    if (route.geometry) {
      try {
        const layer = L.geoJSON(route.geometry);
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
        }
      } catch (e) {
        console.error("Erreur de recentrage :", e);
      }
    } else if (route.points_reference?.length > 0) {
      const bounds = L.latLngBounds(route.points_reference.map((p: any) => [p.lat, p.lon]));
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
      }
    }
  }, [route, map]);
  return null;
}

export default function MapComponent({ activeRoute }: { activeRoute: any }) {
  return (
    <div className="w-full h-full rounded-xl overflow-hidden relative">
      <MapContainer 
        center={[43.6045, 1.4442]} 
        zoom={12} 
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png"
          attribution='&copy; OpenStreetMap France'
        />

        <Updater route={activeRoute} />

        {activeRoute && (
          <>
            {/* 1. Tracé de la ligne */}
            {activeRoute.geometry && (
              <GeoJSON 
                // key dynamique améliorée pour forcer la mise à jour visuelle des lignes
                key={`geo-${activeRoute.id}-${activeRoute.geometry.coordinates?.length}`}
                data={activeRoute.geometry}
                style={{ color: '#4f46e5', weight: 5, opacity: 0.75 }}
              />
            )}

            {/* 2. Affichage des marqueurs */}
            {activeRoute.points_reference?.map((poi: any, idx: number) => (
              <Marker 
                key={`marker-${activeRoute.id}-${idx}`} 
                position={[poi.lat, poi.lon]}
                icon={customIcon}
              >
                <Popup>
                  <div className="p-1 font-sans">
                    <span className="inline-block text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded mb-1">
                      Étape {idx + 1}
                    </span>
                    <h3 className="font-bold text-slate-900 text-sm">{activeRoute.nom}</h3>
                    {poi.adresse && <p className="text-xs text-gray-500 mt-1">{poi.adresse}</p>}
                  </div>
                </Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}