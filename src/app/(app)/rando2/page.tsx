"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation'; // <-- Importation du routeur Next.js
import { 
  ChevronsUpDown, Check, Route, Navigation, MapPin, Calendar
} from 'lucide-react';

// --- UI COMPONENTS ---
import { Button } from "@/components/ui/button";

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
  const router = useRouter(); // <-- Ajout ici
  // --- ÉTATS CARTOGRAPHIE ---
  const [sources, setSources] = useState<any[]>([]);
  // Initialisé à vide pour afficher la carte Leaflet par défaut
  const [selectedSource, setSelectedSource] = useState('');
  const [data, setData] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  // Titre dynamique pour l'affichage textuel
  const currentTitle = useMemo(() => {
    if (!selectedSource) return "Circuits vélo à Toulouse";
    if (selectedSource === 'all') return "Tous les circuits vélo simultanés";
    const found = sources.find(s => s.id === selectedSource);
    return found ? found.title : "Itinéraire inconnu";
  }, [selectedSource, sources]);

  // 1. CHARGEMENT INITIAL DES DONNÉES VÉLO
  useEffect(() => {
    setMounted(true);
    fetch('/api/rando2') 
      .then(res => res.json())
      .then(json => {
        if (Array.isArray(json)) {
          setSources(json);
        }
      })
      .catch(err => console.error("Erreur listing dossiers vélo:", err));
  }, []);

  // 2. GESTION DE L'SÉLECTION MULTIPLE OU UNIQUE
  useEffect(() => {
    if (!selectedSource) {
      setData([]);
      return;
    }

    if (selectedSource === 'all') {
      // Injecte tous les circuits en même temps
      setData(sources);
    } else {
      // Filtre pour n'injecter que le circuit sélectionné
      const found = sources.find(s => s.id === selectedSource);
      setData(found ? [found] : []);
    }
  }, [selectedSource, sources]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      {/* HEADER AVEC SÉLECTEUR NATIF */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-emerald-500" size={20} />
            <span className="font-black tracking-wider uppercase text-xs text-slate-400">Réseau Cyclable</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700 min-w-[280px]">
            <MapPin size={16} className="text-emerald-500 flex-shrink-0" />
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-transparent text-white text-sm font-bold uppercase tracking-wide focus:outline-none w-full cursor-pointer pr-4"
            >
              <option value="" className="text-slate-900 bg-white font-sans normal-case">
                Sélectionner un itinéraire...
              </option>
              <option value="all" className="text-emerald-700 bg-emerald-50 font-sans font-bold normal-case">
                🗺️ Afficher TOUS les circuits simultanément
              </option>
              {sources.map((f) => (
                <option key={f.id} value={f.id} className="text-slate-900 bg-white font-sans normal-case">
                  {f.title ? f.title.replace(/_/g, ' ') : `Circuit ${f.id}`}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

{/* AJOUTEZ CETTE DIV ICI POUR ENGLOBER VOTRE CONTENU */}
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">

      {/* SECTION TITRE + BOUTON ALIGNÉS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
            🌳 Parcours : {currentTitle.replace(/_/g, ' ')}
          </h1>
          <p className="text-sm text-slate-500">
            {selectedSource ? "Visualisation dynamique du tracé sélectionné." : "Choisissez un itinéraire..."}
          </p>
        </div>

        {selectedSource !== 'all' && selectedSource !== '' && (
          <Button
            onClick={() => router.push(`/rando2/create?source=rando2&id=${selectedSource}`)}
            className="bg-blue-600 hover:bg-blue-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center gap-2 px-6 h-11 shrink-0"
          >
            <Calendar size={16} />
            Planifier une sortie avec ce circuit
          </Button>
        )}
      </div>

        {/* 🗺️ ZONE DE RENDU CARTE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-[500px] relative z-10 overflow-hidden">
          <MapComponent 
            key={`map-velo-${selectedSource}`}
            selectedSource={selectedSource}
            data={data}
            customPoints={[]}
            setCustomPoints={() => {}}
          />
        </section>

{/* INFOS DU PARCOURS (S'affiche uniquement si un tracé unique possède des coordonnées) */}
{selectedSource !== 'all' && data?.[0]?.geometry?.coordinates?.[0] && (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm">
    
    {/* Conteneur gauche : Icône + Texte */}
    <div className="flex items-center gap-3">
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
    
  </div>
)}
      </div>
    </main>
  );
}