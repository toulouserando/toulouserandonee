"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction des icônes Leaflet par défaut
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Configuration du style de la ligne du sentier (Bleu pour la Haute-Garonne / Gers)
const pathStyle = {
  color: "#2563eb", // Bleu royal
  weight: 5,
  opacity: 0.85,
  lineJoin: 'round' as const
};

// Hook pour gérer le centrage et le zoom automatique de la carte
function ChangeView({ circuits }: { circuits: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !circuits || circuits.length === 0) return;

    try {
      const featureGroup = new L.FeatureGroup();

      circuits.forEach((c) => {
        // Si le circuit possède une géométrie GeoJSON complète
        if (c.shape && c.shape.geometry) {
          const geoLayer = L.geoJSON(c.shape);
          featureGroup.addLayer(geoLayer);
        }
        // Repli : si seul le point GPS de départ est disponible
        else if (c.geo && c.geo.lat && c.geo.lon) {
          const marker = L.marker([c.geo.lat, c.geo.lon]);
          featureGroup.addLayer(marker);
        }
      });

      const bounds = featureGroup.getBounds();
      if (bounds.isValid()) {
        // Si un seul circuit est sélectionné ou affiché : zoom ciblé
        if (circuits.length === 1) {
          map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        } else {
          // Vue d'ensemble du département complet (Gers ou Haute-Garonne)
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 10 });
        }
      }
    } catch (err) {
      console.error("Erreur lors du recadrage de la caméra Leaflet :", err);
    }
  }, [map, circuits]);

  return null;
}

interface MapComponentProps {
  filtre: string;
  circuits: any[];
}

export default function MapComponent({ filtre, circuits }: MapComponentProps) {
  
  // Popups internes sur les lignes GeoJSON si elles contiennent des métadonnées
  const onEachFeature = (feature: any, layer: L.Layer) => {
    if (feature.properties?.nom_itineraire || feature.properties?.nom) {
      const label = feature.properties.nom_itineraire || feature.properties.nom;
      layer.bindPopup(`<b class="font-sans text-blue-800">${label}</b>`);
    }
  };

  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[43.6045, 1.4442]} // Centrage initial par défaut sur Toulouse / Occitanie
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {/* Déclencheur du recadrage dynamique automatique */}
        <ChangeView circuits={circuits} />

        {/* Rendu des tracés et des marqueurs */}
        {circuits.map((c) => {
          const keyId = `map-item-${c.id}`;

          return (
            <div key={keyId}>
              {/* ÉLÉMENT VECTORIEL : Trace la ligne complète du sentier sur la carte */}
              {c.shape && c.shape.geometry && (
                <GeoJSON 
                  data={c.shape}
                  style={pathStyle}
                  onEachFeature={onEachFeature}
                />
              )}

              {/* MARQUEUR : Place un drapeau/repère au point de départ de la rando */}
              {c.geo && c.geo.lat && c.geo.lon && (
                <Marker 
                  position={[c.geo.lat, c.geo.lon]}
                  icon={customIcon}
                >
                  <Popup>
                    <div className="p-1 font-sans max-w-[200px]">
                      <span className="text-[9px] font-bold text-blue-600 uppercase bg-blue-50 px-1.5 py-0.5 rounded block w-max mb-1">
                        Départ Randonnée
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