"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Icône de repère standard (Point de départ du sentier)
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Style graphique appliqué sur les chemins vectoriels (geo_shape)
const pathStyle = {
  color: "#2563eb", // Bleu royal
  weight: 4,
  opacity: 0.8,
  lineJoin: 'round' as const
};

// Hook utilitaire pour recentrer et zoomer automatiquement
function ChangeView({ circuits }: { circuits: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !circuits || circuits.length === 0) return;

    try {
      const featureGroup = new L.FeatureGroup();

      circuits.forEach((c) => {
        // Option 1 : Rapprocher la caméra sur la base du tracé vectoriel complet
        if (c.shape && c.shape.geometry) {
          const geoLayer = L.geoJSON(c.shape);
          featureGroup.addLayer(geoLayer);
        }
        // Option 2 : Repli sur le point de départ isolé (geo_point_2d)
        else if (c.geo && c.geo.lat && c.geo.lon) {
          const marker = L.marker([c.geo.lat, c.geo.lon]);
          featureGroup.addLayer(marker);
        }
      });

      const bounds = featureGroup.getBounds();
      if (bounds.isValid()) {
        if (circuits.length === 1) {
          // Focus précis sur un tracé unique
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        } else {
          // Zoom large pour voir tous les sentiers du département
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
      }
    } catch (err) {
      console.error("Erreur lors de la mise à jour des coordonnées de la caméra Leaflet :", err);
    }
  }, [map, circuits]);

  return null;
}

interface MapComponentProps {
  selectedCircuitId: string;
  circuits: any[];
}

export default function MapComponent({ selectedCircuitId, circuits }: MapComponentProps) {
  
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties?.nom) {
      layer.bindPopup(`<b class="font-sans text-blue-800">${feature.properties.nom}</b>`);
    }
  };

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[43.6466, 0.5265]} // Coordonnées centrales Gers par défaut
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Recentrage intelligent de la carte */}
        <ChangeView circuits={circuits} />

        {/* Itération sur les circuits transmis */}
        {circuits.map((c) => {
          const keyId = `sentier-node-${c.id}`;

          return (
            <div key={keyId}>
              {/* Couche Vectorielle : Affiche la ligne géodésique du sentier */}
              {c.shape && c.shape.geometry && (
                <GeoJSON 
                  data={c.shape}
                  style={pathStyle}
                  onEachFeature={onEachFeature}
                />
              )}

              {/* Marqueur Physique : Représente l'origine ou point de départ (geo_point_2d) */}
              {c.geo && c.geo.lat && c.geo.lon && (
                <Marker 
                  position={[c.geo.lat, c.geo.lon]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-1 font-sans max-w-[180px]">
                      <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded block w-max mb-1">
                        Point de départ
                      </span>
                      <h3 className="font-bold text-xs text-slate-900 leading-tight mb-1 capitalize">
                        {c.nom}
                      </h3>
                      <p className="text-[11px] text-slate-500 m-0">🏘️ {c.commune}</p>
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