"use client";

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Correction des icônes standards Leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34]
});

// Gestion du recentrage et zoom automatique sur le ou les marqueurs sélectionnés
function ChangeView({ sites }: { sites: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (!map || !sites || sites.length === 0) return;

    try {
      const group = new L.FeatureGroup();

      sites.forEach((site) => {
        if (site.coords?.lat && site.coords?.lon) {
          group.addLayer(L.marker([site.coords.lat, site.coords.lon]));
        }
      });

      const bounds = group.getBounds();
      if (bounds.isValid()) {
        if (sites.length === 1) {
          // Zoom serré si un seul édifice est sélectionné
          map.setView([sites[0].coords.lat, sites[0].coords.lon], 13, { animate: true });
        } else {
          // Vue d'ensemble si plusieurs
          map.fitBounds(bounds, { padding: [50, 50], maxZoom: 11 });
        }
      }
    } catch (err) {
      console.error("Erreur ajustement frontières géographiques :", err);
    }
  }, [map, sites]);

  return null;
}

interface MapComponentProps {
  selectedSiteId: string;
  sites: any[]; // Reçoit les sites filtrés depuis la page parente
}

export default function MapComponent({ selectedSiteId, sites }: MapComponentProps) {
  return (
    <div className="h-full w-full">
      <MapContainer 
        center={[43.6045, 1.4442]} // Toulouse par défaut
        zoom={8} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* Contrôleur d'auto-zoom adaptatif */}
        <ChangeView sites={sites} />

        {/* Affichage des marqueurs */}
        {sites.map((site) => {
          if (!site.coords?.lat || !site.coords?.lon) return null;

          return (
            <Marker 
              key={site.id} 
              position={[site.coords.lat, site.coords.lon]}
              icon={customIcon}
            >
              <Popup>
                <div className="p-2 w-48 font-sans">
                  <h3 className="font-bold text-base text-stone-900 leading-tight mb-1">{site.nom}</h3>
                  <p className="text-xs text-stone-600 m-0 mb-2">📍 {site.ville}</p>
                  <img 
                    src={`/pois-photos/Img_${site.id}.jpg`} 
                    alt={site.nom}
                    className="mt-2 rounded-lg w-full h-32 object-cover shadow-sm"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none'; // Masque l'image si elle n'existe pas
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