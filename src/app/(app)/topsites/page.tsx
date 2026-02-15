'use client';

import { useEffect, useRef, useState } from "react";
import { Loader2, Trophy, Users, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function TopSitesPage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fetch("/api/topsites")
      .then((res) => res.json())
      .then((json) => {
        // Tri par fréquentation (du plus grand au plus petit)
        const sortedData = json.sort((a: any, b: any) => (b.total || 0) - (a.total || 0));
        setData(sortedData);
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !data) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (mapInstance.current) return;

      const map = L.map(mapRef.current, { center: [43.6, 2.5], zoom: 7 });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap France'
      }).addTo(map);

      data.forEach((site, i) => {
        if (site.lat && site.lng) {
          // Taille adaptative : un peu plus grande pour accueillir le texte
          const size = site.total > 1000000 ? 38 : site.total > 200000 ? 28 : 22;
          const color = site.total > 500000 ? "#be123c" : "#0369a1";

          const icon = L.divIcon({
            className: 'site-marker',
            // Ajout du numéro {i + 1} au centre avec Flexbox
            html: `
              <div style="
                background:${color}; 
                border:2px solid white; 
                border-radius:50%; 
                width:${size}px; 
                height:${size}px; 
                box-shadow:0 2px 6px rgba(0,0,0,0.3);
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-family: ui-sans-serif, system-ui, sans-serif;
                font-size: ${size > 30 ? '12px' : '10px'};
                font-weight: 800;
              ">
                ${i + 1}
              </div>`,
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2]
          });

          L.marker([site.lat, site.lng], { icon })
            .addTo(map)
            .bindPopup(`
              <div style="min-width:160px; font-family: sans-serif; padding: 2px;">
                <div style="font-size:10px; font-weight:bold; color:${color}; margin-bottom:2px;">CLASSEMENT #${i + 1}</div>
                <strong style="font-size:14px; display:block; margin-bottom:4px;">${site.sites}</strong>
                <div style="color:#64748b; font-size:12px; display:flex; align-items:center; gap:4px;">
                  📍 ${site.commune}
                </div>
                <div style="margin-top:8px; padding-top:8px; border-top:1px solid #e2e8f0; font-weight:bold; color:#1e293b;">
                  👥 ${site.total ? site.total.toLocaleString() : 'N/C'} <span style="font-weight:normal; font-size:11px;">visiteurs</span>
                </div>
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
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <Loader2 className="animate-spin text-rose-600 mb-4" size={40} />
      <p className="text-slate-500 font-medium">Analyse du tourisme en Occitanie...</p>
    </div>
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen bg-slate-50">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-100 p-2 rounded-lg">
            <Trophy className="text-amber-600" size={24} />
          </div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight">
            OCCITANIE <span className="text-rose-600">2021</span>
          </h1>
        </div>
        <p className="text-slate-500 font-medium italic">Fréquentation des sites touristiques (Top {data.length})</p>
      </header>

      {/* CARTE AVEC MARQUEURS NUMÉROTÉS */}
      <div className="relative w-full mb-12 border-4 border-white shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-200" style={{ height: "55vh" }}>
        <div ref={mapRef} className="h-full w-full" />
        {!isReady && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-100/80 z-10 text-rose-600">
            <Loader2 className="animate-spin" />
          </div>
        )}
      </div>

      {/* PODIUM (TOP 3) */}
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Trophy size={20} className="text-amber-500" /> Les incontournables
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {data.slice(0, 3).map((site, i) => (
          <div key={i} className="p-8 bg-rose-600 text-white rounded-[2rem] shadow-xl relative overflow-hidden group hover:scale-105 transition-all duration-300">
            <div className="absolute right-[-10px] bottom-[-10px] opacity-10 group-hover:rotate-12 transition-transform">
              <Trophy size={120} />
            </div>
            <div className="bg-white/20 w-fit px-3 py-1 rounded-full text-xs font-bold mb-4 uppercase tracking-widest">
              N°{i + 1}
            </div>
            <h3 className="text-xl font-bold mb-2 leading-tight h-14 line-clamp-2 italic">{site.sites}</h3>
            <p className="text-3xl font-black">
              {site.total ? site.total.toLocaleString() : 'N/C'}
              <span className="text-sm font-normal opacity-70 ml-2 block italic text-rose-100">visites / an</span>
            </p>
          </div>
        ))}
      </div>

      {/* LISTE INTÉGRALE */}
      <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
        <Users size={20} className="text-slate-400" /> Classement complet
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {data.map((site, i) => (
          <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-rose-200 transition-all group">
            <div className="flex justify-between items-start mb-3">
              <span className="text-[10px] font-black bg-slate-100 text-slate-500 px-2 py-1 rounded-md group-hover:bg-rose-600 group-hover:text-white transition-colors">
                #{i + 1}
              </span>
              <div className="text-[10px] flex items-center gap-1 text-slate-400 font-bold uppercase truncate max-w-[70%]">
                <MapPin size={10} /> {site.commune}
              </div>
            </div>
            <h4 className="font-bold text-slate-800 text-sm mb-4 line-clamp-2 h-10 leading-tight group-hover:text-rose-700 transition-colors">
              {site.sites}
            </h4>
            <div className="flex items-center justify-between border-t border-slate-50 pt-3">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Total Visites</span>
              <span className="text-sm font-black text-slate-700 font-mono">
                {site.total ? site.total.toLocaleString() : 'N/C'}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}