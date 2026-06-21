"use client";

import React, { useEffect } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// --- DYNAMIC LEAFLET COMPONENTS ---
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// Helper pour récupérer l'instance Leaflet
const useMapInstance = () => {
  const { useMap } = require('react-leaflet');
  try { return useMap(); } catch (e) { return null; }
};

// --- COMPOSANT DE CADRAGE DYNAMIQUE AUTOMATIQUE ---
function ChangeView({ geoData }: { geoData: any }) {
  const map = useMapInstance();
  
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
  // 🎯 EXTRACTION : Récupération du tracé GeoJSON (geometry, route_geometry ou geojson_data)
  const geo = hike.geometry || hike.route_geometry || hike.geojson_data;

  // Conversion en objet si c'est du texte brut JSON provenant de la BDD
  const parsedGeo = typeof geo === "string" ? JSON.parse(geo) : geo;

  const isPoint = parsedGeo?.type === "Point";
  
  // Coordonnées pour placer le CircleMarker si c'est un point unique
  const finalCenter: [number, number] | null = isPoint && parsedGeo?.coordinates 
    ? [parsedGeo.coordinates[1], parsedGeo.coordinates[0]] // Leaflet inversé [Lat, Lon] vs GeoJSON [Lon, Lat]
    : hike.center || null;

  // Centre par défaut de la carte (Toulouse) au cas où rien ne charge au tout début
  const defaultCenter: [number, number] = [43.6045, 1.4442];

  return (
    <MapContainer center={defaultCenter} zoom={12} className="h-full w-full">
      <TileLayer 
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" 
        attribution='&copy; OpenStreetMap France' 
      />
      
      {/* Recadrage automatique de la carte sur la trace reçue */}
      {parsedGeo && <ChangeView geoData={parsedGeo} />}

      {parsedGeo && (
        <React.Fragment>
          <GeoJSON 
            key={`hike-geojson-${hike.id}`}
            data={parsedGeo} 
            pointToLayer={() => (null as any)} // Ignore les points par défaut, géré par CircleMarker
            style={{ 
              color: '#2563eb', // 🎯 Tracé en Bleu Royal (Bleu au lieu de Vert)
              weight: 5, 
              opacity: 0.85 
            }} 
          />

          {/* 🎯 CORRECTION : Rendu conditionnel propre du point d'intérêt isolé */}
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