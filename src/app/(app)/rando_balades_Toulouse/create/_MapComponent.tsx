"use client";

import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Initialisation unique des icônes
const DefaultIcon = L.icon({
  iconUrl: icon.src,
  shadowUrl: iconShadow.src,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

function RoutingManager({ enabled, map }: { enabled: boolean, map: L.Map | null }) {
  useEffect(() => {
    // Si désactivé ou si la carte n'est pas prête, on quitte
    if (!enabled || !map) return;

    let control: any;

    // Chargement dynamique strict
    import('leaflet-routing-machine').then(() => {
      // @ts-ignore
      control = L.Routing.control({
        waypoints: [L.latLng(43.60, 1.44), L.latLng(43.61, 1.45)],
        // FORCE le serviceUrl à vide pour éviter l'appel OSRM par défaut
        serviceUrl: '' 
      }).addTo(map);
    }).catch(err => console.error("Erreur chargement Routing:", err));

    return () => {
      if (control) map.removeControl(control);
    };
  }, [enabled, map]);

  return null;
}

function RecenterMap({ geometry }: { geometry: any }) {
  const map = useMap();
  useEffect(() => {
    if (!geometry) return;
    try {
      const layer = L.geoJSON(geometry);
      const bounds = layer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }
    } catch (e) { console.error("Erreur RecenterMap", e); }
  }, [geometry, map]);
  return null;
}

export default function MapComponent({ data, enableRouting = false }: { data: any[], enableRouting?: boolean }) {
  const [map, setMap] = useState<L.Map | null>(null);
  const item = data?.[0];
  const mapKey = item?.id || 'default-map';

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer 
        key={mapKey}
        center={[43.6045, 1.4442]} 
        zoom={11} 
        style={{ height: '100%', width: '100%' }}
        whenReady={(mapInstance) => setMap(mapInstance.target)}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {item?.geometry && (
          <GeoJSON 
            data={item.geometry} 
            style={{ 
              color: item.id === 'road-trip' ? "#ea580c" : "#2563eb", 
              weight: 5 
            }} 
          />
        )}

        {item?.geometry && <RecenterMap geometry={item.geometry} />}
        
        {/* Le RoutingManager n'est rendu que si enableRouting est true */}
        {enableRouting && <RoutingManager enabled={enableRouting} map={map} />}
      </MapContainer>
    </div>
  );
}