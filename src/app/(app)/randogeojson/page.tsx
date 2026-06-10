'use client';

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { PlusCircle } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// Import dynamique des composants Leaflet pour Next.js
const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

// Petit composant interne pour recentrer la carte
function ChangeView({ center }: { center: [number, number] }) {
  const map = (window as any).L ? require('react-leaflet').useMap() : null;
  if (map && center) map.setView(center, 12);
  return null;
}

export default function PageRandos() {
  const [data, setData] = useState<any>(null);
  const [selectedRando, setSelectedRando] = useState<any>(null);

  useEffect(() => {
    fetch('/api/randogeojson')
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Erreur API:", err));
  }, []);

  // Transformation des coordonnées plates en GeoJSON LineString
  const geoJsonData = useMemo(() => {
    if (!selectedRando || !selectedRando.LAT_DEPART) return null;

    // On filtre les coordonnées pour éviter les erreurs si un point est manquant (NaN)
    const points = [];
    if (!isNaN(selectedRando.LAT_DEPART)) points.push([selectedRando.LON_DEPART, selectedRando.LAT_DEPART]);
    if (!isNaN(selectedRando.LAT_PIVOT)) points.push([selectedRando.LON_PIVOT, selectedRando.LAT_PIVOT]);
    if (!isNaN(selectedRando.LAT_DEST)) points.push([selectedRando.LON_DEST, selectedRando.LAT_DEST]);

    return {
      type: "Feature",
      properties: { name: selectedRando["Nom Rando"] },
      geometry: {
        type: "LineString",
        coordinates: points
      }
    };
  }, [selectedRando]);

  if (!data) return <div className="p-10 text-center">Chargement des randonnées...</div>;

  return (
    <div className="flex flex-col h-screen w-full bg-slate-100 overflow-hidden">
      {/* CARTE */}
      <div className="h-[45%] w-full z-10 border-b-2 border-blue-600 relative">
        <MapContainer center={[43.9, 2.4]} zoom={8} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          
          {selectedRando && !isNaN(selectedRando.LAT_DEPART) && (
            <ChangeView center={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} />
          )}

          {geoJsonData && (
            <GeoJSON 
              key={selectedRando["Nom Rando"]} 
              data={geoJsonData as any} 
              style={{ color: '#1e3a8a', weight: 5, opacity: 0.8 }} 
            />
          )}
        </MapContainer>
        
        {/* ➕ BOUTON FLOTTANT ACTION : CRÉER LA SORTIE À PARTIR DU TRACÉ */}
        {selectedRando && (
          <div className="absolute top-4 right-4 z-[1000] flex flex-col gap-2 items-end">
            <Link
              href={`/randogeojson/create?id=${encodeURIComponent(selectedRando["Nom Rando"])}&source=randogeojson`}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-4 rounded-xl shadow-lg transition-all transform hover:scale-105 text-sm"
            >
              <PlusCircle size={18} />
              Créer la sortie avec ce tracé
            </Link>
          </div>
        )}

        {selectedRando && (
          <div className="absolute bottom-2 right-2 z-[1000] bg-white p-2 rounded shadow text-xs font-bold border border-slate-200">
            📍 {selectedRando.commune || "Commune inconnue"}
          </div>
        )}
      </div>

      {/* ARBORESCENCE */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-xl font-black mb-4 flex items-center gap-2">
            🧭 EXPLORATEUR OCCITANIE
          </h2>
          
          {Object.entries(data).map(([dept, cantons]: any) => (
            <details key={dept} className="mb-2 border rounded-lg overflow-hidden">
              <summary className="p-3 font-bold bg-slate-800 text-white cursor-pointer hover:bg-slate-700">
                {dept}
              </summary>
              <div className="pl-4 p-2 bg-slate-50">
                {Object.entries(cantons).map(([canton, epcis]: any) => (
                  <details key={canton} className="mb-1 border-l-2 border-slate-300 ml-2">
                    <summary className="p-2 text-sm font-semibold cursor-pointer text-slate-700 hover:text-blue-600">
                      Canton : {canton}
                    </summary>
                    <div className="pl-4">
                      {Object.entries(epcis).map(([epci, communes]: any) => (
                        <details key={epci} className="mb-1">
                          <summary className="p-1 text-xs text-slate-500 cursor-pointer italic">
                            {epci}
                          </summary>
                          <div className="pl-4 grid grid-cols-1 gap-1">
                            {Object.entries(communes).map(([commune, randos]: any) => (
                              <details key={commune} className="border-l-2 border-blue-200 ml-2">
                                <summary className="p-1 text-[11px] font-bold text-blue-600 uppercase cursor-pointer">
                                  {commune}
                                </summary>
                                <div className="p-2 grid grid-cols-1 gap-2">
                                  {randos.map((r: any, i: number) => (
                                    <button
                                      key={i}
                                      onClick={() => setSelectedRando(r)}
                                      className={`text-left text-xs p-3 rounded transition-colors border ${
                                        selectedRando === r 
                                        ? 'bg-blue-600 text-white shadow-md border-blue-700' 
                                        : 'bg-white border-slate-200 hover:bg-blue-50'
                                      }`}
                                    >
                                      <div className="font-bold text-sm mb-1">🥾 {r["Nom Rando"]}</div>
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 opacity-90">
                                        <div className="flex items-center gap-1">⏱️ <span className="font-semibold">{r["Durée"]}</span></div>
                                        <div className="flex items-center gap-1">🟢 Départ: <span className="italic truncate">{r["GPS_DEPART"]}</span></div>
                                        <div className="flex items-center gap-1">🟠 Pivot: <span className="italic truncate">{r["GPS_PIVOT"] || 'N/A'}</span></div>
                                        <div className="flex items-center gap-1">🔴 Arrivée: <span className="italic truncate">{r["GPS_DESTINATION"]}</span></div>
                                      </div>
                                    </button>
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
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}