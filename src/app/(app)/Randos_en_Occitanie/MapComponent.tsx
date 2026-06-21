"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction globale des chemins d'icônes Leaflet par défaut
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Style graphique appliqué sur les tracés routiers / sentiers GeoJSON
const lineStyle = {
  color: "#059669", // Vert émeraude de la charte
  weight: 5,
  opacity: 0.85,
  lineJoin: 'round' as const
};

// Hook adaptatif pour ajuster automatiquement le zoom et le centrage
function ChangeView({ lines }: { lines: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !lines || lines.length === 0) return;

    try {
      const featureGroup = new L.FeatureGroup();

      lines.forEach((item) => {
        // Cas A : L'item possède un fichier GeoJSON complet (tracé vectoriel)
        if (item.has_path && item.raw) {
          const geoLayer = L.geoJSON(item.raw);
          featureGroup.addLayer(geoLayer);
        } 
        // Cas B : C'est un point fixe isolé, on englobe ses coordonnées principales
        else if (item.coords_site?.lat && item.coords_site?.lon) {
          const marker = L.marker([item.coords_site.lat, item.coords_site.lon]);
          featureGroup.addLayer(marker);
        }
      });

      const bounds = featureGroup.getBounds();
      if (bounds.isValid()) {
        if (lines.length === 1) {
          // Si focus sur un élément unique : zoom rapproché adaptatif
          if (lines[0].has_path) {
            map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
          } else {
            map.setView([lines[0].coords_site.lat, lines[0].coords_site.lon], 14, { animate: true });
          }
        } else {
          // Vue d'ensemble multicritères globale
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour des frontières géographiques :", err);
    }
  }, [map, lines]);

  return null;
}

interface MapComponentProps {
  selectedId: string;
  lines: any[];
}

export default function MapComponent({ selectedId, lines }: MapComponentProps) {
  
  // Injection des événements contextuels sur chaque élément du tracé GeoJSON
  const onEachFeature = (feature: any, layer: L.Layer) => {
    // Si des métadonnées internes existent au sein du fichier GeoJSON
    if (feature.properties) {
      const label = feature.properties.nom || "Segment Randoligne";
      layer.bindPopup(`<b class="font-sans text-emerald-800">${label}</b>`);
    }
  };

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[43.6045, 1.4442]} // Centrage initial Occitanie (Toulouse)
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Contrôleur d'auto-zoom automatique */}
        <ChangeView lines={lines} />

        {/* RENDU COMBINÉ DES ÉLÉMENTS DU RÉSEAU */}
        {lines.map((item) => {
          const keyId = `line-node-${item.id}`;

          return (
            <div key={keyId}>
              {/* ÉLÉMENT A : Rendu géométrique de la ligne si présente */}
              {item.has_path && item.raw && (
                <GeoJSON 
                  data={item.raw}
                  style={lineStyle}
                  onEachFeature={onEachFeature}
                />
              )}

              {/* ÉLÉMENT B : Marqueur physique de l'emplacement central du monument */}
              {item.coords_site?.lat && item.coords_site?.lon && (
                <Marker 
                  position={[item.coords_site.lat, item.coords_site.lon]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-1 font-sans max-w-[200px]">
                      <span className="text-[9px] font-bold text-emerald-600 uppercase bg-emerald-50 px-1.5 py-0.5 rounded block w-max mb-1">
                        {item.has_path ? "Grand Site Équipé" : "Monument Unique"}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 leading-tight mb-1">{item.nom}</h3>
                      <p className="text-xs text-slate-500 m-0">📍 {item.ville}</p>
                    </div>
                  </Popup>
                </Marker>
              )}
            </div>
          );
        })}
      </MapContainer>
    </div>
  );
}