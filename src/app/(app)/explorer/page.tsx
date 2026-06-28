'use client';

import { useState } from 'react';
import Link from 'next/link';
// Ajout des icônes manquantes dans l'importation
import { Search, Mountain, Bike, Map, Landmark, Route, MapPin, Trees, Building2 } from 'lucide-react';

export default function ExplorerPage() {
  const [searchTerm, setSearchTerm] = useState('');

  // Liste centralisée de vos sources
  const catalogs = [
    { name: "Points d'Intérêt en Occitanie", path: "/Point_Interet_Ocitanie", icon: <Landmark /> },
    { name: "Points Rando par Canton en Occitanie", path: "/point_rando_canton", icon: <MapPin /> },
    { name: "Points Rando en Occitanie", path: "/point_rando_occitanie", icon: <Map /> },
    { name: "Balades à Toulouse", path: "/rando_balades_Toulouse", icon: <Map /> },
    { name: "Crues à Toulouse", path: "/rando_crues_toulouse", icon: <Route /> },
    { name: "Randos en Vélo à Toulouse", path: "/rando_en_velo_Toulouse", icon: <Bike /> },
    { name: "Randos dans le Gers", path: "/rando_Gers", icon: <Mountain /> },
    { name: "Randos en Haute-Garonne", path: "/rando_Haute_Garonne", icon: <Trees /> },
    { name: "Randos dans le Lot", path: "/rando_Lot", icon: <Mountain /> },
    { name: "Randos dans le Lot en Vélo", path: "/rando_Lot_en_Velo", icon: <Bike /> },
    { name: "Randos par Canton en Occitanie", path: "/rando_par_canton", icon: <MapPin /> },
    { name: "Visites de l'Occitanie avec plans", path: "/rando_visite_Occitanie", icon: <Building2 /> },
    { name: "Visites de l'Occitanie avec points", path: "/visites", icon: <Building2 /> },
    { name: "Randos en Occitanie", path: "/Randos_en_Occitanie", icon: <Mountain /> },
    { name: "Randos de la Communauté", path: "/hikes", icon: <Route /> },
  ];

  // Filtrage simple 
  const filteredCatalogs = catalogs.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <main className="p-10 max-w-6xl mx-auto min-h-screen">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Explorer les sentiers et proposer une sortie</h1>
        <p className="text-slate-500 mb-8">Choisissez une zone ou une thématique pour commencer.</p>
        <p className="text-slate-500 mb-8">Sélectionnez une randonnée parmi les 6500 en Occitanie ou de la Communauté pour la proposer aux membres de Toulouse Randonnées.</p>
        
        <div className="relative max-w-md mx-auto">
          <Search className="absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Rechercher une catégorie..."
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-full shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredCatalogs.map((cat) => (
          <Link 
            key={cat.path} 
            href={cat.path}
            className="group p-6 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-xl hover:border-blue-500 transition-all duration-300 flex flex-col items-center text-center gap-4"
          >
            <div className="p-4 bg-slate-50 rounded-full group-hover:bg-blue-100 text-slate-600 group-hover:text-blue-600 transition-colors">
              {cat.icon}
            </div>
            <h2 className="font-bold text-slate-800 group-hover:text-blue-700">{cat.name}</h2>
          </Link>
        ))}
      </div>
    </main>
  );
}