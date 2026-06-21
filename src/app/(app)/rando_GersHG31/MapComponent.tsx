"use client";

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix pour les icônes par défaut de Leaflet
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

interface MapComponentProps {
  selectedSource: string;
  data: any[];
  customPoints?: any[];
  setCustomPoints?: (points: any[]) => void;
}

// Composant interne pour recadrer automatiquement la carte sur les tracés
function RecadrerCarte({ positions }: { positions: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length > 0) {
      const bounds = L.latLngBounds(positions);
      map.fitBounds(bounds, { padding: [40, 40] }); // Augmenté légèrement le padding pour le confort visuel
    }
  }, [positions, map]);
  return null;
}

export default function MapComponent({ selectedSource, data }: MapComponentProps) {
  const [tracesCoords, setTracesCoords] = useState<[number, number][][]>([]);
  const [toutesLesPositions, setToutesLesPositions] = useState<[number, number][]>([]);

  useEffect(() => {
    if (!data || data.length === 0) {
      setTracesCoords([]);
      setToutesLesPositions([]);
      return;
    }

    const nouvellesTraces: [number, number][][] = [];
    const cumulPositions: [number, number][] = [];

    data.forEach((circuit) => {
      const geometry = circuit?.geometry;
      if (!geometry || !geometry.coordinates) return;

      // Cas classique d'une LineString GeoJSON
      if (geometry.type === "LineString") {
        const coordsInversees = geometry.coordinates.map((pt: number[]) => {
          // Inversion essentielle : GeoJSON [Lon, Lat, Alt] -> Leaflet [Lat, Lon]
          return [pt[1], pt[0]] as [number, number];
        });
        nouvellesTraces.push(coordsInversees);
        cumulPositions.push(...coordsInversees);
      } 
      // Cas où la géométrie contient plusieurs segments de lignes (MultiLineString)
      else if (geometry.type === "MultiLineString") {
        geometry.coordinates.forEach((ligne: number[][]) => {
          const coordsInversees = ligne.map((pt: number[]) => [pt[1], pt[0]] as [number, number]);
          nouvellesTraces.push(coordsInversees);
          cumulPositions.push(...coordsInversees);
        });
      }
    });

    setTracesCoords(nouvellesTraces);
    setToutesLesPositions(cumulPositions);
  }, [data]);

  return (
    <div className="w-full h-full">
      <MapContainer 
        center={[43.6045, 0.8]} // Centré par défaut au cœur du Gers/Haute-Garonne
        zoom={9} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* DESSIN DES TRACÉS DE RANDONNÉE */}
        {tracesCoords.map((coords, index) => (
          <Polyline 
            key={`route-${index}`} 
            positions={coords} 
            pathOptions={{ 
              color: '#059669', // Sublime vert émeraude
              weight: 4, 
              opacity: 0.85 
            }} 
          />
        ))}

        {/* MARQUEURS DE DÉPART ET D'ARRIVÉE */}
        {/* On les affiche uniquement si une SEULE randonnée spécifique est sélectionnée (pas le mode "all") */}
        {selectedSource && selectedSource !== 'all' && tracesCoords.length > 0 && tracesCoords[0].length > 0 && (
          <>
            <Marker position={tracesCoords[0][0]} icon={customIcon}>
              <Popup>
                <div className="p-1">
                  <span className="font-bold text-slate-900">🚀 Point de Départ</span>
                  <p className="text-xs text-slate-500 mt-0.5">Début du tracé enregistré</p>
                </div>
              </Popup>
            </Marker>
            
            <Marker position={tracesCoords[tracesCoords.length - 1][tracesCoords[tracesCoords.length - 1].length - 1]} icon={customIcon}>
              <Popup>
                <div className="p-1">
                  <span className="font-bold text-slate-900">🏁 Point d'Arrivée</span>
                  <p className="text-xs text-slate-500 mt-0.5">Fin de la boucle / du sentier</p>
                </div>
              </Popup>
            </Marker>
          </>
        )}

        {/* Recadrage automatique de la caméra Leaflet sur les tracés actifs */}
        {toutesLesPositions.length > 0 && (
          <RecadrerCarte positions={toutesLesPositions} />
        )}
      </MapContainer>
    </div>
  );
}