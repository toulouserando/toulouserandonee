"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { useMap } from 'react-leaflet';

const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

function RecenterMap({ center }: { center: [number, number] | null }) {
  const map = useMap(); 
  useEffect(() => {
    if (center && map) {
      map.setView(center, 14, { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function CarteRandoTest() {
  const [sources, setSources] = useState<{ locaux: any[], supabase: any[] }>({ locaux: [], supabase: [] });
  const [selectedSource, setSelectedSource] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [mounted, setMounted] = useState(false);
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch('/api/listerandos')
      .then(res => res.json())
      .then(json => {
        setSources(json);
        if (json.locaux?.length > 0) setSelectedSource(json.locaux[0].id);
        else if (json.supabase?.length > 0) setSelectedSource(json.supabase[0].id);
      })
      .catch(err => console.error("Erreur listing:", err));
  }, []);

  useEffect(() => {
    if (!selectedSource) return;
    setLoading(true);
    setData([]); 
    
    fetch(`/api/listerandos/${selectedSource}`)
      .then(res => res.json())
      .then(resData => {
        const results = Array.isArray(resData) ? resData : [resData];
        setData(results);

        if (results.length > 0) {
          const firstItem = results[0];
          const geom = firstItem.route_geometry || firstItem.geometry;
          
          if (firstItem.center) {
            setMapCenter(firstItem.center);
          } else if (geom && geom.coordinates && geom.coordinates.length > 0) {
            // Sécurité : si c'est une FeatureCollection, on prend la première feature
            const coords = geom.type === "FeatureCollection" ? geom.features[0].geometry.coordinates : geom.coordinates;
            setMapCenter([coords[0][1], coords[0][0]]);
          }
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur data:", err);
        setLoading(false);
      });
  }, [selectedSource]);

  if (!mounted) return null;

  return (
    <div className="flex flex-col h-screen w-full bg-gray-50 overflow-hidden">
      <header className="z-[1000] p-4 bg-white shadow-md flex items-center gap-4 border-b">
        <Link href="/" className="flex items-center gap-2 text-green-700 font-bold p-2 hover:bg-green-50 rounded-lg">
          <ArrowLeft size={20} />
          <span>Accueil</span>
        </Link>
        <div className="flex-1 max-w-2xl">
          <select 
            value={selectedSource} 
            onChange={(e) => setSelectedSource(e.target.value)}
            className="w-full border-2 border-gray-200 p-2 rounded-lg bg-white text-sm font-semibold outline-none focus:border-green-600"
          >
            <optgroup label="📂 LOCAUX">{sources.locaux?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</optgroup>
            <optgroup label="☁️ SUPABASE">{sources.supabase?.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}</optgroup>
          </select>
        </div>
        {loading && <div className="animate-spin h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full" />}
      </header>

      <main className="flex-1 relative z-0">
        <MapContainer 
          center={[43.60, 1.44]} 
          zoom={11} 
          className="h-full w-full"
          whenReady={() => setMapReady(true)}
        >
          <TileLayer url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" attribution='&copy; OSM' />
          
          {mapReady && (
            <>
              {mapCenter && <RecenterMap center={mapCenter} />}

              {data.map((item, idx) => {
                const rawGeo = item.route_geometry || item.geometry;
                if (!rawGeo) return null;

                try {
                  // 1. On parse si c'est du string
                  const parsedGeo = typeof rawGeo === 'string' ? JSON.parse(rawGeo) : rawGeo;

                  // 2. Validation de sécurité : est-ce que ça ressemble à du GeoJSON ?
                  if (!parsedGeo.type) return null;

                  // 3. Normalisation stricte
                  const normalized = parsedGeo.type === "FeatureCollection" ? parsedGeo : {
                    type: "FeatureCollection",
                    features: [{
                      type: "Feature",
                      geometry: parsedGeo,
                      properties: { title: item.title }
                    }]
                  };

                  return (
                    <GeoJSON 
                      // CRITIQUE : La clé doit changer radicalement pour forcer Leaflet 
                      // à oublier l'ancien objet "invalid"
                      key={`geo-${selectedSource}-${item.id || idx}-${JSON.stringify(parsedGeo).length}`} 
                      data={normalized}
                      style={{ color: '#2563eb', weight: 6, opacity: 0.9 }}
                      onEachFeature={(f, layer) => {
                        layer.bindPopup(`<b>${item.title}</b>`);
                      }}
                    />
                  );
                } catch (e) {
                  console.error("Erreur de rendu GeoJSON pour", item.title, e);
                  return null;
                }
              })}
            </>
          )}
        </MapContainer>
      </main>
    </div>
  );
}