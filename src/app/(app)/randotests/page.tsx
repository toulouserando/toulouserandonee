"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { 
  ChevronsUpDown, Compass, Check, Library, 
  ChevronRight, Route, Search, Loader2 
} from 'lucide-react';
import 'leaflet/dist/leaflet.css';

// UI COMPONENTS (shadcn)
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Label } from "@/components/ui/label";

// --- DYNAMIC LEAFLET (SSR: FALSE) ---
const MapContainer = dynamic(() => import('react-leaflet').then(mod => mod.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then(mod => mod.TileLayer), { ssr: false });
const GeoJSON = dynamic(() => import('react-leaflet').then(mod => mod.GeoJSON), { ssr: false });

/**
 * COMPOSANT : Gère le centrage automatique haute précision
 */
function ChangeView({ data }: { data: any }) {
  const { useMap } = require('react-leaflet');
  const map = useMap();

  useEffect(() => {
    if (map && data) {
      // On attend un court instant que le layout CSS soit stabilisé
      const timeout = setTimeout(() => {
        const L = require('leaflet');
        try {
          // FORCE le recalcul de la taille du conteneur (Crucial pour Next.js)
          map.invalidateSize();

          const layer = L.geoJSON(data);
          const bounds = layer.getBounds();
          
          if (bounds.isValid()) {
            // fitBounds avec padding pour éviter que le tracé ne touche les bords
            map.fitBounds(bounds, { 
              padding: [40, 40], // 40px de marge sur chaque côté
              animate: true,
              duration: 0.5,
              maxZoom: 15 // Empêche un zoom excessif sur les tracés très courts
            });
          }
        } catch (err) {
          console.error("Erreur lors du centrage haute précision :", err);
        }
      }, 300); 

      return () => clearTimeout(timeout);
    }
  }, [data, map]);

  return null;
}

export default function RandotestsPage() {
  const [mounted, setMounted] = useState(false);
  const [sources, setSources] = useState<{ locaux: Record<string, any[]> }>({ locaux: {} });
  const [selectedSource, setSelectedSource] = useState('');
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);
  const [openLocaux, setOpenLocaux] = useState(true);

  useEffect(() => {
    setMounted(true);
    fetch('/api/randotests')
      .then(res => res.json())
      .then(json => setSources(json))
      .catch(err => console.error("Erreur listing:", err));
  }, []);

  useEffect(() => {
    if (!selectedSource) {
      setGeoJsonData(null);
      return;
    }
    
    setLoading(true);
    fetch(`/api/randotests?id=${encodeURIComponent(selectedSource)}`)
      .then(res => res.json())
      .then(data => {
        setGeoJsonData(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur Fetch :", err);
        setLoading(false);
      });
  }, [selectedSource]);

  const currentTitle = useMemo(() => {
    if (!selectedSource) return "Sélectionner un itinéraire...";
    for (const files of Object.values(sources.locaux)) {
      const found = files.find(f => f.id === selectedSource);
      if (found) return found.title;
    }
    return "Sélectionner un itinéraire...";
  }, [selectedSource, sources]);

  if (!mounted) return null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      <section className="space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-bold uppercase">
          <Compass size={14} /> Test des Tracés
        </div>
        <h1 className="text-4xl font-black uppercase text-slate-900 leading-none">
          Explorateur <span className="text-blue-600">GeoJSON</span>
        </h1>
      </section>

      <Card className="overflow-hidden border-blue-100 shadow-xl">
        <CardHeader className="bg-slate-900 text-white flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-bold">
            <Route size={20}/> Visualisation des fichiers locaux
          </CardTitle>
          {loading && <Loader2 className="animate-spin" size={20} />}
        </CardHeader>

        <div className="bg-slate-50 p-4 border-b flex flex-col md:flex-row items-center gap-4">
          <Label className="text-slate-700 font-semibold min-w-[120px] flex items-center gap-2">
            <Search size={18} /> Itinéraire :
          </Label>

          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white h-11 border-slate-200 shadow-sm hover:bg-slate-50 transition-colors">
                <span className="truncate text-slate-700">{currentTitle}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 text-slate-500" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[450px] p-0 z-[1100] shadow-2xl border-slate-200" align="start">
              <Command className="rounded-lg shadow-md">
                <CommandInput placeholder="Filtrer par nom ou commune..." className="h-12" />
                <CommandList className="max-h-[450px]">
                  <CommandEmpty className="py-6 text-center text-slate-500">Aucun fichier trouvé.</CommandEmpty>
                  <CommandGroup>
                    <Collapsible open={openLocaux} onOpenChange={setOpenLocaux}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-[11px] font-black text-blue-600 bg-blue-50/50 uppercase tracking-wider">
                        <span className="flex items-center gap-2"><Library size={14} /> Fichiers par commune</span>
                        <ChevronRight className={`transition-transform duration-200 ${openLocaux ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="transition-all duration-300">
                        {Object.entries(sources.locaux).map(([commune, files]) => (
                          <div key={commune} className="border-b last:border-0 border-slate-100">
                            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 bg-slate-50/30 uppercase tracking-widest">{commune}</div>
                            {files.map((f) => (
                              <CommandItem 
                                key={f.id} 
                                onSelect={() => { setSelectedSource(f.id); setOpenMenu(false); }} 
                                className="pl-6 cursor-pointer hover:bg-blue-50/50 py-2.5"
                              >
                                <Check className={`mr-2 h-4 w-4 text-blue-600 ${selectedSource === f.id ? "opacity-100" : "opacity-0"}`} />
                                <span className="truncate text-slate-600 font-medium">{f.title}</span>
                              </CommandItem>
                            ))}
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        <div className="h-[600px] w-full relative z-0 bg-slate-100">
          <MapContainer 
            key={`map-instance-${selectedSource || 'initial'}`}
            center={[43.9, 2.1]} 
            zoom={9} 
            className="h-full w-full"
          >
            <TileLayer 
              url="https://{s}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png" 
              attribution='&copy; OSM France' 
            />
            
            {geoJsonData && (
              <>
                <ChangeView data={geoJsonData} />
                <GeoJSON 
                  data={geoJsonData}
                  style={{ color: '#2563eb', weight: 5, opacity: 0.85, lineJoin: 'round' }}
                />
              </>
            )}
          </MapContainer>
        </div>
      </Card>
    </div>
  );
}