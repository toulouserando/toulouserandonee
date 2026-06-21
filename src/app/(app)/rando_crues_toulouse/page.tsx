"use client";
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { Calendar, MapPin } from 'lucide-react'; // <-- AJOUT DE MAPPIN
import { Button } from "@/components/ui/button";

const MapComponent = dynamic(() => import('./MapComponent'), { ssr: false });

interface Point {
  lon: number;
  lat: number;
  adresse?: string;
}

interface Itineraire {
  id: any;
  originalId?: any;
  sourceFile?: string;
  nom: string;
  points_reference: Point[];
  geometry: any;
}

export default function CruetouPage() {
  const router = useRouter();
  const [itineraires, setItineraires] = useState<Itineraire[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<Itineraire | null>(null); // Initialisé à null
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/rando_crues_toulouse')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setItineraires(data);
          // SUPPRESSION DE LA SÉLECTION AUTOMATIQUE DU PREMIER ÉLÉMENT ICI
        } else {
          setErrorMsg(data.error || "Le format de réponse de l'API est invalide.");
        }
        loading && setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Impossible de joindre l'API.");
        setLoading(false);
      });
  }, []);

  if (loading) return <p className="p-10 text-center font-medium">Chargement des itinéraires Cruetou...</p>;
  if (errorMsg) return <p className="p-10 text-center text-red-600 font-bold">⚠️ Erreur : {errorMsg}</p>;

  return (
    <main className="p-4 md:p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen space-y-6">
      
      {/* En-tête */}
      <header className="border-b border-gray-200 pb-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-indigo-900 uppercase tracking-tight">
            Cruetou : Toulouse & ses crues
          </h1>
          <p className="text-gray-600 text-sm">Découvrez l'histoire de la ville à travers ses points de repère.</p>
        </div>

        {selectedRoute ? (
          <Button
            onClick={() => router.push(`/rando_crues_toulouse/create?source=rando_crues_toulouse&id=${selectedRoute.id}`)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-xs tracking-wider rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2 px-6 h-11 shrink-0 w-full md:w-auto justify-center animate-fade-in"
          >
            <Calendar size={16} />
            Planifier avec ce circuit
          </Button>
        ) : (
          /* Invitation dans l'en-tête */
          <div className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-4 py-2.5 rounded-xl flex items-center gap-2 shrink-0 w-full md:w-auto justify-center shadow-sm">
            <MapPin size={14} className="animate-bounce" />
            Veuillez sélectionner un tracé ci-dessous
          </div>
        )}
      </header>

      {/* ZONE CARTE */}
      <div className="w-full bg-white rounded-2xl p-4 shadow-md border border-gray-100 h-[450px] relative z-0">
        <MapComponent activeRoute={selectedRoute} />
        
        {/* Overlay d'invitation sur la carte si aucun tracé n'est sélectionné */}
        {!selectedRoute && (
          <div className="absolute inset-4 rounded-xl bg-slate-900/10 backdrop-blur-[1px] pointer-events-none z-10 flex items-center justify-center">
            <div className="bg-white/95 text-slate-900 px-4 py-3 rounded-xl shadow-xl border border-slate-200 text-center font-medium text-sm flex flex-col items-center gap-1.5 max-w-xs">
              <span className="text-lg">🗺️</span>
              <p className="font-bold text-indigo-950">Sélectionne ton circuit</p>
              <p className="text-xs text-gray-500">Cliquez sur un circuit disponible plus bas pour l'afficher à l'écran.</p>
            </div>
          </div>
        )}
      </div>

      {/* ZONE LISTE */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-slate-950 flex items-center gap-2">
          🗺️ Itinéraires disponibles <span className="text-xs font-normal text-gray-500">({itineraires.length})</span>
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itineraires.map((route) => (
            <div 
              key={route.id} 
              onClick={() => setSelectedRoute(route)}
              className={`cursor-pointer transition-all bg-white rounded-xl shadow-sm border p-4 flex flex-col justify-between hover:border-indigo-400 hover:shadow-md ${
                selectedRoute?.id === route.id ? 'ring-2 ring-indigo-600 border-transparent bg-indigo-50/10' : 'border-gray-100'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold px-2 py-1 bg-indigo-100 text-indigo-700 rounded-md">
                    ID: {route.originalId || route.id}
                  </span>
                  {route.sourceFile && (
                    <span className="text-[10px] text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">
                      {route.sourceFile}
                    </span>
                  )}
                </div>
                <h3 className="text-md font-bold text-gray-900 line-clamp-2 mb-2">{route.nom}</h3>
              </div>
              
              <div className="space-y-3 pt-3 mt-2 border-t border-gray-50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-gray-500">{route.points_reference.length} repères</span>
                  <span className="text-indigo-600 font-semibold">
                    {selectedRoute?.id === route.id ? '📍 Activé' : 'Sélectionner →'}
                  </span>
                </div>

                <Button
                  size="sm"
                  variant={selectedRoute?.id === route.id ? "default" : "outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/rando_crues_toulouse/create?source=rando_crues_toulouse&id=${route.id}`);
                  }}
                  className={`w-full text-xs font-bold uppercase ${
                    selectedRoute?.id === route.id 
                      ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                      : 'border-indigo-200 text-indigo-700 hover:bg-indigo-50'
                  }`}
                >
                  Choisir ce circuit pour une sortie
                </Button>
              </div>

            </div>
          ))}
        </div>
      </div>
    </main>
  );
}