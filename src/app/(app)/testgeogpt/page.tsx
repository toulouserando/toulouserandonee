"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import 'leaflet/dist/leaflet.css';

const MapContainer = dynamic(() => import('react-leaflet').then(m => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(m => m.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(m => m.GeoJSON), { ssr: false });

export default function TestGeoGPTPage() {
  const [geoData, setGeoData] = useState<any>(null);
  const [map, setMap] = useState<any>(null);
  const [highlightedRando, setHighlightedRando] = useState<string | null>(null);
  const [activeLetter, setActiveLetter] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch('/api/testgeogpt')
      .then(res => res.json())
      .then(data => setGeoData(data));

    // Fermer le menu si on clique ailleurs
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setActiveLetter(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const alphaGroups = useMemo(() => {
    if (!geoData) return {};
    const groups: Record<string, any[]> = {};
    const seenNames = new Set();
    const sortedFeatures = [...geoData.features].sort((a, b) => 
      a.properties["Nom Rando"].localeCompare(b.properties["Nom Rando"])
    );

    sortedFeatures.forEach((feature: any) => {
      const nom = feature.properties["Nom Rando"];
      if (!nom || seenNames.has(nom)) return;
      seenNames.add(nom);
      const initiale = nom.charAt(0).toUpperCase();
      const key = /[A-Z]/.test(initiale) ? initiale : "#";
      if (!groups[key]) groups[key] = [];
      groups[key].push(feature);
    });
    return groups;
  }, [geoData]);

  const handleRandoClick = (feature: any) => {
    setHighlightedRando(feature.properties["Nom Rando"]);
    setActiveLetter(null); // Ferme le menu après sélection
    if (map && feature.geometry.coordinates.length > 0) {
      const [lon, lat] = feature.geometry.coordinates[0];
      map.flyTo([lat, lon], 14, { duration: 1.5 });
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full bg-slate-100 font-sans">
      
      {/* 1. CARTE PLEINE LARGEUR */}
      <header className="w-full h-[450px] sticky top-0 z-[1000] shadow-md border-b bg-white">
        <MapContainer center={[43.9, 2.3]} zoom={8} style={{ height: '100%', width: '100%' }} ref={setMap}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {geoData && (
            <GeoJSON
              key={highlightedRando || 'all'}
              data={geoData}
              filter={(f) => !highlightedRando || f.properties["Nom Rando"] === highlightedRando}
              style={{ color: '#ef4444', weight: 6, opacity: 1 }}
            />
          )}
        </MapContainer>
      </header>

      {/* 2. BARRE ALPHABÉTIQUE HORIZONTALE */}
      <main className="w-full p-4 md:p-8" ref={menuRef}>
        <div className="max-w-6xl mx-auto">
          <div className="mb-6 flex justify-between items-center">
            <h1 className="text-xl font-bold text-slate-800 uppercase tracking-wider">Index Alphabétique</h1>
            <p className="text-sm text-blue-600 font-bold bg-blue-50 px-3 py-1 rounded-full">
              {geoData?.features.length || 0} randonnées
            </p>
          </div>

          {/* LISTE DES LETTRES À L'HORIZONTALE */}
          <div className="flex flex-wrap gap-2 justify-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200 relative">
            {Object.keys(alphaGroups).sort().map(lettre => (
              <div key={lettre} className="relative">
                <button
                  onClick={() => setActiveLetter(activeLetter === lettre ? null : lettre)}
                  className={`w-12 h-12 flex items-center justify-center rounded-xl font-bold transition-all border ${
                    activeLetter === lettre 
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg scale-110 z-[1100]" 
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-400 hover:bg-white"
                  }`}
                >
                  {lettre}
                  <span className="text-[8px] ml-0.5 mt-1 opacity-50 group-hover:opacity-100">▼</span>
                </button>

                {/* MENU DÉROULANT QUI PASSE PAR DESSUS (DROPDOWN) */}
                {activeLetter === lettre && (
                  <div className="absolute top-full left-0 mt-2 w-72 max-h-80 overflow-y-auto bg-white border border-slate-200 shadow-2xl rounded-xl z-[2000] animate-in fade-in zoom-in duration-200">
                    <div className="sticky top-0 bg-blue-50 p-2 text-xs font-bold text-blue-700 border-b flex justify-between">
                      <span>Lettre {lettre}</span>
                      <span>{alphaGroups[lettre].length} circuits</span>
                    </div>
                    <div className="p-1">
                      {alphaGroups[lettre].map((rando, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleRandoClick(rando)}
                          className="w-full text-left p-3 hover:bg-blue-50 rounded-lg text-sm text-slate-700 border-b border-slate-50 last:border-0 flex flex-col"
                        >
                          <span className="font-bold leading-tight">{rando.properties["Nom Rando"]}</span>
                          <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter italic">
                            ⏱ {rando.properties["Durée"]}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}