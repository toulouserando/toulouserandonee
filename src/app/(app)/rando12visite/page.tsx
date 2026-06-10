"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Maximize2, X, ZoomIn, MapPin, Landmark, CalendarPlus } from 'lucide-react';

export default function VisitesPage() {
  const router = useRouter();
  const [visites, setVisites] = useState<any[]>([]);
  const [selectedVille, setSelectedVille] = useState<any>(null);
  const [activeCarteIndex, setActiveCarteIndex] = useState<number>(0);
  const [isZoomed, setIsZoomed] = useState<boolean>(false);

  useEffect(() => {
    fetch('/api/rando12visite')
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          setVisites(data);
          setSelectedVille(data[0]);
          setActiveCarteIndex(0);
        }
      });
  }, []);

  const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const villeObj = visites.find(v => v.ville === event.target.value);
    if (villeObj) {
      setSelectedVille(villeObj);
      setActiveCarteIndex(0);
      setIsZoomed(false);
    }
  };

  if (!selectedVille) {
    return <div className="p-10 font-mono text-center text-slate-500 animate-pulse">Chargement des guides de visite...</div>;
  }

  const activeImageUrl = `/api/visites/image?ville=${encodeURIComponent(selectedVille.ville)}&file=${encodeURIComponent(selectedVille.cartes[activeCarteIndex])}`;

  // 🛡️ FILTRE SÉCURISÉ
  const pointsValides = selectedVille.points 
    ? selectedVille.points.filter((pt: any) => pt.id !== undefined && pt.id !== null)
    : [];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-12 font-sans">
      
      {/* BARRE SUPÉRIEURE AVEC SÉLECTEUR */}
      <header className="bg-slate-900 text-white sticky top-0 z-40 shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <span className="font-black tracking-wider uppercase text-xs text-slate-400">Guides de Visites</span>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-800 rounded-xl px-3 py-1.5 border border-slate-700">
            <MapPin size={16} className="text-amber-500 flex-shrink-0" />
            <select
              value={selectedVille.ville}
              onChange={handleSelectChange}
              className="bg-transparent text-white text-sm font-bold uppercase tracking-wide focus:outline-none w-full sm:w-64 cursor-pointer"
            >
              {visites.map(v => (
                <option key={`select-${v.ville}`} value={v.ville} className="text-slate-900 bg-white font-sans normal-case">
                  {v.ville}
                </option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
        
        {/* TITRE DE LA VILLE & BOUTON PLANIFICATION */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-900">
              {selectedVille.ville}
            </h1>
            <p className="text-sm text-slate-500">Explorez les plans historiques et suivez les guides ci-dessous.</p>
          </div>
          <button
            onClick={() => router.push(`/rando12visite/create?id=${selectedVille.ville}&source=rando12visite`)}
            className="inline-flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-sm px-5 py-3 rounded-xl transition-all shadow-md hover:shadow-lg"
          >
            <CalendarPlus size={18} />
            Planifier une visite collective
          </button>
        </div>

        {/* 🗺️ ZONE CARTE */}
        <section className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <h2 className="text-md font-bold text-slate-800 flex items-center gap-2">
              🗺️ Plans disponibles
            </h2>
            
            {selectedVille.cartes && selectedVille.cartes.length > 0 && (
              <button
                onClick={() => setIsZoomed(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-amber-500 text-slate-700 hover:text-slate-950 text-xs font-bold rounded-lg transition-colors"
              >
                <Maximize2 size={14} />
                Agrandir à la taille d'origine
              </button>
            )}
          </div>

          {/* Onglets si plusieurs plans existent */}
          {selectedVille.cartes && selectedVille.cartes.length > 1 && (
            <div className="flex flex-wrap gap-2 p-1 bg-slate-100 rounded-xl w-max max-w-full">
              {selectedVille.cartes.map((carteNom: string, idx: number) => (
                <button
                  key={`tab-carte-${idx}`}
                  onClick={() => setActiveCarteIndex(idx)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                    activeCarteIndex === idx
                      ? 'bg-white text-slate-900 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {carteNom.replace(/\.(jpg|jpeg|png)$/i, '').replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          )}

          {/* Aperçu du plan JPEG */}
          <div className="relative border border-slate-100 rounded-xl overflow-hidden bg-slate-50 group">
            {selectedVille.cartes && selectedVille.cartes.length > 0 ? (
              <div 
                className="cursor-zoom-in relative flex justify-center items-center p-2 min-h-[250px]"
                onClick={() => setIsZoomed(true)}
              >
                <img 
                  src={activeImageUrl} 
                  alt="Plan de visite" 
                  className="max-h-[420px] w-auto object-contain rounded-lg"
                />
                <div className="absolute inset-0 bg-slate-950/0 group-hover:bg-slate-950/5 transition-colors flex items-center justify-center">
                  <span className="bg-slate-900/80 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1.5">
                    <ZoomIn size={14} /> Cliquer pour voir en taille réelle
                  </span>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-sm text-slate-400 italic">Aucun plan trouvé.</div>
            )}
          </div>
        </section>

        {/* 📋 TABLEAU DES MONUMENTS PROPRE */}
        {pointsValides.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
              <Landmark size={18} className="text-amber-600" />
              <h2 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                📋 Liste des monuments et descriptions
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-600 uppercase font-mono tracking-wider border-b border-slate-200">
                    <th className="py-3 px-4 w-16 text-center font-black">N°</th>
                    <th className="py-3 px-4 font-bold">Désignation du Monument & Historique</th>
                    <th className="py-3 px-4 hidden md:table-cell text-slate-500">Adresse</th>
                    <th className="py-3 px-4 w-40 font-mono text-center">Coordonnées GPS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-sans">
                  {pointsValides.map((pt: any, idx: number) => {
                    const lat = typeof pt.latitude === 'number' ? pt.latitude : pt.lat;
                    const lng = typeof pt.longitude === 'number' ? pt.longitude : pt.lng;
                    const hasGps = typeof lat === 'number' && typeof lng === 'number';

                    return (
                      <tr key={`visite-row-unique-${idx}`} className="hover:bg-amber-50/20 transition-colors">
                        <td className="py-4 px-4 text-center align-top">
                          <span className="inline-block bg-slate-800 text-white text-[10px] font-black rounded-full px-2 py-0.5 min-w-[22px]">
                            {pt.id}
                          </span>
                        </td>
                        
                        <td className="py-4 px-4 text-slate-900 align-top">
                          <div className="font-bold text-sm text-slate-900">{pt.nom}</div>
                          <div className="text-slate-600 font-normal text-xs mt-1.5 leading-relaxed whitespace-pre-wrap max-w-2xl">
                            {pt.content || pt.details || (pt.adresse ? `Retrouvez ce monument à l'adresse : ${pt.adresse}` : "Aucune description disponible.")}
                          </div>
                          {pt.adresse && <div className="block md:hidden text-[11px] text-slate-400 font-normal mt-2">📍 {pt.adresse}</div>}
                        </td>

                        <td className="py-4 px-4 hidden md:table-cell text-slate-600 align-top font-medium">
                          {pt.adresse || "—"}
                        </td>

                        <td className="py-4 px-4 text-center font-mono text-slate-500 whitespace-nowrap align-top">
                          {hasGps ? (
                            <span className="bg-slate-100 px-2 py-1 rounded text-[11px] text-slate-700 font-semibold">
                              {lat.toFixed(4)}, {lng.toFixed(4)}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

      </div>

      {/* MODAL ZOOM */}
      {isZoomed && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col">
          <div className="w-full bg-slate-900 text-white px-6 py-3 flex items-center justify-between border-b border-slate-800">
            <div className="space-y-0.5">
              <p className="text-xs uppercase font-bold tracking-wider text-amber-500 font-mono">Taille d'origine brute 100%</p>
              <h3 className="text-sm font-bold truncate max-w-md">
                {selectedVille.ville} — {selectedVille.cartes[activeCarteIndex]}
              </h3>
            </div>
            <button 
              onClick={() => setIsZoomed(false)}
              className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-red-600 rounded-lg text-xs font-bold transition-colors text-white"
            >
              <X size={16} /> Fermer
            </button>
          </div>

          <div 
            className="flex-1 overflow-auto p-4 flex justify-start items-start bg-slate-900/50"
            onClick={() => setIsZoomed(false)}
          >
            <div className="min-w-full min-h-full flex items-center justify-center p-4">
              <img 
                src={activeImageUrl} 
                alt="Plan taille réelle" 
                className="max-w-none h-auto shadow-2xl rounded-sm border-2 border-slate-700 bg-white" 
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </main>
  );
}