"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { MapPin, Route, Navigation, Layers, Calendar } from 'lucide-react'; // <-- AJOUT DE CALENDAR
import { Button } from "@/components/ui/button"; // <-- AJOUT DE BUTTON

const MapComponent = dynamic(() => import('./MapComponent'), { 
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 flex items-center justify-center font-mono text-slate-400 animate-pulse">
      Chargement du module cartographique...
    </div>
  )
});

export default function Rando5Page() {
  const router = useRouter(); // <-- AJOUT DU ROUTER
  const [listRandos, setListRandos] = useState<string[]>([]);
  const [selectedRando, setSelectedRando] = useState<string>('');
  const [geojsonData, setGeojsonData] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>([44.45, 1.56]);

  useEffect(() => {
    fetch('/api/rando_Lot')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setListRandos(data);
        }
      });
  }, []);

  useEffect(() => {
    if (!selectedRando) {
      setGeojsonData(null);
      return;
    }

    fetch(`/api/rando_Lot?rando=${encodeURIComponent(selectedRando)}`)
      .then(res => res.json())
      .then(data => {
        setGeojsonData(data);

        try {
          const coordinates = data.features[0].geometry.coordinates[0];
          if (coordinates && coordinates.length > 0) {
            const middlePoint = coordinates[Math.floor(coordinates.length / 2)];
            setMapCenter([middlePoint[1], middlePoint[0]]);
          }
        } catch (e) {
          console.error("Erreur de recentrage géographique", e);
        }
      });
  }, [selectedRando]);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      {/* HEADER AVEC SÉLECTEUR */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Navigation className="text-emerald-500" size={20} />
            <span className="font-black tracking-wider uppercase text-xs text-slate-400">Explorateur de Circuits (Lot)</span>
          </div>

          <div className={`flex items-center gap-2 w-full sm:w-auto bg-slate-800 rounded-xl px-3 py-1.5 border transition-all ${!selectedRando ? 'border-amber-500/50 ring-2 ring-amber-500/20' : 'border-slate-700'}`}>
            <MapPin size={16} className={!selectedRando ? 'text-amber-500 animate-bounce' : 'text-emerald-500'} />
            <select
              value={selectedRando}
              onChange={(e) => setSelectedRando(e.target.value)}
              className="bg-transparent text-white text-sm font-bold uppercase tracking-wide focus:outline-none w-full sm:w-64 cursor-pointer"
            >
              <option value="" className="text-slate-500 bg-white font-sans normal-case italic">
                -- Choisir un circuit disponible --
              </option>
              {listRandos.map(rando => (
                <option key={rando} value={rando} className="text-slate-900 bg-white font-sans normal-case font-bold">
                  {rando.replace(/_/g, ' ')}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        {/* TITRE ET BOUTON DYNAMIQUE */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              🌳 {selectedRando ? `Parcours : ${selectedRando.replace(/_/g, ' ')}` : 'Circuits dans le Lot'}
            </h1>
            <p className="text-sm text-slate-500">
              {selectedRando ? 'Visualisation dynamique du tracé enregistré dans le Lot.' : 'Sélectionnez un circuit dans le menu en haut pour charger la carte.'}
            </p>
          </div>

          {selectedRando && (
            <Button
              onClick={() => router.push(`/rando_Lot/create?source=rando_Lot&id=${encodeURIComponent(selectedRando)}`)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 px-6 h-11 shrink-0 w-full md:w-auto justify-center"
            >
              <Calendar size={16} />
              Planifier une sortie avec ce circuit
            </Button>
          )}
        </div>

        {/* 🗺️ ZONE DE RENDU CARTE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 h-[500px] relative z-10 overflow-hidden">
          <MapComponent geojsonData={geojsonData} center={mapCenter} />
          
          {!selectedRando && (
            <div className="absolute inset-4 rounded-xl bg-slate-900/10 backdrop-blur-[1px] pointer-events-none z-10 flex items-center justify-center">
              <div className="bg-white/95 text-slate-900 px-6 py-4 rounded-xl shadow-xl border border-slate-200 text-center font-medium text-sm flex flex-col items-center gap-2 max-w-xs">
                <Layers className="text-amber-500 w-6 h-6 animate-pulse" />
                <p className="font-extrabold text-slate-900 uppercase text-xs tracking-wider">Veuillez sélectionner un circuit</p>
                <p className="text-xs text-slate-500 leading-relaxed">Utilisez le menu déroulant situé dans la barre supérieure pour afficher un itinéraire.</p>
              </div>
            </div>
          )}
        </section>

        {/* INFOS DU PARCOURS */}
        {selectedRando && geojsonData?.features?.[0]?.geometry?.coordinates?.[0] && (
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-3 shadow-sm transition-all">
            <div className="p-2.5 bg-emerald-50 rounded-lg text-emerald-600">
              <Route size={18} />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Précision du tracé</h3>
              <p className="text-sm text-slate-700 font-medium">
                Ce circuit comporte <span className="font-bold text-slate-900 font-mono">{geojsonData.features[0].geometry.coordinates[0].length}</span> points de géolocalisation haute précision.
              </p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}