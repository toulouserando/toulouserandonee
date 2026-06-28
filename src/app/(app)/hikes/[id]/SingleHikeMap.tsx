"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Popup, useMap } from 'react-leaflet'; // 🎯 Imports standards sécurisés par le wrapper dynamique parent
import 'leaflet/dist/leaflet.css';

// --- COMPOSANT DE CADRAGE DYNAMIQUE AUTOMATIQUE ---
function ChangeView({ geoData }: { geoData: any }) {
  const map = useMap(); // 🎯 Plus besoin de ruse, utilisable directement ici.
  
  useEffect(() => {
    if (map && geoData) {
      const timer = setTimeout(async () => {
        const L = await import('leaflet');
        try {
          const layer = L.geoJSON(geoData);
          const bounds = layer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], animate: true });
          }
        } catch (e) {
          console.error("Erreur lors du calcul des limites géographiques :", e);
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [geoData, map]);
  
  return null;
}

interface SingleHikeMapProps {
  hike: any;
}

export default function SingleHikeMap({ hike }: SingleHikeMapProps) {
  // 🎯 VÉRIFICATION SÉCURISÉE : Extraction du tracé GeoJSON
  const geo = hike.geometry || hike.route_geometry || hike.geojson_data;

  // Conversion propre selon le format stocké en BDD
  let parsedGeo = null;
  try {
    parsedGeo = typeof geo === "string" ? JSON.parse(geo) : geo;
  } catch (error) {
    console.error("Le format GeoJSON stocké dans la table 'hikes' est invalide", error);
  }

  const isPoint = parsedGeo?.type === "Point";
  
  // Coordonnées pour placer le CircleMarker si c'est un point unique
  const finalCenter: [number, number] | null = isPoint && parsedGeo?.coordinates 
    ? [parsedGeo.coordinates[1], parsedGeo.coordinates[0]] // Conversion [Lon, Lat] -> [Lat, Lon]
    : null;

  // Centre par défaut (Toulouse)
  const defaultCenter: [number, number] = [43.6045, 1.4442];

  return (
    <MapContainer center={defaultCenter} zoom={12} className="h-full w-full">
      <TileLayer 
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" 
        attribution='&copy; OpenStreetMap France' 
      />
      
      {/* Recadrage automatique sur la trace */}
      {parsedGeo && <ChangeView geoData={parsedGeo} />}

      {parsedGeo && (
        <React.Fragment>
          <GeoJSON 
            key={`hike-geojson-${hike.id}`}
            data={parsedGeo} 
            pointToLayer={() => (null as any)} // Ignore les points ici pour laisser CircleMarker s'en occuper
            style={{ 
              color: '#2563eb', // Tracé Bleu Royal
              weight: 5, 
              opacity: 0.85 
            }} 
          />

          {/* Rendu du point d'intérêt s'il s'agit d'un point isolé */}
          {isPoint && finalCenter && (
            <CircleMarker 
              center={finalCenter} 
              radius={6} 
              pathOptions={{ 
                fillColor: '#16a34a',
                color: '#ffffff', 
                weight: 2, 
                fillOpacity: 1 
              }}
            >
              <Popup>
                <div className="font-bold text-green-800">{hike.title}</div>
                {hike.location && <p className="text-xs text-slate-600">{hike.location}</p>}
              </Popup>
            </CircleMarker>
          )}
        </React.Fragment>
      )}
    </MapContainer>
  );
}