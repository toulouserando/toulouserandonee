"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  ChevronsUpDown, Check, Map, ChevronRight, 
  Search, Navigation, HelpCircle, Plus
} from 'lucide-react';

// --- COMPOSANTS DE VOTRE UI ---
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

// --- CHARGEMENT DYNAMIQUE SANS SSR ---
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium font-mono italic">
      Chargement du moteur cartographique Randoligne...
    </div>
  )
});

export default function RandolignePage() {
  const router = useRouter();
  
  const [lines, setLines] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState<string>('all'); 
  const [loading, setLoading] = useState(true); // Correction : Initialisé à true
  const [openMenu, setOpenMenu] = useState(false);
  const [openItineraires, setOpenItineraires] = useState(false);

  // 1. CHARGEMENT DES ITINÉRAIRES DEPUIS L'API
  useEffect(() => {
    fetch('/api/Randos_en_Occitanie')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setLines(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur récupération API rando8:", err);
        setLoading(false);
      });
  }, []);

  // Filtrage des lignes pour la carte
  const filteredLines = useMemo(() => {
    if (selectedId === 'all') return lines;
    return lines.filter(item => String(item.id) === String(selectedId));
  }, [selectedId, lines]);

  // Libellé dynamique du bouton du sélecteur
  const currentSelectorTitle = useMemo(() => {
    if (selectedId === 'all') return "🗺️ Vue globale de l'ensemble du réseau";
    const found = lines.find(item => String(item.id) === String(selectedId));
    return found ? `${found.has_path ? '🛣️' : '📍'} ${found.nom}` : "Choisir un itinéraire...";
  }, [selectedId, lines]);

  if (loading) {
    return (
      <div className="p-10 text-center font-mono text-slate-600 animate-pulse">
        Analyse du réseau des Randolignes...
      </div>
    );
  }

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      
      {/* EN-TÊTE DE PAGE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-l-8 border-emerald-500 pl-6">
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            RANDOLIGNE <span className="text-emerald-600">OCCITANIE</span>
          </h1>
          <p className="text-slate-500 text-lg">Itinéraires, tracés géométriques et accès aux réseaux de randonnées.</p>
        </div>
        {/* BOUTON DE CRÉATION RAPIDE SI AUCUNE LIGNE SÉLECTIONNÉE, OU POUR LE RÉSEAU */}
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 self-start sm:self-center"
          onClick={() => router.push(`/Randos_en_Occitanie/create?source=Randos_en_Occitanie${selectedId !== 'all' ? `&id=${selectedId}` : ''}`)}
        >
          <Plus size={16} /> Planifier une sortie
        </Button>
      </div>

      {/* BLOC CARTOGRAPHIQUE CENTRAL COMPLET */}
      <Card className="overflow-hidden border-slate-200 shadow-lg bg-white">
        
        {/* ENTETE BANDEAU BLOC */}
        <CardHeader className="bg-slate-900 text-slate-100 flex flex-row items-center justify-between py-4 px-6">
          <CardTitle className="flex items-center gap-2 text-md font-mono tracking-wide">
            <Map size={18} className="text-emerald-400" /> Explorateur Géographique Réseau
          </CardTitle>
        </CardHeader>

        {/* POPOVER / BARRE DE RECHERCHE FILTRANTE */}
        <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center gap-4">
          <Label className="text-slate-700 font-semibold min-w-[150px] flex items-center gap-2 shrink-0 text-sm">
            <Search size={16} className="text-emerald-600" /> Filtrer le réseau :
          </Label>

          <Popover open={openMenu} onOpenChange={setOpenMenu}>
            <PopoverTrigger asChild>
              <Button variant="outline" className="w-full justify-between bg-white border-slate-200 h-11 text-sm shadow-sm hover:bg-slate-50 text-left">
                <span className="truncate text-slate-700">{currentSelectorTitle}</span>
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            
            <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 z-[1100]" align="start">
              <Command>
                <CommandInput placeholder="Rechercher une ligne, un itinéraire, une ville..." />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>Aucune ligne trouvée.</CommandEmpty>
                  
                  {/* OPTION PAR DÉFAUT : TOUT AFFICHER */}
                  <CommandGroup>
                    <CommandItem 
                      onSelect={() => { setSelectedId("all"); setOpenMenu(false); }} 
                      className="text-emerald-700 font-bold py-2.5 border-b cursor-pointer bg-emerald-50/40"
                    >
                      <Check className={`mr-2 h-4 w-4 shrink-0 ${selectedId === "all" ? "opacity-100" : "opacity-0"}`} />
                      🌐 Afficher l'ensemble du réseau ({lines.length})
                    </CommandItem>
                  </CommandGroup>

                  {/* SECTIONS COLLAPSIBLE DES ITINÉRAIRES */}
                  <CommandGroup>
                    <Collapsible open={openItineraires} onOpenChange={setOpenItineraires}>
                      <CollapsibleTrigger className="flex w-full items-center justify-between p-2.5 text-xs font-bold text-slate-500 bg-slate-100 uppercase tracking-wider">
                        <div className="flex items-center gap-2"><Navigation size={12} /> Itinéraires répertoriés</div>
                        <ChevronRight className={`transition-transform ${openItineraires ? 'rotate-90' : ''}`} size={12} />
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1 bg-white">
                          {lines.map((item) => {
                            const isSelected = String(selectedId) === String(item.id);
                            return (
                              <CommandItem 
                                key={item.id} 
                                onSelect={() => { setSelectedId(String(item.id)); setOpenMenu(false); }} 
                                className="pl-6 py-2 cursor-pointer flex items-center justify-between"
                              >
                                <div className="flex items-center truncate">
                                  <Check className={`mr-2 h-4 w-4 shrink-0 text-emerald-600 ${isSelected ? "opacity-100" : "opacity-0"}`} />
                                  <span className="truncate font-medium text-slate-800">{item.nom}</span>
                                </div>
                                <span className={`text-[9px] font-mono shrink-0 px-2 py-0.5 rounded ml-2 font-bold uppercase ${
                                  item.has_path ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {item.has_path ? 'Tracé' : 'Fixe'}
                                </span>
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

        {/* CONTENEUR CARTE DYNAMIQUE */}
        <div className="h-[500px] w-full relative z-0">
          <MapComponent 
            selectedId={selectedId}
            lines={filteredLines}
          />
        </div>
      </Card>

      {/* GRILLE DES CARTES INFÉRIEURES */}
      <div className="grid gap-4">
        {lines.map((item) => {
          const isCurrent = String(selectedId) === String(item.id);
          return (
            <div 
              key={item.id} 
              onClick={() => setSelectedId(String(item.id))}
              className={`group bg-white border rounded-xl p-5 hover:bg-slate-50 transition-all flex items-center justify-between cursor-pointer ${
                isCurrent 
                  ? 'border-emerald-600 ring-2 ring-emerald-600/10 bg-emerald-50/10 shadow-md' 
                  : 'border-slate-200'
              }`}
            >
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-emerald-600 tracking-widest uppercase">
                  ID #{item.id}
                </span>
                <h2 className="text-xl font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                  {item.nom}
                </h2>
                <p className="text-sm text-slate-500 italic">📍 {item.ville}</p>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-400 font-mono">
                    {item.coords_site.lat?.toFixed(4)}, {item.coords_site.lon?.toFixed(4)}
                  </p>
                  {item.has_path ? (
                    <span className="text-xs text-emerald-600 font-medium">Tracé disponible</span>
                  ) : (
                    <span className="text-xs text-slate-400">Point seul (LineString vide)</span>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedId(String(item.id));
                      window.scrollTo({ top: 180, behavior: 'smooth' });
                    }}
                    className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all ${
                      item.has_path 
                        ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm" 
                        : "bg-slate-800 text-slate-200 hover:bg-slate-900"
                    }`}
                  >
                    {item.has_path ? "Voir le tracé" : "Cadrer"}
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/Randos_en_Occitanie/create?source=Randos_en_Occitanie&id=${item.id}`);
                    }}
                    className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium transition-all"
                  >
                    Planifier
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* NOTE TECHNIQUE */}
      <div className="bg-slate-900 text-slate-400 p-6 rounded-2xl text-sm shadow-inner">
        <h3 className="text-white font-mono font-bold mb-2 flex items-center gap-2">
          <HelpCircle size={16} className="text-emerald-400" /> Structure de l'indexation cartographique
        </h3>
        <p className="leading-relaxed">
          Le système analyse dynamiquement chaque entité. Si l'élément possède un attribut géométrique complet, un calque polyline <code className="text-emerald-400">GeoJSON</code> est généré à l'écran. Dans le cas contraire, un marqueur d'ancrage est assigné d'après les coordonnées du pôle central (`coords_site`).
        </p>
      </div>
    </main>
  );
}