"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus } from 'lucide-react';

export default function GlobalRandoPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<any[]>([]);
  const [filteredData, setFilteredData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tous');

  useEffect(() => {
    fetch('/api/rando11balrand')
      .then(res => res.json())
      .then(data => {
        setAllData(data);
        setFilteredData(data);
        setLoading(false);
      });
  }, []);

  const filterCategory = (cat: string) => {
    setActiveTab(cat);
    if (cat === 'Tous') setFilteredData(allData);
    else setFilteredData(allData.filter(d => d.categorie === cat));
  };

  const categories = ['Tous', ...new Set(allData.map(d => d.categorie))];

  if (loading) return <div className="p-20 text-center text-xl font-bold">Initialisation de la base de données...</div>;

  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-10">
      <header className="max-w-7xl mx-auto mb-10">
        <h1 className="text-5xl font-black text-slate-900 mb-2">RANDOS <span className="text-indigo-600">HUB</span></h1>
        <p className="text-slate-500 uppercase tracking-widest font-bold text-sm">Exploration multi-sources Occitanie</p>
      </header>

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
        {filteredData.map((item) => (
          <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200 hover:shadow-xl transition-all group flex flex-col justify-between">
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
                <button className="text-xs font-bold text-indigo-600 hover:underline">
                  Chargement du JSON →
                </button>
              </div>

              {/* Bouton de planification */}
              <button 
                onClick={() => router.push(`/rando11balrand/create?id=${item.id}&source=rando11balrand`)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl transition-colors text-xs font-bold flex items-center justify-center gap-2 border border-slate-200"
              >
                <CalendarPlus size={14} className="text-indigo-600" />
                Planifier une sortie
              </button>
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-20 text-slate-400 italic">Aucun résultat trouvé dans cette catégorie.</div>
      )}
    </main>
  );
}