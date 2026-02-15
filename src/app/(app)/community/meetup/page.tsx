'use client';

import React from 'react';
import { Calendar, ExternalLink, Handshake, Users, Heart, MapPin } from 'lucide-react';

const meetupGroups = [
  { 
    name: "Évènements à Toulouse", 
    url: "https://www.meetup.com/find/?source=EVENTS", 
    category: "Général",
    description: "Le flux global des activités sur la ville rose."
  },
  { 
    name: "Colocation, Logement, Job, Stage & Ecologie", 
    url: "https://www.meetup.com/colocation-logement-hebergement-emploi-job-stage-toulouse/events/", 
    category: "Entraide",
    description: "Échanges pratiques, emploi et solutions de logement."
  },
  { 
    name: "Toulouse Sorties, Soirées, Visites & Randos", 
    url: "https://www.meetup.com/toulouse-sorties-evenements-soirees-balades-visites-randos/events/", 
    category: "Loisirs",
    description: "Activités de plein air, culture et rencontres nocturnes."
  },
  { 
    name: "Tous les évènements à Toulouse", 
    url: "https://www.ftstoulouse.online/meetup-full", 
    category: "Général",
    description: "Agenda des évènements sur Meetup."
  },
  { 
    name: "Expats in Toulouse - Language Café", 
    url: "https://www.meetup.com/expats-in-toulouse/events/", 
    category: "International",
    description: "Échanges linguistiques et accueil des nouveaux arrivants."
  }
];

export default function MeetupPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-12">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Section */}
        <header className="mb-12 text-center">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 text-red-600 rounded-full mb-4">
            <Calendar size={32} />
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tight uppercase">
            ÉVÈNEMENTS <span className="text-red-600">MEETUP</span>
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto font-medium">
            Planifiez vos prochaines sorties avec nos communautés Meetup. Des rencontres réelles pour partager vos passions.
          </p>
        </header>

        {/* Meetup Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          {meetupGroups.map((group, index) => (
            <a 
              key={index}
              href={group.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative bg-white border border-slate-200 p-8 rounded-[2.5rem] shadow-sm hover:shadow-2xl hover:border-red-300 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 bg-red-50 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition-colors duration-300">
                    <Calendar size={28} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest bg-slate-100 text-slate-500 px-3 py-1.5 rounded-full">
                    {group.category}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-slate-800 leading-tight mb-3 group-hover:text-red-600 transition-colors">
                  {group.name}
                </h3>
                <p className="text-sm text-slate-500 leading-relaxed mb-4">
                  {group.description}
                </p>
              </div>

              <div className="mt-4 flex items-center justify-between text-slate-400 group-hover:text-red-500 transition-colors pt-6 border-t border-slate-50">
                <div className="flex items-center gap-2 text-xs font-bold uppercase">
                  <MapPin size={14} className="text-red-400" />
                  <span>Toulouse & Région</span>
                </div>
                <div className="flex items-center gap-2 font-bold text-xs">
                  <span>Rejoindre</span>
                  <ExternalLink size={18} className="transform group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Info Card */}
        <div className="mt-16 p-10 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[3rem] text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3 justify-center md:justify-start">
                <Users className="text-red-400" /> Communauté grandissante
              </h2>
              <p className="text-slate-300 max-w-md">
                Meetup est l'outil idéal pour organiser des activités concrètes et rencontrer des personnes partageant les mêmes centres d'intérêt.
              </p>
            </div>
<a 
  href="https://www.meetup.com/"
  target="_blank" 
  rel="noopener noreferrer"
  className="bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-full font-black transition-all transform hover:scale-105 shadow-lg shadow-red-900/20 uppercase text-sm inline-block text-center"
>
  Proposer un événement
</a>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white/5 rounded-full blur-3xl"></div>
        </div>

      </div>
    </div>
  );
}