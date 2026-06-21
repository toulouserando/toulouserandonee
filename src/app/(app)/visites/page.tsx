"use client";

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { MapPin, Navigation, Info } from 'lucide-react';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium font-mono italic border rounded-2xl">
      Chargement de la carte interactive...
    </div>
  )
});

export default function VisitesPage() {
  const [visites, setVisites] = useState<any[]>([]);
  // 🎯 Initialisé à null pour commencer sur une vue neutre/vierge
  const [selectedVille, setSelectedVille] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetch('/api/visites')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setVisites(data);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur récupération visites:", err);
        setLoading(false);
      });
  }, []);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    if (value === "") {
      setSelectedVille(null);
      return;
    }
    const villeObj = visites.find(v => v.ville === value);
    if (villeObj) {
      setSelectedVille(villeObj);
    }
  };

  if (loading) {
    return <div className="p-10 font-mono text-center text-slate-600 animate-pulse">Chargement des données géographiques...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
          
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            {/* 🎯 "Veuillez sélectionner votre visite" appliqué à la place d'Explorateur Urbain */}
            <span className="font-black tracking-wider uppercase text-xs text-slate-400 hidden sm:inline">
              Veuillez sélectionner votre visite
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700 focus-within:border-amber-500 transition-colors w-full sm:w-auto">
            <MapPin size={16} className="text-amber-500 flex-shrink-0" />
            <select
              value={selectedVille ? selectedVille.ville : ""}
              onChange={handleSelectChange}
              className="bg-transparent text-white text-sm font-bold uppercase tracking-wide focus:outline-none w-full sm:w-64 cursor-pointer"
            >
              {/* 🎯 Option neutre par défaut */}
              <option value="" className="text-slate-900 bg-white font-sans normal-case">
                -- Choisir une destination --
              </option>
              {visites.map(v => (
                <option key={v.ville} value={v.ville} className="text-slate-900 bg-white font-sans normal-case">
                  {v.ville}
                </option>
              ))}
            </select>
          </div>

        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        
        {selectedVille ? (
          <>
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900 capitalize">
                Découverte de : {selectedVille.ville}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {selectedVille.points?.length || 0} points d'intérêt répertoriés sur ce parcours.
              </p>
            </div>

            {/* ZONE CARTE AVEC POINTS */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 relative z-0 overflow-hidden h-[450px]">
              <MapComponent points={selectedVille.points || []} />
            </section>

            {/* ZONE LISTE DES MONUMENTS */}
            <section className="space-y-4">
              <div className="border-b border-slate-200 pb-2">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Navigation size={18} className="text-blue-600" /> Monuments et étapes à visiter
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedVille.points?.map((pt: any, idx: number) => {
                  const latitude = typeof pt.latitude === 'number' ? pt.latitude : pt.lat;
                  const longitude = typeof pt.longitude === 'number' ? pt.longitude : pt.lng;
                  const hasValidGps = typeof latitude === 'number' && typeof longitude === 'number';

                  return (
                    <div 
                      key={`card-${pt.id || idx}-${idx}`} 
                      className="flex gap-4 p-4 bg-white rounded-xl border border-slate-200/60 shadow-sm hover:border-amber-400 hover:bg-amber-50/10 transition-all group"
                    >
                      <span className="flex-shrink-0 w-8 h-8 bg-slate-800 group-hover:bg-amber-500 text-white group-hover:text-slate-950 rounded-full flex items-center justify-center font-black text-xs shadow-sm transition-colors">
                        {pt.id || idx + 1}
                      </span>
                      
                      <div className="space-y-0.5 w-full">
                        <h3 className="font-bold text-sm text-slate-800 group-hover:text-slate-900 transition-colors">
                          {pt.nom || "Étape sans nom"}
                        </h3>
                        {pt.adresse && (
                          <p className="text-xs text-slate-500 leading-snug">
                            {pt.adresse}
                          </p>
                        )}
                        {pt.details && (
                          <p className="text-xs text-slate-600 italic bg-slate-50 p-1.5 rounded border border-slate-100 mt-1">
                            {pt.details}
                          </p>
                        )}
                        
                        {hasValidGps ? (
                          <p className="text-[10px] text-slate-400 font-mono pt-1">
                            GPS: {latitude.toFixed(4)}, {longitude.toFixed(4)}
                          </p>
                        ) : (
                          <p className="text-[10px] text-amber-600 italic font-medium pt-1">
                            📍 Infos de visite uniquement (repère carte absent)
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        ) : (
          /* 🎯 ÉCRAN D'ATTENTE NEUTRE (Carte Vierge + Message d'invitation) */
          <div className="space-y-6">
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-5 flex items-start gap-3 shadow-sm">
              <Info className="text-amber-600 shrink-0 mt-0.5" size={20} />
              <div>
                <h2 className="font-bold text-base">Aucun itinéraire sélectionné</h2>
                <p className="text-sm text-amber-800/90 mt-0.5">
                  Utilisez le sélecteur situé en haut à droite pour charger une ville et afficher son parcours historique de visite.
                </p>
              </div>
            </div>

            {/* Carte Vierge (On passe un tableau vide pour qu'elle reste neutre) */}
            <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-2 relative z-0 overflow-hidden h-[450px]">
              <MapComponent points={[]} />
            </section>
          </div>
        )}

      </div>
    </main>
  );
}