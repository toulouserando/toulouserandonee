'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, MapPin, X } from 'lucide-react'; // Ajout de l'icône X
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('./MapComponent'), {
  ssr: false,
});

export default function GlobalRandoPage() {
  const router = useRouter();
  const [allData, setAllData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Tous');
  const [selectedCircuitId, setSelectedCircuitId] = useState<string>('all');

  useEffect(() => {
    fetch('/api/point_rando_tous')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllData(data);
        setLoading(false);
      });
  }, []);

  // Le tableau ne dépend PAS de selectedCircuitId, donc il conserve toujours toutes les données (ou filtrées par catégorie)
  const displayedGridData = useMemo(() => {
    return activeTab === 'Tous' ? allData : allData.filter(d => d.categorie === activeTab);
  }, [activeTab, allData]);

  // La carte est filtrée par selectedCircuitId
  const mapData = useMemo(() => {
    const categoryData = activeTab === 'Tous' ? allData : allData.filter(d => d.categorie === activeTab);
    return selectedCircuitId !== 'all' 
      ? categoryData.filter(item => String(item.id) === String(selectedCircuitId)) 
      : categoryData;
  }, [selectedCircuitId, activeTab, allData]);

  const handleMapMarkerClick = (id: string | number) => {
    setSelectedCircuitId(String(id));
  };

  const selectedItem = allData.find(item => String(item.id) === String(selectedCircuitId));

  if (loading) return <div>Chargement...</div>;

  return (
    <main className="p-10 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Gestion des Randonnées</h1>
      
      {/* La clé unique force la mise à jour de la carte quand la sélection change */}
      <div className="h-[450px] w-full mb-8 rounded-xl overflow-hidden border shadow-lg">
        <MapComponent 
          key={`${activeTab}-${selectedCircuitId}`} 
          circuits={mapData} 
          onMarkerClick={handleMapMarkerClick} 
        />
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
        <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">
              {selectedItem 
                ? `Randonnée sélectionnée : ${selectedItem.nom}` 
                : "Sélectionnez un point sur la carte ou dans la liste ci-dessous"}
            </h2>
            {selectedCircuitId !== 'all' && (
                <button onClick={() => setSelectedCircuitId('all')} className="text-sm text-gray-500 hover:text-red-500 flex items-center gap-1">
                    <X size={16} /> Réinitialiser
                </button>
            )}
        </div>
        
        {selectedItem && (
          <button 
            onClick={() => router.push(`/point_rando_tous/create?id=${selectedItem.id}`)}
            className="mt-4 flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-green-700 transition"
          >
            <CalendarPlus size={20} />
            Sélectionner ce point pour créer une sortie
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {displayedGridData.map((item) => (
          <div key={item.id} className={`p-4 border rounded-lg transition-all ${String(selectedCircuitId) === String(item.id) ? 'border-blue-500 bg-blue-50' : 'bg-white'}`}>
            <h3 className="font-bold mb-2">{item.nom}</h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setSelectedCircuitId(String(item.id))}
                className="flex-1 text-sm bg-slate-800 text-white py-2 rounded hover:bg-slate-700"
              >
                <MapPin size={16} className="inline mr-1" /> Voir carte
              </button>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}