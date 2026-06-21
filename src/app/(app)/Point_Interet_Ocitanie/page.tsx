"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  ChevronsUpDown, Check, Landmark, ChevronRight, 
  Search, Home, MapPin, Calendar
} from 'lucide-react';

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
import { Label } from "@/components/ui/label";

// --- CHARGEMENT DYNAMIQUE DU COMPOSANT DE CARTE ---
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-stone-100 flex items-center justify-center text-stone-400 font-medium font-serif italic">
      Chargement de la carte du patrimoine...
    </div>
  )
});

export default function PoiocPage() {
  const router = useRouter();
  
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [openMenu, setOpenMenu] = useState(false);
  const [openLocaux, setOpenLocaux] = useState(false);

  // Synchronisation avec le fichier GeoJSON Occitanie
  useEffect(() => {
    fetch('/rando/poi_occitanie_clean.json.geojson')
      .then(res => res.json())
      .then(data => {
        if (data && data.features) {
          const formatted = data.features.map((f: any) => ({
            id: f.properties.id,
            nom: f.properties.local_name,
            ville: f.properties.city,
            adresse: f.properties.address || "Adresse non spécifiée",
            cp: f.properties.zipcode || "",
            type: f.properties.category || "Monument",
            coords: {
              lat: f.properties.latitude,
              lon: f.properties.longitude
            }
          }));
          setSites(formatted);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur chargement patrimoine:", err);
        setLoading(false);
      });
  }, []);

  const filteredSites = useMemo(() => {
    if (selectedSiteId === 'all') return sites;
    return sites.filter(s => String(s.id) === String(selectedSiteId));
  }, [selectedSiteId, sites]);

  const currentTitle = useMemo(() => {
    if (selectedSiteId === 'all') return "🏛️ Tous les sites historiques simultanément";
    const found = sites.find(s => String(s.id) === String(selectedSiteId));
    return found ? `📍 ${found.nom}` : "Sélectionner un monument...";
  }, [selectedSiteId, sites]);

  // Déterminer si un monument unique et valide est sélectionné pour afficher le bouton
  const showPlanButton = useMemo(() => {
    return selectedSiteId !== '' && selectedSiteId !== 'all';
  }, [selectedSiteId]);

  if (loading) {
    return <div className="p-10 text-center font-serif italic text-amber-900">Chargement du patrimoine...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 bg-stone-50/50 min-h-screen">
      
      <header className="space-y-3 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div className="space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-xs font-bold uppercase tracking-wider">
            <Landmark size={14} /> Exploration Culturelle
          </div>
          <h1 className="text-4xl md:text-5xl font-serif text-stone-900 tracking-tight">
            Patrimoine & <span className="text-amber-700 italic">Sites Historiques</span>
          </h1>
        </div>

        {/* BOUTON SÉLECTIONNER CE CIRCUIT / MONUMENT */}
        {showPlanButton && (
          <Button
            onClick={() => router.push(`/Point_Interet_Ocitanie/create?source=Point_Interet_Ocitanie&id=${encodeURIComponent(selectedSiteId)}`)}
            className="bg-amber-700 hover:bg-amber-800 text-stone-50 font-bold uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 h-11 px-6 w-full md:w-auto"
          >
            <Calendar size={16} />
            Sélectionner ce lieu pour une sortie
          </Button>
        )}
      </header>

      <Card className="overflow-hidden border-amber-200 shadow-xl bg-white">
        <CardHeader className="bg-amber-800 text-amber-50 flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-serif tracking-wide">
            <Landmark size={20}/> Cartographie des Édifices Remarquables
          </CardTitle>
        </CardHeader>

        <div className="bg-amber-50/60 p-4 border-b border-amber-100 flex flex-col sm:flex-row items-center gap-4">
          <Label className="text-stone-800 font-medium min-w-[140px] flex items-center gap-2 shrink-0">
            <Search size={18} className="text-amber-700" /> Choisir un monument :
          </Label>

          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white border-stone-200 h-11 text-sm shadow-sm text-left">
                <span className="truncate text-stone-700">{currentTitle}</span>
                <ThemeIconChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] md:w-[500px] p-0 z-[1100]" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une abbaye, église, ville..." />
                <CommandList className="max-h-[350px]">
                  <CommandEmpty>Aucun édifice trouvé.</CommandEmpty>
                  
                  <CommandGroup>
                    <CommandItem 
                      onSelect={() => { setSelectedSiteId("all"); setOpenMenu(false); }} 
                      className="text-amber-800 font-bold py-2.5 border-b cursor-pointer"
                    >
                      <Check className={`mr-2 h-4 w-4 shrink-0 ${selectedSiteId === "all" ? "opacity-100" : "opacity-0"}`} />
                      🏛️ Afficher TOUS les monuments ({sites.length})
                    </CommandItem>
                  </CommandGroup>

                  <CommandGroup>
                    <Collapsible open={openLocaux} onOpenChange={setOpenLocaux}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-3 text-xs font-bold text-stone-500 bg-stone-50 border-t uppercase tracking-wider">
                        <div className="flex items-center gap-2"><MapPin size={14} /> Liste du patrimoine</div>
                        <ChevronRight className={`transition-transform ${openLocaux ? 'rotate-90' : ''}`} size={14} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 bg-white">
                          {sites.map((site) => {
                            const isSelected = String(selectedSiteId) === String(site.id);
                            return (
                              <CommandItem 
                                key={site.id} 
                                onSelect={() => { setSelectedSiteId(String(site.id)); setOpenMenu(false); }} 
                                className="pl-6 py-2 cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center truncate">
                                  <Check className={`mr-2 h-4 w-4 shrink-0 text-amber-700 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                  <span className="truncate font-medium text-stone-800">{site.nom}</span>
                                </div>
                              </CommandItem>
                            );
                          })}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* INTEGRATION DE LA CARTE AVEC LES PROPS FILTERED */}
        <div className="h-[550px] w-full relative z-0">
          <MapComponent 
            selectedSiteId={selectedSiteId}
            sites={filteredSites}
          />
        </div>
      </Card>

      {/* GRILLE DES CARTES */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        {sites.map((site) => (
          <div 
            key={site.id} 
            onClick={() => setSelectedSiteId(String(site.id))}
            className={`bg-white rounded-xl border p-6 flex flex-col justify-between cursor-pointer transition-all ${
              String(selectedSiteId) === String(site.id)
                ? 'border-amber-600 ring-2 ring-amber-600/20 shadow-md' 
                : 'border-stone-200 hover:border-stone-300'
            }`}
          >
            <div>
              <h2 className="text-lg font-serif text-stone-800 mb-2 leading-tight">{site.nom}</h2>
              <p className="text-sm text-stone-600">📍 {site.ville}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-stone-100 flex justify-between items-center">
              <div className="text-[10px] font-mono text-stone-400 bg-stone-50 px-2 py-0.5 rounded">
                {site.coords.lat?.toFixed(4)} / {site.coords.lon?.toFixed(4)}
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedSiteId(String(site.id));
                  window.scrollTo({ top: 200, behavior: 'smooth' });
                }}
                className="bg-stone-800 text-amber-50 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-amber-900"
              >
                Localiser
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Composant proxy d'icône pour éviter les conflits de nommage de variables
function ThemeIconChevronsUpDown(props: React.ComponentProps<typeof ChevronsUpDown>) {
  return <ChevronsUpDown {...props} />;
}