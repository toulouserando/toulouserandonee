'use client';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

// --- CONFIGURATION DU MARQUEUR ---
const L = typeof window !== 'undefined' ? require('leaflet') : null;
const customIcon = L ? new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
}) : null;

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(m => m.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(m => m.Popup), { ssr: false });

const MapController = ({ coords }: { coords: [number, number] }) => {
  const { useMap } = require('react-leaflet');
  const map = useMap();
  useEffect(() => {
    if (coords && map) map.setView(coords, 13, { animate: true });
  }, [coords, map]);
  return null;
};

export default function PageRandos() {
  const [data, setData] = useState<any>(null);
  const [selectedRando, setSelectedRando] = useState<any>(null);

  useEffect(() => {
    fetch('/api/geojson') 
      .then(res => res.json())
      .then(setData)
      .catch(err => console.error("Erreur chargement data:", err));
  }, []);

  if (!data) return (
    <div className="flex h-screen items-center justify-center bg-slate-50">
      <div className="text-center">
        <div className="animate-spin text-4xl mb-4">🔄</div>
        <p className="font-bold text-slate-600">Chargement des sentiers...</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen w-full font-sans bg-slate-100 overflow-hidden">
      
      {/* 1. CARTE */}
      <div className="h-[40%] w-full shadow-md z-10 border-b-2 border-blue-600 relative">
        <MapContainer center={[43.9, 2.4]} zoom={8} className="h-full w-full">
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {selectedRando && (
            <>
              <MapController coords={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} />
              <Marker position={[selectedRando.LAT_DEPART, selectedRando.LON_DEPART]} icon={customIcon}>
                <Popup>
                  <div className="text-sm font-bold">{selectedRando["Nom Rando"]}</div>
                  <p className="text-xs">{selectedRando.commune}</p>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* 2. ARBORESCENCE COMPACTE */}
      <div className="flex-1 overflow-y-auto p-4 bg-white">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-lg font-bold text-slate-700 mb-4 flex items-center gap-2">
            <span className="text-blue-600">📍</span> PARCOURIR LES RANDONNÉES
          </h2>

          <div className="space-y-2">
            {/* NIVEAU 1 : DÉPARTEMENT */}
            {Object.entries(data).map(([dept, cantons]: any) => (
              <details key={dept} className="group border border-slate-200 rounded-lg">
                <summary className="list-none cursor-pointer p-3 font-bold bg-slate-50 flex justify-between items-center hover:bg-slate-100">
                  <span>📂 {dept}</span>
                  <span className="text-xs group-open:rotate-180">▼</span>
                </summary>
                
                <div className="p-2 space-y-1 ml-4 border-l-2 border-slate-100">
                  {/* NIVEAU 2 : CANTON */}
                  {Object.entries(cantons).map(([canton, epcis]: any) => (
                    <details key={canton} className="group/canton">
                      <summary className="list-none cursor-pointer py-2 px-3 font-semibold text-slate-700 flex justify-between items-center hover:text-blue-600">
                        <span>🧩 Canton : {canton}</span>
                        <span className="text-[10px] group-open/canton:rotate-180">▼</span>
                      </summary>

                      <div className="ml-4 space-y-1">
                        {/* NIVEAU 3 : EPCI */}
                        {Object.entries(epcis).map(([epci, communes]: any) => (
                          <details key={epci} className="group/epci">
                            <summary className="list-none cursor-pointer py-1.5 px-3 text-sm text-slate-500 font-medium flex justify-between items-center hover:text-blue-500">
                              <span>🏛️ {epci}</span>
                              <span className="text-[10px] group-open/epci:rotate-180">▼</span>
                            </summary>

                            <div className="ml-4 space-y-1 pb-2">
                              {/* NIVEAU 4 : COMMUNE (NOUVEL ACCORDÉON) */}
                              {Object.entries(communes).map(([commune, randos]: any) => (
                                <details key={commune} className="group/commune border-b border-slate-50">
                                  <summary className="list-none cursor-pointer py-1 px-3 text-xs font-bold text-blue-700 uppercase flex justify-between items-center bg-blue-50/30 rounded">
                                    <span>🏘️ {commune} <span className="ml-2 text-[10px] font-normal text-slate-400">({Array.isArray(randos) ? randos.length : 0})</span></span>
                                    <span className="text-[8px] group-open/commune:rotate-180">▼</span>
                                  </summary>

                                  <div className="grid grid-cols-1 gap-1 p-2">
                                    {Array.isArray(randos) && randos.map((r: any, i: number) => (
                                      <button
                                        key={i}
                                        onClick={() => {
                                          setSelectedRando(r);
                                          window.scrollTo({ top: 0, behavior: 'smooth' });
                                        }}
                                        className={`text-left text-xs p-2 rounded transition-all flex justify-between items-center ${
                                          selectedRando === r 
                                          ? 'bg-blue-600 text-white shadow-md' 
                                          : 'bg-white border border-slate-200 hover:bg-slate-50'
                                        }`}
                                      >
                                        <span className="font-medium">🥾 {r["Nom Rando"]}</span>
                                        <span className={`text-[10px] ${selectedRando === r ? 'text-blue-100' : 'text-slate-400'}`}>
                                          {r.Durée || 'N/C'}
                                        </span>
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
    </div>
  );
}