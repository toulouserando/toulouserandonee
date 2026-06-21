"use client";

import { useEffect, useState, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Compass, CalendarPlus } from 'lucide-react';

// Importation dynamique du MapComponent pour désactiver le rendu côté serveur (SSR)
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium font-mono italic border rounded-xl">
      Chargement de la carte et des tracés...
    </div>
  )
});

export default function CircuitsPage() {
  const router = useRouter();
  const [circuits, setCircuits] = useState<any[]>([]);
  // 🎯 MODIFICATION : Le filtre par défaut devient la Haute-Garonne
  const [filtre] = useState('Haute-Garonne (31)');
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/rando_Haute_Garonne')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setCircuits(data);
        } else {
          console.error("Format de données invalide reçu de l'API");
          setCircuits([]);
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur lors de la récupération des circuits:", err);
        setCircuits([]);
        setLoading(false);
      });
  }, []);

  // 1. Liste complète des circuits de Haute-Garonne
  const circuitsFiltrés = useMemo(() => {
    return Array.isArray(circuits) ? circuits.filter(c => c.departement === filtre) : [];
  }, [circuits, filtre]);

  // 2. Données transmises à la carte : soit la totalité du département, soit le circuit isolé
  const mapData = useMemo(() => {
    if (selectedCircuitId === 'all') return circuitsFiltrés;
    return circuitsFiltrés.filter(c => String(c.id) === String(selectedCircuitId));
  }, [selectedCircuitId, circuitsFiltrés]);

  if (loading) {
    return <div className="p-10 text-center font-mono text-slate-600 animate-pulse">Chargement des sentiers...</div>;
  }

  return (
    <main className="p-6 max-w-6xl mx-auto font-sans space-y-6">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-800">Explorateur de Randonnées</h1>
          {/* 🎯 NETTOYAGE : Texte d'introduction mis à jour */}
          <p className="text-sm text-slate-500 mt-1">Haute-Garonne — Tracés géographiques et points de repère.</p>
        </div>
        
        {selectedCircuitId !== 'all' && (
          <button
            onClick={() => setSelectedCircuitId('all')}
            className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 text-xs font-semibold rounded-lg hover:bg-blue-100 transition-colors"
          >
            🔄 Réinitialiser la carte (Voir tout)
          </button>
        )}
      </div>

      {/* 🎯 SUPPRESSION : La barre complète d'onglets du Gers et de la Haute-Garonne a été retirée ici */}

      {/* Zone d'affichage cartographique Leaflet */}
      <div className="h-[450px] w-full rounded-xl overflow-hidden shadow-inner border border-slate-200 relative z-0">
        <MapComponent 
          key={`${filtre}-${selectedCircuitId}`} 
          filtre={filtre}
          circuits={mapData}
        />
      </div>

      {/* Grille des circuits sous forme de fiches */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {circuitsFiltrés.map((c) => {
          const isSelected = String(selectedCircuitId) === String(c.id);

          return (
            <div 
              key={c.id} 
              className={`bg-white border rounded-xl p-5 shadow-sm transition-all flex flex-col justify-between ${
                isSelected 
                  ? 'border-blue-500 ring-2 ring-blue-500/20 bg-blue-50/5 shadow-md' 
                  : 'border-slate-200 hover:shadow-md'
              }`}
            >
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-500">{c.departement}</span>
                <h2 className="text-lg font-bold text-slate-700 mt-1 h-14 overflow-hidden leading-snug capitalize">
                  {c.nom}
                </h2>
                
                <div className="mt-4 text-sm text-slate-600 space-y-2">
                  <p>🏘️ <strong>Commune :</strong> {c.commune}</p>
                  
                  {c.longueur && (
                    <p>
                      📏 <strong>Distance :</strong> {c.longueur >= 1000 ? `${(c.longueur / 1000).toFixed(1)} km` : `${c.longueur} m`}
                    </p>
                  )}
                  
                  {c.geo?.lat && c.geo?.lon ? (
                    <p className="text-[11px] text-slate-400 font-mono mt-2">
                      GPS: {c.geo.lat.toFixed(4)}, {c.geo.lon.toFixed(4)}
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-500 font-mono mt-2 italic">
                      Tracé vectoriel complet
                    </p>
                  )}
                </div>
              </div>

              {/* Actions de la fiche */}
              <div className="space-y-2 mt-5">
                <button 
                  onClick={() => {
                    setSelectedCircuitId(String(c.id));
                    window.scrollTo({ top: 100, behavior: 'smooth' });
                  }}
                  className={`w-full py-2 rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${
                    isSelected 
                      ? 'bg-blue-600 text-white hover:bg-blue-700' 
                      : 'bg-slate-800 text-white hover:bg-slate-700'
                  }`}
                >
                  <Compass size={14} />
                  {isSelected ? '🎯 Centré' : 'Voir sur la carte'}
                </button>

                <button 
                  onClick={() => {
                    router.push(`/rando_Haute_Garonne/create?id=${c.id}&source=rando_Haute_Garonne`);
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

        {circuitsFiltrés.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-400 font-medium italic">
            Aucun circuit trouvé pour la zone de la Haute-Garonne.
          </div>
        )}
      </div>
    </main>
  );
}