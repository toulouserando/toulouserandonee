"use client";

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Compass } from 'lucide-react';
import dynamic from 'next/dynamic';

// 🎯 Importation dynamique asynchrone sans SSR (Exactement comme pour la Haute-Garonne)
const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400 font-medium font-mono italic border rounded-xl">
      Chargement de la carte et des tracés globaux...
    </div>
  )
});

export default function GlobalRandoPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tous');
  
  // 🎯 État pour isoler ou centrer un tracé spécifique sur la carte
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('all');

  useEffect(() => {
    fetch('/api/point_rando_tous')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllData(data);
          setFilteredData(data);
        } else {
          console.error("Format de données invalide reçu du Hub");
        }
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur récupération Hub:", err);
        setLoading(false);
      });
  }, []);

  // Filtrer les données de la liste et de la carte selon l'onglet actif
  const filterCategory = (cat: string) => {
    setActiveTab(cat);
    setSelectedCircuitId('all'); // Réinitialise le focus de la carte au changement d'onglet
    if (cat === 'Tous') {
      setFilteredData(allData);
    } else {
      setFilteredData(allData.filter(d => d.categorie === cat));
    }
  };

  const categories = ['Tous', ...new Set(allData.map(d => d.categorie))];

  // 🎯 Données calculées transmises à la carte (Tout l'onglet ou l'élément sélectionné)
  const mapData = useMemo(() => {
    if (selectedCircuitId === 'all') return filteredData;
    return filteredData.filter(item => String(item.id) === String(selectedCircuitId));
  }, [selectedCircuitId, filteredData]);

  if (loading) {
    return <div className="p-20 text-center text-xl font-mono font-bold text-slate-600 animate-pulse">Initialisation de la base de données...</div>;
  }

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-5xl font-black text-slate-900 mb-2">RANDOS <span className="text-indigo-600">HUB</span></h1>
          <p className="text-slate-500 uppercase tracking-widest font-bold text-sm">Exploration multi-sources Occitanie</p>
        </div>

        {/* Bouton de réinitialisation de la vue de la carte */}
        {selectedCircuitId !== 'all' && (
          <button
            onClick={() => setSelectedCircuitId('all')}
            className="px-3 py-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-semibold rounded-lg hover:bg-indigo-100 transition-colors"
          >
            🔄 Réinitialiser la carte (Voir la catégorie)
          </button>
        )}
      </header>

      {/* 🎯 Zone de la Carte Interactive Leaflet */}
      <div className="max-w-7xl mx-auto h-[450px] w-full rounded-2xl overflow-hidden shadow-inner border border-slate-200 mb-8 relative z-0">
        <MapComponent 
          key={`${activeTab}-${selectedCircuitId}`}
          filtre={activeTab}
          circuits={mapData}
        />
      </div>

      {/* Barre de Filtres Dynamique */}
      <div className="max-w-7xl mx-auto flex flex-wrap gap-2 mb-8">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => filterCategory(cat)}
            className={`px-4 py-2 rounded-full text-xs font-bold transition-all ${
              activeTab === cat ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-100 border'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grille de résultats */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredData.map((item) => {
          const isSelected = String(selectedCircuitId) === String(item.id);

          return (
            <div 
              key={item.id} 
              className={`bg-white p-5 rounded-2xl border transition-all group flex flex-col justify-between ${
                isSelected 
                  ? 'border-indigo-500 ring-2 ring-indigo-500/20 bg-indigo-50/5 shadow-md' 
                  : 'border-slate-200 hover:shadow-xl'
              }`}
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <span className="text-[10px] font-black px-2 py-1 bg-slate-100 rounded text-slate-500 uppercase">
                    {item.categorie}
                  </span>
                  <span className="text-slate-300 text-[10px] font-mono">{item.type}</span>
                </div>
                
                <h2 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 line-clamp-2 min-h-[3.5rem]">
                  {item.nom}
                </h2>
              </div>

              <div className="mt-4 pt-4 border-t border-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 truncate max-w-[150px]">
                    {item.file}
                  </span>
                  <span className="text-[11px] text-slate-400 italic">
                    Source chargée
                  </span>
                </div>

                {/* Boutons d'actions de la fiche */}
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => {
                      setSelectedCircuitId(String(item.id));
                      window.scrollTo({ top: 150, behavior: 'smooth' });
                    }}
                    className={`py-2 rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-1.5 ${
                      isSelected 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                        : 'bg-slate-800 text-white hover:bg-slate-700'
                    }`}
                  >
                    <Compass size={13} />
                    {isSelected ? 'Centré' : 'Voir la carte'}
                  </button>

                  <button 
                    onClick={() => router.push(`/point_rando_tous/create?id=${item.id}&source=point_rando_tous`)}
                    className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-200"
                  >
                    <CalendarPlus size={13} className="text-indigo-600" />
                    Planifier
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-20 text-slate-400 italic">Aucun résultat trouvé dans cette catégorie.</div>
      )}
    </main>
  );
}