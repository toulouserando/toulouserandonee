'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChevronDown, PlusCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- CONFIGURATION LEAFLET SANS SSR ---
const MapContainer = dynamic(
  () => import('react-leaflet').then((m) => m.MapContainer),
  { ssr: false }
);

const TileLayer = dynamic(
  () => import('react-leaflet').then((m) => m.TileLayer),
  { ssr: false }
);

const Marker = dynamic(
  () => import('react-leaflet').then((m) => m.Marker),
  { ssr: false }
);

const Popup = dynamic(
  () => import('react-leaflet').then((m) => m.Popup),
  { ssr: false }
);

interface Rando {
  commune?: string;
  Durée?: string;
  LAT_DEPART?: number | string;
  LON_DEPART?: number | string;
  "Nom Rando": string;
  [key: string]: any;
}

export default function PageRandos() {
  const [data, setData] = useState<any>(null);
  const [selectedRando, setSelectedRando] = useState<Rando | null>(null);

  // 🎯 On crée la référence directe pour manipuler l'instance de la carte
  const mapRef = useRef<any>(null);

  // 1. Chargement des données cantonales depuis l'API
  useEffect(() => {
    fetch('/api/point_rando_canton')
      .then((res) => res.json())
      .then((json) => {
        console.log("API chargée", json);
        setData(json);
      })
      .catch((err) => console.error("Erreur API :", err));
  }, []);

  // 2. Recentrage automatique et stable sur le point de départ choisi
  useEffect(() => {
    if (!selectedRando) return;

    const lat = Number(selectedRando.LAT_DEPART);
    const lon = Number(selectedRando.LON_DEPART);

    if (!Number.isNaN(lat) && !Number.isNaN(lon) && mapRef.current) {
      mapRef.current.setView([lat, lon], 12);
    }
  }, [selectedRando]);

  // 3. Configuration du marqueur Leaflet
  const customIcon = useMemo(() => {
    if (typeof window === 'undefined') return null;
    const L = require('leaflet');
    return new L.Icon({
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
    });
  }, []);

  if (!data) {
    return (
      <div className="flex items-center justify-center h-screen text-lg font-medium text-slate-600 bg-slate-50">
        🔄 Chargement des randonnées d'Occitanie...
      </div>
    );
  }

  // Position du marqueur
  const markerPosition = selectedRando
    ? [Number(selectedRando.LAT_DEPART), Number(selectedRando.LON_DEPART)]
    : null;

  const hasValidCoords = markerPosition && !Number.isNaN(markerPosition[0]) && !Number.isNaN(markerPosition[1]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden">
      
      {/* 1. CARTE (Hauteur de 45% exactement comme le modèle fonctionnel) */}
      <div className="h-[45%] w-full z-10 border-b-2 border-blue-600 relative">
        <MapContainer
          center={[43.9, 2.4]}
          zoom={8}
          className="h-full w-full"
          ref={mapRef}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {hasValidCoords && customIcon && (
            <Marker position={[markerPosition[0], markerPosition[1]]} icon={customIcon}>
              <Popup>
                <div className="text-xs font-bold text-slate-900">{selectedRando?.["Nom Rando"]}</div>
                <div className="text-[10px] text-slate-500">{selectedRando?.commune}</div>
              </Popup>
            </Marker>
          )}
        </MapContainer>

        {/* 🎯 BOUTON ACTION FLOTTANT : Garanti visible avec z-[1000] absolue au-dessus de la carte */}
        {selectedRando && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
            <Link
              href={`/point_rando_canton/create?id=${encodeURIComponent(selectedRando["Nom Rando"])}&source=point_rando_canton`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105 text-sm whitespace-nowrap"
            >
              <PlusCircle size={18} />
              Créer la sortie avec ce tracé
            </Link>
          </div>
        )}

        {/* Repère de commune active */}
        {selectedRando && (
          <div className="absolute bottom-2 right-2 z-[1000] bg-white p-2 rounded shadow text-xs font-bold border border-slate-200">
            📍 {selectedRando.commune || "Commune inconnue"}
          </div>
        )}
      </div>

      {/* 2. ARBORESCENCE EXPLORATEUR (Fils de l'écran flex-1) */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            🧭 EXPLORATEUR OCCITANIE
          </h2>

          <div className="space-y-2">
            {Object.entries(data).map(([dept, cantons]: any) => (
              <details key={dept} className="mb-2 border rounded-lg overflow-hidden border-slate-200">
                <summary className="p-3 font-bold bg-slate-800 text-white cursor-pointer hover:bg-slate-700 flex justify-between items-center list-none">
                  <span>📂 {dept}</span>
                  <ChevronDown size={16} />
                </summary>
                
                <div className="pl-4 p-2 bg-slate-50 space-y-1">
                  {Object.entries(cantons).map(([canton, epcis]: any) => (
                    <details key={canton} className="mb-1 border-l-2 border-slate-300 ml-2">
                      <summary className="p-2 text-sm font-semibold cursor-pointer text-slate-700 hover:text-blue-600 flex justify-between items-center list-none">
                        <span>🧩 Canton : {canton}</span>
                      </summary>

                      <div className="pl-4 space-y-1">
                        {Object.entries(epcis).map(([epci, communes]: any) => (
                          <details key={epci} className="mb-1">
                            <summary className="p-1 text-xs text-slate-500 cursor-pointer italic">
                              🏛️ {epci}
                            </summary>

                            <div className="pl-4 grid grid-cols-1 gap-1">
                              {Object.entries(communes).map(([commune, randos]: any) => (
                                <details key={commune} className="border-l-2 border-blue-200 ml-2">
                                  <summary className="p-1 text-[11px] font-bold text-blue-600 uppercase cursor-pointer">
                                    🏘️ {commune}
                                  </summary>

                                  <div className="p-2 grid grid-cols-1 gap-2">
                                    {Array.isArray(randos) && randos.map((r: Rando, i: number) => {
                                      const isSelected = selectedRando && selectedRando["Nom Rando"] === r["Nom Rando"];
                                      return (
                                        <button
                                          key={i}
                                          type="button"
                                          onClick={() => setSelectedRando(r)}
                                          className={`text-left text-xs p-3 rounded transition-colors border flex justify-between items-center cursor-pointer ${
                                            isSelected 
                                              ? 'bg-blue-600 text-white shadow-md border-blue-700 font-bold' 
                                              : 'bg-white border-slate-200 hover:bg-blue-50'
                                          }`}
                                        >
                                          <div className="flex flex-col">
                                            <span className="text-sm mb-0.5">🥾 {r["Nom Rando"]}</span>
                                            <span className={`text-[10px] ${isSelected ? 'text-blue-100' : 'text-slate-400'}`}>
                                              Durée estimée : {r.Durée || 'N/C'}
                                            </span>
                                          </div>
                                          <span className={`text-xs font-mono px-2 py-0.5 rounded ${isSelected ? 'bg-white/20' : 'bg-slate-100 text-slate-600'}`}>
                                            {isSelected ? 'Sélectionné ✅' : 'Voir'}
                                          </span>
                                        </button>
                                      );
                                    })}
                                  </div>
                                </details>
                              ))}
                            </div>
                          </details>
                        ))}
                      </div>
                    </details>
                  ))}
                </div>
              </details>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}