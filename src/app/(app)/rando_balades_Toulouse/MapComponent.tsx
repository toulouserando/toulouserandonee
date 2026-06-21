"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Fix icônes
const DefaultIcon = L.icon({ iconUrl: icon.src, shadowUrl: iconShadow.src, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

// Import dynamique : NE CHARGE LE CODE QUE SI ON L'APPELLE
const RoutingManager = dynamic(() => import('./RoutingManager'), { ssr: false });

function RecenterMap({ geometry }: { geometry: any }) {
  const map = useMap();
  React.useEffect(() => {
    if (!geometry) return;
    try {
      const layer = L.geoJSON(geometry);
      const bounds = layer.getBounds();
      if (bounds.isValid()) map.fitBounds(bounds, { padding: [20, 20] });
    } catch (e) { console.error(e); }
  }, [geometry, map]);
  return null;
}

export default function MapComponent({ data, enableRouting = false }: { data: any[], enableRouting?: boolean }) {
  const [map, setMap] = useState<L.Map | null>(null);
  const item = data?.[0];

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer center={[43.6045, 1.4442]} zoom={11} style={{ height: '100%', width: '100%' }} whenReady={(e) => setMap(e.target)}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {item?.geometry && <GeoJSON data={item.geometry} style={{ color: "#2563eb", weight: 5 }} />}
        {item?.geometry && <RecenterMap geometry={item.geometry} />}
        {enableRouting && <RoutingManager map={map} />}
      </MapContainer>
    </div>
  );
}