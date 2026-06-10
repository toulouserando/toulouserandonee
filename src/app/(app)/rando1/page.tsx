"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'; // <-- Importation du routeur Next.js
import { 
  ChevronsUpDown, Check, Route, Navigation, MapPin, Calendar
} from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

// --- CHARGEMENT DYNAMIQUE DE LA CARTE (SANS SSR) ---
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center font-mono text-slate-400 animate-pulse">
      Chargement du module cartographique...
    </div>
  )
});

export default function CarteRandoInteractive() {
  const router = useRouter(); // <-- Initialisation du routeur
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [mapReady, setMapReady] = useState(false);

  // --- ÉTATS CARTOGRAPHIE ---
  const [sources, setSources] = useState<{ locaux: Record<string, any[]>, supabase: any[] }>({ 
    locaux: {}, 
    supabase: [] 
  });
  
  const [selectedSource, setSelectedSource] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);
  const [openMenu, setOpenMenu] = useState(false);

  // Mémoïsation du titre sélectionné
  const currentTitle = useMemo(() => {
    if (!selectedSource) return "Sélectionner un itinéraire...";
    
    const foundSupa = (sources.supabase || []).find(s => String(s.id) === String(selectedSource));
    if (foundSupa) return foundSupa.title;
    
    for (const deptFiles of Object.values(sources.locaux)) {
      const found = deptFiles.find(f => f.id === selectedSource);
      if (found) return found.title;
    }
    return "Sélectionner un itinéraire...";
  }, [selectedSource, sources]);

  // 1. CHARGEMENT INITIAL DES DONNÉES
  useEffect(() => {
    setMounted(true);
    fetch('/api/rando1') 
      .then(res => res.json())
      .then(json => {
        const formattedLocaux: Record<string, any[]> = {};
        
        if (Array.isArray(json)) {
          json.forEach((item: any) => {
            const cat = item.category || "Balades Toulouse";
            if (!formattedLocaux[cat]) {
              formattedLocaux[cat] = [];
            }
            formattedLocaux[cat].push({
              id: item.id,
              title: item.title,
              cat: cat,
              geometry: item.geometry,
              properties: item.properties || {}
            });
          });
        }

        setSources({ locaux: formattedLocaux, supabase: [] });
      })
      .catch(err => console.error("Erreur listing dossiers toulouse:", err));
  }, []);

  // 2. SÉLECTION D'UN CIRCUIT
  useEffect(() => {
    if (!selectedSource) {
      setData([]);
      return;
    }

    let randoInfo = null;
    for (const files of Object.values(sources.locaux)) {
      const found = files.find(f => f.id === selectedSource);
      if (found) { randoInfo = found; break; }
    }

    if (randoInfo && randoInfo.geometry) {
      setData([{
        geometry: randoInfo.geometry,
        properties: randoInfo.properties || {},
        id: randoInfo.id,
        title: randoInfo.title
      }]);
    } else {
      setData([]);
    }
  }, [selectedSource, sources.locaux]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      {/* HEADER AVEC SÉLECTEUR INTERACTIF */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-emerald-500" size={20} />
            <span className="font-black tracking-wider uppercase text-xs text-slate-400">Explorateur de Circuits (Haute-Garonne)</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700 min-w-[280px]">
            <MapPin size={16} className="text-emerald-500 flex-shrink-0" />
            
            <Popover open={openMenu} onOpenChange={setOpenMenu}>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="w-full justify-between h-auto p-0 bg-transparent text-white hover:bg-transparent hover:text-white text-sm font-bold uppercase tracking-wide focus:outline-none cursor-pointer">
                  <span className="truncate max-w-[200px] sm:max-w-[240px] text-left">{currentTitle}</span>
                  <ChevronsUpDown className="ml-2 h-4 w-4 opacity-50 flex-shrink-0" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[320px] sm:w-[450px] p-0 z-[1100]" align="end">
                <Command>
                  <CommandInput placeholder="Rechercher une trace..." />
                  <CommandList className="max-h-[350px]">
                    <CommandEmpty>Aucun résultat.</CommandEmpty>
                    
                    <CommandGroup>
                      {Object.entries(sources.locaux).map(([dept, files]) => (
                        <div key={dept} className="mt-2 first:mt-0">
                          <div className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider bg-slate-50 border-y border-slate-100">
                            {dept}
                          </div>
                          {files.map((f) => (
                            <CommandItem key={f.id} onSelect={() => { setSelectedSource(f.id); setOpenMenu(false); }} className="pl-6 py-2.5 cursor-pointer">
                              <Check className={`mr-2 h-3 w-3 text-emerald-600 ${selectedSource === f.id ? "opacity-100" : "opacity-0"}`} />
                              <span className="truncate font-medium text-slate-700">{f.title}</span>
                            </CommandItem>
                          ))}
                        </div>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* EN-TÊTE AVEC BANDEAU ACTIONS */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 border border-slate-200 rounded-2xl shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl font-black uppercase tracking-tight text-slate-900">
              🌳 {selectedSource && currentTitle ? currentTitle.replace(/_/g, ' ') : 'itinéraires en haute-Garonne'}
            </h1>
            <p className="text-sm text-slate-500">
              {selectedSource ? "Visualisation dynamique du tracé enregistré en Haute-Garonne." : "Choisissez un itinéraire dans le menu supérieur pour afficher son tracé."}
            </p>
          </div>

          {/* 🟢 ACTION DE REDIRECTION : S'affiche uniquement si une trace est à l'écran */}
          {selectedSource && (
            <Button
              onClick={() => router.push(`/rando1/create?source=rando1&id=${selectedSource}`)}
              className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 px-4 h-11"
            >
              <Calendar size={16} />
              Planifier une sortie avec ce circuit
            </Button>
          )}
        </div>

        {/* 🗺️ ZONE DE RENDU CARTE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-[500px] relative z-10 overflow-hidden">
          <MapComponent 
            key={`map-${selectedSource}`}
            selectedSource={selectedSource}
            data={data}
            customPoints={[]}
            setCustomPoints={() => {}}
            setMapReady={setMapReady}
          />
        </section>

        {/* INFOS DU PARCOURS */}
        {data?.[0]?.geometry?.coordinates?.[0] && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Route size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Précision du tracé</h3>
              <p className="text-sm text-slate-700 font-medium">
                Ce circuit comporte <span className="font-bold text-slate-900 font-mono">{data[0].geometry.coordinates[0].length}</span> points de géolocalisation haute précision.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}