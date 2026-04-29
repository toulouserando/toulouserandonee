"use client";

import React, { useEffect, useState, useRef, useMemo } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { 
  ArrowLeft, MousePointer2, Trash2, Search, ChevronsUpDown, 
  Check, Users, Library, ChevronRight, Route 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// --- IMPORTS UI ---
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

// --- IMPORTS DYNAMIQUES LEAFLET ---
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });
const Marker = dynamic(() => import('react-leaflet').then(mod => mod.Marker), { ssr: false });
const Popup = dynamic(() => import('react-leaflet').then(mod => mod.Popup), { ssr: false });

// --- HOOKS ET SOUS-COMPOSANTS ---

const useMapInstance = () => {
  const { useMap } = require('react-leaflet');
  try { 
    return useMap(); 
  } catch (e) { 
    return null; 
  }
};

function RoutingControl({ points, setPoints, active }: { points: any[], setPoints: any, active: boolean }) {
  const map = useMapInstance();
  const routingRef = useRef<any>(null);

  useEffect(() => {
    if (!map || !active) {
      if (routingRef.current) {
        map.removeControl(routingRef.current);
        routingRef.current = null;
      }
      return;
    }

    import('leaflet-routing-machine').then(() => {
      const L = (window as any).L;
      if (!routingRef.current && map) {
        routingRef.current = L.Routing.control({
          waypoints: points.map(p => L.latLng(p[0], p[1])),
          lineOptions: { styles: [{ color: '#16a34a', weight: 5 }] },
          addWaypoints: true,
          routeWhileDragging: true,
          show: false
        }).addTo(map);

        routingRef.current.on('routesfound', (e: any) => {
          const coords = e.routes[0].coordinates.map((c: any) => [c.lat, c.lng]);
          setPoints(coords);
        });
      }
    });

    return () => { if (routingRef.current && map) map.removeControl(routingRef.current); };
  }, [active, map, points, setPoints]);

  return null;
}

function ChangeView({ data, source }: { data: any[], source: string }) {
  const map = useMapInstance();

  useEffect(() => {
    if (map && data && data.length > 0) {
      const timer = setTimeout(async () => {
        const L = await import('leaflet');
        const bounds = L.latLngBounds([]);
        let hasValidPoints = false;

        data.forEach(item => {
          if (item.lat && item.lon) {
            bounds.extend([item.lat, item.lon]);
            hasValidPoints = true;
          } 
          const rawGeo = item.route_geometry || item.geometry || item.geo_shape?.geometry || item;
          try {
            const parsed = typeof rawGeo === 'string' ? JSON.parse(rawGeo) : rawGeo;
            if (parsed && (parsed.type || parsed.features)) {
                const tempLayer = L.geoJSON(parsed);
                bounds.extend(tempLayer.getBounds());
                hasValidPoints = true;
            }
          } catch (e) {}
        });

        if (hasValidPoints && bounds.isValid()) {
          map.fitBounds(bounds, { padding: [30, 30], maxZoom: 15 });
        }
      }, 250); 
      return () => clearTimeout(timer);
    }
  }, [data, map, source]);

  return null;
}

export default function CarteRandoInteractive() {
  const [sources, setSources] = useState<{ locaux: any[], supabase: any[] }>({ locaux: [], supabase: [] });
  const [selectedSource, setSelectedSource] = useState('custom');
  const [data, setData] = useState<any[]>([]);
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const [mounted, setMounted] = useState(false);

  const [openMenu, setOpenMenu] = useState(false);
  const [openSupabase, setOpenSupabase] = useState(false);
  const [openLocaux, setOpenLocaux] = useState(false);

  const currentTitle = useMemo(() => {
    if (selectedSource === 'custom') return "✍️ Nouveau tracé personnalisé";
    const all = [...(sources.locaux || []), ...(sources.supabase || [])];
    const found = all.find(s => s.id === selectedSource);
    return found ? found.title : "Sélectionner un itinéraire...";
  }, [selectedSource, sources]);

  useEffect(() => {
    setMounted(true);
    fetch('/api/listerandos')
      .then(res => res.json())
      .then(json => setSources(json))
      .catch(err => console.error("Erreur listing:", err));
  }, []);

  useEffect(() => {
    if (!selectedSource || selectedSource === 'custom') {
      setData([]);
      return;
    }
    fetch(`/api/listerandos/${selectedSource}`)
      .then(res => res.json())
      .then(resData => setData(Array.isArray(resData) ? resData : [resData]))
      .catch(() => setData([]));
  }, [selectedSource]);

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <header className="flex items-center justify-between mb-4">
        <Link href="/" className="flex items-center gap-2 text-green-700 font-bold p-2 hover:bg-green-50 rounded-lg transition-colors">
          <ArrowLeft size={20} />
          <span>Retour à l'Accueil</span>
        </Link>
      </header>

      <Card className="overflow-hidden border-green-100 shadow-lg">
        <CardHeader className="bg-green-700 text-white flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-bold">
            <Route size={20}/> Explorateur d'itinéraires
          </CardTitle>
          {selectedSource === 'custom' && (
            <Button variant="outline" size="sm" onClick={() => setCustomPoints([])} className="bg-white/10 text-white border-white/20 hover:bg-white/20">
              <Trash2 size={14} className="mr-2"/> Effacer
            </Button>
          )}
        </CardHeader>

        <div className="bg-green-50 p-4 border-b border-green-100 flex flex-col md:flex-row items-center gap-4">
          <label className="text-green-800 font-semibold min-w-[150px] flex items-center gap-2 text-sm">
            <Search size={18} /> Choisir un circuit :
          </label>

          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white border-green-200 h-11 text-sm font-semibold">
                <span className="truncate">{currentTitle}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0 z-[1100]" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une randonnée..." />
                <CommandList className="max-h-[400px]">
                  <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem onSelect={() => { setSelectedSource("custom"); setOpenMenu(false); }} className="font-bold text-orange-600 cursor-pointer py-3">
                      <Check className={`mr-2 h-4 w-4 ${selectedSource === "custom" ? "opacity-100" : "opacity-0"}`} />
                      ✍️ Nouveau tracé personnalisé
                    </CommandItem>
                  </CommandGroup>
                  <CommandGroup>
                    <Collapsible open={openLocaux} onOpenChange={setOpenLocaux}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-blue-600 bg-blue-50/50 hover:bg-blue-50 border-t uppercase tracking-wider">
                        <div className="flex items-center gap-2"><Library size={14} /> Circuits Officiels</div>
                        <ChevronRight className={`transition-transform duration-200 ${openLocaux ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {sources.locaux?.map((s, idx) => (
                          <CommandItem key={`local-${s.id}-${idx}`} onSelect={() => { setSelectedSource(s.id); setOpenMenu(false); }} className="pl-8 text-blue-900 cursor-pointer">
                            <Check className={`mr-2 h-4 w-4 ${selectedSource === s.id ? "opacity-100" : "opacity-0"}`} />
                            <Route size={14} className="mr-2 text-blue-500" /> {s.title}
                          </CommandItem>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>
                  <CommandGroup>
                    <Collapsible open={openSupabase} onOpenChange={setOpenSupabase}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-slate-500 bg-slate-50 hover:bg-slate-100 border-t uppercase tracking-wider">
                        <div className="flex items-center gap-2"><Users size={14} /> Tracés Communauté</div>
                        <ChevronRight className={`transition-transform duration-200 ${openSupabase ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        {sources.supabase?.map((s) => (
                          <CommandItem key={s.id} onSelect={() => { setSelectedSource(s.id); setOpenMenu(false); }} className="pl-8 cursor-pointer">
                            <Check className={`mr-2 h-4 w-4 ${selectedSource === s.id ? "opacity-100" : "opacity-0"}`} />
                            <div className="flex flex-col">
                              <span className="font-medium">{s.title}</span>
                              {s.distance && <span className="text-[10px] text-slate-400">{s.distance}km</span>}
                            </div>
                          </CommandItem>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

<div className="h-[450px] w-full bg-slate-100 relative z-0">
  {mounted && (
    <MapContainer center={[43.60, 1.44]} zoom={12} className="h-full w-full">
      <TileLayer 
        url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" 
        attribution='&copy; OSM' 
      />
      
      <ChangeView data={data} source={selectedSource} />
      <RoutingControl 
        active={selectedSource === 'custom'} 
        points={customPoints} 
        setPoints={setCustomPoints} 
      />
      
      {selectedSource !== 'custom' && Array.isArray(data) && data.map((item, idx) => {
        if (!item) return null;

        // --- 1. PRÉPARATION DES DONNÉES ---
        const lat = item.lat || item.properties?.latitude || (item.geometry?.type === 'Point' ? item.geometry.coordinates[1] : null);
        const lon = item.lon || item.properties?.longitude || (item.geometry?.type === 'Point' ? item.geometry.coordinates[0] : null);
        const name = item.properties?.local_name || item.adresse || item.title || "Point d'intérêt";
        const rawGeo = item.route_geometry || item.geometry || item.geo_shape?.geometry || (item.type === 'Feature' ? item : null);

        return (
          <React.Fragment key={`group-${selectedSource}-${idx}`}>
            {/* --- 2. AFFICHAGE DU MARQUEUR (Si coordonnées présentes) --- */}
            {lat && lon && typeof lat === 'number' && typeof lon === 'number' && (
              <Marker position={[lat, lon]}>
                <Popup>
                  <div className="font-bold text-green-800">{name}</div>
                  {item.properties?.city && <div className="text-xs text-slate-500">{item.properties.city}</div>}
                </Popup>
              </Marker>
            )}

            {/* --- 3. AFFICHAGE DU TRACÉ (Si géométrie valide avec coordonnées) --- */}
            {(() => {
              if (!rawGeo) return null;
              try {
                const parsed = typeof rawGeo === 'string' ? JSON.parse(rawGeo) : rawGeo;
                if (!parsed || (!parsed.type && !parsed.features)) return null;
                const lineStyle = { color: '#2563eb', weight: 5, opacity: 0.8 };

                // Cas FeatureCollection
                if (parsed.type === "FeatureCollection" && parsed.features) {
                  return parsed.features.map((f: any, fIdx: number) => {
                    if (f?.geometry?.coordinates?.length > 0) {
                      return <GeoJSON key={`geo-f-${idx}-${fIdx}`} data={f} style={lineStyle} />;
                    }
                    return null;
                  });
                }

                // Cas Géométrie simple (Polygon, LineString, etc.)
                const hasCoords = (parsed.coordinates && parsed.coordinates.length > 0) || 
                                  (parsed.geometry?.coordinates && parsed.geometry.coordinates.length > 0);
                
                if (hasCoords) {
                  return <GeoJSON data={parsed} style={lineStyle} />;
                }
              } catch (e) {
                return null;
              }
              return null;
            })()}
          </React.Fragment>
        );
      })}
    </MapContainer>
  )}

  {selectedSource === 'custom' && (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-white/90 backdrop-blur shadow-xl border border-green-200 px-4 py-2 rounded-full flex items-center gap-3 animate-bounce">
      <MousePointer2 className="text-green-600" size={18} />
      <span className="text-sm font-bold text-green-800">Cliquez sur la carte pour tracer</span>
    </div>
  )}
</div>
      </Card>
    </div>
  );
}