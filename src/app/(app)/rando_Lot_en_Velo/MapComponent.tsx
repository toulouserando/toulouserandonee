"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Hook pour gérer le recentrage automatique sur l'ensemble des tracés visibles
function ChangeView({ data }: { data: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !data || data.length === 0) return;

    try {
      const group = new L.FeatureGroup();

      data.forEach((item) => {
        // CORRECTION : Tes données GeoJSON sont stockées dans item.raw (FeatureCollection)
        if (item.raw) {
          const geoLayer = L.geoJSON(item.raw);
          group.addLayer(geoLayer);
        }
      });

      const bounds = group.getBounds();
      if (bounds.isValid()) {
        // Aligne automatiquement le zoom pour faire entrer toutes les lignes actives dans l'écran
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      }
    } catch (err) {
      console.error("Erreur lors de l'ajustement des frontières géographiques :", err);
    }
  }, [map, data]);

  return null;
}

interface MapComponentProps {
  selectedSource: string;
  data: any[];
  customPoints: [number, number][];
  setCustomPoints: React.Dispatch<React.SetStateAction<[number, number][]>>;
}

export default function MapComponent({ selectedSource, data, customPoints, setCustomPoints }: MapComponentProps) {
  
  // Style dynamique des lignes du réseau vélo
  const getPolylineStyle = () => {
    return {
      color: selectedSource === 'all' ? '#10b981' : '#0284c7', // Vert émeraude si vue globale, bleu si tracé unique
      weight: 5,
      opacity: 0.85,
      lineJoin: 'round' as const
    };
  };

  // Ajout de popups descriptifs cliquables au-dessus des lignes
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties) {
      const nom = feature.properties.nom || "Circuit Vélo";
      const distance = feature.properties.distance_km ? `${feature.properties.distance_km} km` : "Non spécifiée";
      const difficulte = feature.properties.difficulte || "Non définie";

      layer.bindPopup(`
        <div style="font-family: sans-serif; padding: 2px;">
          <h3 style="font-weight: bold; margin: 0 0 4px 0; color: #065f46; font-size: 14px;">🚴 ${nom}</h3>
          <p style="margin: 2px 0; font-size: 12px; color: #475569;"><b>Distance :</b> ${distance}</p>
          <p style="margin: 2px 0; font-size: 12px; color: #475569;"><b>Difficulté :</b> ${difficulte}</p>
        </div>
      `);
    }
  };

  return (
    <div className="h-full w-full bg-slate-100">
      <MapContainer 
        center={[44.6, 1.5]} // Centré sur le Lot (Cahors) au lieu de Toulouse pour voir immédiatement les tracés
        zoom={10} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Contrôleur d'auto-zoom adaptatif */}
        <ChangeView data={data} />

        {/* Affichage simultané de toutes les Features GeoJSON injectées dans le tableau data */}
        {data.map((circuit) => {
          // CORRECTION : On vérifie l'existence de circuit.raw (qui contient le GeoJSON complet)
          if (!circuit.raw) return null;
          
          return (
            <GeoJSON 
              key={circuit.filename || circuit.id} // Utilisation du nom de fichier unique comme clé
              data={circuit.raw} // On passe l'objet FeatureCollection entier à React-Leaflet
              style={getPolylineStyle}
              onEachFeature={onEachFeature}
            />
          );
        })}
      </MapContainer>
    </div>
  );
}