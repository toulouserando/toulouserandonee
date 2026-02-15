'use client';

import React from 'react';
import { Globe, ExternalLink, Handshake, Users, Heart } from 'lucide-react';

const webPartners = [
  { name: "Fais ta Sortie à Toulouse", url: "https://www.faistasortieatoulouse.online/", category: "Événements" },
  { name: "FTS", url: "https://www.ftstoulouse.online/", category: "Communauté" },
  { name: "Sortir à Toulouse", url: "https://sortiratoulouse.vercel.app/", category: "Guide Sorties" },
  { name: "Tolosa", url: "https://tolsoa.site/", category: "Plateforme" },
  { name: "Bilingue 31", url: "http://www.bilingue.fr.nf/", category: "Langues" },
  { name: "Happy People Toulouse", url: "http://www.happypeople.fr.nf/", category: "Social" },
  { name: "Language Exchange International", url: "https://www.lei-web.click/", category: "International" },
  { name: "Café des Langues à Toulouse", url: "https://www.cafedeslanguestoulouse.com/", category: "Échanges" }
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
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight uppercase">
            NOS <span className="text-rose-600">PARTENAIRES</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Découvrez les sites et plateformes qui font bouger la Ville Rose. Un réseau local pour vos sorties, vos rencontres et vos loisirs.
          </p>
        </header>

        {/* Partners Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {webPartners.map((partner, index) => (
            <a 
              key={index}
              href={partner.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white border border-slate-200 p-6 rounded-[2rem] shadow-sm hover:shadow-xl hover:border-rose-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="p-2 bg-rose-50 text-rose-600 rounded-lg group-hover:bg-rose-600 group-hover:text-white transition-colors duration-300">
                    <Globe size={24} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-2 py-1 rounded-md">
                    {partner.category}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-slate-800 leading-snug mb-2 group-hover:text-rose-600 transition-colors">
                  {partner.name}
                </h3>
                <p className="text-xs text-slate-400 truncate font-mono">
                  {partner.url.replace('https://', '').replace('http://', '')}
                </p>
              </div>

              <div className="mt-6 flex items-center justify-between text-slate-400 group-hover:text-rose-500 transition-colors border-t border-slate-50 pt-4">
                <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-tighter">
                  <Users size={14} />
                  <span>Voir le site</span>
                </div>
                <ExternalLink size={18} className="transform group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </div>
            </a>
          ))}
        </div>

        {/* Footer Note */}
        <footer className="mt-20 text-center p-8 bg-white border border-slate-200 rounded-[3rem] shadow-sm">
          <Heart className="mx-auto text-rose-500 mb-4 animate-pulse" />
          <h2 className="text-xl font-bold text-slate-800 mb-2">Envie de devenir partenaire ?</h2>
          <p className="text-slate-500 mb-6">Nous sommes toujours ouverts aux collaborations avec les acteurs locaux de Toulouse.</p>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-full font-bold hover:bg-rose-600 transition-colors shadow-lg shadow-slate-200">
            Écrivez-nous
          </button>
        </footer>

      </div>
    </div>
  );
}