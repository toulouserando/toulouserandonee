"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Route as RouteIcon, Navigation as NavIcon, MapPin as MapPinIcon } from 'lucide-react';

// --- CHARGEMENT DYNAMIQUE SANS SSR ---
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center font-mono text-slate-400 animate-pulse">
      Chargement du module cartographique...
    </div>
  )
});

export default function CircuitsPage() {
  const [circuits, setCircuits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [selectedSource, setSelectedSource] = useState('');

  // 1. CHARGEMENT DES DONNÉES DEPUIS L'API
  useEffect(() => {
    setMounted(true);
    fetch('/api/rando4GersHG31') 
      .then((res) => {
        if (!res.ok) throw new Error(`Erreur serveur: ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (Array.isArray(json)) {
          // 🔥 TRÈS IMPORTANT : Algorithme de tri intelligent "Humain"
          const trie = json.sort((a, b) => {
            const aCommenceParChiffre = /^\d+/.test(a.id);
            const bCommenceParChiffre = /^\d+/.test(b.id);

            // Si l'un commence par un chiffre et pas l'autre, le chiffre passe devant (ex: 18_Auch devant Voie_Verte)
            if (aCommenceParChiffre && !bCommenceParChiffre) return -1;
            if (!aCommenceParChiffre && bCommenceParChiffre) return 1;

            // Si les deux sont de même type, on applique un tri alphanumérique classique (01, 02, etc.)
            return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
          });
          setCircuits(trie);
        } else {
          setCircuits([]);
        }
      })
      .catch((err) => {
        console.error("Erreur lors de la récupération des sentiers:", err);
        setCircuits([]);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  // 2. FILTRAGE DES CIRCUITS ENVOYÉS À LA CARTE
  const dataPourLaCarte = useMemo(() => {
    if (!selectedSource) return [];
    if (selectedSource === 'all') return circuits;
    const found = circuits.find(c => c.id === selectedSource);
    return found ? [found] : [];
  }, [circuits, selectedSource]);

  // 3. TITRE DYNAMIQUE
  const currentTitle = useMemo(() => {
    if (!selectedSource) return "Circuits du Gers et de Haute-Garonne";
    if (selectedSource === 'all') return `Tous les circuits simultanés (${circuits.length})`;
    const found = circuits.find(c => c.id === selectedSource);
    return found ? found.title : "Itinéraire";
  }, [selectedSource, circuits]);

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      {/* HEADER SOMBRE FIXE */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <NavIcon className="text-emerald-500" size={20} />
            <span className="font-black tracking-wider uppercase text-xs text-slate-400">
              Explorateur Gers & HG31
            </span>
          </div>

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
              
              {circuits.length > 0 && (
                <option value="all" className="text-emerald-700 bg-emerald-50 font-sans font-bold normal-case">
                  🗺️ Afficher TOUS les circuits simultanément ({circuits.length})
                </option>
              )}

              {circuits.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900 bg-white font-sans normal-case">
                  {c.departement === "Gers" ? "🟢 " : "🔵 "} {c.title}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      {/* ZONE PRINCIPALE */}
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 break-words">
            🌳 Parcours : {currentTitle}
          </h1>
          <p className="text-sm text-slate-500">
            Visualisation en temps réel des données géographiques.
          </p>
        </div>

        {/* 🗺️ ZONE DE RENDU CARTE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-[500px] relative z-10 overflow-hidden">
          {loading ? (
            <div className="w-full h-full bg-slate-50 flex items-center justify-center font-mono text-slate-400 animate-pulse">
              Initialisation des tracés...
            </div>
          ) : (
            <MapComponent 
              key={`map-circuit-${selectedSource}`}
              selectedSource={selectedSource}
              data={dataPourLaCarte}
            />
          )}
        </section>
      </div>
    </main>
  );
}