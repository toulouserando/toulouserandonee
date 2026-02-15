'use client';

import React from 'react';
import { Facebook, ExternalLink, Handshake, Users, Heart } from 'lucide-react';

const facebookGroups = [
  { name: "Happy People Toulouse", url: "https://www.facebook.com/groups/996796667051330", category: "Social" },
  { name: "Toulouse Le Bon Plan", url: "https://www.facebook.com/groups/550741995050817", category: "Bons Plans" },
  { name: "Toulouse libre ou gratuit", url: "https://www.facebook.com/groups/651831044888765", category: "Bons Plans" },
  { name: "Sorties Soirées Toulouse", url: "https://www.facebook.com/groups/596757027131271", category: "Sorties" },
  { name: "Colocation hébergement gratuit Toulouse", url: "https://www.facebook.com/groups/559216034241574", category: "Logement" },
  { name: "Les Concerts Gratuits de Toulouse", url: "https://www.facebook.com/groups/221534187648", category: "Musique" },
  { name: "Sorties culturelles à Toulouse", url: "https://www.facebook.com/groups/513531158446053", category: "Culture" },
  { name: "Sorties Visite Toulouse, Occitanie et Région Toulousaine", url: "https://www.facebook.com/groups/546506525504472", category: "Tourisme" },
  { name: "Soirées sorties entre filles Toulouse et Occitanie", url: "https://www.facebook.com/groups/1397077878141492", category: "Social" },
  { name: "Aller au théâtre, impro, stand up, spectacles, comédie à Toulouse", url: "https://www.facebook.com/groups/1396560737927890", category: "Culture" },
  { name: "Sport à Toulouse", url: "https://www.facebook.com/groups/1492320668700625/", category: "Sport" },
  { name: "Sortie ski dans les Pyrénées à partir de Toulouse", url: "https://www.facebook.com/groups/304919476675833", category: "Sport" },
  { name: "Toulouse Sortie Plage", url: "https://www.facebook.com/groups/1634680750109791/", category: "Sorties" },
  { name: "Club lecture et club d'écriture à Toulouse", url: "https://www.facebook.com/groups/1355306319236116/", category: "Culture" },
  { name: "Soirée Jeux, bar et club de jeux sur Toulouse", url: "https://www.facebook.com/groups/1363843758107232/", category: "Loisirs" },
  { name: "Comedie Club Stand Up Blind Test et Quizz à Toulouse", url: "https://www.facebook.com/groups/625050106569426/", category: "Loisirs" },
  { name: "Salons de thé, coffee shop et restaurants à Toulouse", url: "https://www.facebook.com/groups/1313021633356765/", category: "Gastronomie" },
  { name: "Café Des Langues Toulouse", url: "https://www.facebook.com/groups/191206554544247/", category: "Social" }
];

export default function PartnersPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-rose-100 text-rose-600 rounded-full mb-4">
            <Handshake size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight">
            GROUPES <span className="text-rose-600">FACEBOOK</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Retrouvez les meilleures communautés toulousaines sur Facebook. Rejoignez-les pour sortir, bouger et découvrir Toulouse autrement.
          </p>
        </header>

        {/* Groups Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {facebookGroups.map((group, index) => (
            <a 
              key={index}
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                    <Facebook size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                    {group.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 group-hover:text-rose-600 transition-colors">
                  {group.name}
                </h3>
              </div>

              <div className="mt-4 flex items-center justify-between text-slate-400 group-hover:text-rose-500 transition-colors">
                <div className="flex items-center gap-1 text-xs font-bold">
                  <Users size={14} />
                  <span>Communauté</span>
                </div>
                <ExternalLink size={18} className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        {/* Footer Note */}
        <footer className="mt-20 text-center p-8 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
          <Heart className="mx-auto text-rose-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Vous gérez un groupe toulousain ?</h2>
          <p className="text-slate-500 mb-6">Nous sommes toujours ravis d'agrandir notre réseau de partenaires sur Facebook.</p>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-rose-600 transition-colors">
            Contactez-nous
          </button>
        </footer>

      </div>
    </div>
  );
}