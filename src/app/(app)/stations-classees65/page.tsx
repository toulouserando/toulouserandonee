'use client';

import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

interface Station {
  com_name_source: string;
  com_tourism_type: string;
  dep_name: string;
  epci_name: string;
  latitude: number;
  longitude: number;
  com_code_source: string;
}

export default function Accueil65Page() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const [data, setData] = useState<Station[] | null>(null);
  const [isReady, setIsReady] = useState(false);

  // 1. Chargement des données enrichies par l'API
  useEffect(() => {
    fetch("/api/stations-classees65")
      .then((res) => res.json())
      .then((json) => {
        if (Array.isArray(json)) setData(json);
      })
      .catch(console.error);
  }, []);

  // 2. Initialisation de la carte (Style Europe)
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !data) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;

      if (mapInstance.current) return;

      // Centre sur Montauban / Tarn-et-Garonne
      const map = L.map(mapRef.current, {
        center: [44.016, 1.35],
        zoom: 9,
        zoomControl: true
      });
      
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap France'
      }).addTo(map);

      // Ajout des marqueurs circulaires stylisés
      data.forEach((st, index) => {
        if (st.latitude && st.longitude) {
          const isStation = st.com_tourism_type.includes("Station");
          const color = isStation ? "#e11d48" : "#f59e0b"; // Rose/Rouge pour station, Ambre pour commune

          const customIcon = L.divIcon({
            className: 'custom-marker',
            html: `<div style="
              background-color: ${color}; 
              color: white; 
              border-radius: 50%; 
              width: 28px; 
              height: 28px; 
              display: flex; 
              align-items: center; 
              justify-content: center; 
              font-weight: bold; 
              border: 3px solid white; 
              box-shadow: 0 3px 6px rgba(0,0,0,0.2); 
              font-size: 11px;
            ">${index + 1}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
          });

          L.marker([st.latitude, st.longitude], { icon: customIcon })
            .addTo(map)
            .bindPopup(`
              <div style="font-family: sans-serif; padding: 5px;">
                <strong style="font-size: 14px; color: ${color}; uppercase">${st.com_name_source}</strong><br>
                <span style="font-size: 12px; font-weight: bold;">${st.com_tourism_type}</span><br>
                <small style="color: #666;">${st.epci_name}</small>
              </div>
            `);
        }
      });

      setTimeout(() => {
        map.invalidateSize();
        setIsReady(true);
      }, 300);
    };

    initMap();

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [data]);

  if (!data) return (
    <div className="h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-orange-600 mb-2" size={32} />
      <p className="text-slate-500">Initialisation des données touristiques...</p>
    </div>
  );

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-black text-slate-900 tracking-tight italic">
          EXPLORE <span className="text-orange-600">OCCITANIE</span>
        </h1>
        <p className="text-slate-500 font-medium">Secteur Tarn-et-Garonne : Communes classées</p>
      </header>

      {/* CARTE LEAFLET (Conteneur façon Europe) */}
      <div className="relative w-full border-4 border-white shadow-2xl rounded-[2rem] bg-slate-200 overflow-hidden" style={{ height: "55vh" }}>
        <div ref={mapRef} className="h-full w-full" />
        
        {!isReady && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50/90 z-[1000]">
            <Loader2 className="animate-spin h-8 w-8 text-orange-600 mb-2" />
            <p className="text-slate-600 font-bold animate-pulse text-sm">Génération de la carte…</p>
          </div>
        )}
      </div>

      {/* GRILLE DES COMMUNES */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {data.map((st, index) => (
          <div key={index} className="group p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-md hover:border-orange-200 transition-all flex gap-4 items-start">
            <div className="bg-slate-50 rounded-full w-10 h-10 flex items-center justify-center flex-shrink-0 group-hover:bg-orange-50 transition-colors">
              <span className="font-black text-slate-300 group-hover:text-orange-400 text-sm">
                {(index + 1).toString().padStart(2, '0')}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{st.com_name_source}</h3>
              <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mt-1">
                {st.com_tourism_type}
              </p>
              <div className="flex items-center gap-1 mt-3 text-slate-400">
                <MapPin size={12} />
                <span className="text-[10px] font-medium truncate w-40">{st.epci_name}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}