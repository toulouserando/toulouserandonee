"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  ArrowLeft, MousePointer2, Trash2, ChevronsUpDown, 
  Check, Users, Library, ChevronRight, Route 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

// --- DYNAMIC LEAFLET ---
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then(mod => mod.CircleMarker), { ssr: false });

// --- HELPERS ---
const useMapInstance = () => {
  const { useMap } = require('react-leaflet');
  try { return useMap(); } catch (e) { return null; }
};

function RoutingControl({ points, setPoints, active }: { points: any[], setPoints: any, active: boolean }) {
  const map = useMapInstance();
  const routingRef = useRef<any>(null);

  useEffect(() => {
    // CRITIQUE : On vérifie que la map ET le pane existent
    if (!map || !active || !map.getPanes()) {
      if (routingRef.current && map) {
        try { map.removeControl(routingRef.current); } catch (e) {}
        routingRef.current = null;
      }
      return;
    }

    let control: any;
    import('leaflet-routing-machine').then(() => {
      const L = (window as any).L;
      if (!routingRef.current && map) {
        control = L.Routing.control({
          waypoints: points.map(p => L.latLng(p[0], p[1])),
          lineOptions: { styles: [{ color: '#16a34a', weight: 5 }] },
          addWaypoints: true,
          routeWhileDragging: true,
          show: false,
          createMarker: () => null
        });
        routingRef.current = control.addTo(map);
        
        routingRef.current.on('routesfound', (e: any) => {
          const coords = e.routes[0].coordinates.map((c: any) => [c.lat, c.lng]);
          setPoints(coords);
        });
      }
    });

    return () => {
      if (routingRef.current && map) {
        try { map.removeControl(routingRef.current); } catch (e) {}
        routingRef.current = null;
      }
    };
  }, [active, map]); // On réduit les dépendances pour éviter les boucles de rendu
  return null;
}

// --- CHANGE VIEW : Adapté au format standardisé de l'API ---
function ChangeView({ data }: { data: any[] }) {
  const map = useMapInstance();
  useEffect(() => {
    if (map && data && data.length > 0) {
      const timer = setTimeout(async () => {
        const L = await import('leaflet');
        const bounds = L.latLngBounds([]);
        let hasValidPoints = false;

        data.forEach(item => {
          // Utilise le champ "geometry" standardisé par ton route.ts
          const geo = item.geometry;
          if (geo) {
            try {
              const layer = L.geoJSON(geo);
              const geoBounds = layer.getBounds();
              if (geoBounds.isValid()) {
                bounds.extend(geoBounds);
                hasValidPoints = true;
              }
            } catch (e) { console.error("Erreur bounds:", e); }
          }
        });

        if (hasValidPoints && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [50, 50], animate: true });
        }
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [data, map]);
  return null;
}

export default function CarteRandoInteractive() {
  const [sources, setSources] = useState<{ locaux: Record<string, any[]>, supabase: any[] }>({ 
    locaux: {}, 
    supabase: [] 
  });
  const [selectedSource, setSelectedSource] = useState('custom');
  const [data, setData] = useState<any[]>([]);
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const [mounted, setMounted] = useState(false);

  const [openMenu, setOpenMenu] = useState(false);
  const [openSupabase, setOpenSupabase] = useState(false);
  const [openLocaux, setOpenLocaux] = useState(false);

  const currentTitle = useMemo(() => {
    if (selectedSource === 'custom') return "✍️ Nouveau tracé personnalisé";
    const foundSupa = (sources.supabase || []).find(s => String(s.id) === String(selectedSource));
    if (foundSupa) return foundSupa.title;
    for (const deptFiles of Object.values(sources.locaux || {})) {
      const found = deptFiles.find(f => f.id === selectedSource);
      if (found) return found.title;
    }
    return "Sélectionner un itinéraire...";
  }, [selectedSource, sources]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/testrandos')
      .then(res => res.json())
      .then(json => setSources({
        locaux: json.locaux || {},
        supabase: json.supabase || []
      }))
      .catch(err => console.error("Erreur listing:", err));
  }, []);

  useEffect(() => {
    setData([]); 
    if (!selectedSource || selectedSource === 'custom') return;

    let endpoint = "";
    if (selectedSource.includes('/') || selectedSource.includes('.')) {
      let format = "format-tableau";
      if (selectedSource.includes("adresses")) format = "format-points";
      else if (selectedSource.endsWith(".geojson")) format = "format-geojson";
      endpoint = `/api/testrandos/${format}/${selectedSource}`;
    } else {
      endpoint = `/api/testrandos/${selectedSource}`;
    }

fetch(endpoint)
    .then(res => res.json())
    .then(resData => {
      console.log("Source sélectionnée:", selectedSource);
      console.log("Données reçues de l'API:", resData); // <--- REGARDE ICI DANS F12
      const arrayData = Array.isArray(resData) ? resData : [resData];
      setData(arrayData);
    })
    .catch(err => console.error("Erreur Fetch:", err));
}, [selectedSource]);

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-green-700 font-bold p-2 hover:bg-green-50 rounded-lg">
          <ArrowLeft size={20} />
          <span>Accueil</span>
        </Link>
      </header>

      <Card className="overflow-hidden border-green-100 shadow-xl">
        <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="text-md flex items-center gap-2">
            <Route size={20}/> Explorateur de Randonnées
          </CardTitle>
          {selectedSource === 'custom' && (
            <Button variant="outline" size="sm" onClick={() => setCustomPoints([])} className="bg-white/10 border-white/20 text-white">
              <Trash2 size={14} className="mr-2"/> Effacer
            </Button>
          )}
        </CardHeader>

        <div className="bg-green-50 p-4 border-b border-green-100">
          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white border-green-200 h-11 text-sm">
                <span className="truncate">{currentTitle}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0 z-[1100]" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une trace..." />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>Aucun résultat.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedSource("custom"); setOpenMenu(false); }} className="text-orange-600 font-bold py-3">
                      <Check className={`mr-2 h-4 w-4 ${selectedSource === "custom" ? "opacity-100" : "opacity-0"}`} />
                      ✍️ Nouveau tracé personnalisé
                    </CommandItem>
                  </CommandGroup>

                  <CommandGroup>
                    <Collapsible open={openLocaux} onOpenChange={setOpenLocaux}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-blue-600 bg-blue-50/50 border-t uppercase">
                        <div className="flex items-center gap-2"><Library size={14} /> Fichiers Officiels</div>
                        <ChevronRight className={`transition-transform ${openLocaux ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {Object.entries(sources.locaux).map(([dept, files]) => (
                          <div key={dept} className="mt-1">
                            <div className="px-4 py-1 text-[10px] font-black text-slate-400 uppercase">{dept}</div>
                            {files.map((f) => (
                              <CommandItem key={f.id} onSelect={() => { setSelectedSource(f.id); setOpenMenu(false); }} className="pl-6">
                                <Check className={`mr-2 h-3 w-3 ${selectedSource === f.id ? "opacity-100" : "opacity-0"}`} />
                                <span className="truncate">{f.title}</span>
                              </CommandItem>
                            ))}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>

                  <CommandGroup>
                    <Collapsible open={openSupabase} onOpenChange={setOpenSupabase}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-slate-500 bg-slate-50 border-t uppercase">
                        <div className="flex items-center gap-2"><Users size={14} /> Tracés Communauté</div>
                        <ChevronRight className={`transition-transform ${openSupabase ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {sources.supabase?.length > 0 ? (
                          sources.supabase.map((s) => (
                            <CommandItem key={s.id} onSelect={() => { setSelectedSource(s.id); setOpenMenu(false); }} className="pl-6">
                              <Check className={`mr-2 h-4 w-4 ${selectedSource === s.id ? "opacity-100" : "opacity-0"}`} />
                              <div className="flex flex-col">
                                <span className="font-medium">{s.title}</span>
                                <span className="text-[10px] text-slate-400">{s.location} • {s.distance}</span>
                              </div>
                            </CommandItem>
                          ))
                        ) : (
                          <div className="p-4 text-center text-xs text-slate-400">Aucun tracé communautaire</div>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

<div className="h-[500px] w-full relative z-0">
  {/* On s'assure que le composant est monté côté client */}
  {mounted && (
    <MapContainer center={[43.60, 1.44]} zoom={12} className="h-full w-full">
      <TileLayer 
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" 
        attribution='&copy; OSM' 
      />
      
      {/* On ne rend les enfants que si la map est prête */}
      <ChangeView data={data} />
      <RoutingControl active={selectedSource === 'custom'} points={customPoints} setPoints={setCustomPoints} />

{selectedSource !== 'custom' && data && data.length > 0 && data.map((item, idx) => {
  // MODIFICATION ICI : On accepte "geometry" OU "route_geometry"
  const geo = item.geometry || item.route_geometry; 
  
  if (!item || !geo) return null;

  const isPoint = geo.type === "Point";

  return (
<React.Fragment key={`layer-${selectedSource}-${idx}`}>
  <GeoJSON 
    key={`geojson-${selectedSource}-${idx}-${data.length}`}
    data={geo} 
    // CETTE LIGNE EST LA CLÉ : Elle dit à GeoJSON d'ignorer le rendu des points 
    // car on s'en occupe nous-mêmes avec le CircleMarker juste en dessous.
    pointToLayer={() => (null as any)} 
    style={{ 
      color: String(selectedSource).toLowerCase().includes('gers') ? '#e11d48' : '#2563eb', 
      weight: 5, 
      opacity: 0.8 
    }} 
  />

  {/* MARQUEUR : Uniquement pour les points isolés (Repères de crue) */}
  {isPoint && item.center && (
    <CircleMarker 
      center={item.center} 
      radius={6} 
      pathOptions={{ 
        fillColor: '#16a34a', // Vert pour correspondre à ton thème
        color: '#ffffff',     // Bordure blanche
        weight: 2, 
        fillOpacity: 1 
      }}
    >
      <Popup>
        <div className="font-bold text-green-800">{item.title}</div>
        {item.properties?.adresse && (
          <p className="text-xs text-slate-600">{item.properties.adresse}</p>
        )}
      </Popup>
    </CircleMarker>
  )}
</React.Fragment>
  );
})}
    </MapContainer>
  )}

          
          {selectedSource === 'custom' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 shadow-2xl border border-green-200 px-6 py-2 rounded-full flex items-center gap-3 animate-bounce">
              <MousePointer2 className="text-green-600" size={18} />
              <span className="text-sm font-bold text-green-800 uppercase tracking-tight">Tracez votre chemin</span>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}