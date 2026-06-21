"use client";

import React, { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Home, Map as MapIcon, Compass, CalendarPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

// Chargement dynamique de la carte Leaflet sans SSR
const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium font-mono italic">
      Chargement de la carte du Gers...
    </div>
  )
});

export default function CircuitsPage() {
  const router = useRouter();
  
  const [circuits, setCircuits] = useState<any[]>([]);
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rando_Gers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCircuits(data);
        } else {
          setCircuits([]);
        }
        loading && setLoading(false);
      })
      .catch(err => {
        console.error("Erreur fetch rando9:", err);
        setCircuits([]);
        setLoading(false);
      });
  }, []);

  // Filtrage pour la carte (soit tous les circuits du Gers, soit celui sélectionné)
  const mapData = useMemo(() => {
    if (selectedCircuitId === 'all') return circuits;
    return circuits.filter(c => String(c.id) === String(selectedCircuitId));
  }, [selectedCircuitId, circuits]);

  if (loading) {
    return <div className="p-10 text-center font-mono text-slate-600 animate-pulse">Chargement des sentiers du Gers...</div>;
  }

  return (
    <main className="p-6 max-w-6xl mx-auto font-sans space-y-6">
      
      {/* Barre de retour */}
      <div className="flex justify-between items-center">
        <Button 
          variant="outline" 
          onClick={() => router.push('/')} 
          className="flex items-center gap-2 text-slate-600 border-slate-200"
        >
          <Home size={16} />
          Retour à l'accueil
        </Button>
      </div>

      {/* En-tête */}
      <div className="space-y-1">
        <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">
          Randonnées du <span className="text-blue-600">Gers (32)</span>
        </h1>
        <p className="text-sm text-slate-500">Explorez les circuits du département et leurs tracés géographiques.</p>
      </div>

      {/* Zone Cartographique */}
      <Card className="overflow-hidden border-slate-200 shadow-sm bg-white">
        <CardHeader className="bg-slate-900 text-slate-100 py-3 px-5 flex flex-row items-center justify-between">
          <CardTitle className="text-sm font-mono font-medium flex items-center gap-2">
            <MapIcon size={16} className="text-blue-400" /> 
            {selectedCircuitId === 'all' 
              ? `Vue globale — ${circuits.length} sentiers répertoriés` 
              : `Focus sentier actif`
            }
          </CardTitle>
          {selectedCircuitId !== 'all' && (
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setSelectedCircuitId('all')}
              className="h-7 text-xs px-3"
            >
              Voir tout le département
            </Button>
          )}
        </CardHeader>
        <div className="h-[480px] w-full relative z-0">
          <MapComponent 
            key={`map-gers-${selectedCircuitId}`}
            selectedCircuitId={selectedCircuitId}
            circuits={mapData}
          />
        </div>
      </Card>

      {/* Liste des circuits sous forme de cartes */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circuits.map((c) => {
          const isSelected = String(selectedCircuitId) === String(c.id);
          return (
            <div 
              key={c.id} 
              onClick={() => setSelectedCircuitId(String(c.id))}
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between cursor-pointer ${
                isSelected 
                  ? 'border-blue-600 ring-2 ring-blue-600/10 bg-blue-50/5' 
                  : 'border-slate-200 hover:shadow-md'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">Gers (32)</span>
                <h2 className="text-lg font-bold text-slate-800 mt-1 h-14 overflow-hidden leading-snug capitalize">
                  {c.nom}
                </h2>
                
                <div className="mt-4 text-sm text-slate-600 space-y-2">
                  <p className="flex items-center gap-1.5">
                    <span>🏘️</span> <strong>Commune :</strong> {c.commune}
                  </p>
                  {c.longueur && (
                    <p className="flex items-center gap-1.5">
                      <span>📏</span> <strong>Distance :</strong> {c.longueur} m
                    </p>
                  )}
                  {c.geo && (
                    <p className="text-[11px] text-slate-400 font-mono pt-1">
                      GPS: {c.geo.lat?.toFixed(4)}, {c.geo.lon?.toFixed(4)}
                    </p>
                  )}
                </div>
              </div>

              {/* Groupe de boutons d'action */}
              <div className="space-y-2 mt-5">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedCircuitId(String(c.id));
                    window.scrollTo({ top: 180, behavior: 'smooth' });
                  }}
                  className={`w-full py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                    isSelected
                      ? "bg-blue-600 text-white hover:bg-blue-700"
                      : "bg-slate-800 text-white hover:bg-slate-700"
                  }`}
                >
                  <Compass size={14} />
                  Voir sur la carte
                </button>

                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/rando_Gers/create?id=${c.id}&source=rando_Gers`);
                  }}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 border border-slate-200"
                >
                  <CalendarPlus size={14} className="text-blue-600" />
                  Planifier une sortie
                </button>
              </div>

            </div>
          );
        })}

        {circuits.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium italic">
            Aucun fichier JSON trouvé dans le dossier data/randos/Gers.
          </div>
        )}
      </div>
    </main>
  );
}