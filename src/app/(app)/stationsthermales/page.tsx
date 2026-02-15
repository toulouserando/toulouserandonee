'use client';

import { useEffect, useRef, useState } from "react";
import { Loader2, Waves, MapPin, Activity } from "lucide-react";
import "leaflet/dist/leaflet.css";

export default function StationsThermalePage() {
  const mapRef = useRef<HTMLDivElement | null>(null);
  const mapInstance = useRef<any>(null);
  const [data, setData] = useState<any[] | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    fetch("/api/stationsthermales")
      .then(res => res.json())
      .then(json => {
        // On trie par fréquentation 2019 dès la réception pour fixer les numéros
        const sorted = json.sort((a: any, b: any) => (b.frequ_2019 || 0) - (a.frequ_2019 || 0));
        setData(sorted);
      });
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current || !data) return;

    const initMap = async () => {
      const L = (await import('leaflet')).default;
      if (mapInstance.current) return;

      const map = L.map(mapRef.current, { center: [43.6, 2.5], zoom: 7 });
      mapInstance.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png').addTo(map);

      data.forEach((st, i) => {
        const lat = st.geo_point_2d.lat;
        const lon = st.geo_point_2d.lon;
        
        // Taille et couleur selon l'importance
        const size = st.frequ_2019 > 10000 ? 32 : 24;
        const color = st.frequ_2019 > 10000 ? "#1e3a8a" : "#3b82f6";

        const icon = L.divIcon({
          className: 'thermal-marker',
          html: `
            <div style="
              background:${color}; 
              border:2px solid white; 
              border-radius:50%; 
              width:${size}px; 
              height:${size}px; 
              box-shadow: 0 2px 5px rgba(0,0,0,0.3);
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-family: sans-serif;
              font-size: ${size > 30 ? '12px' : '10px'};
              font-weight: bold;
            ">
              ${i + 1}
            </div>`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2]
        });

        L.marker([lat, lon], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="min-width:160px; font-family: sans-serif;">
              <div style="color:${color}; font-size:10px; font-weight:bold;">STATION THERMALE #${i + 1}</div>
              <strong style="font-size:14px; display:block; margin-bottom:5px;">${st.stations_t}</strong>
              <div style="font-size:12px; color:#64748b; margin-bottom:8px;">📍 ${st.nom_comm}</div>
              <div style="font-size:11px; background:#f1f5f9; padding:5px; rounded:4px; border-left:3px solid ${color};">
                ${st.special}
              </div>
              <div style="margin-top:8px; font-weight:bold; font-size:13px; text-align:right;">
                ${st.frequ_2019?.toLocaleString() || 'N/C'} <small>curistes</small>
              </div>
            </div>
          `);
      });

      setTimeout(() => { map.invalidateSize(); setIsReady(true); }, 300);
    };
    initMap();
    return () => { if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; } };
  }, [data]);

  if (!data) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-blue-500" size={40} /></div>;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-blue-600 rounded-2xl text-white shadow-lg">
            <Waves size={32} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight text-uppercase uppercase">Stations <span className="text-blue-600">Thermales</span></h1>
            <p className="text-slate-500 font-medium italic underline decoration-blue-200 decoration-2">Classement Occitanie 2019</p>
          </div>
        </div>
      </header>

      {/* CARTE NUMÉROTÉE */}
      <div className="relative w-full h-[55vh] border-4 border-white shadow-2xl rounded-[2.5rem] overflow-hidden bg-slate-200">
        <div ref={mapRef} className="h-full w-full" />
        {!isReady && <div className="absolute inset-0 flex items-center justify-center bg-white/50 z-10"><Loader2 className="animate-spin text-blue-600" /></div>}
      </div>

      {/* TABLEAU NUMÉROTÉ */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b bg-blue-50/50">
          <h2 className="font-bold text-blue-900 flex items-center gap-2">
            <Activity size={18} /> Détail des fréquentations par station
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-400 uppercase text-[10px] font-black tracking-widest border-b">
                <th className="p-5 w-16">Rang</th>
                <th className="p-5">Station</th>
                <th className="p-5">Commune</th>
                <th className="p-5 hidden lg:table-cell">Spécialité dominante</th>
                <th className="p-5 text-right">Visiteurs 2019</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((st, i) => (
                <tr key={i} className="hover:bg-blue-50/50 transition-colors group">
                  <td className="p-5">
                    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100 text-slate-500 font-bold text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {i + 1}
                    </span>
                  </td>
                  <td className="p-5">
                    <div className="font-bold text-slate-800 group-hover:text-blue-700">{st.stations_t}</div>
                  </td>
                  <td className="p-5 text-slate-500">
                    <div className="flex items-center gap-1.5 underline decoration-slate-200 uppercase text-[11px] font-bold">
                      <MapPin size={12} className="text-blue-400" /> {st.nom_comm}
                    </div>
                  </td>
                  <td className="p-5 text-slate-400 italic text-xs hidden lg:table-cell max-w-md">
                    {st.special}
                  </td>
                  <td className="p-5 text-right font-mono font-black text-blue-600 text-base">
                    {st.frequ_2019 ? st.frequ_2019.toLocaleString() : "N/C"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}