"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { 
  Navigation as NavIcon, 
  MapPin as MapPinIcon, 
  Home as HomeIcon, 
  Trash2 as TrashIcon,
  MousePointer2 as DrawIcon,
  Calendar as CalendarIcon // <-- AJOUT DE CALENDAR
} from 'lucide-react';

import { Button } from "@/components/ui/button";

// --- CHARGEMENT DYNAMIQUE DE LA CARTE SANS SSR ---
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center font-mono text-slate-400 animate-pulse">
      Chargement du module cartographique...
    </div>
  )
});

export default function CarteRandoInteractive() {
  const router = useRouter();
  
  const [sources, setSources] = useState<any[]>([]);
  const [selectedSource, setSelectedSource] = useState(''); 
  const [data, setData] = useState<any[]>([]);
  const [customPoints, setCustomPoints] = useState<[number, number][]>([]);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);

  // 1. CHARGEMENT DE TES FICHIERS GEOJSON VIA TON API RANDO6
  useEffect(() => {
    setMounted(true);
    fetch('/api/rando6') 
      .then(res => {
        if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
        return res.json();
      })
      .then(json => {
        if (Array.isArray(json)) {
          const trie = json.sort((a, b) => 
            (a.name || a.title || '').localeCompare(b.name || b.title || '', undefined, { numeric: true, sensitivity: 'base' })
          );
          setSources(trie);
        }
      })
      .catch(err => console.error("Erreur listing traces GeoJSON:", err))
      .finally(() => setLoading(false));
  }, []);

  // 2. FILTRAGE ET INJECTION DES DONNÉES DANS LA CARTE
  useEffect(() => {
    if (!selectedSource || selectedSource === 'custom') {
      setData([]);
      return;
    }

    if (selectedSource === 'all') {
      setData(sources);
    } else {
      const found = sources.find(s => s.filename === selectedSource || s.id === selectedSource);
      setData(found ? [found] : []);
    }
  }, [selectedSource, sources]);

  // Titre dynamique pour le H1 de la page
  const currentTitle = useMemo(() => {
    if (!selectedSource) return "Circuits du Lot";
    if (selectedSource === 'custom') return "Nouveau tracé personnalisé";
    if (selectedSource === 'all') return `Tous les circuits vélo simultanés (${sources.length})`;
    const found = sources.find(s => s.filename === selectedSource || s.id === selectedSource);
    return found ? (found.name || found.title) : "Itinéraire";
  }, [selectedSource, sources]);

  // Condition pour afficher le bouton de création de sortie (Uniquement sur un parcours unique réel)
  const showPlanButton = useMemo(() => {
    return selectedSource !== '' && selectedSource !== 'all' && selectedSource !== 'custom';
  }, [selectedSource]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      {/* 1. HEADER STYLE SOMBRE EN HAUT */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          {/* Logo / Contexte */}
          <div className="flex items-center gap-2">
            <NavIcon className="text-emerald-500" size={20} />
            <span className="font-black tracking-wider uppercase text-xs text-slate-400">
              Réseau du Lot • Cyclisme
            </span>
          </div>

          {/* Menu de sélection natif épuré */}
          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700 min-w-[320px] max-w-full sm:max-w-xl">
            <MapPinIcon size={16} className="text-emerald-500 flex-shrink-0" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-transparent text-white text-sm font-bold uppercase tracking-wide focus:outline-none w-full cursor-pointer pr-4 text-ellipsis overflow-hidden"
              disabled={loading}
            >
              <option value="" className="text-slate-900 bg-white font-sans normal-case">
                {loading ? "Chargement des sentiers..." : "Sélectionner un itinéraire..."}
              </option>
              
              <option value="all" className="text-emerald-700 bg-emerald-50 font-sans font-bold normal-case">
                🗺️ Afficher TOUS les circuits simultanément ({sources.length})
              </option>

              <option value="custom" className="text-orange-700 bg-orange-50 font-sans font-bold normal-case">
                ✍️ Dessiner un tracé personnalisé à la main
              </option>

              {sources.map((item) => {
                const uniqueId = item.filename || item.id;
                return (
                  <option key={uniqueId} value={uniqueId} className="text-slate-900 bg-white font-sans normal-case">
                    🚲 {item.name || item.title} ({item.segments || 1} seg)
                  </option>
                );
              })}
            </select>
          </div>
        </div>
      </header>

      {/* 2. ZONE DE CONTENU PRINCIPALE */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Titres et bouton de planification */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 break-words">
              🌳 Parcours : {currentTitle}
            </h1>
            <p className="text-sm text-slate-500">
              Visualisation cartographique dynamique du réseau du Lot.
            </p>
          </div>

          {/* Bouton effacer le dessin si mode custom sélectionné */}
          {selectedSource === 'custom' && customPoints.length > 0 && (
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => setCustomPoints([])}
              className="rounded-xl font-bold uppercase tracking-wide text-xs shrink-0"
            >
              <TrashIcon size={14} className="mr-2"/> Effacer le dessin
            </Button>
          )}

          {/* AJOUT DU BOUTON SÉLECTIONNER / PLANIFIER CE CIRCUIT */}
          {showPlanButton && (
            <Button
              onClick={() => router.push(`/rando6/create?source=rando6&id=${encodeURIComponent(selectedSource)}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 px-6 h-11 shrink-0 w-full md:w-auto justify-center"
            >
              <CalendarIcon size={16} />
              Sélectionner ce circuit pour une sortie
            </Button>
          )}
        </div>

        {/* 3. LE CONTENEUR DE LA CARTE INTERACTIVE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-[550px] relative z-10 overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center font-mono text-slate-400 animate-pulse">
              Initialisation des tracés cyclables...
            </div>
          ) : (
            <MapComponent 
              key={`map-velo-${selectedSource}`}
              selectedSource={selectedSource}
              data={data}
              customPoints={customPoints}
              setCustomPoints={setCustomPoints}
            />
          )}

          {/* Notification flottante pour le mode dessin à la main */}
          {selectedSource === 'custom' && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900 text-white shadow-xl border border-slate-800 px-6 py-2.5 rounded-full flex items-center gap-3 animate-pulse">
              <DrawIcon className="text-orange-400" size={16} />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Cliquez sur la carte pour tracer vos repères
              </span>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}